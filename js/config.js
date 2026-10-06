/**
 * ELOQVENT 2K26 - Central Configuration File
 * -------------------------------------------------------------
 * Edit this file to easily update event dates, coordinator details,
 * Google Sheets webhook URL, tracks info, and gallery photos without
 * modifying HTML or styling!
 */

window.ELOQVENT_CONFIG = {
  // Event Details
  event: {
    name: "ELOQVENT",
    edition: "2K26",
    editionNumber: "3rd Edition",
    tagline: "Tech. Talk. Triumph.",
    category: "Regional Level",
    dates: "Nov 13 – 14, 2026",
    venue: "",
    countdownDate: "2026-11-13T09:30:00+05:30",
    stats: {
      expectedParticipants: "500+",
      prizePool: "₹15,000",
      collegesRepresented: "40+",
      flagshipTracks: "2"
    }
  },

  // Google Sheets Integration
  sheets: {
    // Paste the deployed Apps Script /exec URL here. No local demo submission is used.
    webAppUrl: "https://script.google.com/macros/s/AKfycbx_u_fL8A01GCy3f0tuZuUUpXwvrp0uwvZmIwbVta6NRgrqLM_HoUMIcdOpWC-Tu-v-vw/exec",
    paymentQrImage: "photos/payment-qr.jpeg"
  },

  // All times use India Standard Time (UTC+05:30). The backend enforces this cutoff.
  pricing: {
    earlyBirdPerPerson: 299,
    regularPerPerson: 359,
    earlyBirdDeadline: "2026-10-13T00:00:00+05:30"
  },

  // Two Student Coordinators / Lead Organizers (as requested)
  coordinators: [
    {
      id: 1,
      name: "Dinesh Kumar",
      role: "Event Coordinator",
      phone: "+91 85229 01884",
      cleanPhone: "918522901884",
      whatsappMessage: "Hi Dinesh, I have a query regarding ELOQVENT 2K26."
    },
    {
      id: 2,
      name: "Bhavith",
      role: "Event Coordinator",
      phone: "+91 77801 06774",
      cleanPhone: "917780106774",
      whatsappMessage: "Hi Bhavith, I have a query regarding ELOQVENT 2K26."
    }
  ],

  // Track Details for Apple-Style Feature Carousel
  tracks: {
    elocution: {
      id: "elocution",
      badge: "Track 01",
      title: "Elocution",
      subtitle: "The Oratory & Pitch Arena",
      focusTagline: "JAM Sessions. Debates. Storytelling.",
      shortDescription: "Have great ideas but don't know how to approach presenting them? Elocution turns public speaking into a fine craft teaching you how to command attention, master delivery tone, and make your words resonate with any audience.",
      accentColor: "#00f2fe", // Electric Cyan
      gradient: "from-cyan-500 to-blue-600",
      highlights: [
        "JAM Sessions & Thematic Debates",
        "Storytelling & Narrative Building",
        "Structured Debate & Delivery Drills",
        "Final Assessment & Recognition"
      ],
      blueprint: {
        tagline: "Command Attention. Make Your Words Resonate.",
        rounds: [
          {
            title: "JAM Sessions & Thematic Debates",
            desc: "Practice thinking on your feet and presenting clear viewpoints on a range of themes."
          },
          {
            title: "Storytelling & Narrative Building",
            desc: "Shape ideas into compelling narratives that connect with an audience."
          },
          {
            title: "Structured Debate & Delivery Drills",
            desc: "Build confident delivery, clear structure, and persuasive speaking habits."
          },
          {
            title: "Final Assessment & Recognition",
            desc: "Bring your speaking skills together in a final assessment and receive recognition."
          }
        ],
        judgingCriteria: [
          "Clarity of Thought & Articulation (25%)",
          "Persuasive Rhetoric & Vocabulary (25%)",
          "Confidence, Voice Modulation & Stage Presence (25%)",
          "Jury Q&A Handling & Technical Accuracy (25%)"
        ],
        prizes: "Winner Trophy + Cash Prize of ₹10,000 | Runner-Up ₹5,000 | Certificates of Merit for Finalists",
      }
    },

    rootRiddle: {
      id: "root-riddle",
      badge: "Track 02",
      title: "Root Riddle",
      subtitle: "The Design Thinking Conclave",
      focusTagline: "Empathy. Root Cause. Pitch-Ready Projects.",
      shortDescription: "Want to build a project but don't know how to approach it? Root Riddle takes you through the entire journey of taking an idea from scratch and turning it into a pitch-ready, practical project.",
      accentColor: "#a855f7", // Neon Purple
      gradient: "from-purple-500 to-indigo-600",
      highlights: [
        "Empathy Mapping & Field Research",
        "Root Cause & Problem Statement Building",
        "Prototype, Value Proposition & Business Model",
        "Expert Panel Pitch & Final Showcase"
      ],
      blueprint: {
        tagline: "Take an Idea from Scratch to a Practical Project.",
        rounds: [
          {
            title: "Empathy Mapping & Field Research",
            desc: "Understand people and their needs through empathy mapping and field research."
          },
          {
            title: "Root Cause & Problem Statement Building",
            desc: "Find the underlying cause of a challenge and turn it into a clear problem statement."
          },
          {
            title: "Prototype, Value Proposition & Business Model",
            desc: "Develop a practical prototype and shape its value proposition and business model."
          },
          {
            title: "Expert Panel Pitch & Final Showcase",
            desc: "Present and showcase your pitch-ready project to an expert panel."
          }
        ],
        judgingCriteria: [
          "Depth of Root Cause Identification (25%)",
          "Design Thinking & User Empathy (25%)",
          "Practical Feasibility & Scalability (25%)",
          "Presentation & Prototype Execution (25%)"
        ],
        prizes: "Winner Trophy + Cash Prize of ₹12,000 | Runner-Up ₹6,000 | Certificates of Innovation for Finalists",
      }
    }
  },

  // Past Editions Gallery (3rd Edition Legacy)
  gallery: [
    {
      edition: "Edition 2.0 (2025)",
      title: "Regional Grand Stage Finals",
      category: "Auditorium Pitch",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80"
    },
    {
      edition: "Edition 2.0 (2025)",
      title: "Root Riddle Brainstorm Sprint",
      category: "Design Thinking",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80"
    },
    {
      edition: "Edition 1.0 (2024)",
      title: "Inaugural Keynote & Lighting",
      category: "Ceremony",
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
    },
    {
      edition: "Edition 2.0 (2025)",
      title: "Fierce Elocution Debate Round",
      category: "Oratory Clash",
      image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80"
    },
    {
      edition: "Edition 1.0 (2024)",
      title: "Trophy & Cash Award Felicitation",
      category: "Champions",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
    },
    {
      edition: "Edition 2.0 (2025)",
      title: "Cross-College Networking Hub",
      category: "Community",
      image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80"
    }
  ]
};
