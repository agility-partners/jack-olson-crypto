
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_02f5abe4eb139c4ca7951c5b3030390a_12774]
   as 
    
    
    



select btc_dominance_pct
from "crypto_data"."gold"."market_summary"
where btc_dominance_pct is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_02f5abe4eb139c4ca7951c5b3030390a_12774]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_02f5abe4eb139c4ca7951c5b3030390a_12774]
  ;')