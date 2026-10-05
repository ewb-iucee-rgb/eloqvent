# ELOQVENT 2K26 — Official Website Documentation

Welcome to the **ELOQVENT 2K26 (3rd Edition)** single-page web experience, designed with the motion-heavy aesthetics inspired by the **Audi RS5 launch animation** and the **Apple iPhone interactive product showcase**.

---

## 🚀 How to Run the Website

**Zero-Build Architecture**: There is no need to run `npm install` or configure Node.js/Python.
1. Simply double-click `index.html` to open it in Google Chrome, Microsoft Edge, Brave, or Safari.
2. The website will immediately play the **Audi RS5-inspired cinematic opening reveal** for **ELOQVENT 2K26**, followed by the smooth camera zoom into the interactive homepage.

---

## 🛠️ Quick Customization via `js/config.js`

You can customize almost everything directly in **`js/config.js`** without touching the HTML:

```javascript
window.ELOQVENT_CONFIG = {
  // 1. Event Dates & Countdown Target (IST)
  event: {
    dates: "November 13-14, 2026",
    venue: "",
    countdownDate: "2026-11-13T09:30:00+05:30",
  },

  // 2. Google Apps Script deployment URL; blank disables registration
  sheets: {
    webAppUrl: "YOUR_DEPLOYED_APPS_SCRIPT_EXEC_URL",
    paymentQrImage: "photos/payment-qr.jpeg",
    baseRegistrationCount: 148
  },

  // 3. Fees are previewed here; the Apps Script values are authoritative
  pricing: {
    earlyBirdPerPerson: 299,
    regularPerPerson: 359,
    earlyBirdDeadline: "2026-10-13T00:00:00+05:30"
  },

  // 4. Event Coordinators
  coordinators: [
    {
      name: "P. Revanth Reddy",
      role: "Lead Event Coordinator",
      phone: "+91 98765 43210",
      email: "revanth.eloqvent@gmail.com",
    },
    {
      name: "A. Harshavardhan",
      role: "Technical & Operations Co-Lead",
      phone: "+91 98765 43211",
      email: "tech.eloqvent@gmail.com",
    }
  ]
};
```

---

## Registration Setup: Google Sheets + Drive

The existing registration modal supports individual registration for Elocution and Root Riddle, IST-based fee calculation, UTR and image validation, and payment-proof upload. The backend calculates the final fee and registration ID, saves the proof in Drive, and records the registration as **Pending Verification**. A submitted screenshot is not treated as proof of a verified payment.

### Configure Google Workspace

1. Create a Google Sheet for registrations. Keep access restricted to the organizers who need participant information.
2. Create a Drive folder for payment screenshots. In Drive sharing, grant access only to authorized organizers; do not enable link sharing.
3. Open the Sheet's **Extensions → Apps Script**, replace the editor contents with `google-sheets-script.js`, and save.
4. In Apps Script **Project Settings → Script properties**, add:
  - `SPREADSHEET_ID`: the ID from the Google Sheet URL.
  - `DRIVE_FOLDER_ID`: the ID from the Drive folder URL.
  - `ORGANIZER_EMAILS`: comma-separated Google account email addresses authorized to change payment statuses.
5. Select `authorizeSetup` in the Apps Script function menu and click **Run**. Review and grant the requested Google Sheets and Drive permissions. This initializes the sheet and status protection. Then select **Deploy → New deployment → Web app**.
6. Set **Execute as: Me**. Anonymous participants need access to submit, so set **Who has access: Anyone** if that option is available for your Google Workspace. This makes the endpoint public; keep the URL out of unrelated places and monitor submissions. The script applies server-side validation, an email-based rate limit, a honeypot, and idempotent retry handling.
7. Copy the deployed `/exec` URL into `sheets.webAppUrl` in `js/config.js`. When changing the Apps Script later, deploy a new version of the web app.
8. The organizer's payment QR is configured as `photos/payment-qr.jpeg`; change `sheets.paymentQrImage` in `js/config.js` if you replace it.

The backend creates the `Registrations` tab and its columns on the first submission. If it finds the earlier multi-participant schema, it preserves that tab under a legacy name and creates a fresh individual-registration tab. It protects the Payment status column so only the script owner and addresses in `ORGANIZER_EMAILS` can edit it. Keep the spreadsheet and screenshot folder shared only with those authorized organizers. The screenshot files remain private in Drive; the sheet stores their Drive references.

### Pricing and Payment Review

The browser settings are in `js/config.js` under `pricing`. The authoritative values are `EARLY_BIRD_FEE`, `REGULAR_FEE`, and `EARLY_BIRD_END` near the top of `google-sheets-script.js`; keep these aligned when changing prices or the deadline. The early-bird offer ends at 11:59 PM IST on 12 October 2026; regular pricing starts at 12:00 AM IST on 13 October 2026. The server uses its own clock, recomputes the fee, and rejects a displayed fee that no longer matches. It generates the registration ID and timestamp and sets payment status itself.

After payment, organizers should compare the UTR and exact received amount against their bank/UPI records. A repeated UTR receives a note on its UTR cell for organizer review; it never verifies payment automatically. Change `Payment Status` manually to `Verified`, `Amount Mismatch`, or `Rejected` only after review. New submissions always start as `Pending Verification`.

The form accepts JPG, JPEG, PNG, and WebP screenshots up to 5 MB; the browser converts them to JPEG before upload and the server limits the stored image to 4 MB. Never add Google credentials or organizer access tokens to website files. The Sheet ID and Drive folder ID belong only in Apps Script Script Properties.


## 🎭 Interactive Features Breakdown

1. **Cinematic Opening Animation**:
   - High-impact kinetic typography reveal for **ELOQVENT 2K26**.
   - Speed lines and real-time percentage initialization counter.
   - Shutter blur zoom into the main hero.
   - Includes a **Replay Intro** button in the top navigation to replay at any time.

2. **Apple iPhone-Style Features Carousel**:
   - Smooth segmented pill switcher: `[ 01. Elocution ]` and `[ 02. Root Riddle ]`.
   - Card transition animation with high-contrast typography, stats, and badges.
   - **"View Track Blueprint"** button: Opens an Apple-style drawer detailing all rounds, judging criteria, and prizes.
   - Touch-swipe support on mobile and arrow key navigation.

3. **About & 3rd Edition Retrospective**:
   - Story of ELOQVENT 3.0.
   - 6 Glassmorphic Bento Cards for "What You Will Experience".
   - Photo gallery commemorating Editions 1.0 (2024) and 2.0 (2025).

4. **Coordinators Section**:
   - VIP badge cards for both coordinators with instant **Call**, **Email**, and **WhatsApp** chat buttons.
