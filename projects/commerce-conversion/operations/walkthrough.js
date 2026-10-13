'use strict';
(() => {
  const data = window.OPERATIONS_DEMO;
  const $ = id => document.getElementById(id);
  let current = 0;
  const buttons = data.scenarios.map((scenario, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${index + 1}. ${scenario.title}`;
    button.addEventListener('click', () => show(index));
    $('scenarios').appendChild(button);
    return button;
  });
  function show(index) {
    current = index;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const {title, explanation, result, report, input} = data.scenarios[index];
    $('title').textContent = title;
    $('explanation').textContent = explanation;
    $('status').textContent = result.status;
    $('version').textContent = `Trusted report version ${report.version} · ${result.status === 'PUBLISHED' ? 'New version committed' : 'Previous version retained'}`;
    $('reason').textContent = result.reason ? `Publication blocked: ${result.reason}.` :
      result.status === 'REPLAY' ? 'No report version or metric changed.' :
      `${result.inserted} inserted · ${result.duplicates} duplicate rows ignored · ${result.late_events} late events. Restated days: ${result.restated_days.join(', ') || 'none'}.`;
    $('freshness').textContent = `Report as of ${report.as_of}; source complete through ${report.complete_through}. These are fixed demonstration timestamps.`;
    const day = report.daily[0];
    $('metrics').replaceChildren();
    for (const [value, label] of [[day.visitors,'Observed visitors'],[day.orders,'Distinct orders'],[`${(100 * day.buyer_rate).toFixed(1)}%`,'Same-day buyer rate']]) {
      const box = document.createElement('div'); box.className = 'metric';
      const strong = document.createElement('strong'); strong.textContent = value;
      const span = document.createElement('span'); span.textContent = label;
      box.append(strong, span); $('metrics').appendChild(box);
    }
    $('daily').replaceChildren();
    for (const row of report.daily) {
      const tr = document.createElement('tr');
      for (const key of ['day','events','visitors','buyers','orders','status']) {
        const td = document.createElement('td'); td.textContent = row[key]; tr.appendChild(td);
      }
      $('daily').appendChild(tr);
    }
    $('audit').textContent = JSON.stringify(result, null, 2);
    $('input').textContent = JSON.stringify(input, null, 2);
  }
  $('download').addEventListener('click', () => {
    const record = {evidence_type: data.evidence_type, scenario: data.scenarios[current]};
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = `reporting-scenario-${current + 1}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  show(0);
})();
