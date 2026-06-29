
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_94360deba0ea6eaf509b64cfd8dddd9d_16495]
   as 
    
    
    



select current_price
from "crypto_data"."silver"."stg_coin_markets"
where current_price is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_94360deba0ea6eaf509b64cfd8dddd9d_16495]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_94360deba0ea6eaf509b64cfd8dddd9d_16495]
  ;')