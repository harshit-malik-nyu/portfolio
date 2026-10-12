-- Grain: one distinct recorded event. Identical records are collapsed, not claimed fraudulent.
CREATE TABLE events AS SELECT DISTINCT ts, visitor, event, item, transaction_id FROM raw;
CREATE INDEX event_order ON events(visitor,ts);
CREATE TABLE marked AS
SELECT *, CASE WHEN lag(ts) OVER (PARTITION BY visitor ORDER BY ts,event,item,transaction_id) IS NULL
 OR ts-lag(ts) OVER (PARTITION BY visitor ORDER BY ts,event,item,transaction_id)>:gap THEN 1 ELSE 0 END AS new_session
FROM events;
CREATE TABLE sequenced AS
SELECT *,sum(new_session) OVER(PARTITION BY visitor ORDER BY ts,event,item,transaction_id ROWS UNBOUNDED PRECEDING) AS session_no
FROM marked;
CREATE INDEX session_lookup ON sequenced(visitor,session_no,event,ts);
CREATE TABLE sessions AS
SELECT visitor,session_no,min(ts) AS start_ts,max(ts) AS end_ts,
 count(*) AS events,min(CASE WHEN event='view' THEN ts END) AS view_ts,
 min(CASE WHEN event='addtocart' THEN ts END) AS any_cart_ts,
 max(CASE WHEN event='transaction' THEN 1 ELSE 0 END) AS any_purchase
FROM sequenced GROUP BY visitor,session_no;
ALTER TABLE sessions ADD COLUMN cart_ts INTEGER;
UPDATE sessions SET cart_ts=(SELECT min(e.ts) FROM sequenced e WHERE e.visitor=sessions.visitor
 AND e.session_no=sessions.session_no AND e.event='addtocart' AND e.ts>sessions.view_ts);
ALTER TABLE sessions ADD COLUMN purchase_ts INTEGER;
UPDATE sessions SET purchase_ts=(SELECT min(e.ts) FROM sequenced e WHERE e.visitor=sessions.visitor
 AND e.session_no=sessions.session_no AND e.event='transaction' AND e.ts>sessions.cart_ts);
ALTER TABLE sessions ADD COLUMN after_cart_ts INTEGER;
UPDATE sessions SET after_cart_ts=(SELECT min(e.ts) FROM sequenced e WHERE e.visitor=sessions.visitor
 AND e.session_no=sessions.session_no AND e.event='transaction' AND e.ts>sessions.any_cart_ts);
-- Orders differ from transaction-item event rows. Unknown IDs are excluded from order counts.
CREATE TABLE orders AS SELECT visitor,transaction_id,min(ts) AS ts,count(DISTINCT item) AS distinct_items
FROM events WHERE event='transaction' AND transaction_id IS NOT NULL GROUP BY visitor,transaction_id;
CREATE INDEX order_lookup ON orders(visitor,ts);
CREATE TABLE visitors AS SELECT visitor,min(ts) AS first_ts,max(ts) AS last_ts FROM events GROUP BY visitor;
