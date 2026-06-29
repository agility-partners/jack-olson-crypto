
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_e1ff072e85d6d4165e4eace1c122c0a9_4177]
   as 
    
    
    



select market_cap_rank
from "crypto_data"."silver"."stg_coin_markets"
where market_cap_rank is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_e1ff072e85d6d4165e4eace1c122c0a9_4177]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_e1ff072e85d6d4165e4eace1c122c0a9_4177]
  ;')