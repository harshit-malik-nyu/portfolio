import unittest, copy
from pathlib import Path
import importlib.util
spec=importlib.util.spec_from_file_location("revenue_build",Path(__file__).with_name("build.py"))
module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
fixture,analyze=module.fixture,module.analyze
class RevenueTests(unittest.TestCase):
 def setUp(self): self.tables=fixture(); self.r=analyze(self.tables)
 def row(self,id): return next(r for r in self.r['rows'] if r['account_id']==id and r['month']=='2026-09')
 def test_grain(self): self.assertEqual(len(self.r['rows']),270); self.assertEqual(len({(r['account_id'],r['month']) for r in self.r['rows']}),270)
 def test_duplicate(self): self.assertEqual(self.r['duplicates_removed'],1); self.assertEqual(self.row('A004')['billed_cents'],10000)
 def test_split_payment(self): self.assertEqual(self.row('A007')['collected_cents'],10000)
 def test_cutoff(self): self.assertEqual(self.row('A006')['collected_cents'],0)
 def test_missing_invoice(self): self.assertEqual(self.row('A002')['billing_gap_cents'],30000)
 def test_under_over_billing(self): self.assertEqual(self.row('A001')['billing_gap_cents'],5000); self.assertEqual(self.row('A003')['billing_gap_cents'],-3000)
 def test_failed_payment(self): self.assertEqual(self.row('A005')['collection_gap_cents'],30000)
 def test_bridge(self):
  for r in self.r['rows']: self.assertEqual(r['mrr_cents']-r['billing_gap_cents']-r['collection_gap_cents'],r['collected_cents'])
 def test_cohort_censoring(self): self.assertEqual(self.r['cohorts'][2]['retained'],[15,15,None,None,None,None]); self.assertEqual(self.r['cohorts'][0]['retained'][2],27)
 def test_conflicting_invoice_rejected(self):
  t=copy.deepcopy(self.tables); row=t['invoices'][1][0].copy();row[-1]+=1;t['invoices'][1].append(row)
  with self.assertRaises(ValueError): analyze(t)
 def test_orphan_payment_rejected(self):
  t=copy.deepcopy(self.tables); t['payments'][1].append(['orphan','absent','2026-09-01',100])
  with self.assertRaises(ValueError): analyze(t)
 def test_pools(self): self.assertEqual(self.r['pools'],{'collection':120000,'onboarding':610000,'renewal':1070000})
if __name__=='__main__': unittest.main()
