/* ------------------------------------------------------------------
   The three tools on this page run the real calculations, ported from
   the Python in each repository. Nothing here is a mock: type a name
   into the screening demo and it scores it the way the filter does.
   ------------------------------------------------------------------ */

/* ---------- 1. Name screening (sanctions-triage) ---------- */

const LEGAL_SUFFIXES = new Set([
  "ltd","limited","llc","lc","inc","incorporated","corp","corporation","co",
  "company","plc","pte","pvt","private","sa","sas","sarl","srl","spa","ag",
  "gmbh","mbh","kg","bv","nv","ab","as","oy","oyj","aps","sp","zoo","ooo",
  "oao","zao","pjsc","ojsc","cjsc","jsc","llp","lp","gp","fzc","fze","dmcc",
  "wll","sal","psc","pjs"
]);
const STOPWORDS = new Set(["the","and","of","for","de","del","la","le","el","al"]);

function normalise(name) {
  if (!name) return "";
  // Fold diacritics: what makes MUÑOZ and MUNOZ comparable, and the single
  // most load-bearing step for transliterated names.
  let t = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Collapse dotted abbreviations (S.A. -> sa) before splitting on punctuation,
  // or the legal form stops being recognisable.
  t = t.replace(/\b(?:[a-z]\.){2,}/g, m => m.replace(/\./g, ""));
  t = t.replace(/[^\w\s]/g, " ");
  const tokens = t.split(/\s+/).filter(Boolean);
  const kept = tokens.filter(x => !LEGAL_SUFFIXES.has(x) && !STOPWORDS.has(x));
  // Never normalise a name out of existence: "CO LTD" must not become "".
  return (kept.length ? kept : tokens).join(" ");
}

// Longest common subsequence length, iterative to avoid recursion limits.
function lcsLength(a, b) {
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  let prev = new Uint16Array(n + 1), cur = new Uint16Array(n + 1);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    [prev, cur] = [cur, prev];
    cur.fill(0);
  }
  return prev[n];
}

function ratio(a, b) {
  if (!a.length && !b.length) return 100;
  if (!a.length || !b.length) return 0;
  return (200 * lcsLength(a, b)) / (a.length + b.length);
}

/* token_sort_ratio, chosen by measurement rather than preference.
   token_set_ratio returns 100 whenever one token set is a subset of the
   other, so APPLE INC scored a perfect match against APPLE BANK FOR SAVINGS. */
function score(a, b) {
  const na = normalise(a), nb = normalise(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  const sa = na.split(" ").sort().join(" ");
  const sb = nb.split(" ").sort().join(" ");
  return ratio(sa, sb);
}

/* ---------- 2. Benchmark resolution (evaldrift) ---------- */

const Z = { 0.80: 0.8416212335729143, 0.95: 1.6448536269514722, 0.975: 1.959963984540054 };

function wilson(successes, n, z = Z[0.975]) {
  if (!n) return [0, 0];
  const p = successes / n, d = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / d;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, centre - margin), Math.min(1, centre + margin)];
}

function minDetectableEffect(nItems, accuracy = 0.7) {
  return (Z[0.975] + Z[0.80]) * Math.sqrt((2 * accuracy * (1 - accuracy)) / nItems);
}

function itemsRequired(effect, accuracy = 0.7) {
  return Math.ceil(((Z[0.975] + Z[0.80]) ** 2 * 2 * accuracy * (1 - accuracy)) / effect ** 2);
}

/* Design effect from item clustering. DEFF scales with CLUSTER SIZE, which is
   why a benchmark averaging 246 items per subject is sensitive to an
   intra-cluster correlation of 0.003. */
function designEffect(meanClusterSize, icc) {
  return 1 + (meanClusterSize - 1) * icc;
}

/* ---------- 3. Citation verification base rates (citeaudit) ---------- */

const CITEAUDIT_RATES = [
  { corpus: "Publisher-deposited, DOI supplied", writer: "a machine", rate: 0.0,    lo: 0.0,    hi: 0.0124, n: 307 },
  { corpus: "Publisher-deposited, no identifier", writer: "a machine", rate: 0.013,  lo: 0.0051, hi: 0.0330, n: 307 },
  { corpus: "arXiv bibliographies",               writer: "expert authors",     rate: 0.1316, lo: 0.1136, hi: 0.1519, n: 1201 },
  { corpus: "Wikipedia, scholarly citations",     writer: "non-expert authors", rate: 0.1392, lo: 0.1009, hi: 0.1891, n: 237 }
];

/* ---------- 4. Sanctions operating cost (sanctions-triage) ----------
   Threshold sweep measured against live OFAC data: 9,973 designated entities,
   8,000 real registered companies, 6,000 held-out aliases. Cost inputs are
   published benchmarks, not assumptions — $15-25 per alert review, 20-45
   minutes each.                                                            */

