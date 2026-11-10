# Safarnama Education – Website

Course website for **Safarnama Education 5.0 – The Gurukul of Success** by Dr. Humayra Aslam Sheikh (Sarava Parihaara).
Live at **https://safarnama.club**

- **Hosting:** GitHub Pages (free)
- **Type:** plain HTML, CSS and JavaScript. No build step.

## Everyday changes – one file
Edit `assets/js/course-config.js` on GitHub: open the file → ✏️ pencil icon → edit → **Commit changes**. The site updates in 1–2 minutes.

| Setting | What it does |
|---|---|
| `whatsapp`, `phoneDisplay`, `email` | Contact details used across the site |
| `metaPixelId`, `ga4Id` | Meta Pixel and Google Analytics. Leave `""` to switch off |
| `batchName`, `startDate` | Current batch and countdown |
| `classDuration`, `recordingAccess` | Shown in the fee section and FAQ |
| `programmes` | Programme list: name, duration, fee and Razorpay `link` for each |
| `oneToOne` | One-to-one healing sessions |
| `androidApp`, `iosApp` | App store links once the app is live |
| `videos` | YouTube testimonial links (`"https://youtube.com/shorts/... \| Name, City"`) |

While a programme's `link` is `""`, its **Join** button opens WhatsApp with the programme name already typed.

## Razorpay (when the account is active)
1. In Razorpay, create one **Payment Page** (or Payment Link) per programme.
2. Set the success redirect to `https://safarnama.club/thank-you.html?programme=NAME&amount=FEE`.
3. Paste each link into that programme's `link` in `course-config.js`.

## Setting up the domain (once)
**GitHub:** repo → **Settings → Pages** → Source: *Deploy from a branch*, Branch: `main` / `(root)` → Save. Custom domain: `safarnama.club` → Save. When the check is green, tick **Enforce HTTPS**.

**Domain DNS** (where safarnama.club was bought):

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `irfansiddiqui08.github.io.` |

Delete any other `@` or `www` records (parking pages, redirects). DNS can take up to 24 hours.

## Files
```
index.html            Course landing page
thank-you.html        After payment (not indexed)
terms.html  refund-policy.html  privacy.html  contact.html   Needed for Razorpay
404.html
assets/js/course-config.js   Settings (edit this one)
assets/js/course.js  site.js Page scripts
assets/css/  assets/img/
CNAME  .nojekyll  robots.txt  sitemap.xml
```
