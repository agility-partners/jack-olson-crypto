
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_8504d4fc815d34f8b6b9d56cb0fa08b2_4893]
   as 
    
    
    



select coin_id
from "crypto_data"."silver"."stg_coin_markets"
where coin_id is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_8504d4fc815d34f8b6b9d56cb0fa08b2_4893]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_8504d4fc815d34f8b6b9d56cb0fa08b2_4893]
  ;')