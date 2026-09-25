# harshit-malik-nyu.github.io — portfolio

Static site. No build step, no dependencies, no framework.

## Deploying

**Vercel** — import this repository at
[vercel.com/new](https://vercel.com/new). Framework preset: **Other**. Leave
the build command empty and the output directory as the repository root.
`vercel.json` handles the rest.

**GitHub Pages** — served from the `gh-pages` branch.

## Why it is plain HTML

The three tools on the page run the real algorithms from the linked
repositories, ported to JavaScript and verified against the Python to within
0.04 points. A framework would add a build step and a dependency tree without
changing anything a reader sees.

```
index.html    structure and content
styles.css    one stylesheet
app.js        the three tools
```
