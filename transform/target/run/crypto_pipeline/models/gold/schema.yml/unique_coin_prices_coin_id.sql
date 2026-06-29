
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_071d8bac72e3adcd9fbb5a5a39648ea6_11867]
   as 
    
    
    

select
    coin_id as unique_field,
    count(*) as n_records

from "crypto_data"."gold"."coin_prices"
where coin_id is not null
group by coin_id
having count(*) > 1



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_071d8bac72e3adcd9fbb5a5a39648ea6_11867]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_071d8bac72e3adcd9fbb5a5a39648ea6_11867]
  ;')