const SWEEP = [{"t": 50.0, "recall": 0.77417, "fp": 0.675466}, {"t": 52.0, "recall": 0.75867, "fp": 0.625422}, {"t": 54.0, "recall": 0.743, "fp": 0.580883}, {"t": 56.0, "recall": 0.7265, "fp": 0.537595}, {"t": 58.0, "recall": 0.71, "fp": 0.485175}, {"t": 60.0, "recall": 0.69667, "fp": 0.445515}, {"t": 62.0, "recall": 0.67617, "fp": 0.397848}, {"t": 64.0, "recall": 0.656, "fp": 0.355311}, {"t": 66.0, "recall": 0.63367, "fp": 0.318779}, {"t": 68.0, "recall": 0.60883, "fp": 0.275241}, {"t": 70.0, "recall": 0.58667, "fp": 0.236332}, {"t": 72.0, "recall": 0.56317, "fp": 0.197798}, {"t": 74.0, "recall": 0.53067, "fp": 0.162767}, {"t": 76.0, "recall": 0.49917, "fp": 0.129739}, {"t": 78.0, "recall": 0.4695, "fp": 0.100963}, {"t": 80.0, "recall": 0.44333, "fp": 0.082197}, {"t": 82.0, "recall": 0.39917, "fp": 0.049794}, {"t": 84.0, "recall": 0.36867, "fp": 0.032153}, {"t": 86.0, "recall": 0.32583, "fp": 0.016765}, {"t": 88.0, "recall": 0.28633, "fp": 0.009884}, {"t": 90.0, "recall": 0.2475, "fp": 0.004254}, {"t": 92.0, "recall": 0.203, "fp": 0.000751}, {"t": 94.0, "recall": 0.16717, "fp": 0.0005}, {"t": 96.0, "recall": 0.115, "fp": 0.00025}, {"t": 98.0, "recall": 0.04733, "fp": 0.000125}, {"t": 100.0, "recall": 0.03433, "fp": 0.000125}];

const COST_PER_ALERT = 20;      // published: $15-25 direct review cost
const MINUTES_PER_ALERT = 22;   // published: 20-45 min per Level 1 review
const HOURS_PER_FTE_YEAR = 1800;
const PENALTY_P90 = 12027066;   // OFAC 90th percentile, 180 published actions

function atThreshold(t) {
  let best = SWEEP[0];
  for (const row of SWEEP) {
    if (Math.abs(row.t - t) < Math.abs(best.t - t)) best = row;
  }
  return best;
}

function operatingCost(screenings, threshold) {
  const row = atThreshold(threshold);
  const alerts = row.fp * screenings;
  const reviewCost = alerts * COST_PER_ALERT;
  const fte = (alerts * MINUTES_PER_ALERT) / 60 / HOURS_PER_FTE_YEAR;
  return { alerts, reviewCost, fte, recall: row.recall, threshold: row.t };
}

