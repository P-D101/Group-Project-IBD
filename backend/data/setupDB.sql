-- Set Nulls to actually be NULL
UPDATE focus_raw
SET
AvailabilityZone = NULLIF(AvailabilityZone, 'NULL'),
BilledCost = NULLIF(BilledCost, 'NULL'),
BillingAccountId = NULLIF(BillingAccountId, 'NULL'),
BillingAccountName = NULLIF(BillingAccountName, 'NULL'),
BillingCurrency = NULLIF(BillingCurrency, 'NULL'),
BillingPeriodEnd = NULLIF(BillingPeriodEnd, 'NULL'),
BillingPeriodStart = NULLIF(BillingPeriodStart, 'NULL'),
ChargeCategory = NULLIF(ChargeCategory, 'NULL'),
ChargeClass = NULLIF(ChargeClass, 'NULL'),
ChargeDescription = NULLIF(ChargeDescription, 'NULL'),
ChargeFrequency = NULLIF(ChargeFrequency, 'NULL'),
ChargePeriodEnd = NULLIF(ChargePeriodEnd, 'NULL'),
ChargePeriodStart = NULLIF(ChargePeriodStart, 'NULL'),
CommitmentDiscountCategory = NULLIF(CommitmentDiscountCategory, 'NULL'),
CommitmentDiscountId = NULLIF(CommitmentDiscountId, 'NULL'),
CommitmentDiscountName = NULLIF(CommitmentDiscountName, 'NULL'),
CommitmentDiscountStatus = NULLIF(CommitmentDiscountStatus, 'NULL'),
CommitmentDiscountType = NULLIF(CommitmentDiscountType, 'NULL'),
ConsumedQuantity = NULLIF(ConsumedQuantity, 'NULL'),
ConsumedUnit = NULLIF(ConsumedUnit, 'NULL'),
ContractedCost = NULLIF(ContractedCost, 'NULL'),
ContractedUnitPrice = NULLIF(ContractedUnitPrice, 'NULL'),
EffectiveCost = NULLIF(EffectiveCost, 'NULL'),
InvoiceIssuerName = NULLIF(InvoiceIssuerName, 'NULL'),
ListCost = NULLIF(ListCost, 'NULL'),
ListUnitPrice = NULLIF(ListUnitPrice, 'NULL'),
PricingCategory = NULLIF(PricingCategory, 'NULL'),
PricingQuantity = NULLIF(PricingQuantity, 'NULL'),
PricingUnit = NULLIF(PricingUnit, 'NULL'),
ProviderName = NULLIF(ProviderName, 'NULL'),
PublisherName = NULLIF(PublisherName, 'NULL'),
RegionId = NULLIF(RegionId, 'NULL'),
RegionName = NULLIF(RegionName, 'NULL'),
ResourceId = NULLIF(ResourceId, 'NULL'),
ResourceName = NULLIF(ResourceName, 'NULL'),
ResourceType = NULLIF(ResourceType, 'NULL'),
ServiceCategory = NULLIF(ServiceCategory, 'NULL'),
Id = NULLIF(Id, 'NULL'),
ServiceName = NULLIF(ServiceName, 'NULL'),
SkuId = NULLIF(SkuId, 'NULL'),
SkuPriceId = NULLIF(SkuPriceId, 'NULL'),
SubAccountId = NULLIF(SubAccountId, 'NULL'),
SubAccountName = NULLIF(SubAccountName, 'NULL'),
Tags = NULLIF(Tags, 'NULL');


-- Extract revelant details from tags
DROP VIEW IF EXISTS focus_with_tags;
CREATE VIEW focus_with_tags AS
SELECT *,
    json_extract(Tags,"$.business_unit") AS business_unit,
    json_extract(Tags,"$.application") AS application
FROM focus_raw;

DROP TABLE IF EXISTS billing_account;
CREATE TABLE billing_account (
    billing_account_id TEXT PRIMARY KEY,
    billing_account_name TEXT
);

INSERT OR IGNORE INTO billing_account
SELECT DISTINCT
    BillingAccountId AS billing_account_id,
    BillingAccountName AS billing_account_name
FROM focus_raw;

DROP TABLE IF EXISTS sub_account;
CREATE TABLE sub_account (
    sub_account_id TEXT PRIMARY KEY,
    sub_account_name TEXT
);

INSERT OR IGNORE INTO sub_account
SELECT DISTINCT
    SubAccountId AS sub_account_id,
    SubAccountName AS sub_account_name
FROM focus_raw WHERE SubAccountId IS NOT NULL;

