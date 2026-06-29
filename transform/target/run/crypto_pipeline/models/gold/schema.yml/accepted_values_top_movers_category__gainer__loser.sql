
    
    -- Create target schema if it does not
  USE [crypto_data];
  IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'silver')
  BEGIN
    EXEC('CREATE SCHEMA [silver]')
  END

  

  
  EXEC('create view 
    [silver].[testview_887d0c0494bc55af2059421218d1164d_6039]
   as 
    
    
    

with all_values as (

    select
        category as value_field,
        count(*) as n_records

    from "crypto_data"."gold"."top_movers"
    group by category

)

select *
from all_values
where value_field not in (
    ''gainer'',''loser''
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
    [silver].[testview_887d0c0494bc55af2059421218d1164d_6039]
  
  ) dbt_internal_test;

  EXEC('drop view 
    [silver].[testview_887d0c0494bc55af2059421218d1164d_6039]
  ;')