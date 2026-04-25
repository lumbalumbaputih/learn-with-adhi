# Learn with Adhi

A simple static learning hub built with HTML, CSS, and vanilla JavaScript.

## Structure

```
learn-with-adhi/
├── index.html                        — Home page (course listing, dark/light theme)
├── design-system/
│   └── tca-design-system.html        — Uploaded visual identity/design reference
├── README.md
└── courses/
    ├── ai/
    │   ├── ai-capability-course.html — Bridging the AI Gap (live)
    │   └── ai-capability-v2.html     — v2 in progress
    ├── carbon-accounting/
    │   ├── carbon-accounting-course.html — Carbon Accounting (live)
    │   └── carbon-accounting-v2.html     — v2 in progress
    ├── coding/
    │   ├── code-ecosystem-guide-complete-v1.html — How to Code for Non-Coders (live)
    │   └── code-for-non-coders-v2.html           — v2 in progress
    ├── ielts/
    │   ├── ielts-bahasa-hacking.html      — Bahasa Hacking IELTS (live)
    │   ├── ielts-bahasa-hacking-v2.html   — v2 in progress
    │   ├── ielts-band7-precision.html     — Band 7 Precision Lab (live)
    │   └── ielts-band7-precision-v2.html  — v2 in progress
    └── tools/
        ├── feifelusiac-safe-area-calculator-v3.html — Safe-area calculator v3
        └── feifelusiac-safe-area-calculator-v4.html — Safe-area calculator v4 (live)
```

## How to run locally

Because this is a static site, you can open `index.html` directly in your browser.

If you prefer a local server, run any static server command, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Notes

- Theme preference on the home page is saved in browser `localStorage`.
- No build step is required.
- v2 course files are works in progress and not yet linked from the home page.
- Use the uploaded design system as the default reference when building new pages/components, except the logo (do not reuse the logo).
