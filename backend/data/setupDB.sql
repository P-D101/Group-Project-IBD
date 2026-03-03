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

--==============================--
--    PREVIOUS COMMIT POINT     --
--==============================--

-- Hard code a ConsumedUnitTaxonomy, this may need to be changed depending on the data but this is a starting point for grouping similar units together
DROP TABLE IF EXISTS consumed_unit_taxonomy;
CREATE TABLE consumed_unit_taxonomy (
    consumed_unit           TEXT PRIMARY KEY,
    unit_category            TEXT NOT NULL, -- e.g. compute_capacity, compute_execution, memory_capacity, storage, network
    normalised_unit          TEXT,
    is_capacity              BOOLEAN NOT NULL CHECK (is_capacity IN (0,1)),
    is_time_based            BOOLEAN NOT NULL CHECK (is_time_based IN (0,1)),
    notes                    TEXT
);

INSERT INTO consumed_unit_taxonomy
(consumed_unit, unit_category, normalised_unit, is_capacity, is_time_based, notes)
VALUES

-- STORAGE CAPACITY
('GB', 'storage_capacity', 'gb', 1, 0, 'Raw storage capacity'),
('GB-Hours', 'storage_capacity', 'gb_hour', 1, 1, 'Monthly storage capacity'),
('GB Hours', 'storage_capacity', 'gb_hour', 1, 1, 'Monthly storage capacity'),
('GiB Hours', 'storage_capacity', 'gib_hour', 1, 1, 'Monthly storage capacity'),
('GB-Months', 'storage_capacity', 'gb_month', 1, 1, 'Monthly storage capacity'),
('GB Months', 'storage_capacity', 'gb_month', 1, 1, 'Monthly storage capacity'),
('GB/Month', 'storage_capacity', 'gb_month', 1, 1, 'Monthly storage capacity'),
('Obj-Months', 'storage_capacity', 'object_month', 1, 1, 'Object storage capacity'),
('TB', 'storage_capacity', 'tb', 1, 0, 'Storage capacity'),
('Gigabyte Storage Capacity per month', 'storage_capacity', 'gb_month', 1, 1, 'Explicit monthly storage'),

-- COMPUTE CAPACITY
('vCPU-Hours', 'compute_capacity', 'vcpu_hour', 1, 1, 'Provisioned vCPU capacity'),
('vCPU-Months', 'compute_capacity', 'vcpu_month', 1, 1, 'Reserved vCPU capacity'),
('OCPU Hours', 'compute_capacity', 'ocpu_hour', 1, 1, 'Oracle CPU capacity'),
('OCPU Per Hour', 'compute_capacity', 'ocpu_hour', 1, 1, 'Oracle CPU capacity'),
('OCU-Hours', 'compute_capacity', 'ocu_hour', 1, 1, 'Oracle compute units'),
('ACU-Hours', 'compute_capacity', 'acu_hour', 1, 1, 'Autoscaling capacity units'),
('RPU-Hours', 'compute_capacity', 'rpu_hour', 1, 1, 'Read provisioned units'),
('LCU-Hours', 'compute_capacity', 'lcu_hour', 1, 1, 'Load balancer capacity units'),
('Cluster Per Hour', 'compute_capacity', 'cluster_hour', 1, 1, 'Provisioned cluster capacity'),
('LB Hours', 'compute_capacity', 'lb_hour', 1, 1, 'Load balancer provisioned capacity'),
('Data Node Per Hour', 'compute_capacity', 'node_hour', 1, 1, 'Provisioned data node'),

-- COMPUTE EXECUTION
('Lambda-GB-Seconds', 'compute_execution', 'gb_second', 0, 1, 'Serverless execution'),
('GiB/Second-Months', 'compute_execution', 'gib_second', 0, 1, 'Execution time aggregated'),
('MiB/Second-Months', 'compute_execution', 'mib_second', 0, 1, 'Execution time aggregated'),
('byte-seconds', 'compute_execution', 'byte_second', 0, 1, 'Execution-time billing'),
('Seconds', 'compute_execution', 'second', 0, 1, 'Execution duration'),
('seconds', 'compute_execution', 'second', 0, 1, 'Execution duration'),
('Minutes', 'compute_execution', 'minute', 0, 1, 'Execution duration'),

