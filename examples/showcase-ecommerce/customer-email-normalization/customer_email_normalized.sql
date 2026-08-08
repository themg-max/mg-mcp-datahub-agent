-- Proposal-only SELECT for showcase-ecommerce customer email normalization.
-- SYNTHETIC_FIXTURE — not production SQL, not a migration runner.
-- No UPDATE / DELETE / DROP. Human approval required before any real use.

WITH source_customers AS (
  -- Synthetic sample rows (public-safe). Replace only under approved authority.
  SELECT 1001 AS customer_id, '  Ada.Lovelace@Example.COM ' AS email_raw
  UNION ALL
  SELECT 1002 AS customer_id, 'grace.hopper@example.com' AS email_raw
  UNION ALL
  SELECT 1003 AS customer_id, '  Ada.Lovelace@Example.COM ' AS email_raw
  UNION ALL
  SELECT 1004 AS customer_id, CAST(NULL AS TEXT) AS email_raw
  UNION ALL
  SELECT 1005 AS customer_id, '   ' AS email_raw
)
SELECT
  customer_id,
  email_raw,
  CASE
    WHEN email_raw IS NULL THEN NULL
    WHEN trim(email_raw) = '' THEN NULL
    ELSE lower(trim(email_raw))
  END AS email_normalized
FROM source_customers
ORDER BY customer_id;
