"""Conservative bounded-outcome uncertainty, credit/cash controls and stress cases."""
import json, math
from datetime import date
from pathlib import Path

def credit_cash(invoice_cents,paid_cents,credits,refunds,cutoff='2026-09-30'):
    """One invoice; paid_cents is cumulative cash already filtered to cutoff.
    Credits reduce receivables; refunds reduce cash. Neither changes contracted MRR.
    Explicitly exclude credit reversals, tax, FX and recognition schedules.
    """
    for x in (invoice_cents,paid_cents):
        if type(x) is not int or x<0:raise ValueError('Nonnegative integer cents required')
    date.fromisoformat(cutoff)
    totals=[]
    for events in (credits,refunds):
        seen=set();total=0
        for e in events:
            if not isinstance(e['id'],str) or not e['id'] or e['id'] in seen:raise ValueError('Invalid or duplicate adjustment identity')
            seen.add(e['id']);date.fromisoformat(e['date'])
            if type(e['cents']) is not int or e['cents']<0:raise ValueError('Invalid adjustment amount')
            if e['date']<=cutoff:total+=e['cents']
        totals.append(total)
    credit,refund=totals
    if credit>invoice_cents or refund>paid_cents:raise ValueError('Adjustment exceeds source amount')
    net_billed=invoice_cents-credit;net_cash=paid_cents-refund
    balance=net_billed-net_cash
    return dict(net_billed_cents=net_billed,net_cash_cents=net_cash,
      receivable_cents=max(balance,0),customer_credit_cents=max(-balance,0),
      reconciliation_difference_cents=net_billed-net_cash-max(balance,0)+max(-balance,0))

def bounded_interval(treatment,control,lower,upper,alpha=.05):
    """Conservative finite-population ATE interval via two Hoeffding bounds.
    Requires complete random assignment, fixed arm sizes, no interference and
    prespecified bounds containing BOTH potential outcomes for every account.
    Sampling without replacement obeys the same conservative Hoeffding bound.
    A union bound combines the two arm bounds. No fitted normal approximation.
    """
    if not 0<alpha<1 or not math.isfinite(lower) or not math.isfinite(upper) or upper<=lower:raise ValueError('Invalid bounds or alpha')
    if not treatment or not control:raise ValueError('Both arms required')
    for x in treatment+control:
        if x is None or not isinstance(x,(int,float)) or isinstance(x,bool) or not math.isfinite(x) or not lower<=x<=upper:raise ValueError('Missing or out-of-bound assigned outcome')
    span=upper-lower;effect=sum(treatment)/len(treatment)-sum(control)/len(control)
    radius=span*(math.sqrt(math.log(4/alpha)/(2*len(treatment)))+math.sqrt(math.log(4/alpha)/(2*len(control))))
    return dict(effect=effect,lower=max(-span,effect-radius),upper=min(span,effect+radius),
      confidence=1-alpha,method='Conservative bounded-outcome Hoeffding union interval',
      assumptions='Prespecified potential-outcome bounds; complete random assignment; no interference; complete follow-up')

def sensitivity():
    """27 joint planning scenarios. Equal enumeration is not probability weighting."""
    rows=[]
    for effect in (.5,1,1.5):
        for margin in (.6,.8,.9):
            for cost_factor in (1,1.25,1.5):
                nets={'recovery':1200*.35*effect-300*cost_factor,
                      'activation':6100*.12*effect*3*margin-700*cost_factor,
                      'renewal':10700*.08*effect*3*margin-1000*cost_factor}
                costs={'recovery':300*cost_factor,'activation':700*cost_factor,'renewal':1000*cost_factor}
                feasible={k:v for k,v in nets.items() if costs[k]<=1000 and v>0}
                winner=max(feasible,key=feasible.get) if feasible else 'hold'
                rows.append(dict(effect_multiplier=effect,margin=margin,cost_multiplier=cost_factor,
                                 net_cash_usd=nets,cost_usd=costs,candidate=winner))
    return {'budget_usd':1000,'capacity_hours':20,'rows':rows,
       'warning':'Scenario counts are not probabilities; all effect, margin and cost ranges are unvalidated assumptions.'}

def build():
    interval=bounded_interval([20000]*6,[10000]*6,0,30000)
    return {'synthetic':True,'credit_then_refund':credit_cash(10000,10000,[dict(id='C1',date='2026-09-20',cents=2000)],[dict(id='R1',date='2026-09-21',cents=2000)]),
      'credit_awaiting_refund':credit_cash(10000,10000,[dict(id='C1',date='2026-09-20',cents=2000)],[]),
      'experiment_interval_cents':interval,
      'decision':'HOLD: small synthetic experiment interval includes economically harmful effects despite a small sharp-null p-value.',
      'sensitivity':sensitivity()}
if __name__=='__main__':
    (Path(__file__).parent/'data/robustness.json').write_text(json.dumps(build(),indent=2)+'\n')