-- STORAGE IO / DATABASE IO
('IOPS-Months', 'storage_io', 'iops_month', 1, 1, 'Provisioned IOPS'),
('IOs', 'storage_io', 'io', 0, 0, 'Storage operations'),
('ReadCapacityUnit-Hours', 'storage_io', 'rcu_hour', 1, 1, 'Provisioned read capacity'),
('WriteCapacityUnit-Hours', 'storage_io', 'wcu_hour', 1, 1, 'Provisioned write capacity'),
('ReadRequestUnits', 'storage_io', 'read_request', 0, 0, 'Read requests'),
('WriteRequestUnits', 'storage_io', 'write_request', 0, 0, 'Write requests'),

-- NETWORK / DATA TRANSFER
('GB Of Data Transferred', 'network', 'gb_transfer', 0, 0, 'Network egress/ingress'),
('Gigabyte Per Hour', 'network', 'gb_hour', 0, 1, 'Bandwidth over time'),
('Gigabytes Per Hour', 'network', 'gb_hour', 0, 1, 'Bandwidth over time'),

-- REQUEST-BASED
('Requests', 'request', 'request', 0, 0, 'API or service requests'),
('API Requests', 'request', 'request', 0, 0, 'API Gateway requests'),
('10K Requests', 'request', 'request', 0, 0, 'Request blocks'),
('USE2-AmazonApiGatewayRequest', 'request', 'request', 0, 0, 'Regional API requests'),
('USW1-ApiGatewayRequests', 'request', 'request', 0, 0, 'Regional API requests'),
('USW2-AmazonApiGatewayRequests', 'request', 'request', 0, 0, 'Regional API requests'),
('Queries', 'request', 'query', 0, 0, 'Query-based billing'),

-- TIME ONLY (NO CAPACITY)
('Hours', 'time', 'hour', 0, 1, 'Elapsed time'),
('Hour', 'time', 'hour', 0, 1, 'Elapsed time'),
('Hourly', 'time', 'hour', 0, 1, 'Elapsed time'),
('UsageHours', 'time', 'hour', 0, 1, 'Elapsed usage time'),
('Months', 'time', 'month', 0, 1, 'Elapsed time'),
('Units/Hour', 'time', 'unit_hour', 0, 1, 'Rate-based billing'),
('Units/Day', 'time', 'unit_day', 0, 1, 'Rate-based billing'),
('User-Months', 'time', 'user_month', 1, 1, 'Per-user subscription'),
('User Per Month', 'time', 'user_month', 1, 1, 'Per-user subscription'),

-- COUNTS / EVENTS
('Units', 'count', 'unit', 0, 0, 'Generic unit'),
('Units/Month', 'count', 'unit_month', 0, 1, 'Monthly unit count'),
('Events', 'count', 'event', 0, 0, 'Event-based billing'),
('StateTransitions', 'count', 'transition', 0, 0, 'Workflow transitions'),
('Metrics', 'count', 'metric', 0, 0, 'Monitoring metrics'),
('Alarms', 'count', 'alarm', 0, 0, 'Monitoring alarms'),
('Dashboards', 'count', 'dashboard', 0, 0, 'Monitoring dashboards'),
('Traces', 'count', 'trace', 0, 0, 'Tracing spans'),
('Notifications', 'count', 'notification', 0, 0, 'Notifications'),
('Messages', 'count', 'message', 0, 0, 'Message count'),
('Counts', 'count', 'count', 0, 0, 'Generic count'),
('Million Datapoints', 'count', 'datapoint', 0, 0, 'Monitoring datapoints'),
('Finding Ingestion Events', 'count', 'event', 0, 0, 'Security ingestion'),
('Security Checks', 'count', 'check', 0, 0, 'Security checks'),
('ConfigurationItemRecorded', 'count', 'config_item', 0, 0, 'Config recording'),
('USW2-ConfigurationItemRecorded', 'count', 'config_item', 0, 0, 'Config recording'),
('UsageRecord-Months', 'count', 'usage_record_month', 0, 1, 'Usage records'),
('Resource-Assessments', 'count', 'assessment', 0, 0, 'Assessment count'),
('Number of Monitored resources', 'count', 'resource', 1, 0, 'Monitored resources'),

