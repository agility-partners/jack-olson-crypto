
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_7de11f08750232d7a22259188aaa9b94_8653]
   as 
    
    
    



select rank
from "crypto_data"."gold"."top_movers"
where rank is null



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_7de11f08750232d7a22259188aaa9b94_8653]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_7de11f08750232d7a22259188aaa9b94_8653]
  ;')