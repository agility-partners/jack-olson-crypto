
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_300b4072e5b7e5777dca7d9fd76a1636_15362]
   as 
    
    
    

with all_values as (

    select
        price_trend as value_field,
        count(*) as n_records

    from "crypto_data"."gold"."coin_prices"
    group by price_trend

)

select *
from all_values
where value_field not in (
    ''strong_up'',''up'',''stable'',''down'',''strong_down''
)



  ;')
  select
    
    count(*) as failures,
    case when count(*) != 0
      then 'true' else 'false' end as should_warn,
    case when count(*) != 0
      then 'true' else 'false' end as should_error
  from (
    select * from 
    [silver].[testview_300b4072e5b7e5777dca7d9fd76a1636_15362]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_300b4072e5b7e5777dca7d9fd76a1636_15362]
  ;')