-- OTHER / SPECIAL
('Keys', 'other', NULL, 0, 0, 'Key-based billing'),
('Secrets', 'other', NULL, 0, 0, 'Secrets management'),
('Key Version Hours', 'other', 'key_version_hour', 1, 1, 'Key version retention'),
('HostedZone', 'other', NULL, 1, 0, 'DNS hosted zone'),
('URLs', 'other', NULL, 0, 0, 'URL count'),
('Characters', 'other', NULL, 0, 0, 'Character-based billing'),
('Users', 'other', NULL, 0, 0, 'User-based billing'),
('Objects', 'other', NULL, 0, 0, 'Object-based billing'),
('64K-Chunks', 'other', NULL, 0, 0, 'Chunk-based billing'),
('Estimates', 'other', NULL, 0, 0, 'Estimated usage'),
('Service Fees (OCPU Hours)', 'compute_capacity', 'ocpu_hour', 1, 1, 'Service fee on capacity'),
('CognitoUserPoolsMAU', 'count', 'user_month', 1, 1, 'Monthly active users'),
('Tag-Months', 'other', NULL, 0, 0, 'Tag-Months-based billing');

DROP TABLE IF EXISTS sku_compute_mapping;
CREATE TABLE sku_compute_mapping (
    provider_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    service_category TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    usage_unit TEXT,

    -- Core semantics
    is_compute BOOLEAN NOT NULL,

    compute_model TEXT, 
    -- instance | container | serverless | managed-shared | control-plane | none | unknown

    meter_dimension TEXT,
    -- cpu | memory | storage | io | network | activity | control-plane | abstract

    cpu_unit TEXT,
    -- vcpu | ocpu | abstract | null

    attributable_to_customer_workload BOOLEAN,
    utilisation_possible BOOLEAN,

    confidence TEXT,
    -- high | medium | low

    notes TEXT,

    PRIMARY KEY (service_name, service_category, sku_id)
);

INSERT INTO sku_compute_mapping (
    provider_name,
    service_name,
    service_category,
    sku_id,
    usage_unit,
    is_compute,
    compute_model,
    meter_dimension,
    attributable_to_customer_workload,
    utilisation_possible,
    confidence,
    notes
)
SELECT DISTINCT
    ProviderName AS provider_name,
    ServiceName AS service_name,
    ServiceCategory AS service_category,
    SkuId AS sku_id,
    ConsumedUnit AS usage_unit,

    -- is_compute: conservative
    CASE
        WHEN ServiceCategory IN ('Compute', 'AI and Machine Learning') THEN TRUE
        ELSE FALSE
    END AS is_compute,

    -- compute_model: coarse default
    CASE
        WHEN ServiceCategory = 'Compute' THEN 'instance'
        WHEN ServiceCategory = 'AI and Machine Learning' THEN 'managed-shared'
        ELSE 'none'
    END AS compute_model,

    -- meter_dimension: default unknown until refined
    'abstract' AS meter_dimension,

    NULL AS attributable_to_customer_workload,
    NULL AS utilisation_possible,

    'medium' AS confidence,
    'Initial classification from ServiceCategory' AS notes
FROM focus_raw
WHERE SkuId IS NOT NULL
GROUP BY ServiceName, ServiceCategory, SkuId;

UPDATE sku_compute_mapping
SET
    is_compute = FALSE,
    compute_model = 'control-plane',
    meter_dimension = 'network',
    attributable_to_customer_workload = FALSE,
    utilisation_possible = FALSE,
    confidence = 'high',
    notes = 'Networking services billed by time or activity, not customer CPU'
WHERE service_category = 'Networking';

UPDATE sku_compute_mapping
SET
    meter_dimension = 'storage',
    is_compute = FALSE,
    utilisation_possible = FALSE,
    confidence = 'high'
WHERE usage_unit IN (
    'GB', 'GB-Months', 'GB-Hours', 'GB Months', 'GB Hours', 'GB/Month'
);

UPDATE sku_compute_mapping
SET
    meter_dimension = 'cpu',
    cpu_unit = 'vcpu',
    attributable_to_customer_workload = TRUE,
    utilisation_possible = TRUE,
    confidence = 'high'
WHERE usage_unit = 'vCPU-Hours';

UPDATE sku_compute_mapping
SET
    meter_dimension = 'cpu',
    cpu_unit = 'ocpu',
    attributable_to_customer_workload = TRUE,
    utilisation_possible = TRUE,
    confidence = 'high'
WHERE usage_unit LIKE 'OCPU%';


UPDATE sku_compute_mapping
SET meter_dimension = 'memory',
    compute_model = 'serverless',
    attributable_to_customer_workload = TRUE,
    utilisation_possible = TRUE,
    confidence = 'high',
    notes = 'Memory-weighted serverless execution'
WHERE usage_unit IN ('Lambda-GB-Seconds', 'byte-seconds', 'GiB/Second-Months', 'MiB/Second-Months');

