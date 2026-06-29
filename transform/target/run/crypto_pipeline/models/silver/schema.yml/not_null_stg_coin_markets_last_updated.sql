
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_b2e30529ea0867fd12d940680056d0c9_16226]
   as 
    
    
    



select last_updated
from "crypto_data"."silver"."stg_coin_markets"
where last_updated is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_b2e30529ea0867fd12d940680056d0c9_16226]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_b2e30529ea0867fd12d940680056d0c9_16226]
  ;')