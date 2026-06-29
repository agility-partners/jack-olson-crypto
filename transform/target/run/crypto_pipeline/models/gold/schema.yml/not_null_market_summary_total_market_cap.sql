
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_7423d29244e0a7b83c20c44a8bf763f1_13439]
   as 
    
    
    



select total_market_cap
from "crypto_data"."gold"."market_summary"
where total_market_cap is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_7423d29244e0a7b83c20c44a8bf763f1_13439]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_7423d29244e0a7b83c20c44a8bf763f1_13439]
  ;')