DROP TABLE IF EXISTS focus_usage_cost;
CREATE TABLE focus_usage_cost (
    provider_name TEXT NOT NULL,
    billing_account_id TEXT NOT NULL,
    sub_account_id TEXT,
    service_category TEXT,
    service_name TEXT,
    region_id TEXT,
    resource_id TEXT,
    application TEXT,
    business_unit TEXT,
    charge_start_time DATETIME NOT NULL,
    charge_end_time DATETIME NOT NULL,
    billed_cost REAL NOT NULL,
    effective_cost REAL NOT NULL,
    currency TEXT,
    usage_quantity REAL,
    usage_unit TEXT,
    description TEXT,
    
    FOREIGN KEY (billing_account_id) REFERENCES billing_account(billing_account_id),
    FOREIGN KEY (sub_account_id) REFERENCES sub_account(sub_account_id)
);

INSERT OR IGNORE INTO focus_usage_cost
SELECT
    ProviderName AS provider_name,
    BillingAccountId AS billing_account_id,
    SubAccountId AS sub_account_id,
    ServiceCategory AS service_category,
    ServiceName AS service_name,
    RegionId AS region_id,
    ResourceId AS resource_id,
    application,
    business_unit,
    DATETIME(ChargePeriodStart) AS charge_start_time,
    DATETIME(ChargePeriodEnd) AS charge_end_time,
    BilledCost AS billed_cost,
    EffectiveCost AS effective_cost,
    BillingCurrency AS currency,
    ConsumedQuantity AS usage_quantity,
    ConsumedUnit AS usage_unit,
    ChargeDescription as description    
FROM focus_with_tags;

-- create const_entity table
DROP TABLE IF EXISTS cost_entity;
CREATE TABLE cost_entity (
    provider_name TEXT,
    billing_account_id TEXT,
    sub_account_id TEXT,
    service_category TEXT,
    service_name TEXT,
    region_id TEXT,
    resource_id TEXT,
    application TEXT,
    business_unit TEXT
);

INSERT OR IGNORE INTO cost_entity
SELECT DISTINCT
    provider_name,
    billing_account_id,
    sub_account_id,
    service_category,
    service_name,
    region_id,
    resource_id,
    application,
    business_unit
FROM focus_usage_cost;


DROP TABLE IF EXISTS focus_usage_cost_hourly;
CREATE TABLE focus_usage_cost_hourly AS
SELECT
    provider_name,
    billing_account_id,
    sub_account_id,
    service_category,
    service_name,
    region_id,
    resource_id,
    application,
    business_unit,
    charge_start_time AS usage_hour,
    SUM(billed_cost) AS billed_cost,
    SUM(CASE WHEN effective_cost < 0 THEN effective_cost ELSE 0 END) AS total_credits,
    SUM(CASE WHEN effective_cost >= 0 THEN effective_cost ELSE 0 END) AS total_usage_cost,
    SUM(effective_cost) AS net_cost,
    SUM(usage_quantity) AS usage_quantity,
    usage_unit
FROM focus_usage_cost
GROUP BY
    provider_name, billing_account_id, sub_account_id,
    service_category, service_name, region_id, resource_id,
    application, business_unit, usage_hour, usage_unit
ORDER BY usage_hour;

-- Common aggregation by provider + hour
DROP INDEX IF EXISTS idx_provider_hour_cost;
CREATE INDEX idx_provider_hour_cost 
ON focus_usage_cost_hourly(provider_name, usage_hour, total_usage_cost);

-- Aggregation by account + hour
DROP INDEX IF EXISTS  idx_account_hour_cost;
CREATE INDEX idx_account_hour_cost
ON focus_usage_cost_hourly(billing_account_id, usage_hour, total_usage_cost);

-- Aggregation by service + hour
DROP INDEX IF EXISTS idx_service_hour_cost;
CREATE INDEX idx_service_hour_cost
ON focus_usage_cost_hourly(provider_name, service_name, usage_hour, total_usage_cost);


DROP TABLE IF EXISTS focus_usage_cost_daily;
CREATE TABLE focus_usage_cost_daily AS
SELECT
    provider_name,
    billing_account_id,
    sub_account_id,
    service_category,
    service_name,
    region_id,
    resource_id,
    application,
    business_unit,
    strftime('%Y-%m-%d', charge_start_time) AS usage_date,
    SUM(billed_cost) AS billed_cost,
    SUM(CASE WHEN effective_cost < 0 THEN effective_cost ELSE 0 END) AS total_credits,
    SUM(CASE WHEN effective_cost >= 0 THEN effective_cost ELSE 0 END) AS total_usage_cost,
    SUM(effective_cost) AS net_cost,
    SUM(usage_quantity) AS usage_quantity,
    usage_unit
