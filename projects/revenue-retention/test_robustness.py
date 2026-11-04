import importlib.util,unittest,math
from pathlib import Path
s=importlib.util.spec_from_file_location('revenue_robustness',Path(__file__).with_name('robustness.py'));r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
class RobustnessTests(unittest.TestCase):
 def test_credit_not_double_counted_as_refund(self):
  x=r.build()['credit_then_refund'];self.assertEqual((x['net_billed_cents'],x['net_cash_cents'],x['receivable_cents'],x['customer_credit_cents']),(8000,8000,0,0));self.assertEqual(x['reconciliation_difference_cents'],0)
 def test_customer_credit_not_negative_receivable(self):self.assertEqual(r.build()['credit_awaiting_refund']['customer_credit_cents'],2000)
 def test_refund_cutoff(self):
  x=r.credit_cash(100,100,[],[dict(id='late',date='2026-10-01',cents=50)]);self.assertEqual(x['net_cash_cents'],100)
 def test_invalid_adjustments_fail(self):
  with self.assertRaises(ValueError):r.credit_cash(100,100,[dict(id='bad',date='2026-09-01',cents=101)],[])
  event=dict(id='same',date='2026-09-01',cents=1)
  with self.assertRaises(ValueError):r.credit_cash(100,100,[event,event],[])
 def test_interval_independent_formula(self):
  x=r.bounded_interval([1]*100,[0]*100,0,1);radius=2*math.sqrt(math.log(80)/200);self.assertAlmostEqual(x['lower'],1-radius);self.assertEqual(x['upper'],1)
 def test_small_sample_inconclusive(self):self.assertLess(r.build()['experiment_interval_cents']['lower'],0)
 def test_missing_outcomes_rejected(self):
  with self.assertRaises(ValueError):r.bounded_interval([None],[0],0,1)
 def test_outcome_support_rejected(self):
  with self.assertRaises(ValueError):r.bounded_interval([2],[0],0,1)
 def test_more_data_narrows_bound(self):self.assertGreater(r.bounded_interval([1]*100,[0]*100,0,1)['lower'],r.bounded_interval([1]*10,[0]*10,0,1)['lower'])
 def test_sensitivity_budget_binding(self):
  rows=r.sensitivity()['rows'];self.assertEqual(len(rows),27)
  for x in rows:
   if x['candidate']!='hold':self.assertLessEqual(x['cost_usd'][x['candidate']],1000);self.assertGreater(x['net_cash_usd'][x['candidate']],0)
  base=next(x for x in rows if (x['effect_multiplier'],x['margin'],x['cost_multiplier'])==(1,.8,1));self.assertAlmostEqual(base['net_cash_usd']['activation'],1056.8);self.assertEqual(base['candidate'],'activation')
if __name__=='__main__':unittest.main()
