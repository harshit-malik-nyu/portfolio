-- Fixed synthetic snapshot. Cash = payments for these invoices received by cutoff.
-- Aggregate separately before joining to prevent split-payment / invoice fan-out.
CREATE VIEW clean_invoices AS SELECT DISTINCT * FROM invoices;
CREATE VIEW cash_by_invoice AS
 SELECT invoice_id,SUM(amount_cents) collected_cents FROM payments
 WHERE paid_at <= '2026-09-30' GROUP BY invoice_id;
CREATE VIEW billing_by_account AS
 SELECT i.account_id,i.month,SUM(i.amount_cents) billed_cents,
 SUM(COALESCE(p.collected_cents,0)) collected_cents
 FROM clean_invoices i LEFT JOIN cash_by_invoice p USING(invoice_id)
 GROUP BY i.account_id,i.month;
CREATE VIEW reconciliation AS
 SELECT s.account_id,s.month,a.segment,a.cohort,a.activated_14d,u.active_days,
 s.mrr_cents,COALESCE(b.billed_cents,0) billed_cents,
 COALESCE(b.collected_cents,0) collected_cents,
 s.mrr_cents-COALESCE(b.billed_cents,0) billing_gap_cents,
 COALESCE(b.billed_cents,0)-COALESCE(b.collected_cents,0) collection_gap_cents
 FROM subscriptions s JOIN accounts a USING(account_id)
 JOIN usage u ON u.account_id=s.account_id AND u.month=s.month
 LEFT JOIN billing_by_account b ON b.account_id=s.account_id AND b.month=s.month;
