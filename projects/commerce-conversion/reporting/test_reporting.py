import importlib.util
from pathlib import Path
import sqlite3
import unittest
spec=importlib.util.spec_from_file_location('reporting_build',Path(__file__).with_name('build.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class ReportingTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:');self.db.executescript(m.SCHEMA)
    def tearDown(self):self.db.close()
    def test_replay_and_exact_duplicates(self):
        row=(1430438400000,1,'view',1,-1)
        self.assertEqual(m.ingest(self.db,[row,row]),1)
        self.assertEqual(m.ingest(self.db,[row]),0)
    def test_check_violation_rolls_back_valid_row(self):
        with self.assertRaises(sqlite3.IntegrityError):
            m.ingest(self.db,[(1430438400000,1,'view',1,-1),(1430438400001,1,'broken',1,-1)])
        self.assertEqual(self.db.execute('SELECT count(*) FROM events').fetchone()[0],0)
    def test_cross_day_order_has_one_attribution_date(self):
        m.ingest(self.db,[(1430438400000,1,'transaction',1,9),(1430524800000,1,'transaction',2,9)])
        rows=self.db.execute(m.DAILY).fetchall()
        self.assertEqual([r[-1] for r in rows],[1,0])
    def test_visitors_are_nonadditive(self):
        m.ingest(self.db,[(1430438400000,1,'view',1,-1),(1430524800000,1,'view',1,-1)])
        self.assertEqual(sum(r[2] for r in self.db.execute(m.DAILY)),2)
        self.assertEqual(self.db.execute('SELECT count(DISTINCT visitor) FROM events').fetchone()[0],1)
if __name__=='__main__':unittest.main()
