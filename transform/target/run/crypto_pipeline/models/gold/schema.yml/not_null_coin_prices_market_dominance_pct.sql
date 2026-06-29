
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_bcebda56dd17bafa61efff67748c72b5_12718]
   as 
    
    
    



select market_dominance_pct
from "crypto_data"."gold"."coin_prices"
where market_dominance_pct is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_bcebda56dd17bafa61efff67748c72b5_12718]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_bcebda56dd17bafa61efff67748c72b5_12718]
  ;')