from enum import Enum
from datetime import datetime, time
import database
# TODO: cleanup into multiple different files and into its own folder - create folder structure
############
# Internal #
############

class MyEnum(Enum):
    @classmethod
    def to_list(cls):
        return list(map(lambda x: x.value, cls))
    
    # default implementation for map
    def map(self):
        return self.value

class AGGREGATE_TABLE(MyEnum):
    HOURLY = 'focus_usage_cost_hourly'
    DAILY = 'focus_usage_cost_daily'
    WEEKLY = 'focus_usage_cost_weekly'
    MONTHLY = 'focus_usage_cost_monthly'


class USAGE_TIME_FIELD(MyEnum):
    HOURLY = 'usage_hour'
    DAILY = 'usage_date'
    WEEKLY = 'usage_week'
    MONTHLY = 'usage_month'

def get_data(field):
    # you can get data on any of the fields in GROUPBY
    if field not in GROUPBY:
        return f'Bad Request: {field} not in acceptible data fields: {GROUPBY.to_list()}', 400
    
    res = database.query(f"SELECT DISTINCT {GROUPBY(field).map()} FROM cost_entity;")

    # each row will just be one element so flatten the list for a nicer format
    return list(map(lambda x: x[0], res))

#############
# Interface #
#############

class TIMESPAN(MyEnum):
    HOURLY = 'hourly'
    DAILY = 'daily'
    WEEKLY = 'weekly'
    MONTHLY = 'monthly'
    def map(self):
        match self:
            case TIMESPAN.HOURLY: return [AGGREGATE_TABLE.HOURLY.value,USAGE_TIME_FIELD.HOURLY.value]
            case TIMESPAN.DAILY: return [AGGREGATE_TABLE.DAILY.value,USAGE_TIME_FIELD.DAILY.value]
            case TIMESPAN.WEEKLY: return [AGGREGATE_TABLE.WEEKLY.value,USAGE_TIME_FIELD.WEEKLY.value]
            case TIMESPAN.MONTHLY: return [AGGREGATE_TABLE.MONTHLY.value,USAGE_TIME_FIELD.MONTHLY.value]
# /api/usage/
class SELECTS(MyEnum): 
    BILLED_COST = 'billed_cost'         # cost without deductions, credit or any other savings
    CREDIT = 'credit'                   # credit applied to the account shows up as negative cost
    USAGE_COST = 'usage_cost'           # total usage cost without credit subtracted
    NET_COST = 'net_cost'               # net cost to the business
    USAGE_QUANTITY = 'usage_quantity'   # selects usage quantity and usage unit. (i.e. 20 GB / 1 hour / 3 GB hours)
    def map(self):
        match self:
            case SELECTS.BILLED_COST: return 'SUM(billed_cost)'
            case SELECTS.CREDIT: return 'SUM(total_credits)'
            case SELECTS.USAGE_COST: return 'SUM(total_usage_cost)'
            case SELECTS.NET_COST: return 'SUM(net_cost)'
            case SELECTS.USAGE_QUANTITY: return 'SUM(usage_quantity),usage_unit' # also gets grouped by usage_unit

class GROUPBY(MyEnum):
    PROVIDER = 'provider'
    BILLING_ACCOUNT = 'billing_account'
    SUB_ACCOUNT = 'sub_account'
    SERVICE_CATEGORY = 'service_category'
    SERVICE_NAME = 'service_name'
    REGION = 'region'
    RESOURCE = 'resource'
    APPLICATION = 'application'
    BUSINESS_UNIT = 'business_unit'
    def map(self):
        match self:
            case GROUPBY.PROVIDER: return 'provider_name'
            case GROUPBY.BILLING_ACCOUNT: return 'billing_account_id'
            case GROUPBY.SUB_ACCOUNT: return 'sub_account_id'
            case GROUPBY.SERVICE_CATEGORY: return 'service_category'
            case GROUPBY.REGION: return 'region_id'
            case GROUPBY.RESOURCE: return 'resource_id'
            case GROUPBY.APPLICATION: return 'application'
            case GROUPBY.BUSINESS_UNIT: return 'business_unit'


DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
DATE_FORMAT = "%Y-%m-%d"
def format_time_for_filter(provided_time):
    try:
        dt = datetime.strptime(provided_time, DATETIME_FORMAT) # if this errors try to parse as %Y-%m-%d
    except:
        try:
            dt = datetime.strptime(provided_time,DATE_FORMAT).date() # if this errors then throw a real error
        except:
            raise Exception(f"datetime: {provided_time} does not conform to {DATETIME_FORMAT} or {DATE_FORMAT}")
        # time.max is 23:59:59 so BEFORE is inclusive
        dt = datetime.combine(dt,time.max) # in AFTER gets truncated to just %Y-%m-%d so time.max is just for BEFORE
    return dt

class FILTERS(MyEnum):
    BEFORE = 'before'                       # value must be date OP: <
    AFTER = 'after'                         # value must be date OP: >
    PROVIDER = 'provider'                   # must be a valid provider
    BILLING_ACCOUNT = 'billing_account'
    SUB_ACCOUNT = 'sub_account'
    SERVICE_CATEGORY = 'service_category'
    SERVICE_NAME = 'service_name'
    REGION = 'region'
    RESOURCE = 'resource'
    APPLICATION = 'application'
    BUSINESS_UNIT = 'business_unit'
    def map(self):
        match self:
            case FILTERS.BEFORE: return '{}' # will be formatted during processing
            case FILTERS.AFTER: return '{}' # will be formatted during processing
            case FILTERS.PROVIDER: return 'provider_name'
            case FILTERS.BILLING_ACCOUNT: return 'billing_account_id'
            case FILTERS.SUB_ACCOUNT: return 'sub_account_id'
            case FILTERS.SERVICE_CATEGORY: return 'service_category'
            case FILTERS.REGION: return 'region_id'
            case FILTERS.RESOURCE: return 'resource_id'
            case FILTERS.APPLICATION: return 'application'
            case FILTERS.BUSINESS_UNIT: return 'business_unit'
    
    
    def validate_and_process_to_SQL(self,value,selected_usage_field): # throws exception
        match self:
            case FILTERS.BEFORE:
                dt = format_time_for_filter(value)
                return f"{self.map().format(selected_usage_field)} < \"{dt.strftime("%Y-%m-%d %H:%M:%S")}\""
            
            case FILTERS.AFTER:
                dt = format_time_for_filter(value)
                return f"{self.map().format(selected_usage_field)} >= \"{dt.strftime("%Y-%m-%d")}\""
            
            case FILTERS.PROVIDER:
                if value not in get_data('provider'):
                    raise Exception(f"Bad Request: ${value} not in acceptible providers: ${get_data('provider')}")
                return f"{self.map()} = {value}"
            
            case FILTERS.BILLING_ACCOUNT:
                if value not in get_data('billing_account_id'):
                    raise Exception(f"Bad Request: ${value} not in acceptible billing accounts: ${get_data('billing_account_id')}")
                return f"{self.map()} = {value}"
                
            case FILTERS.SUB_ACCOUNT:
                if value not in get_data('sub_account_id'):
                    raise Exception(f"Bad Request: ${value} not in acceptible sub accounts: ${get_data('sub_account_id')}")
                return f"{self.map()} = {value}"
                
            case FILTERS.SERVICE_CATEGORY:
                if value not in get_data('service_category'):
                    raise Exception(f"Bad Request: ${value} not in acceptible service categories: ${get_data('service_category')}")
                return f"{self.map()} = {value}"
                
            case FILTERS.REGION:
                if value not in get_data('region_id'):
                    raise Exception(f"Bad Request: ${value} not in acceptible regions: ${get_data('region_id')}")
                return f"{self.map()} = {value}"
                
            case FILTERS.RESOURCE:
                if value not in get_data('resource_id'):
                    raise Exception(f"Bad Request: ${value} not in acceptible resources: ${get_data('resource_id')}")
                return f"{self.map()} = {value}"
                
            case FILTERS.APPLICATION:
                if value not in get_data('application'):
                    raise Exception(f"Bad Request: ${value} not in acceptible applications: ${get_data('application')}")
                return f"{self.map()} = {value}"
                
            case FILTERS.BUSINESS_UNIT:
                if value not in get_data('business_unit'):
                    raise Exception(f"Bad Request: ${value} not in acceptible business units: ${get_data('business_unit')}")
                return f"{self.map()} = {value}"
                