FROM focus_usage_cost
GROUP BY
    provider_name, billing_account_id, sub_account_id,
    service_category, service_name, region_id, resource_id,
    application, business_unit, usage_date, usage_unit
ORDER BY usage_date;
    
-- Common aggregation by provider + hour
DROP INDEX IF EXISTS idx_provider_date_cost;
CREATE INDEX idx_provider_date_cost 
ON focus_usage_cost_daily(provider_name, usage_date, total_usage_cost);

-- Aggregation by account + date
DROP INDEX IF EXISTS idx_account_date_cost;
CREATE INDEX idx_account_date_cost
ON focus_usage_cost_daily(billing_account_id, usage_date, total_usage_cost);

-- Aggregation by service + date
DROP INDEX IF EXISTS idx_service_date_cost;
CREATE INDEX idx_service_date_cost
ON focus_usage_cost_daily(provider_name, service_name, usage_date, total_usage_cost);


DROP TABLE IF EXISTS focus_usage_cost_weekly;
CREATE TABLE focus_usage_cost_weekly AS
SELECT
    provider_name,
    billing_account_id,
    sub_account_id,
    service_category,
    service_name,
    region_id,
    resource_id,
    application,
    business_unit,
    DATE(charge_start_time, 'weekday 1', '-7 days') AS usage_week,
    SUM(billed_cost) AS billed_cost,
    SUM(CASE WHEN effective_cost < 0 THEN effective_cost ELSE 0 END) AS total_credits,
    SUM(CASE WHEN effective_cost >= 0 THEN effective_cost ELSE 0 END) AS total_usage_cost,
    SUM(effective_cost) AS net_cost,
    SUM(usage_quantity) AS usage_quantity,
    usage_unit
FROM focus_usage_cost
GROUP BY
    provider_name, billing_account_id, sub_account_id,
    service_category, service_name, region_id, resource_id,
    application, business_unit, usage_week, usage_unit
ORDER BY usage_week;
    

-- Common aggregation by provider + week
DROP INDEX IF EXISTS idx_provider_week_cost;
CREATE INDEX idx_provider_week_cost 
ON focus_usage_cost_weekly(provider_name, usage_week, total_usage_cost);

-- Aggregation by account + week
DROP INDEX IF EXISTS idx_account_week_cost;
CREATE INDEX idx_account_week_cost
ON focus_usage_cost_weekly(billing_account_id, usage_week, total_usage_cost);

-- Aggregation by service + week
DROP INDEX IF EXISTS idx_service_week_cost;
CREATE INDEX idx_service_week_cost
ON focus_usage_cost_weekly(provider_name, service_name, usage_week, total_usage_cost);

DROP TABLE IF EXISTS focus_usage_cost_monthly;
CREATE TABLE focus_usage_cost_monthly AS
SELECT
    provider_name,
    billing_account_id,
    sub_account_id,
    service_category,
    service_name,
    region_id,
    resource_id,
    application,
    business_unit,
    strftime('%Y-%m', charge_start_time) AS usage_month,
    SUM(billed_cost) AS billed_cost,
    SUM(CASE WHEN effective_cost < 0 THEN effective_cost ELSE 0 END) AS total_credits,
    SUM(CASE WHEN effective_cost >= 0 THEN effective_cost ELSE 0 END) AS total_usage_cost,
    SUM(effective_cost) AS net_cost,
    SUM(usage_quantity) AS usage_quantity,
    usage_unit
FROM focus_usage_cost
GROUP BY
    provider_name, billing_account_id, sub_account_id,
    service_category, service_name, region_id, resource_id,
    application, business_unit, usage_month, usage_unit
ORDER BY usage_month;
    

-- Common aggregation by provider + month
DROP INDEX IF EXISTS idx_provider_month_cost;
CREATE INDEX idx_provider_month_cost 
ON focus_usage_cost_monthly(provider_name, usage_month, total_usage_cost);

-- Aggregation by account + month
DROP INDEX IF EXISTS idx_account_month_cost;
CREATE INDEX idx_account_month_cost
ON focus_usage_cost_monthly(billing_account_id, usage_month, total_usage_cost);

-- Aggregation by service + month
DROP INDEX IF EXISTS idx_service_month_cost;
CREATE INDEX idx_service_month_cost
ON focus_usage_cost_monthly(provider_name, service_name, usage_month, total_usage_cost);