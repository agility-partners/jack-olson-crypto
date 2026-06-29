
    
    

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
    'strong_up','up','stable','down','strong_down'
)


