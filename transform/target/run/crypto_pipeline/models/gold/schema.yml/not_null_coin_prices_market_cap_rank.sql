
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_4b79bf5b4559c27e2a234ace8295f083_10800]
   as 
    
    
    



select market_cap_rank
from "crypto_data"."gold"."coin_prices"
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
    [silver].[testview_4b79bf5b4559c27e2a234ace8295f083_10800]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_4b79bf5b4559c27e2a234ace8295f083_10800]
  ;')