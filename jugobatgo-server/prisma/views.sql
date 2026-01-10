-- contact_statistics View 생성
-- 각 연락처별 거래 통계를 실시간으로 계산

CREATE OR REPLACE VIEW contact_statistics AS
SELECT
  c.id AS contact_id,
  c."userId" AS user_id,
  c.name,
  c."phoneNumber" AS phone_number,
  c."ledgerGroupId" AS ledger_group_id,
  
  -- 준 금액 합계
  COALESCE(SUM(CASE WHEN t.type = 'GIVE' THEN t.amount ELSE 0 END), 0) AS total_give,
  
  -- 받은 금액 합계
  COALESCE(SUM(CASE WHEN t.type = 'RECEIVE' THEN t.amount ELSE 0 END), 0) AS total_receive,
  
  -- 잔액 (받은 금액 - 준 금액)
  COALESCE(SUM(CASE WHEN t.type = 'RECEIVE' THEN t.amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN t.type = 'GIVE' THEN t.amount ELSE 0 END), 0) AS balance,
  
  -- 거래 건수
  COUNT(t.id) AS transaction_count,
  
  -- 최근 거래 날짜
  MAX(t."eventDate") AS last_transaction_date,
  
  -- 카테고리별 거래 수
  COUNT(CASE WHEN t.category = 'CASH' THEN 1 END) AS cash_count,
  COUNT(CASE WHEN t.category = 'GIFT' THEN 1 END) AS gift_count,
  COUNT(CASE WHEN t.category = 'GOLD' THEN 1 END) AS gold_count
  
FROM contacts c
LEFT JOIN transactions t ON c.id = t."contactId"
GROUP BY c.id, c."userId", c.name, c."phoneNumber", c."ledgerGroupId";


-- user_statistics View 생성
-- 각 사용자별 전체 통계를 실시간으로 계산

CREATE OR REPLACE VIEW user_statistics AS
SELECT
  u.id AS user_id,
  u.email,
  
  -- 준 금액 합계
  COALESCE(SUM(CASE WHEN t.type = 'GIVE' THEN t.amount ELSE 0 END), 0) AS total_give,
  
  -- 받은 금액 합계
  COALESCE(SUM(CASE WHEN t.type = 'RECEIVE' THEN t.amount ELSE 0 END), 0) AS total_receive,
  
  -- 잔액
  COALESCE(SUM(CASE WHEN t.type = 'RECEIVE' THEN t.amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN t.type = 'GIVE' THEN t.amount ELSE 0 END), 0) AS balance,
  
  -- 거래 건수
  COUNT(t.id) AS transaction_count,
  
  -- 연락처 수
  (SELECT COUNT(*) FROM contacts WHERE "userId" = u.id) AS contact_count,
  
  -- 장부 그룹 수
  (SELECT COUNT(*) FROM ledger_groups WHERE "userId" = u.id) AS ledger_group_count,
  
  -- 주밥 온도 계산
  CASE
    WHEN COUNT(t.id) = 0 THEN 36.5
    ELSE 
      LEAST(42, GREATEST(30,
        36.5 + (
          (COALESCE(SUM(CASE WHEN t.type = 'RECEIVE' THEN t.amount ELSE 0 END), 0) - 
           COALESCE(SUM(CASE WHEN t.type = 'GIVE' THEN t.amount ELSE 0 END), 0)) 
          / 
          NULLIF(COALESCE(SUM(CASE WHEN t.type = 'GIVE' THEN t.amount ELSE 0 END), 0) + 
                 COALESCE(SUM(CASE WHEN t.type = 'RECEIVE' THEN t.amount ELSE 0 END), 0), 0)
        ) * 5 + 
        CASE
          WHEN COUNT(t.id) >= 50 THEN 1
          WHEN COUNT(t.id) >= 20 THEN 0.5
          ELSE 0
        END
      ))
  END AS jubad_temperature
  
FROM users u
LEFT JOIN contacts c ON u.id = c."userId"
LEFT JOIN transactions t ON c.id = t."contactId"
GROUP BY u.id, u.email;


-- ledger_group_statistics View 생성
-- 장부 그룹별 통계

CREATE OR REPLACE VIEW ledger_group_statistics AS
SELECT
  lg.id AS ledger_group_id,
  lg."userId" AS user_id,
  lg.name AS group_name,
  
  -- 준 금액 합계
  COALESCE(SUM(CASE WHEN t.type = 'GIVE' THEN t.amount ELSE 0 END), 0) AS total_give,
  
  -- 받은 금액 합계
  COALESCE(SUM(CASE WHEN t.type = 'RECEIVE' THEN t.amount ELSE 0 END), 0) AS total_receive,
  
  -- 잔액
  COALESCE(SUM(CASE WHEN t.type = 'RECEIVE' THEN t.amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN t.type = 'GIVE' THEN t.amount ELSE 0 END), 0) AS balance,
  
  -- 거래 건수
  COUNT(t.id) AS transaction_count,
  
  -- 연락처 수
  (SELECT COUNT(*) FROM contacts WHERE "ledgerGroupId" = lg.id) AS contact_count
  
FROM ledger_groups lg
LEFT JOIN transactions t ON lg.id = t."ledgerGroupId"
GROUP BY lg.id, lg."userId", lg.name;