const usd = n =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}m`
  : n >= 1e3 ? `$${Math.round(n / 1e3)}k`
  : `$${Math.round(n)}`;

function initCostCase() {
  const vol = $("#cost-volume"), thr = $("#cost-threshold");
  if (!vol) return;

  const render = () => {
    const screenings = +vol.value * 1e6;
    const r = operatingCost(screenings, +thr.value);

    $("#cost-volume-out").textContent = `${(+vol.value).toFixed(1)}m`;
    $("#cost-threshold-out").textContent = r.threshold.toFixed(0);
    $("#cost-alerts").textContent = Math.round(r.alerts).toLocaleString();
    $("#cost-fte").textContent = r.fte < 1 ? r.fte.toFixed(1) : Math.round(r.fte).toLocaleString();
    $("#cost-spend").textContent = usd(r.reviewCost);
    $("#cost-recall").textContent = pct(r.recall);

    // What the same book costs at the other end of the range.
    const tight = operatingCost(screenings, 92);
    const saving = r.reviewCost - tight.reviewCost;
    const recallLost = r.recall - tight.recall;

    const v = $("#cost-verdict");
    if (r.threshold >= 92) {
      v.className = "readout is-alarm";
      v.innerHTML = `Cheap to run and <b>${pct(r.recall)} recall</b>. Defensible
        as an operating choice, indefensible as a detection claim — it should
        be adopted alongside compensating controls, not as the control.`;
    } else {
      v.className = "readout";
      v.innerHTML = `Tightening to 92 would save <b>${usd(saving)} a year</b> in
        review cost and give up <b>${pct(recallLost)}</b> of recall. That is the
        trade the committee is actually making.`;
    }
  };

  [vol, thr].forEach(el => el.addEventListener("input", render));
  render();
}

/* ---------- Page wiring ---------- */

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;

/* Hero: a claim, then the verdict. */
function initHero() {
  const btn = $("#hero-check");
  const out = $("#hero-verdict");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const mde = minDetectableEffect(198, 0.70);
    const need = itemsRequired(0.02, 0.70);
    out.innerHTML =
      `<p class="verdict-line">That benchmark has 198 questions. The smallest
       difference it can separate from noise is <b>${pct(mde)}</b>.</p>
       <p class="verdict-line">Showing a two-point difference would take
       <b>${need.toLocaleString()}</b> questions &mdash;
       <b>${Math.round(need / 198)} times</b> its size.</p>
       <p class="verdict-line verdict-close">The claim isn't wrong. It's
       unmeasurable, and nobody checked.</p>`;
    out.hidden = false;
    btn.disabled = true;
    btn.textContent = "Checked";
  });
}

/* Tool 1: benchmark resolution calculator. */
function initResolution() {
  const items = $("#res-items"), effect = $("#res-effect");
  if (!items) return;

  const render = () => {
    const n = +items.value, e = +effect.value / 1000;
    const mde = minDetectableEffect(n, 0.70);
    const need = itemsRequired(e, 0.70);
    const ok = e >= mde;
    const [lo, hi] = wilson(Math.round(0.7 * n), n);

    $("#res-items-out").textContent = n.toLocaleString();
    $("#res-effect-out").textContent = pct(e);
    $("#res-mde").textContent = pct(mde);
    $("#res-interval").textContent = `±${pct((hi - lo) / 2)}`;

    const v = $("#res-verdict");
    v.className = `readout ${ok ? "is-ok" : "is-alarm"}`;
    v.innerHTML = ok
      ? `A ${pct(e)} difference is <b>measurable</b> here.`
      : `A ${pct(e)} difference is <b>not measurable</b> here. It would take
         <b>${need.toLocaleString()}</b> questions.`;

    const bar = $("#res-bar-claim");
    bar.style.width = `${Math.min(100, (e / 0.15) * 100)}%`;
    $("#res-bar-noise").style.width = `${Math.min(100, (mde / 0.15) * 100)}%`;
  };

  items.addEventListener("input", render);
  effect.addEventListener("input", render);
  render();
}

/* Tool 2: sanctions name screening. */
function initScreening() {
  const a = $("#scr-a"), b = $("#scr-b"), thr = $("#scr-threshold");
  if (!a) return;

  const render = () => {
    const s = score(a.value, b.value);
    const t = +thr.value;
    const alerts = s >= t;

    $("#scr-score").textContent = s.toFixed(1);
    $("#scr-threshold-out").textContent = t;
    $("#scr-norm-a").textContent = normalise(a.value) || "—";
    $("#scr-norm-b").textContent = normalise(b.value) || "—";

    const v = $("#scr-verdict");
    v.className = `readout ${alerts ? "is-alarm" : "is-ok"}`;
    v.innerHTML = alerts
      ? `<b>Alert.</b> An analyst reviews this by hand, at roughly twenty minutes.`
      : `<b>No alert.</b> This pair passes without review.`;

    const dial = $("#scr-dial-fill");
    if (dial) dial.style.width = `${s}%`;
  };

  [a, b, thr].forEach(el => el.addEventListener("input", render));

  $$("[data-pair]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [x, y] = btn.dataset.pair.split("||");
      a.value = x; b.value = y; render();
      $$("[data-pair]").forEach(o => o.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
    });
  });
  render();
}

/* Tool 3: citation base rates, drawn as intervals. */
function initCitations() {
  const wrap = $("#cite-chart");
  if (!wrap) return;
  const max = 0.22;

  wrap.innerHTML = CITEAUDIT_RATES.map(r => `
    <div class="cite-row">
      <div class="cite-label">
        <span class="cite-corpus">${r.corpus}</span>
        <span class="cite-writer">written by ${r.writer}</span>
      </div>
      <div class="cite-track" role="img"
           aria-label="${r.corpus}: ${pct(r.rate, 2)} unverified,
                       95% interval ${pct(r.lo, 2)} to ${pct(r.hi, 2)}, n=${r.n}">
        <span class="cite-interval"
              style="left:${(r.lo / max) * 100}%;width:${((r.hi - r.lo) / max) * 100}%"></span>
        <span class="cite-point" style="left:${(r.rate / max) * 100}%"></span>
      </div>
      <div class="cite-value">${pct(r.rate, 2)}<span class="cite-n">n=${r.n.toLocaleString()}</span></div>
    </div>`).join("");
}

/* Navigation without fragments.
   Clicking a nav link used to put "#contact" in the address bar. Copying that
   URL into a profile means every future visitor lands at the footer instead of
   the top. Scrolling in script keeps the URL clean, so whatever gets copied is
   always the plain address. */
function initNav() {
  const header = document.querySelector(".masthead");
  const offset = header ? header.offsetHeight + 8 : 64;

  document.querySelectorAll('.masthead-nav a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: smooth ? "smooth" : "auto"
      });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });   // keyboard focus follows the jump
    });
  });
}

/* Any URL already carrying a fragment — a link shared before the fix — opens
   at the top and the address is cleaned, so it stops propagating. */
function normaliseEntry() {
  if (!window.location.hash) return;
  history.replaceState(null, "", window.location.pathname + window.location.search);
  window.scrollTo(0, 0);
  // Some browsers restore the fragment scroll after load; override it once.
  requestAnimationFrame(() => window.scrollTo(0, 0));
}

document.addEventListener("DOMContentLoaded", () => {
  normaliseEntry();
  initNav();
  initHero();
  initResolution();
  initScreening();
  initCitations();
  initCostCase();
});
