
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_c9d647119c5ebac5beb83775b5cf1545_4751]
   as 
    
    
    



select price_trend
from "crypto_data"."gold"."coin_prices"
where price_trend is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_c9d647119c5ebac5beb83775b5cf1545_4751]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_c9d647119c5ebac5beb83775b5cf1545_4751]
  ;')