UPDATE sku_compute_mapping
SET
    meter_dimension = 'control-plane',
    attributable_to_customer_workload = FALSE,
    utilisation_possible = FALSE,
    confidence = 'high',
    notes = 'Hours indicates resource existence, not CPU usage'
WHERE usage_unit IN ('Hours', 'Hour', 'Hourly', 'UsageHours')
  AND cpu_unit IS NULL;
  
UPDATE sku_compute_mapping
SET
    compute_model = 'managed-shared',
    meter_dimension = 'cpu',
    attributable_to_customer_workload = TRUE,
    utilisation_possible = TRUE,
    confidence = 'medium',
    notes = 'Managed database compute capacity'
WHERE service_category = 'Databases'
  AND usage_unit IN ('vCPU-Hours', 'ACU-Hours', 'OCU-Hours');
  
UPDATE sku_compute_mapping
SET
    meter_dimension = 'activity',
    is_compute = FALSE,
    attributable_to_customer_workload = FALSE,
    utilisation_possible = FALSE,
    confidence = 'high',
    notes = 'Activity-based billing, no capacity semantics'
WHERE usage_unit IN (
    'Requests', 'API Requests', 'Events', 'Messages',
    'Queries', 'Counts', 'Metrics'
);

UPDATE sku_compute_mapping
SET
    meter_dimension = 'io',
    is_compute = FALSE,
    utilisation_possible = FALSE,
    confidence = 'high'
WHERE usage_unit LIKE '%IOPS%' OR usage_unit = 'IOs';


DROP INDEX IF EXISTS idx_sku_compute_mapping;
CREATE INDEX idx_sku_compute_mapping 
ON sku_compute_mapping(sku_id);


-- Add sku_id to focus_usage_cost and all aggregations

--==============================--
--     START OF DUPLICATION     --
--==============================--

