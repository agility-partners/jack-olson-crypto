
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_64fa4ef10349b7107810f3ca8a8fa369_15204]
   as 
    
    
    



select ingested_at
from "crypto_data"."silver"."stg_coin_markets"
where ingested_at is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_64fa4ef10349b7107810f3ca8a8fa369_15204]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_64fa4ef10349b7107810f3ca8a8fa369_15204]
  ;')