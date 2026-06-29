
    
    

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
    'gainer','loser'
)


