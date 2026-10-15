"""Rebuild synthetic assignment evidence and a decision-gate handoff."""
import json
import subprocess
from pathlib import Path
from analyze import ROOT, analyze, digest


def fixture():
    assignments, events = [], []
    for arm, buyers, exposed in [("control", 200, 900), ("treatment", 260, 600)]:
        for i in range(1000):
            visitor = f"{arm}-{i}"
            assignments.append({"visitor_id": visitor, "arm": arm, "assigned_at": "2026-01-01T00:00:00Z"})
            for kind, include, when in [("exposure", i < exposed, "2026-01-01T01:00:00Z"),
                                        ("purchase", i < buyers, "2026-01-02T00:00:00Z"),
                                        ("harm", i < 20, "2026-01-03T00:00:00Z")]:
                if include:
                    events.append({"event_id": f"{kind}-{visitor}", "visitor_id": visitor, "kind": kind, "arm": arm, "occurred_at": when})
    # Exact delivery retries and multiple purchase rows must not inflate binary outcomes.
    assignments.append(dict(assignments[0]))
    events.append(dict(events[0]))
    events.append({"event_id": "repeat-purchase", "visitor_id": "control-0", "kind": "purchase", "arm": "control", "occurred_at": "2026-01-04T00:00:00Z"})
    events.append({"event_id": "at-window-end", "visitor_id": "treatment-999", "kind": "purchase", "arm": "treatment", "occurred_at": "2026-01-08T00:00:00Z"})
    return {"evidence": "synthetic", "as_of": "2026-01-09T00:00:00Z", "assignments": assignments, "events": events}


