
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_06a6e3e5f31eff753f3c4b46128aacab_4404]
   as 
    
    
    



select total_coins
from "crypto_data"."gold"."market_summary"
where total_coins is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_06a6e3e5f31eff753f3c4b46128aacab_4404]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_06a6e3e5f31eff753f3c4b46128aacab_4404]
  ;')