/**
 * Eloqvent 2K26 - High-Concurrency Optimized Apps Script Backend
 * Designed for sub-second execution, multi-user concurrency, and zero lock contention.
 */
const SHEET_NAME = "Registrations";
const EARLY_BIRD_END = new Date("2026-10-13T00:00:00+05:30").getTime();
const EARLY_BIRD_FEE = 299;
const REGULAR_FEE = 359;
const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024; // 3 MB max decoded
const STATUS_COLUMN = 8;
const UTR_COLUMN = 6;

// Pre-compiled regex patterns to eliminate runtime recompilation overhead
const RE_REQUEST_ID = /^[a-zA-Z0-9-]{12,80}$/;
const RE_UTR = /^[A-Za-z0-9-]{6,35}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_MOBILE = /^\d{10}$/;
const VALID_EVENTS = new Set(["Root Riddle", "Elocution"]);
const VALID_YEARS = new Set(["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"]);
const VALID_BRANCHES = new Set(["CSM", "CSD", "IT", "CS-IT", "CSE", "ECE", "EEE", "Mechanical", "Civil", "Other"]);

const HEADERS = [
  "Registration ID", "Timestamp", "Event", "Registration Fee", "Expected Amount",
  "UTR / Transaction ID", "Payment Screenshot", "Payment Status",
  "Participant Name", "Email ID", "Mobile Number", "College Full Name",
  "Roll Number", "Year", "Branch"
];

/**
 * Health-check endpoint for browser tests & uptime monitoring.
 */
function doGet(e) {
  return jsonResponse_({
    status: "active",
    service: "ELOQVENT 2K26 Registration API",
    time: new Date().toISOString()
  });
}

/**
 * Main transactional endpoint for registrations.
 */
