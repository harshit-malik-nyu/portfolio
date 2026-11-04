import importlib.util,unittest,tempfile,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('revenue_advanced',Path(__file__).with_name('advanced.py'));a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class AdvancedTests(unittest.TestCase):
 def test_mrr_bridge_independent_totals(self):
  r=a.examples()['mrr_bridge'];self.assertEqual((r['opening'],r['closing'],r['difference']),(140000,90000,0));self.assertEqual((r['new'],r['reactivation'],r['expansion'],r['contraction'],r['churn']),(10000,30000,20000,20000,90000));self.assertAlmostEqual(r['grr'],3/14);self.assertAlmostEqual(r['nrr'],5/14)
 def test_zero_denominator(self):self.assertIsNone(a.mrr_bridge({'a':0},{'a':10})['nrr'])
 def test_incomplete_bridge_fails(self):
  with self.assertRaises(ValueError):a.mrr_bridge({'a':1},{})
 def test_exact_probability_oracle(self):
  r=a.examples()['experiment_signal'];self.assertEqual(r['extreme_allocations'],2);self.assertEqual(r['allocations'],924);self.assertAlmostEqual(r['p_value'],2/924);self.assertEqual(r['effect_cents'],10000)
 def test_missing_is_not_zero(self):self.assertEqual(a.examples()['experiment_missing']['decision'],'HOLD');self.assertIsNone(a.examples()['experiment_missing']['p_value'])
 def test_equal_outcomes_hold(self):
  rows=[dict(id=str(i),arm='T' if i<3 else 'C',days=90,net_cash_cents=100) for i in range(6)]
  r=a.experiment(rows);self.assertEqual(r['p_value'],1);self.assertEqual(r['decision'],'HOLD')
 def test_negative_effect_never_advances(self):
  rows=[dict(id=str(i),arm='T' if i<6 else 'C',days=90,net_cash_cents=0 if i<6 else 10000) for i in range(12)]
  self.assertEqual(a.experiment(rows)['decision'],'HOLD')
 def test_duplicate_assignment_fails(self):
  rows=[dict(id='same',arm=arm,days=90,net_cash_cents=0) for arm in ['T','C']]
  with self.assertRaises(ValueError):a.experiment(rows)
 def test_immature_and_economic_boundary(self):
  rows=[dict(id=str(i),arm='T' if i<6 else 'C',days=90,net_cash_cents=20000 if i<6 else 10000) for i in range(12)]
  self.assertEqual(a.experiment(rows,10000)['decision'],'HOLD');rows[0]['days']=89;self.assertIsNone(a.experiment(rows)['p_value'])
 def test_csv_import_reproduces(self):
  result=a.import_csv(a.ROOT/'data');expected=json.loads((a.ROOT/'data/results.json').read_text());self.assertEqual(result['analysis'],expected);self.assertEqual(len(result['source_sha256']),5)
if __name__=='__main__':unittest.main()