def write(path, value):
    path.write_text(json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\n")


def build():
    output = ROOT / "output"
    output.mkdir(exist_ok=True)
    source = fixture()
    # Keep the full fixture compact and reproducible, with no private or real user data.
    (output / "fixture.synthetic.json").write_text(json.dumps(source, sort_keys=True, separators=(",", ":")) + "\n")
    report = analyze(source)
    write(output / "audit.json", report)
    inputs = {**report["gate_counts"], "futureVisitors": 10000, "aov": 80, "margin": .35,
              "cost": 1000, "maxHarm": .005, "fixedHorizon": False,
              "identityChecked": False, "instrumentationChecked": False}
    script = "const {evaluate}=require(process.argv[1]);let s='';process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>console.log(JSON.stringify(evaluate(JSON.parse(s)))));"
    result = json.loads(subprocess.check_output(["node", "-e", script, str(ROOT.parent / "decision.js")], input=json.dumps(inputs), text=True))
    write(output / "decision.json", {"evidence": "synthetic; assumed economics; unverified design", "inputs": inputs, "result": result})
    unit = inputs["aov"] * inputs["margin"]
    modeled_itt = report["itt_lift"] * inputs["futureVisitors"] * unit - inputs["cost"]
    modeled_selected = report["exposed_only_lift"] * inputs["futureVisitors"] * unit - inputs["cost"]
    (ROOT / "index.html").write_text(f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>When the denominator changes the decision · Harshit Malik</title>
<meta name="description" content="Inspect a synthetic assignment ledger, SQL metric audit and business decision about exposure filtering.">
<link rel="stylesheet" href="/tools/event-audit/style.css">
<style>table{{width:100%;border-collapse:collapse}}th,td{{padding:12px;text-align:left;border-bottom:1px solid #cbd7d8}}.scroll{{overflow:auto}}th{{white-space:nowrap}}</style></head>
<body><main><nav><a href="/role-evidence">Three-role evidence</a><a href="/projects/commerce-conversion/experiment/">Experiment decision lab</a></nav>
<p class="eyebrow">DATA + BUSINESS + PRODUCT / SYNTHETIC CASE</p>
<h1>Same purchases.<br>A very different recommendation.</h1>
<p class="lead">Filtering to exposed visitors makes the observed purchase-rate difference look like {report['exposed_only_lift']*100:.2f} percentage points. Keeping every assigned visitor gives {report['itt_lift']*100:.2f} points.</p>
<p><strong>Recommendation: hold rollout.</strong> Retain all assignments in the primary analysis, investigate the exposure difference, and establish design and logging validity before interpreting an effect.</p>
<p class="hint">All people, assignments and outcomes here are invented. This is a deliberately constructed selection example, not a randomized trial or an estimate of a real treatment effect.</p>
<section id="data"><h2>1. Trace the denominator</h2><div class="scroll"><table><thead><tr><th>Measure</th><th>Control</th><th>Treatment</th></tr></thead><tbody>
<tr><td>Assigned visitors</td><td>{report['arms']['control']['assigned']:,}</td><td>{report['arms']['treatment']['assigned']:,}</td></tr>
<tr><td>Visitors with logged exposure</td><td>{report['arms']['control']['exposed']:,}</td><td>{report['arms']['treatment']['exposed']:,}</td></tr>
<tr><td>Purchasers within seven days</td><td>{report['arms']['control']['buyers']:,}</td><td>{report['arms']['treatment']['buyers']:,}</td></tr>
<tr><td>All-assigned purchase rate</td><td>{report['arms']['control']['itt_purchase_rate']:.2%}</td><td>{report['arms']['treatment']['itt_purchase_rate']:.2%}</td></tr>
<tr><td>Exposed-only purchase rate</td><td>{report['arms']['control']['exposed_only_rate']:.2%}</td><td>{report['arms']['treatment']['exposed_only_rate']:.2%}</td></tr>
</tbody></table></div>
<p>Every purchaser in this constructed example has exposure. The difference comes from excluding nonpurchasers unequally. Exposure is a post-assignment condition, so the exposed-only populations are not interchangeable with the assigned populations.</p>
<p><a href="/projects/commerce-conversion/experiment/ledger/output/audit.json">Inspect aggregate audit</a> · <a href="https://github.com/harshit-malik-nyu/portfolio/blob/main/projects/commerce-conversion/experiment/ledger/metrics.sql">Read the SQL</a> · <a href="/projects/commerce-conversion/experiment/ledger/output/fixture.synthetic.json" download>Download synthetic source</a></p></section>
<section id="business"><h2>2. Explain the business consequence</h2>
<p>Assume 10,000 future eligible visitors, $80 per incremental order, 35% contribution margin, $1,000 fixed cost and one incremental order per additional buyer. Applying the all-assigned descriptive difference produces ${modeled_itt:,.0f} modeled net contribution. Applying the selected-population difference produces ${modeled_selected:,.0f}.</p>
<p><strong>The ${modeled_selected-modeled_itt:,.0f} gap is an illustration of model sensitivity, not money earned or lost.</strong> Neither projection is approved: causal validity, future audience comparability, costs and the harm ceiling remain unverified.</p>
<p><a href="https://github.com/harshit-malik-nyu/portfolio/blob/main/projects/commerce-conversion/experiment/ledger/decision-record.md">Read alternatives, change request and acceptance responsibilities</a></p></section>
<section id="product"><h2>3. Separate a passing data check from permission to ship</h2>
<p>Log contract: <strong>{report['contract_status']}</strong>. Decision engine: <strong>{result['decision']}</strong>.</p>
<p>The pipeline checks assignment consistency, event identity, cross-arm records, timestamps, duplicate delivery and the seven-day window. It keeps unexposed and immature assignments. It cannot prove that missing events were captured, people were independently randomized, or an analysis plan existed before results were seen.</p>
<p><a href="/projects/commerce-conversion/experiment/ledger/output/decision.json">Inspect the exact gate handoff</a> · <a href="/projects/commerce-conversion/experiment/ledger/output/manifest.json">Verify artifact hashes</a></p></section>
<section><h2>Challenge the work</h2><p>Move a purchase to exactly day seven, replay an event, insert an event in the other arm, or analyze before follow-up ends. Inspect whether the output excludes the boundary event, preserves counts, rejects contamination, and retains immature assignments.</p>
<p><a href="https://github.com/harshit-malik-nyu/portfolio/tree/main/projects/commerce-conversion/experiment/ledger">Runbook and regression tests</a></p></section>
<footer>Independent, AI-assisted work sample. Synthetic validation demonstrates methods, not employer adoption or candidate interview performance.</footer>
</main></body></html>\n''')
    paths = [ROOT / "analyze.py", ROOT / "metrics.sql", ROOT / "build.py", ROOT / "index.html", ROOT.parent / "decision.js", output / "fixture.synthetic.json", output / "audit.json", output / "decision.json"]
    write(output / "manifest.json", {"evidence": "synthetic", "files": {str(p.relative_to(ROOT.parent)): digest(p) for p in paths}})
    print(json.dumps({"contract": report["contract_status"], "itt_lift": report["itt_lift"], "exposed_only_lift": report["exposed_only_lift"], "decision": result["decision"]}))


if __name__ == "__main__":
    build()
