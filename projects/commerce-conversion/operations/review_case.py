"""Seeded synthetic ownership exercise; no dependencies or persistent writes."""
import argparse
import copy
import importlib.util
import json
from pathlib import Path
import random

spec = importlib.util.spec_from_file_location('review_pipeline', Path(__file__).with_name('pipeline.py'))
pipeline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pipeline)
AS_OF = '2026-01-02T01:00:00Z'
WATERMARK = '2026-01-02T00:00:00Z'


def make_case(seed=1):
    rng = random.Random(seed)
    visitors = rng.randint(12, 40)
    buyers = rng.randint(2, visitors // 3)
    late_buyers = rng.randint(1, visitors // 4)

    def event(identity, visitor, kind='view', order=None):
        return dict(event_id=identity, visitor_id=f'v{visitor}', event=kind,
                    occurred_at='2026-01-01T10:00:00Z', order_id=order)

    rows = [event(f'view-{i}', i) for i in range(visitors)]
    for i in range(buyers):
        # Two recorded items for one order: row count is not order count.
        rows += [event(f'buy-{i}-{j}', i, 'transaction', f'o{i}') for j in range(2)]
    rows += copy.deepcopy(rows[:3])  # transport duplicates
    rng.shuffle(rows)
    late = [event(f'late-{i}', i, 'transaction', f'o{i}')
            for i in range(buyers, buyers + late_buyers)]
    conflict = event('view-0', visitors + 1)
    return dict(seed=seed, synthetic=True, as_of=AS_OF,
                baseline=dict(batch_id='baseline', complete_through=WATERMARK, events=rows),
                rejected=dict(batch_id='correction', complete_through=WATERMARK,
                              events=late + [conflict]),
                corrected=dict(batch_id='correction', complete_through=WATERMARK, events=late))


def reference(case):
    """Oracle uses sets, not pipeline SQL. It defines this fixture's expectation."""
    def summarize(rows):
        unique = {r['event_id']: r for r in rows}
        people = {r['visitor_id'] for r in unique.values()}
        purchases = [r for r in unique.values() if r['event'] == 'transaction']
        buyers = {r['visitor_id'] for r in purchases}
        return dict(events=len(unique), visitors=len(people), buyers=len(buyers),
                    orders=len({r['order_id'] for r in purchases}),
                    buyer_rate=len(buyers) / len(people))
    before = summarize(case['baseline']['events'])
    after = summarize(case['baseline']['events'] + case['corrected']['events'])
    return dict(before=before, after=after,
                statuses=['PUBLISHED', 'REJECTED', 'PUBLISHED', 'REPLAY'],
                versions=[1, 1, 2, 2],
                interpretation='Late recording restates the same historical day; not causal product lift.')


def verify(case):
    expected = reference(case)
    db = pipeline.connect(':memory:')
    observations = []
    try:
        for batch in [case['baseline'], case['rejected'], case['corrected'], case['corrected']]:
            outcome = pipeline.refresh(db, batch, case['as_of'])
            report = pipeline.latest(db)
            observations.append(dict(status=outcome['status'], version=report['version'],
                                     daily=report['daily'][0]))
        assert [x['status'] for x in observations] == expected['statuses']
        assert [x['version'] for x in observations] == expected['versions']
        for i, observation in enumerate(observations):
            target = expected['before' if i < 2 else 'after']
            for key, value in target.items():
                assert observation['daily'][key] == value, (i, key, value, observation)
        return dict(fixture_verification='passed', candidate_assessment='not_performed',
                    expected=expected, observed=observations)
    finally:
        db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seed', type=int, default=1)
    parser.add_argument('--verify', action='store_true', help='Reveal and check reference results')
    args = parser.parse_args()
    case = make_case(args.seed)
    print(json.dumps(verify(case) if args.verify else case, indent=2))
