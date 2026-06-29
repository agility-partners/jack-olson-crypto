
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_246dcdbac762b80be58baf6b6f82f52f_5092]
   as 
    
    
    



select category
from "crypto_data"."gold"."top_movers"
where category is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_246dcdbac762b80be58baf6b6f82f52f_5092]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_246dcdbac762b80be58baf6b6f82f52f_5092]
  ;')