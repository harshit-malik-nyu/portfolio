'use strict';
function scenario(n,aov,margin,cost,lift,baseline=0){
  if(![n,aov,margin,cost,lift,baseline].every(Number.isFinite)||n<=0||aov<0||margin<0||margin>1||cost<0||lift<0||baseline<0||baseline+lift>1)throw Error('Use nonnegative inputs, a margin from 0 to 100%, and a feasible purchase lift.');
  const contribution=aov*margin, orders=n*lift;
  return {orders,gross:orders*aov,contribution:orders*contribution,net:orders*contribution-cost,breakEven:contribution>0?cost/(n*contribution):null};
}
if(typeof module!=='undefined')module.exports={scenario};
if(typeof window!=='undefined'){
const D=window.COMMERCE_DATA,$=id=>document.getElementById(id),num=n=>n.toLocaleString('en-US'),pct=n=>n==null?'Not mature':(n*100).toFixed(2)+'%',money=n=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
function draw(){const d=D[$('gap').value],f=$('segment').value==='all'?d.funnel:d.segments[$('segment').value];
 $('kpis').innerHTML=[['Observed sessions',num(f.sessions)],['Sessions with a product view',num(f.viewed)],['Cart after view',num(f.cart_after_view)],['Any purchase / session',pct(f.purchase_session_rate)]].map(([a,b])=>`<div class="kpi"><span>${a}</span><strong>${b}</strong></div>`).join('');
 $('funnel').innerHTML=[['All observed sessions',f.sessions],['Product view',f.viewed],['Cart after view',f.cart_after_view],['Purchase after cart',f.purchase_after_cart]].map(([a,b])=>`<div class="bar-row"><div class="bar-label"><span>${a}</span><b>${num(b)} · ${pct(b/f.sessions)}</b></div><div class="bar-track"><div class="bar-fill" style="width:${b/f.sessions*100}%"></div></div></div>`).join('');
 $('interpretation').innerHTML=`<p><b>${pct(f.cart_to_purchase)}</b> of ordered cart sessions contain a later purchase.</p><p><b>${num(f.purchase_sessions-f.purchase_after_cart)}</b> purchase sessions do not satisfy the complete ordered funnel. That can reflect direct purchases, missing steps or other journeys.</p><p><b>${num(f.cart_after_view-f.purchase_after_cart)}</b> ordered cart sessions lack a later purchase in the same session. This is an investigation pool, not measured lost sales.</p>`;
 $('segments').innerHTML=Object.entries(d.segments).map(([k,s])=>`<tr><td>${k}</td><td>${num(s.sessions)}</td><td>${pct(s.purchase_session_rate)}</td></tr>`).join('');
 const rates=d.weeks.map(w=>w.purchase_sessions/w.sessions),max=Math.max(...rates)*1.2;
 const points=rates.map((r,i)=>`${50+i/(rates.length-1)*950},${155-r/max*125}`).join(' ');
 $('trend').innerHTML=`<svg viewBox="0 0 1040 195" xmlns="http://www.w3.org/2000/svg"><title>Weekly purchase-session rate, all groups</title><path d="M50 25V155H1000" fill="none" stroke="#c2cec5"/><line x1="50" y1="90" x2="1000" y2="90" stroke="#e2e7e1"/><polyline points="${points}" fill="none" stroke="#256b56" stroke-width="3"/><text x="0" y="30" font-size="12" fill="#5d6f70">${pct(max)}</text><text x="10" y="159" font-size="12" fill="#5d6f70">0%</text><text x="50" y="182" font-size="12" fill="#5d6f70">${d.weeks[0].week}</text><text x="905" y="182" font-size="12" fill="#5d6f70">${d.weeks.at(-1).week}</text></svg>`;
 $('weeks').innerHTML=d.weeks.map(w=>`<tr><td>${w.week}</td><td>${num(w.sessions)}</td><td>${num(w.purchase_sessions)}</td><td>${pct(w.purchase_sessions/w.sessions)}</td></tr>`).join('');
}
const full=D['30'],trial=full.cart_trial_baseline,repeat=full.repeat_purchase;
$('period').textContent=full.period_start.slice(0,10)+' to '+full.period_end.slice(0,10);
$('recommendation').textContent=`${num(trial.mature_visitors)} cart visitors have a complete seven-day outcome window; ${pct(trial.rate)} purchase. Investigate their journey before funding a change. The data does not reveal checkout failures or prove a fix will work.`;
$('repeat').textContent=pct(repeat.rate);$('repeat-note').textContent=`${num(repeat.repeat_buyers)} of ${num(repeat.mature_buyers)} mature buyers. Visitor-level Wilson 95% interval: ${pct(repeat.wilson95[0])} to ${pct(repeat.wilson95[1])}, under independent-visitor assumptions.`;
$('cart-baseline').textContent=pct(trial.rate);$('cart-note').textContent=`${num(trial.converted_visitors)} of ${num(trial.mature_visitors)} mature cart visitors. ${num(trial.cart_visitors-trial.mature_visitors)} late-arriving visitors are excluded from this historical mature-window baseline.`;
$('cohorts').innerHTML=full.cohorts.map(c=>`<tr><td>${c.cohort}</td><td>${num(c.visitors)}</td><td>${num(c.mature7)}</td><td>${pct(c.rate7)}</td><td>${num(c.mature30)}</td><td>${pct(c.rate30)}</td></tr>`).join('');
const populations={cart:trial.mature_visitors,discovery:full.visitors,retention:repeat.mature_buyers};
function calc(){try{const key=$('candidate').value,n=populations[key],s=scenario(n,+$('aov').value,+$('margin').value/100,+$('cost').value,+$('lift').value/100,key==='cart'?trial.rate:key==='retention'?repeat.rate:0);
 $('scenario').innerHTML=`<h3>${money(s.net)}</h3><p>Modeled net contribution after fixed project cost</p><dl><dt>Historical eligible visitor count</dt><dd>${num(n)}</dd><dt>Modeled additional orders</dt><dd>${num(Math.round(s.orders))}</dd><dt>Modeled gross revenue</dt><dd>${money(s.gross)}</dd><dt>Modeled contribution before cost</dt><dd>${money(s.contribution)}</dd><dt>Break-even absolute lift</dt><dd>${s.breakEven==null?'Not reachable':(s.breakEven*100).toFixed(2)+' pp'}</dd></dl><p>${s.net>0?'Worth evaluating if the assumed lift is plausible.':'Revise the cost or evidence for lift before funding.'}</p><p class="small">${key==='discovery'?'Discovery uses all observed visitors as an audience-size proxy; eligibility and baseline need prospective definition.':key==='retention'?'Retention uses mature first-observed buyers. Its 30-day outcome differs from the cart experiment.':'Cart uses visitors with complete seven-day follow-up. This historical count is not a promised future audience.'}</p>`;
}catch(e){$('scenario').textContent=e.message;}}
$('candidate').addEventListener('change',()=>{const k=$('candidate').value;$('cost').value={cart:8000,discovery:20000,retention:6000}[k];$('lift').value={cart:2,discovery:.03,retention:2}[k];calc();});
for(const id of ['aov','margin','cost','lift'])$(id).addEventListener('input',calc);
for(const id of ['gap','segment'])$(id).addEventListener('change',draw);
$('power').textContent=D.plan.note;
$('audit').innerHTML=[['Recorded rows',full.raw_rows],['Identical rows collapsed',full.quality.identical_rows_collapsed],['Distinct event records',full.distinct_events],['Purchase-item event records',full.event_counts.transaction],['Distinct visitor + transaction orders',full.orders],['Transaction records missing IDs',full.quality.transaction_rows_missing_id],['Timestamp groups with tied event types',full.quality.visitor_timestamp_groups_with_multiple_event_types]].map(([a,b])=>`<div class="audit-row"><span>${a}</span><b>${num(b)}</b></div>`).join('');draw();calc();
}
