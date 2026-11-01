import itertools,json,subprocess,sys,tempfile,unittest
from copy import deepcopy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from reconcile import reconcile
from fixtures import base,event,order,scenarios

class ReconciliationTests(unittest.TestCase):
    def test_equal_counts_do_not_prove_completeness(self):
        d=scenarios()[1][1];self.assertEqual(len(d['orders']),len(d['events']))
        r=reconcile(d);self.assertEqual(r['status'],'MISMATCH')
        self.assertEqual((r['counts']['missingOrders'],r['counts']['duplicateOrderEvents'],r['counts']['matchedOrders']),(1,1,1))
    def test_cutoff_is_inclusive_and_snapshot_can_resolve(self):
        d=scenarios()[3][1];self.assertEqual(reconcile(d)['counts']['missingOrders'],1)
        d['asOf']=d['events'][1]['received_at'];self.assertEqual(reconcile(d)['status'],'RECONCILED')
    def test_window_is_half_open_and_maturity_inclusive(self):
        d=base();d['orders']=[order(1,at=d['start']),order(2,at=d['end'])]
        d['events']=[{**event(o),'received_at':d['asOf']} for o in d['orders']]
        self.assertEqual(reconcile(d)['counts']['eligibleOrders'],1)
        d=base();d['asOf']='2026-10-29T10:00:00Z';self.assertEqual(reconcile(d)['status'],'RECONCILED')
        d['asOf']='2026-10-29T09:59:59Z';self.assertEqual(reconcile(d)['status'],'PENDING')
    def test_money_and_currencies_do_not_net(self):
        r=reconcile(scenarios()[2][1]);self.assertEqual(r['counts']['mismatchedOrders'],2)
        self.assertEqual(r['amounts'],[{'currency':'EUR','expectedCents':10000,'matchedCents':0,'missingCents':0,'exceptionCents':10000},{'currency':'USD','expectedCents':11000,'matchedCents':7000,'missingCents':0,'exceptionCents':4000}])
    def test_exact_retries_collapse_conflicting_ids_reject(self):
        d=base();d['orders'].append(deepcopy(d['orders'][0]));d['events'].append(deepcopy(d['events'][0]))
        r=reconcile(d);self.assertEqual(r['status'],'RECONCILED');self.assertEqual(r['counts']['sourceRedeliveries'],1);self.assertEqual(r['counts']['eventRedeliveries'],1)
        d['events'][-1]['amount_cents']+=1
        with self.assertRaises(ValueError):reconcile(d)
    def test_duplicate_values_cannot_hide_invalid_numeric_types(self):
        d=base();d['events'][0]['amount_cents']=1
        d['events'].append({**d['events'][0],'amount_cents':True})
        with self.assertRaises(ValueError):reconcile(d)
    def test_invalid_types_dates_and_schema(self):
        for kind in ['bool','negative','date','extra','currency','future_window']:
            d=base()
            if kind=='bool':d['orders'][0]['amount_cents']=True
            if kind=='negative':d['orders'][0]['amount_cents']=-1
            if kind=='date':d['orders'][0]['completed_at']='2026-02-30T10:00:00Z'
            if kind=='extra':d['orders'][0]['email']='not-permitted'
            if kind=='currency':d['events'][0]['currency']='usd'
            if kind=='future_window':d['asOf']=d['start']
            with self.subTest(kind=kind),self.assertRaises(ValueError):reconcile(d)
    def test_cancelled_or_orphan_event_blocks_and_empty_is_not_success(self):
        self.assertEqual(reconcile(scenarios()[6][1])['counts']['unexpectedEvents'],1)
        d=base();d['events'].append(event(order(99)));self.assertEqual(reconcile(d)['counts']['unexpectedEvents'],1)
        self.assertEqual(reconcile(scenarios()[-1][1])['status'],'NO_ELIGIBLE_ORDERS')
    def test_125_presence_patterns_against_constructed_counts(self):
        # Independent oracle from intended categories, not a second join implementation.
        for pattern in itertools.product(['missing','match','duplicate','amount','currency'],repeat=3):
            d=base();d['events']=[]
            for o,mode in zip(d['orders'],pattern):
                e=event(o)
                if mode=='missing':continue
                if mode=='amount':e['amount_cents']+=1
                if mode=='currency':e['currency']='GBP'
                d['events'].append(e)
                if mode=='duplicate':d['events'].append({**e,'event_id':e['event_id']+'retry'})
            r=reconcile(d);c=r['counts']
            self.assertEqual([c[k] for k in ['missingOrders','matchedOrders','duplicateOrderEvents','mismatchedOrders']],
              [pattern.count('missing'),pattern.count('match'),pattern.count('duplicate'),pattern.count('amount')+pattern.count('currency')])
            self.assertEqual(r['status'],'RECONCILED' if pattern==('match',)*3 else 'MISMATCH')
    def test_cli_fail_closed_and_no_raw_identifiers(self):
        script=Path(__file__).with_name('reconcile.py')
        with tempfile.TemporaryDirectory() as folder:
            p=Path(folder)/'input.json';p.write_text(json.dumps(base()))
            r=subprocess.run([sys.executable,str(script),str(p)],capture_output=True,text=True)
            self.assertEqual(r.returncode,0);self.assertNotIn('order_id',r.stdout);self.assertNotIn('event_id',r.stdout)
            p.write_text('{"schemaVersion":1,"schemaVersion":1}')
            r=subprocess.run([sys.executable,str(script),str(p)],capture_output=True,text=True)
            self.assertEqual(r.returncode,3);self.assertEqual(r.stdout,'')
if __name__=='__main__':unittest.main()
