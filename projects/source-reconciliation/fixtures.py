from copy import deepcopy

def order(i,amount=1000,at='2026-10-28T10:00:00Z',currency='USD'):
    return {'order_id':f'o{i}','completed_at':at,'status':'completed','amount_cents':amount,'currency':currency}
def event(o,i=None):
    return {'event_id':f'e{i or o["order_id"]}','order_id':o['order_id'],'occurred_at':o['completed_at'],'received_at':'2026-10-28T11:00:00Z','amount_cents':o['amount_cents'],'currency':o['currency']}
def base():
    orders=[order(1,4000),order(2,7000),order(3,10000,currency='EUR')]
    return {'schemaVersion':1,'evidence':'synthetic','start':'2026-10-28T00:00:00Z','end':'2026-10-29T00:00:00Z','asOf':'2026-10-30T00:00:00Z','graceHours':24,'orders':orders,'events':[event(o) for o in orders]}
def scenarios():
    clean=base();balanced=deepcopy(clean);balanced['events'][1]=event(clean['orders'][0],'second')
    wrong=deepcopy(clean);wrong['events'][0]['amount_cents']=3999;wrong['events'][2]['currency']='USD'
    late=deepcopy(clean);late['events'][1]['received_at']='2026-10-30T01:00:00Z'
    after=deepcopy(late);after['asOf']='2026-10-30T02:00:00Z'
    pending=deepcopy(clean);pending['asOf']='2026-10-29T00:00:00Z'
    cancelled=deepcopy(clean);cancelled['orders'][1]['status']='cancelled'
    retry=deepcopy(clean);retry['events'].append(deepcopy(retry['events'][0]))
    empty=deepcopy(clean);empty['orders']=[];empty['events']=[]
    return [('Clean supplied snapshot',clean),('Equal counts hide a missing order',balanced),('Amount and currency disagree',wrong),
      ('Transaction arrives after cutoff',late),('Later snapshot resolves delivery',after),('Grace period has not elapsed',pending),
      ('Cancelled source order still emits',cancelled),('Exact delivery retry',retry),('No eligible population',empty)]
