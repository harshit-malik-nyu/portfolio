# Responsive portfolio verification — 2026-10-18

Method: the actual deployed portfolio rendered in a same-origin iframe, using the unlisted, noindex `/verification/responsive` harness. These are real CSS viewport widths, not screenshots scaled down. This does not verify a physical phone, mobile operating system, touch events, mobile Safari, or GPU inference.

| Viewport | Observed content width | Horizontal document overflow |
| --- | --- | --- |
| 320 | 305 after scrollbar | None |
| 390 | 375 after scrollbar | None |
| 768 | 753 after scrollbar | None |
| 1024 | 1009 after scrollbar | None |

The content width excludes the desktop browser scrollbar. Layout measurements inspect rendered DOM, including the expanded commerce study and CSV panel in the 390/1024 checks.

Verified interactions:
- Mobile menu opens, closes on a navigation selection, and closes on Escape with focus returned to its toggle.
- At 320px, the workbench conflict audit returns BLOCKED, two checked records and zero provisionally valid records.
- Product-role selection and project search work at narrow widths.
- SQL search returns the commerce study; choosing it opens the collapsed section and moves focus to the article.
- The optional local-AI CSV panel opens without horizontal overflow at 390px. No inference or physical-device claim is made by this check.

Changes prompted by these observations:
- Replaced multi-row mobile navigation with a progressive, accessible menu. Direct navigation remains available without JavaScript.
- Navigation computes its scroll offset after the mobile menu closes.
- Indexed verified commerce topics so SQL/Python/experiment evidence can be found.
- Search initializes from any text entered before its script loads.
- Enlarged mobile AI prompt targets and CSV text; prevented the opt-in checkbox from shrinking.
- Kept desktop AI context alongside long results on sufficiently tall/wide viewports.
- Corrected compact heading spacing and singular finding-category text.

Validation: 67 existing JavaScript tests pass; structural audit covers 10 HTML pages and 116 local references with no errors. This is not an accessibility certification or a 10/10 usability benchmark. Actual touch, screen-reader sessions, cross-browser/device behavior and large model-download friction remain evaluation gaps.
