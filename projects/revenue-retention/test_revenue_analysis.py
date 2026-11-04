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
 def test_missing_subscription_stops_instead_of_false_churn(self):
  t=copy.deepcopy(self.tables);t['subscriptions'][1].pop()
  with self.assertRaisesRegex(ValueError,'coverage'): analyze(t)
 def test_missing_usage_stops_instead_of_silent_exclusion(self):
  t=copy.deepcopy(self.tables);t['usage'][1].pop()
  with self.assertRaisesRegex(ValueError,'coverage'): analyze(t)
 def test_orphan_invoice_stops(self):
  t=copy.deepcopy(self.tables);t['invoices'][1].append(['bad','unknown','2026-09',100])
  with self.assertRaisesRegex(ValueError,'eligible'): analyze(t)
 def test_invalid_money_and_nulls(self):
  for value in [-1,1.5,True,None,'100']:
   with self.subTest(value=value):
    t=copy.deepcopy(self.tables);t['subscriptions'][1][0][2]=value
    with self.assertRaises(ValueError): analyze(t)
 def test_calendar_and_date_boundaries(self):
  for name,col,value in [('usage',2,31),('payments',2,'2026-09-31'),('accounts',3,2)]:
   with self.subTest(name=name):
    t=copy.deepcopy(self.tables);t[name][1][0][col]=value
    with self.assertRaises(ValueError): analyze(t)
 def test_duplicate_payment_is_not_extra_cash(self):
  t=copy.deepcopy(self.tables);t['payments'][1].append(t['payments'][1][0].copy())
  with self.assertRaisesRegex(ValueError,'Duplicate payment'): analyze(t)
 def test_independent_python_reconciliation_oracle(self):
  invoices={r[0]:r for r in self.tables['invoices'][1]}
  cash={}
  for _,iid,day,amount in self.tables['payments'][1]:
   if day<='2026-09-30': cash[iid]=cash.get(iid,0)+amount
  billed={};collected={}
  for iid,aid,month,amount in invoices.values():
   key=(aid,month);billed[key]=billed.get(key,0)+amount;collected[key]=collected.get(key,0)+cash.get(iid,0)
  for r in self.r['rows']:
   key=(r['account_id'],r['month'])
   self.assertEqual(r['billed_cents'],billed.get(key,0))
   self.assertEqual(r['collected_cents'],collected.get(key,0))
 def test_source_order_does_not_change_result(self):
  t=copy.deepcopy(self.tables)
  for _,rows in t.values(): rows.reverse()
  self.assertEqual(analyze(t),self.r)
if __name__=='__main__': unittest.main()