function doPost(e) {
  let lockAcquired = false;
  const lock = LockService.getScriptLock();

  try {
    // 1. FAST STATELESS PARSE & VALIDATION (Runs OUTSIDE lock to maximize throughput)
    const data = parseAndValidateRequest_(e);
    enforceRateLimit_(data.email);

    const pricing = getServerPricing_();
    if (Number(data.feePerPerson) !== pricing.fee || Number(data.expectedAmount) !== pricing.expectedAmount) {
      throw userError_("The registration fee has changed. Refresh the form and submit the current amount.");
    }

    // 2. CRITICAL SECTION: Lock with 20s timeout to safely queue concurrent requests
    if (!lock.tryLock(20000)) {
      return jsonResponse_({
        status: "error",
        message: "Registration server is currently busy processing requests. Please retry in a few moments."
      });
    }
    lockAcquired = true;

    const props = PropertiesService.getScriptProperties();
    const spreadsheetId = props.getProperty("SPREADSHEET_ID");
    const folderId = props.getProperty("DRIVE_FOLDER_ID");
    if (!spreadsheetId) throw new Error("Missing SPREADSHEET_ID script property.");
    if (!folderId) throw new Error("Missing DRIVE_FOLDER_ID script property.");

    // Idempotency check via CacheService (prevents duplicate submission if user double-clicks)
    const cache = CacheService.getScriptCache();
    const requestKey = `REQ_${Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, data.requestId))}`;
    const cachedReq = cache.get(requestKey);
    if (cachedReq) {
      try {
        const parsed = JSON.parse(cachedReq);
        return jsonResponse_({
          status: "success",
          registrationId: parsed.id,
          expectedAmount: parsed.amount
        });
      } catch (_) {}
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Ensure the header row is always present and never overwritten
    ensureHeaders_(sheet);

    // 3. FAST UTR DUPLICATION CHECK (Cache-First O(1) + TextFinder Exact Match Fallback)
    const normalizedUtr = data.utr.trim().toLowerCase();
    checkDuplicateUtrFast_(normalizedUtr, sheet, cache);

    // 4. ATOMIC REGISTRATION ID (Auto-resets to ELQ26-0001 if sheet rows were cleared)
    const registrationId = getNextRegistrationIdFast_(props, sheet);

    // 5. SAVE SCREENSHOT TO GOOGLE DRIVE WITH ACCESSIBLE SHARING
    const screenshotUrl = saveScreenshotFast_(data.paymentScreenshot, registrationId, folderId);

    // 6. BUILD & APPEND ROW
    const row = [
      registrationId,
      new Date(),
      data.event,
      pricing.fee,
      pricing.expectedAmount,
      safeCell_(data.utr),
      screenshotUrl,
      "Pending Verification",
      safeCell_(data.name),
      safeCell_(data.email),
      safeCell_(data.mobile),
      safeCell_(data.college),
      safeCell_(data.rollNumber),
      safeCell_(data.year),
      safeCell_(data.branch)
    ];

    sheet.appendRow(row);

    // 7. RECORD STATE & COMMIT CACHES
    cache.put(requestKey, JSON.stringify({ id: registrationId, amount: pricing.expectedAmount }), 21600);
    cache.put(`utr_${normalizedUtr}`, "1", 21600); // 6 hours

    return jsonResponse_({
      status: "success",
      registrationId,
      expectedAmount: pricing.expectedAmount
    });

  } catch (error) {
    console.error(error);
    const message = error.userMessage || "We could not save your registration. Please check your connection and try again.";
    return jsonResponse_({ status: "error", message });
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

/**
 * Ensures Row 1 always contains the correct headers.
 * If data accidentally ended up in Row 1 or headers were deleted, automatically restores them.
 */
function ensureHeaders_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  // Check if row 1 is missing or contains registration data instead of headers
  const firstCell = String(sheet.getRange(1, 1).getValue()).trim();
  if (firstCell !== HEADERS[0]) {
    // Row 1 contains a registration ID like ELQ26-0001! Insert a new row at position 1.
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

/**
 * Zero-copy payload extraction and input validation.
 */
function parseAndValidateRequest_(e) {
  let raw = "";
  if (e && e.postData && e.postData.contents) {
    raw = e.postData.contents;
  } else if (e && e.parameter && e.parameter.payload) {
    raw = e.parameter.payload;
  } else {
    throw userError_("Registration payload is missing. Please refresh and try again.");
  }

  let data;
  try {
    data = typeof raw === "object" ? raw : JSON.parse(raw);
  } catch (_) {
    throw userError_("The registration payload could not be parsed.");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw userError_("Invalid submission data format.");
  }

  // Honeypot check
  if (data.website) throw userError_("Submission could not be accepted.");

  // Validation guards
  if (!data.requestId || !RE_REQUEST_ID.test(String(data.requestId))) {
    throw userError_("Please refresh the registration form and try again.");
  }
  if (!VALID_EVENTS.has(data.event)) {
    throw userError_("Please select a valid event track.");
  }
  if (!VALID_YEARS.has(data.year) || !VALID_BRANCHES.has(data.branch)) {
    throw userError_("Please select a valid academic year and department/branch.");
  }

  // Field bounds
  if (!data.name || typeof data.name !== "string" || !data.name.trim() || data.name.length > 120) {
    throw userError_("Enter a valid participant full name.");
  }
  if (!data.college || typeof data.college !== "string" || !data.college.trim() || data.college.length > 180) {
    throw userError_("Enter a valid college name.");
  }
  if (!data.rollNumber || typeof data.rollNumber !== "string" || !data.rollNumber.trim() || data.rollNumber.length > 60) {
    throw userError_("Enter a valid roll / registration number.");
  }
  if (!data.email || !RE_EMAIL.test(data.email) || data.email.length > 254) {
    throw userError_("Enter a valid email address.");
  }
  if (!data.mobile || !RE_MOBILE.test(data.mobile)) {
    throw userError_("Mobile number must contain exactly 10 digits.");
  }
  if (!data.utr || !RE_UTR.test(String(data.utr).trim())) {
    throw userError_("Enter a valid UPI Transaction ID / UTR (6–35 characters).");
  }
  if (!data.paymentScreenshot || typeof data.paymentScreenshot !== "string") {
    throw userError_("Upload a valid JPG, PNG, or WebP payment screenshot.");
  }

  return data;
}

/**
 * Cache-first duplicate UTR check with TextFinder exact cell match.
 * Prevents false substring matches and eliminates reading the entire column into memory.
 */
function checkDuplicateUtrFast_(normalizedUtr, sheet, cache) {
  const cacheKey = `utr_${normalizedUtr}`;
  if (cache.get(cacheKey)) {
    throw userError_("This UPI Transaction ID / UTR has already been submitted.");
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const finder = sheet.getRange(2, UTR_COLUMN, lastRow - 1, 1)
      .createTextFinder(normalizedUtr)
      .matchEntireCell(true) // Exact match only - no substring false positives
      .matchCase(false);
    const match = finder.findNext();
    if (match) {
      cache.put(cacheKey, "1", 21600);
      throw userError_("This UPI Transaction ID / UTR has already been submitted.");
    }
  }
}

/**
 * Atomic registration ID generator with self-healing counter:
 * - If only headers exist (lastRow <= 1), restarts at ELQ26-0001.
 * - Otherwise finds highest existing ID and increments in O(1) time.
 */
function getNextRegistrationIdFast_(props, sheet) {
  const lastRow = sheet.getLastRow();
  let nextNum = Number(props.getProperty("NEXT_REGISTRATION_NUMBER"));

  // If only the header row exists (or sheet is empty), always start at 1
  if (lastRow <= 1) {
    nextNum = 1;
  } else if (!nextNum || isNaN(nextNum)) {
    let largest = 0;
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
    for (let i = 0; i < ids.length; i++) {
      const m = /^ELQ26-(\d+)$/.exec(ids[i][0]);
      if (m) largest = Math.max(largest, Number(m[1]));
    }
    nextNum = largest + 1;
  }

  props.setProperty("NEXT_REGISTRATION_NUMBER", String(nextNum + 1));
  return `ELQ26-${String(nextNum).padStart(4, "0")}`;
}

/**
 * Saves payment proof directly to Drive with view permission for organizers.
 */
function saveScreenshotFast_(base64Data, registrationId, folderId) {
  const cleanBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  const bytes = Utilities.base64Decode(cleanBase64);

  if (bytes.length < 4 || bytes.length > MAX_SCREENSHOT_BYTES) {
    throw userError_("The uploaded payment screenshot size is invalid.");
  }

  // Check magic bytes: JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (52 49 46 46)
  const b0 = bytes[0] & 255;
  const b1 = bytes[1] & 255;
  const b2 = bytes[2] & 255;
  const isJpeg = b0 === 255 && b1 === 216 && b2 === 255;
  const isPng = b0 === 137 && b1 === 80 && b2 === 78;
  const isWebp = b0 === 82 && b1 === 73 && b2 === 70;

  if (!isJpeg && !isPng && !isWebp) {
    throw userError_("Invalid image format. Please upload a clear JPG, PNG or WebP image.");
  }

  const mimeType = isPng ? "image/png" : (isWebp ? "image/webp" : "image/jpeg");
  const ext = isPng ? "png" : (isWebp ? "webp" : "jpg");
  const blob = Utilities.newBlob(bytes, mimeType, `${registrationId}_payment.${ext}`);
  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);

  // Allow organizers clicking the link in the sheet to view the screenshot immediately
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (_) {}

  return file.getUrl();
}

function getServerPricing_() {
  const earlyBird = Date.now() < EARLY_BIRD_END;
  const fee = earlyBird ? EARLY_BIRD_FEE : REGULAR_FEE;
  return { fee, expectedAmount: fee };
}

function enforceRateLimit_(email) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, email.trim().toLowerCase());
  const key = `rl_${Utilities.base64EncodeWebSafe(digest)}`;
  const cache = CacheService.getScriptCache();
  const attempts = Number(cache.get(key) || 0);
  if (attempts >= 5) {
    throw userError_("Too many submissions for this email. Please contact event coordinators.");
  }
  cache.put(key, String(attempts + 1), 3600);
}

function safeCell_(value) {
  const text = String(value || "").trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function userError_(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ONE-CLICK REPAIR & SETUP TRIGGER:
 * Run this function from the Apps Script IDE toolbar.
 * It will fix row 1 headers, freeze row 1, and configure dropdown validations.
 */
function fixAndSetupSheet() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Missing SPREADSHEET_ID script property.");

  const ss = SpreadsheetApp.openById(spreadsheetId);
  ss.setSpreadsheetTimeZone("Asia/Kolkata");
  let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  ensureHeaders_(sheet);

  // Style the header row nicely
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);

  // Status column dropdown validation
  const statusRange = sheet.getRange(2, STATUS_COLUMN, Math.max(1, sheet.getMaxRows() - 1), 1);
  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pending Verification", "Verified", "Amount Mismatch", "Rejected"], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(validation);

  console.log("Sheet headers, frozen row, and validations are fully configured.");
}

/**
 * MANUAL RESET HELPER:
 * Clears test data in the sheet, sets up fresh headers, and resets ID counter to ELQ26-0001.
 */
function resetAllDataToFreshStart() {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty("NEXT_REGISTRATION_NUMBER");

  const spreadsheetId = props.getProperty("SPREADSHEET_ID");
  if (spreadsheetId) {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) {
      sheet.clear();
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }

  console.log("Sheet cleared. Headers restored. Next registration will start at ELQ26-0001.");
}