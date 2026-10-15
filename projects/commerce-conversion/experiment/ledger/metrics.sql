-- Keep every assignment. Reduce to one row per visitor before arm aggregation.
-- Timestamps are validated UTC integer seconds. Outcome window: [assigned, assigned+7d).
WITH person AS (
  SELECT a.visitor_id, a.arm, a.assigned_at,
         CASE WHEN a.assigned_at + 604800 <= :as_of THEN 1 ELSE 0 END AS mature,
         MAX(CASE WHEN e.kind = 'exposure' THEN 1 ELSE 0 END) AS exposed,
         MAX(CASE WHEN e.kind = 'purchase' THEN 1 ELSE 0 END) AS buyer,
         MAX(CASE WHEN e.kind = 'harm' THEN 1 ELSE 0 END) AS harmed
  FROM assignments a
  LEFT JOIN events e ON a.visitor_id = e.visitor_id
    AND e.occurred_at >= a.assigned_at
    AND e.occurred_at < a.assigned_at + 604800
  GROUP BY a.visitor_id, a.arm, a.assigned_at
)
SELECT arm, COUNT(*) AS assigned, SUM(mature) AS mature,
       SUM(exposed) AS exposed, SUM(buyer) AS buyers, SUM(harmed) AS harmed,
       SUM(CASE WHEN exposed = 1 THEN buyer ELSE 0 END) AS exposed_buyers
FROM person GROUP BY arm ORDER BY arm;
