-- Demonstration semantic model over validated event storage. UTC grains.
CREATE INDEX IF NOT EXISTS ix_events_day_type ON events(substr(occurred_at,1,10),event);
CREATE INDEX IF NOT EXISTS ix_events_visitor_time ON events(visitor_id,occurred_at);
CREATE VIEW IF NOT EXISTS dim_visitor AS
 SELECT DISTINCT visitor_id AS visitor_key FROM events;
CREATE VIEW IF NOT EXISTS dim_observed_day AS
 SELECT DISTINCT substr(occurred_at,1,10) AS day_key FROM events;
CREATE VIEW IF NOT EXISTS fact_event AS
 SELECT event_id AS event_key,visitor_id AS visitor_key,
 substr(occurred_at,1,10) AS day_key,occurred_at,event,order_id FROM events;
CREATE VIEW IF NOT EXISTS mart_daily_behavior AS
 SELECT day_key,COUNT(*) AS events,COUNT(DISTINCT visitor_key) AS visitors,
 COUNT(DISTINCT CASE WHEN event='transaction' THEN visitor_key END) AS buyers,
 COUNT(DISTINCT CASE WHEN event='transaction' THEN order_id END) AS orders
 FROM fact_event GROUP BY day_key;
