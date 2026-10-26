"""Inject representative defects into temporary copies; never mutate working sources.

A detected mutant is a targeted assertion failure, not a runtime/import failure.
This is selected mutation testing, not exhaustive correctness or candidate assessment.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
BASE = 'projects/commerce-conversion/'
SUITES = {
    'ledger': [sys.executable, BASE+'experiment/ledger/test_ledger.py'],
    'operations': [sys.executable, BASE+'operations/test_pipeline.py'],
    'decision': ['node', '--test', BASE+'tests/experiment.test.cjs'],
}
MUTATIONS = [
    ('D1', 'data', 'Exclude people with no events', 'ledger', 'experiment/ledger/metrics.sql', 'LEFT JOIN events', 'INNER JOIN events', 'test_population_retained_when_both_arms_have_events'),
    ('D2', 'data', 'Count purchases instead of distinct buyers', 'ledger', 'experiment/ledger/metrics.sql', "MAX(CASE WHEN e.kind = 'purchase'", "SUM(CASE WHEN e.kind = 'purchase'", 'test_retries_and_multiple_purchases_do_not_inflate'),
    ('P1', 'product', 'Include outcomes at the excluded window boundary', 'ledger', 'experiment/ledger/metrics.sql', 'e.occurred_at < a.assigned_at + 604800', 'e.occurred_at <= a.assigned_at + 604800', 'test_window_end_excluded_and_maturity_inclusive'),
    ('D3', 'data', 'Count item rows as orders', 'operations', 'operations/pipeline.py', "COUNT(DISTINCT CASE WHEN event='transaction' THEN order_id END)", "COUNT(CASE WHEN event='transaction' THEN order_id END)", 'test_multirow_order_is_one_order'),
    ('B1', 'business', 'Approve economics using only the point estimate', 'decision', 'experiment/decision.js', 'liftInterval[0]>breakEven', 'lift>breakEven', 'positive lift is insufficient when its lower bound cannot pay back cost'),
    ('B2', 'business', 'Ignore the harm ceiling', 'decision', 'experiment/decision.js', 'guardrailPass=harmInterval[1]<=x.maxHarm', 'guardrailPass=true', 'harm blocks an otherwise profitable treatment'),
    ('P2', 'product', 'Ignore sample ratio mismatch', 'decision', 'experiment/decision.js', 'if(srmP<.001)', 'if(false)', 'sample ratio mismatch invalidates interpretation'),
]

def run(command, directory):
    result = subprocess.run(command, cwd=directory, capture_output=True, text=True, timeout=120)
    return result.returncode, result.stdout + result.stderr

def main():
    for name, command in SUITES.items():
        code, log = run(command, ROOT)
        if code:
            raise RuntimeError(f'Baseline {name} failed; mutation results are uninterpretable.\n{log}')
    records = []
    hashes = {}
    with tempfile.TemporaryDirectory(prefix='portfolio-mutations-') as temp:
        work = Path(temp)
        shutil.copytree(ROOT / BASE, work / BASE, ignore=shutil.ignore_patterns('raw', '*.xlsx', '*.png', '__pycache__'))
        for identity, domain, defect, suite, relative, old, new, expected in MUTATIONS:
            source = ROOT / BASE / relative
            original = source.read_text()
            if original.count(old) != 1:
                raise RuntimeError(f'{identity}: mutation anchor must occur exactly once')
            hashes[BASE+relative] = hashlib.sha256(source.read_bytes()).hexdigest()
            destination = work / BASE / relative
            destination.write_text(original.replace(old, new, 1))
            try:
                command = (['node', '--test', '--test-reporter=tap', '--test-name-pattern=^'+re.escape(expected)+'$', BASE+'tests/experiment.test.cjs'] if suite == 'decision' else SUITES[suite] + [('LedgerTests.' if suite == 'ledger' else 'RefreshTests.')+expected])
                code, log = run(command, work)
                failures = re.findall(r'^FAIL: (\S+)', log, re.M) if suite != 'decision' else re.findall(r'^not ok \d+ - (.+)$', log, re.M)
                detected = code != 0 and expected in failures and 'ERROR:' not in log and 'SyntaxError' not in log
                records.append(dict(id=identity, domain=domain, defect=defect, source=BASE+relative, expected_test=expected, detected=detected, assertion_failures=failures))
                if not detected:
                    raise RuntimeError(f'{identity}: expected assertion did not detect the defect.\n{log}')
            finally:
                destination.write_text(original)
    output = dict(scope='Seven selected, deliberately injected defects; not exhaustive mutation coverage, independent certification, or an assessment of candidate performance.', baseline_suites='all passed', source_sha256=hashes, mutations=records)
    (Path(__file__).parent / 'results.json').write_text(json.dumps(output, indent=2)+'\n')
    print(f'{len(records)}/{len(records)} selected defects detected by their expected assertions; original sources unchanged.')

if __name__ == '__main__':
    main()
