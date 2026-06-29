
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_09c97c4ab6462065371a7446bbc6be30_4189]
   as 
    
    
    



select symbol
from "crypto_data"."silver"."stg_coin_markets"
where symbol is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_09c97c4ab6462065371a7446bbc6be30_4189]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_09c97c4ab6462065371a7446bbc6be30_4189]
  ;')