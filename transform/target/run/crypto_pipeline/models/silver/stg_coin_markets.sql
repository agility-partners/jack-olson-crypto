
      

    
        
            delete from "crypto_data"."silver"."stg_coin_markets"
            where exists (
                select null
                from "crypto_data"."silver"."stg_coin_markets__dbt_tmp"
                where
                
                    "crypto_data"."silver"."stg_coin_markets__dbt_tmp".coin_id = "crypto_data"."silver"."stg_coin_markets".coin_id
                    and 
                
                    "crypto_data"."silver"."stg_coin_markets__dbt_tmp".last_updated = "crypto_data"."silver"."stg_coin_markets".last_updated
                    
                
            )
            
            
    OPTION (LABEL = 'dbt-sqlserver');

        
    

    insert into "crypto_data"."silver"."stg_coin_markets" ("ingested_at", "coin_id", "symbol", "name", "current_price", "market_cap", "market_cap_rank", "total_volume", "high_24h", "low_24h", "price_change_24h", "price_change_percentage_24h", "circulating_supply", "total_supply", "ath", "atl", "last_updated")
    (
        select "ingested_at", "coin_id", "symbol", "name", "current_price", "market_cap", "market_cap_rank", "total_volume", "high_24h", "low_24h", "price_change_24h", "price_change_percentage_24h", "circulating_supply", "total_supply", "ath", "atl", "last_updated"
        from "crypto_data"."silver"."stg_coin_markets__dbt_tmp"
    )
    OPTION (LABEL = 'dbt-sqlserver');


  