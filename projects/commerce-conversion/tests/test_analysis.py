"""Small synthetic counterexamples, never mixed into the observed dataset."""
import csv
import sqlite3
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from analyze import load,analyze,funnel,wilson

class AnalysisTests(unittest.TestCase):
    def model(self,rows,gap=30):
        d=tempfile.TemporaryDirectory();self.addCleanup(d.cleanup)
        p=Path(d.name)/'fixture.csv'
        with p.open('w',newline='') as f:
            w=csv.writer(f);w.writerow(['timestamp','visitorid','event','itemid','transactionid']);w.writerows(rows)
        db=sqlite3.connect(':memory:');self.addCleanup(db.close);load(db,p,gap)
        return db,p

    def test_order_requires_strict_sequence_and_allows_later_valid_cart(self):
        db,_=self.model([(0,1,'addtocart',1,''),(1,1,'view',1,''),(2,1,'addtocart',1,''),(3,1,'transaction',1,7),
                         (0,2,'view',1,''),(0,2,'addtocart',1,''),(1,2,'transaction',1,8)])
        f=funnel(db);self.assertEqual(f['viewed'],2);self.assertEqual(f['cart_after_view'],1);self.assertEqual(f['purchase_after_cart'],1)

    def test_orders_are_not_item_rows_and_duplicate_audit_reconciles(self):
        rows=[(0,1,'view',1,''),(1,1,'transaction',1,7),(1,1,'transaction',2,7),(1,1,'transaction',2,7)]
        db,p=self.model(rows);r=analyze(db,p,30,'synthetic test')
        self.assertEqual(r['orders'],1);self.assertEqual(r['event_counts']['transaction'],2)
        self.assertEqual(r['quality']['identical_rows_collapsed'],1)
        self.assertEqual(r['distinct_events']+r['quality']['identical_rows_collapsed'],r['raw_rows'])

    def test_gap_boundary_and_no_cross_session_funnel(self):
        db,_=self.model([(0,1,'view',1,''),(1800000,1,'addtocart',1,''),(3600001,1,'transaction',1,7)])
        f=funnel(db);self.assertEqual(f['sessions'],2);self.assertEqual(f['purchase_after_cart'],0)

    def test_immature_cohorts_are_not_failures(self):
        day=86400000
        db,p=self.model([(0,1,'view',1,''),(2*day,1,'view',1,''),(31*day,2,'view',1,'')])
        r=analyze(db,p,30,'synthetic test')
        self.assertEqual(sum(x['mature30'] for x in r['cohorts']),1)
        self.assertEqual(sum(x['return30'] for x in r['cohorts']),1)
        self.assertIsNone(r['cohorts'][-1]['rate30'])

    def test_purchase_without_view_not_deleted_or_forced_into_funnel(self):
        db,_=self.model([(0,1,'transaction',1,7)])
        f=funnel(db);self.assertEqual(f['purchase_sessions'],1);self.assertEqual(f['purchase_after_cart'],0)
        self.assertIsNone(f['view_to_cart'])

    def test_wilson_zero_is_not_certain_zero(self):
        self.assertGreater(wilson(0,100)[1],0)
        self.assertIsNone(wilson(0,0))

if __name__=='__main__':unittest.main()
