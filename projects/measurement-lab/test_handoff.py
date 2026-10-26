import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('measurement_handoff',ROOT/'analyze.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)

class HandoffTests(unittest.TestCase):
    def fixture(self): return json.loads((ROOT/'fixture.json').read_text())
    def test_independent_sql_preserves_started_denominator(self):
        r=a.analyze(self.fixture())
        self.assertEqual(r['metrics'],dict(started_sessions=3,viewed_sessions=2,carted_sessions=1,completed_sessions=1,failed_attempts=2,recovered_sessions=1))
        self.assertAlmostEqual(r['completion_per_started'],1/3)
        self.assertEqual(r['completion_per_viewed'],.5)
    def test_no_view_yields_undefined_view_rate(self):
        r=a.analyze(self.fixture()[2]);self.assertIsNone(r['completion_per_viewed']);self.assertEqual(r['completion_per_started'],0)
    def test_redelivery_collapses_but_changed_snapshot_blocks(self):
        x=self.fixture();r=a.analyze(x+[copy.deepcopy(x[0])]);self.assertEqual(r['metrics']['started_sessions'],3);self.assertEqual(r['exact_session_redeliveries'],1)
        changed=copy.deepcopy(x[0]);changed['events'].pop();changed['state']='carted'
        with self.assertRaises(a.ContractError):a.analyze(x+[changed])
    def test_mixed_sources_are_not_poolable(self):
        x=self.fixture();x[0]['source']='local_demo'
        with self.assertRaises(a.ContractError):a.analyze(x)
    def test_contract_rejections(self):
        for mutation in [lambda x:x[0].update(extra=1),lambda x:x[0]['events'][0].update(sequence=True),lambda x:x[0]['events'][0].update(occurred_at='2026-02-30T00:00:00.000Z'),lambda x:x[0]['events'][1].update(occurred_at='2025-01-01T00:00:00.000Z'),lambda x:x[0]['events'][1].update(event='order_completed'),lambda x:x[0]['events'][0].update(email='private@example.test')]:
            x=self.fixture();mutation(x)
            with self.assertRaises(a.ContractError):a.analyze(x)
    def test_one_hundred_varied_populations_against_counts(self):
        # Construct population counts directly, independently of SQL aggregation.
        for size in range(1,101):
            logs=[];templates=self.fixture()
            for i in range(size):
                log=copy.deepcopy(templates[i%3]);identity='s-case-'+str(i)
                for j,e in enumerate(log['events'],1):e.update(session_id=identity,event_id=identity+'-'+str(j))
                logs.append(log)
            r=a.analyze(logs)['metrics'];completed=(size+2)//3;viewed=size-size//3
            self.assertEqual(r['started_sessions'],size);self.assertEqual(r['viewed_sessions'],viewed);self.assertEqual(r['completed_sessions'],completed);self.assertEqual(r['failed_attempts'],2*completed)
    def test_cli_blocks_entire_batch_without_identifiers(self):
        x=self.fixture();x[-1]['events'][0]['email']='private@example.test'
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'input.json';path.write_text(json.dumps(x))
            r=subprocess.run([sys.executable,str(ROOT/'analyze.py'),str(path)],text=True,capture_output=True)
        self.assertEqual(r.returncode,2);self.assertEqual(r.stdout,'');self.assertNotIn('private@example.test',r.stderr)
    def test_duplicate_json_fields_reject(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'input.json';path.write_text('{"source":"local_demo","source":"synthetic_fixture"}')
            with self.assertRaises(a.ContractError):a.load(path)

if __name__=='__main__':unittest.main()
