/* ============================================================
   SAFARNAMA EDUCATION 5.0 — COURSE PAGE SETTINGS
   Edit on GitHub: open this file > pencil icon > edit > Commit changes.
   This is the only file you need to edit for prices, dates, links and contact details.
   ============================================================ */
window.SAFARNAMA = {
  // ---------- CONTACT & TRACKING ----------
  // WhatsApp number: country code + number, no "+" or spaces
  whatsapp: "917354854003",
  phoneDisplay: "+91 73548 54003",
  email: "humayrasheikh03@gmail.com",
  // Meta (Facebook) Pixel ID, e.g. "123456789012345". Leave "" to switch off.
  metaPixelId: "",
  // Google Analytics 4 ID, e.g. "G-XXXXXXXXXX". Leave "" to switch off.
  ga4Id: "",

  // ---------- BATCH ----------
  // Current batch. Change these when a new batch opens.
  batchName: "December 2026 Batch",
  // Start date and time in India time (YYYY-MM-DDTHH:MM). Used for the date shown and the countdown.
  startDate: "2026-12-01T00:00",

  // Shown on the page
  classDuration: "1.5 घंटे",      // per session
  recordingAccess: "24 घंटे",     // how long each class recording stays available

  // Optional seat line, e.g. "Only 50 seats". Leave "" for the default "Seats Limited".
  seatsText: "",

  // COMPLETE COURSE BUNDLE — all programmes below in one payment. Set fee to "" to hide this card.
  bundle: { name: "Complete Safarnama Education 5.0", note: "नीचे दिए गए सभी 11 programmes, एक साथ", fee: "₹11,000", amount: 11000, link: "" },

  // PROGRAMMES — one line each.
  //   name:     programme name
  //   duration: shown under the name ("" to hide)
  //   fee:      fee text exactly as it should appear
  //   amount:   fee in rupees, numbers only (used for ad tracking; 0 if unsure)
  //   link:     Razorpay payment link for this programme. While "", its Join button opens WhatsApp.
  programmes: [
    { name: "Commando Training – Project 60", duration: "60 Days (2 Months)", fee: "₹999 / month", amount: 999, link: "" },
    { name: "The Power (Shakti)", duration: "2 Months", fee: "₹2,100", amount: 2100, link: "" },
    { name: "Chakra Healing & Balancing", duration: "7 Days", fee: "₹999", amount: 999, link: "" },
    { name: "Inner Child Healing", duration: "3 Days", fee: "₹999", amount: 999, link: "" },
    { name: "Energy Cord Cutting", duration: "2 Days", fee: "₹999", amount: 999, link: "" },
    { name: "Forgiveness & Emotional Healing", duration: "3 Days", fee: "₹999", amount: 999, link: "" },
    { name: "Money Mastery Practices", duration: "3 Days", fee: "₹999", amount: 999, link: "" },
    { name: "121 Ritual", duration: "3 Days", fee: "₹999", amount: 999, link: "" },
    { name: "Advanced Manifestation Meditation", duration: "5 Days", fee: "₹999", amount: 999, link: "" },
    { name: "The Science of Getting Rich (Advanced)", duration: "2 Months 20 Days", fee: "₹3,500", amount: 3500, link: "" },
    { name: "Magic Book Practice (Daily)", duration: "Monthly", fee: "₹999 / month", amount: 999, link: "" }
  ],

  // ONE-TO-ONE HEALING SESSIONS — booked on WhatsApp unless a payment link is added.
  oneToOne: [
    { name: "One to One Healing", duration: "1 घंटा", fee: "₹3,500", amount: 3500, link: "" },
    { name: "One to One Healing", duration: "3 घंटे", fee: "₹11,000", amount: 11000, link: "" }
  ],

  // SPECIAL EVENT BANNER — shown below the hero until "endsAt" (India time), then hides itself.
  // To show a new event, change these lines and the image. Set show: false to hide it.
  event: {
    show: true,
    title: "11:11 Portal 2026",
    subtitle: "Special Portal Activation Session",
    date: "11 November 2026",
    time: "सुबह 10:30 बजे से",
    text: "Abundance, Health, Wealth, Happiness और Success manifest करने का एक powerful दिन। 11:11 – एक नई शुरुआत, नई ऊर्जा और नए संकल्पों का दिन!",
    image: "assets/img/portal-1111.jpg",
    endsAt: "2026-11-11T23:59",
    button: "Session Join करें",
    waText: "Hello! मुझे 11:11 Portal Activation Session (11 November) join करना है।",
    link: ""
  },

  // App store links. Leave "" while the app is not live yet ("coming soon" is shown).
  androidApp: "",
  iosApp: "",

  // VIDEO TESTIMONIALS — upload to YouTube (Public or Unlisted), then paste links here:
  //   "https://youtube.com/shorts/AbCdEfGhIjk | Geeta, Raipur",
  // The section stays hidden until at least one link is added.
  videos: [
  ],

  // VIDEO TESTIMONIALS HOSTED ON THIS WEBSITE (mp4 files in assets/video/)
  // Use this until the videos are on YouTube; then move them to "videos" above and delete the file.
  selfVideos: [
    { src: "assets/video/saba-khan-testimonial.mp4", poster: "assets/img/saba-khan-poster.jpg", name: "Saba Khan" }
  ],

  // Optional written testimonials / screenshot images (same rules: only with permission)
  testimonials: [
  ],
  screenshots: [
  ]
};
