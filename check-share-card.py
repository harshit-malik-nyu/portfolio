#!/usr/bin/env python3
"""
Every figure on the share card must appear on the page.

The card is what a stranger sees when the link is pasted into Slack or
LinkedIn, and nothing on the site renders it, so it is the one asset that can
go stale without anyone noticing. It did: it carried the opening figures of
the first four engagements long after there were eight.

Run before publishing. It checks the claim, not the image.
"""

import pathlib
import sys

# Kept in step with the figures drawn in the card. Changing one means
# changing both, which is the point.
CARD_FIGURES = ["$15.6m", "0.38%", "62.5%", "22 pts"]


def main() -> int:
    page = pathlib.Path(__file__).parent / "index.html"
    html = page.read_text()
    missing = [f for f in CARD_FIGURES
               if f not in html and f.replace(" ", "&nbsp;") not in html]
    for f in CARD_FIGURES:
        print(f"  {'ok  ' if f not in missing else 'MISS'} {f}")
    if missing:
        print(f"\nshare card carries figures not on the page: {missing}",
              file=sys.stderr)
        return 1
    print("\nshare card is current")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
