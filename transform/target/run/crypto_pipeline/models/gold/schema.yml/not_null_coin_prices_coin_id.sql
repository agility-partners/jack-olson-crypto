
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_752e513db3b37860329e0a528a3eb387_10098]
   as 
    
    
    



select coin_id
from "crypto_data"."gold"."coin_prices"
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
    [silver].[testview_752e513db3b37860329e0a528a3eb387_10098]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_752e513db3b37860329e0a528a3eb387_10098]
  ;')