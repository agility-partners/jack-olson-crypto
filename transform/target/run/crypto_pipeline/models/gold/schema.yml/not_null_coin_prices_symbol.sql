
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_91d4e5b5d3be8604cf73837fcc7e7f60_10728]
   as 
    
    
    



select symbol
from "crypto_data"."gold"."coin_prices"
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
    [silver].[testview_91d4e5b5d3be8604cf73837fcc7e7f60_10728]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_91d4e5b5d3be8604cf73837fcc7e7f60_10728]
  ;')