DROP TABLE IF EXISTS focus_usage_cost;
CREATE TABLE focus_usage_cost (
    provider_name TEXT NOT NULL,
    billing_account_id TEXT NOT NULL,
    sub_account_id TEXT,
    service_category TEXT,
    service_name TEXT,
    region_id TEXT,
    resource_id TEXT,
    sku_id TEXT,
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
    SkuId AS sku_id,
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
    sku_id,
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
    service_category, service_name, region_id, resource_id, sku_id,
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
    sku_id,
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
    service_category, service_name, region_id, resource_id,sku_id,
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
    sku_id,
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
    service_category, service_name, region_id, resource_id,sku_id,
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
    sku_id,
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
    service_category, service_name, region_id, resource_id,sku_id,
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

--==============================--
--      END OF DUPLICATION      --
--==============================--

DROP VIEW IF EXISTS annotated_focus_usage_cost;
CREATE VIEW annotated_focus_usage_cost AS
SELECT
    f.*,
    scm.compute_model,
    scm.cpu_unit,
    scm.confidence
FROM focus_usage_cost f
LEFT JOIN sku_compute_mapping scm
  ON f.service_name = scm.service_name
  AND f.service_category = scm.service_category
 AND f.sku_id = scm.sku_id;


-- CPU ESTIMATION
DROP TABLE IF EXISTS unit_conversion;
CREATE TABLE unit_conversion (
    from_normalised_unit TEXT NOT NULL,
    to_normalised_unit   TEXT NOT NULL,
    factor               REAL,
    confidence            TEXT,
    notes                 TEXT,
    PRIMARY KEY (from_normalised_unit, to_normalised_unit)
);

INSERT INTO unit_conversion VALUES
('tb', 'gb', 1000.0, 'high', 'Decimal storage units'),
('gb', 'gb', 1.0, 'high', 'Identity'),

('minute', 'hour', 1.0/60.0, 'high', 'Time conversion'),
('hour', 'hour', 1.0, 'high', 'Identity'),
('month', 'hour', 30.0*24, 'medium', 'Average month'),
('second', 'hour', 1.0/(60.0*60.0), 'high', 'Time conversion'),

('gb_month', 'gb_hour', 1.0/(30.0*24.0), 'medium', 'Average month'),
('gb_hour', 'gb_hour', 1.0, 'medium', 'Identity'),
('gib_hour', 'gb_hour', 1.0/(1.024), 'medium', 'Binary to decimal'),
('byte_second', 'gb_hour', (60.0*60.0)/(1024*1024*1024), 'high', 'Time conversion and Binary bytes'),
('mib_second', 'gb_hour', (60.0*60.0)/1024.0, 'high', 'Time conversion and Binary to decimal'),
('gib_second', 'gb_hour', (60.0*60.0)/1.024, 'medium', 'Time conversion and Binary to decimal'),
('gb_second', 'gb_hour', 60.0*60.0, 'high', 'Time Conversion'),

('vcpu_month', 'vcpu_hour', 1.0/720.0, 'medium', 'Average month'),
('ocpu_hour', 'vcpu_hour', 2.0, 'medium', 'Oracle: 1 OCPU ≈ 2 vCPU'),
('acu_hour', 'vcpu_hour', NULL, 'low', 'Autoscaling unit'),
('ocu_hour', 'vcpu_hour', NULL, 'low', 'Provider-defined'),
('rpu_hour', 'vcpu_hour', NULL, 'low', 'IO-bound capacity'),
('lcu_hour', 'vcpu_hour', NULL, 'low', 'Load balancer capacity'),
('node_hour', 'vcpu_hour', NULL, 'low', 'Node size unknown'),
('vcpu_hour', 'vcpu_hour', 1.0, 'low', 'Identity');





DROP TABLE IF EXISTS compute_serverless_efficiency;
CREATE TABLE compute_serverless_efficiency (
    provider_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    usage_unit TEXT NOT NULL,
    normalized_unit TEXT NOT NULL,
    
    billed_usage REAL,        -- from focus_usage_cost
    normalized_usage REAL,    -- converted to normalized unit
--    efficiency_pct REAL,      -- actual_usage / billed_usage if available
    
    notes TEXT,
    PRIMARY KEY (provider_name, service_name, sku_id)
);

INSERT INTO compute_serverless_efficiency (
    provider_name,
    service_name,
    sku_id,
    usage_unit,
    normalized_unit,
    billed_usage,
    normalized_usage,
--    efficiency_pct,
    notes
)
SELECT 
    f.provider_name,
    f.service_name,
    f.sku_id,
    f.usage_unit,
    cu.normalised_unit AS normalized_unit,
    SUM(f.billed_cost) AS billed_usage,
    SUM(f.billed_cost * uc.factor) AS normalized_usage,
--    SUM(f.billed_cost * uc.factor) * 1.0 / MAX(SUM(f.billed_cost * uc.factor)) OVER (PARTITION BY f.provider_name, f.service_name) AS efficiency_pct,
    'Serverless memory-time efficiency' AS notes
FROM focus_usage_cost f
JOIN sku_compute_mapping scm 
  ON f.sku_id = scm.sku_id
JOIN consumed_unit_taxonomy cu
  ON f.usage_unit = cu.consumed_unit
LEFT JOIN unit_conversion uc
  ON cu.normalised_unit = uc.from_normalised_unit
WHERE scm.compute_model = 'serverless'
GROUP BY f.provider_name, f.service_name, f.sku_id, f.usage_unit, cu.normalised_unit;


DROP TABLE IF EXISTS compute_instance_efficiency;
CREATE TABLE compute_instance_efficiency (
    provider_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    usage_unit TEXT NOT NULL,
    normalized_unit TEXT NOT NULL,

    billed_cpu REAL,          -- actual billed usage from focus_usage_cost
    normalized_cpu REAL,      -- converted to common unit (vcpu_hour)
--    efficiency_pct REAL,      -- billed / allocated
    
    notes TEXT,
    PRIMARY KEY (provider_name, service_name, sku_id)
);




-- Populate with data
INSERT INTO compute_instance_efficiency (
    provider_name,
    service_name,
    sku_id,
    usage_unit,
    normalized_unit,
    billed_cpu,
    normalized_cpu,
--    efficiency_pct,
    notes
)
SELECT 
    f.provider_name,
    f.service_name,
    f.sku_id,
    f.usage_unit,
    cu.normalised_unit AS normalized_unit,
    SUM(f.billed_cost) AS billed_cpu,
    SUM(f.billed_cost * uc.factor) AS normalized_cpu,
--    SUM(f.billed_cost * uc.factor) * 1.0 / MAX(SUM(f.billed_cost * uc.factor)) OVER (PARTITION BY f.provider_name, f.service_name) AS efficiency_pct,
    'Instance CPU-time efficiency' AS notes
FROM focus_usage_cost f
JOIN sku_compute_mapping scm 
  ON f.sku_id = scm.sku_id
JOIN consumed_unit_taxonomy cu
  ON f.usage_unit = cu.consumed_unit
LEFT JOIN unit_conversion uc
  ON cu.normalised_unit = uc.from_normalised_unit
WHERE scm.compute_model IN ('instance', 'managed-shared')
  AND cu.unit_category = 'compute_capacity'
GROUP BY f.provider_name, f.service_name, f.sku_id, f.usage_unit, cu.normalised_unit;



-- Commitment
DROP TABLE IF EXISTS commitment_summary;
CREATE TABLE commitment_summary AS
SELECT 
    ProviderName AS provider_name,
    ServiceName AS service_name,
    SkuId AS sku_id,
    CommitmentDiscountId AS commitment_discount_id,
    CommitmentDiscountName AS commitment_discount_name,
    CommitmentDiscountType AS commitment_discount_type,
    ConsumedUnit AS consumed_unit,
    ChargeDescription AS charge_description,

    SUM(ListCost) AS total_list_cost,
    SUM(BilledCost) AS total_billed_cost,
    SUM(EffectiveCost) AS total_effective_cost,
    SUM(ContractedCost) AS total_contracted_cost,

    -- Purchased capacity = total ListCost / ListUnitPrice
    CASE 
        WHEN ListUnitPrice > 0 THEN SUM(ListCost) / ListUnitPrice
        ELSE NULL
    END AS purchased_capacity
/*
    -- Utilization ratio = total BilledCost / purchased capacity
    ,CASE
        WHEN ListUnitPrice > 0 THEN SUM(BilledCost) / (SUM(ListCost) / ListUnitPrice)
        ELSE NULL
    END AS utilization_ratio*/

FROM focus_raw
WHERE CommitmentDiscountId IS NOT NULL
  AND CommitmentDiscountId != ''
GROUP BY 
    ProviderName,
    ServiceName,
    SkuId,
    CommitmentDiscountId,
    CommitmentDiscountName,
    CommitmentDiscountType,
    ConsumedUnit,
    ChargeDescription,
    ListUnitPrice;



-- CREATE GOLD STANDARD NORMALISATION TABLE
DROP TABLE IF EXISTS gold_standard_usage;
CREATE TABLE gold_standard_usage AS
SELECT
    f.provider_name,
    f.billing_account_id,
    ba.billing_account_name,
    f.sub_account_id,
    sa.sub_account_name,
    f.service_category,
    f.service_name,
    f.region_id AS region_name,
    f.resource_id,
    f.sku_id,
    f.application,
    f.business_unit,

    -- Time dimensions
    DATE(f.charge_start_time) AS usage_date,
    STRFTIME('%Y-%W', f.charge_start_time) AS usage_week,
    STRFTIME('%Y-%m', f.charge_start_time) AS usage_month,

    -- Cost
    SUM(f.billed_cost) AS billed_cost,
    SUM(CASE WHEN f.effective_cost < 0 THEN f.effective_cost ELSE 0 END) AS total_credits,
    SUM(CASE WHEN f.effective_cost >= 0 THEN f.effective_cost ELSE 0 END) AS total_usage_cost,
    SUM(f.effective_cost) AS net_cost,

    -- Usage
    SUM(f.usage_quantity) AS usage_quantity,
    f.usage_unit,
    SUM(f.usage_quantity * uc.factor) AS normalized_usage,
    cu.normalised_unit AS normalized_unit,

    -- Compute/Serverless metadata
    scm.compute_model,
    scm.meter_dimension,
    scm.cpu_unit,
    scm.attributable_to_customer_workload,
    scm.utilisation_possible,
    scm.confidence

FROM annotated_focus_usage_cost f
LEFT JOIN sku_compute_mapping scm
  ON f.service_name = scm.service_name
  AND f.service_category = scm.service_category
  AND f.sku_id = scm.sku_id
LEFT JOIN consumed_unit_taxonomy cu
  ON f.usage_unit = cu.consumed_unit
LEFT JOIN unit_conversion uc
  ON cu.normalised_unit = uc.from_normalised_unit
LEFT JOIN billing_account ba 
  ON f.billing_account_id = ba.billing_account_id
LEFT JOIN sub_account sa 
  ON f.sub_account_id = sa.sub_account_id

GROUP BY
    f.provider_name, f.billing_account_id, f.sub_account_id,
    f.service_category, f.service_name, f.region_id, f.resource_id, f.sku_id,
    f.application, f.business_unit,
    usage_date, usage_week, usage_month,
    f.usage_unit, cu.normalised_unit,
    scm.compute_model, scm.meter_dimension, scm.cpu_unit,
    scm.attributable_to_customer_workload, scm.utilisation_possible, scm.confidence;
    
--=============================--
--        UPLOAD POINT         --
--=============================--