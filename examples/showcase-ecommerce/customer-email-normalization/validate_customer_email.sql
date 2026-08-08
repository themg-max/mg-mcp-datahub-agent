-- Offline validation for the synthetic customer-email normalization proposal.
-- Read-only checks against an in-memory sample. No persistent writes.

.headers on
.mode column

WITH source_customers AS (
  SELECT 1001 AS customer_id, '  Ada.Lovelace@Example.COM ' AS email_raw
  UNION ALL
  SELECT 1002 AS customer_id, 'grace.hopper@example.com' AS email_raw
  UNION ALL
  SELECT 1003 AS customer_id, '  Ada.Lovelace@Example.COM ' AS email_raw
  UNION ALL
  SELECT 1004 AS customer_id, CAST(NULL AS TEXT) AS email_raw
  UNION ALL
  SELECT 1005 AS customer_id, '   ' AS email_raw
),
normalized AS (
  SELECT
    customer_id,
    email_raw,
    CASE
      WHEN email_raw IS NULL THEN NULL
      WHEN trim(email_raw) = '' THEN NULL
      ELSE lower(trim(email_raw))
    END AS email_normalized
  FROM source_customers
),
checks AS (
  SELECT
    'row_count' AS check_name,
    CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL' END AS status,
    CAST(COUNT(*) AS TEXT) AS detail
  FROM normalized

  UNION ALL
  SELECT
    'customer_id_preserved',
    CASE WHEN COUNT(*) = 5 AND COUNT(DISTINCT customer_id) = 5 THEN 'PASS' ELSE 'FAIL' END,
    'distinct_ids=' || COUNT(DISTINCT customer_id)
  FROM normalized

  UNION ALL
  SELECT
    'raw_email_retained',
    CASE
      WHEN SUM(CASE WHEN customer_id = 1001 AND email_raw = '  Ada.Lovelace@Example.COM ' THEN 1 ELSE 0 END) = 1
      THEN 'PASS' ELSE 'FAIL'
    END,
    'raw sample retained for id 1001'
  FROM normalized

  UNION ALL
  SELECT
    'trim_lowercase_normalization',
    CASE
      WHEN SUM(CASE WHEN customer_id = 1001 AND email_normalized = 'ada.lovelace@example.com' THEN 1 ELSE 0 END) = 1
       AND SUM(CASE WHEN customer_id = 1002 AND email_normalized = 'grace.hopper@example.com' THEN 1 ELSE 0 END) = 1
      THEN 'PASS' ELSE 'FAIL'
    END,
    'normalized forms match expected'
  FROM normalized

  UNION ALL
  SELECT
    'null_blank_validation',
    CASE
      WHEN SUM(CASE WHEN customer_id IN (1004, 1005) AND email_normalized IS NULL THEN 1 ELSE 0 END) = 2
      THEN 'PASS' ELSE 'FAIL'
    END,
    'null/blank map to NULL normalized'
  FROM normalized

  UNION ALL
  SELECT
    'duplicate_detection',
    CASE
      WHEN (
        SELECT COUNT(*) FROM (
          SELECT email_normalized
          FROM normalized
          WHERE email_normalized IS NOT NULL
          GROUP BY email_normalized
          HAVING COUNT(*) > 1
        )
      ) = 1
      THEN 'PASS' ELSE 'FAIL'
    END,
    'duplicate normalized email detected (ada.lovelace@example.com)'
  FROM (SELECT 1)
)
SELECT check_name, status, detail FROM checks
ORDER BY check_name;

WITH source_customers AS (
  SELECT 1001 AS customer_id, '  Ada.Lovelace@Example.COM ' AS email_raw
  UNION ALL
  SELECT 1002 AS customer_id, 'grace.hopper@example.com' AS email_raw
  UNION ALL
  SELECT 1003 AS customer_id, '  Ada.Lovelace@Example.COM ' AS email_raw
  UNION ALL
  SELECT 1004 AS customer_id, CAST(NULL AS TEXT) AS email_raw
  UNION ALL
  SELECT 1005 AS customer_id, '   ' AS email_raw
),
normalized AS (
  SELECT
    customer_id,
    email_raw,
    CASE
      WHEN email_raw IS NULL THEN NULL
      WHEN trim(email_raw) = '' THEN NULL
      ELSE lower(trim(email_raw))
    END AS email_normalized
  FROM source_customers
),
checks AS (
  SELECT
    'row_count' AS check_name,
    CASE WHEN COUNT(*) = 5 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM normalized
  UNION ALL
  SELECT
    'customer_id_preserved',
    CASE WHEN COUNT(*) = 5 AND COUNT(DISTINCT customer_id) = 5 THEN 'PASS' ELSE 'FAIL' END
  FROM normalized
  UNION ALL
  SELECT
    'raw_email_retained',
    CASE
      WHEN SUM(CASE WHEN customer_id = 1001 AND email_raw = '  Ada.Lovelace@Example.COM ' THEN 1 ELSE 0 END) = 1
      THEN 'PASS' ELSE 'FAIL'
    END
  FROM normalized
  UNION ALL
  SELECT
    'trim_lowercase_normalization',
    CASE
      WHEN SUM(CASE WHEN customer_id = 1001 AND email_normalized = 'ada.lovelace@example.com' THEN 1 ELSE 0 END) = 1
       AND SUM(CASE WHEN customer_id = 1002 AND email_normalized = 'grace.hopper@example.com' THEN 1 ELSE 0 END) = 1
      THEN 'PASS' ELSE 'FAIL'
    END
  FROM normalized
  UNION ALL
  SELECT
    'null_blank_validation',
    CASE
      WHEN SUM(CASE WHEN customer_id IN (1004, 1005) AND email_normalized IS NULL THEN 1 ELSE 0 END) = 2
      THEN 'PASS' ELSE 'FAIL'
    END
  FROM normalized
  UNION ALL
  SELECT
    'duplicate_detection',
    CASE
      WHEN (
        SELECT COUNT(*) FROM (
          SELECT email_normalized
          FROM normalized
          WHERE email_normalized IS NOT NULL
          GROUP BY email_normalized
          HAVING COUNT(*) > 1
        )
      ) = 1
      THEN 'PASS' ELSE 'FAIL'
    END
  FROM (SELECT 1)
)
SELECT
  CASE
    WHEN SUM(CASE WHEN status != 'PASS' THEN 1 ELSE 0 END) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS overall_validation_status
FROM checks;
