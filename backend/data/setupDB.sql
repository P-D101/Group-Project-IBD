UPDATE hundred_k
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



CREATE VIEW focus_with_tags AS
SELECT *,
    json_extract(Tags,"$.business_unit") AS business_unit,
    json_extract(Tags,"$.application") AS application
FROM focus_raw;



CREATE TABLE cost_entity (
    cost_entity_id TEXT PRIMARY KEY,
    provider TEXT,
    entity_type TEXT,
    display_name TEXT
);

INSERT OR IGNORE INTO cost_entity
SELECT DISTINCT
  CASE
    WHEN ProviderName != "Google Cloud" THEN ProviderName || '::' || SubAccountName
    WHEN business_unit IS NOT NULL THEN 'GCP::' || business_unit
    WHEN application IS NOT NULL THEN 'GCP::' || application
    ELSE 'GCP::Unassigned'
  END AS cost_entity_id,

  ProviderName AS provider,

  CASE
    WHEN ProviderName != "Google Cloud" THEN 'subAccount'
    WHEN business_unit IS NOT NULL THEN 'business_unit'   
    WHEN application IS NOT NULL THEN 'application'
    ELSE 'unattributed'
  END AS entity_type,

  CASE
    WHEN ProviderName != "Google Cloud" THEN SubAccountName
    WHEN business_unit IS NOT NULL THEN business_unit
    WHEN application IS NOT NULL THEN application
    ELSE 'Unattributed (GCP)'
  END AS display_name
FROM focus_with_tags;

CREATE TABLE service (
    service_id TEXT PRIMARY KEY,
    provider TEXT
);

INSERT OR IGNORE INTO service
SELECT DISTINCT
ServiceName AS service_id,
ProviderName as provider
FROM focus_raw;

-- need to check what other rows are relevant, for example is ChargeCategory relevant?

CREATE TABLE focus_usage_cost (
    id INT PRIMARY KEY,
    time DATETIME,
    cost_entity_id TEXT,
    service_id TEXT,
    serviceCategory TEXT,
    region TEXT,
    usage_quantity REAL,
    usage_unit TEXT,
    cost REAL,
    currency TEXT,
    description TEXT,
    FOREIGN KEY (cost_entity_id) REFERENCES cost_entity(cost_entity_id),
    FOREIGN KEY (service_id) REFERENCES service(service_id)
)

-- populate the cut down version of the table
