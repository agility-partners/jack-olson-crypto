
      -- back compat for old kwarg name
  
  
  
        
            
                
                
            
                
                
            
        
    

    

    merge into "crypto_data"."silver"."stg_coin_markets" as DBT_INTERNAL_DEST
        using "crypto_data"."silver"."stg_coin_markets__dbt_tmp" as DBT_INTERNAL_SOURCE
        on (
                    DBT_INTERNAL_SOURCE.coin_id = DBT_INTERNAL_DEST.coin_id
                ) and (
                    DBT_INTERNAL_SOURCE.last_updated = DBT_INTERNAL_DEST.last_updated
                )

    
    when matched then update set
        "bronze_id" = DBT_INTERNAL_SOURCE."bronze_id","ingested_at" = DBT_INTERNAL_SOURCE."ingested_at","coin_id" = DBT_INTERNAL_SOURCE."coin_id","symbol" = DBT_INTERNAL_SOURCE."symbol","name" = DBT_INTERNAL_SOURCE."name","current_price" = DBT_INTERNAL_SOURCE."current_price","market_cap" = DBT_INTERNAL_SOURCE."market_cap","market_cap_rank" = DBT_INTERNAL_SOURCE."market_cap_rank","total_volume" = DBT_INTERNAL_SOURCE."total_volume","high_24h" = DBT_INTERNAL_SOURCE."high_24h","low_24h" = DBT_INTERNAL_SOURCE."low_24h","price_change_24h" = DBT_INTERNAL_SOURCE."price_change_24h","price_change_percentage_24h" = DBT_INTERNAL_SOURCE."price_change_percentage_24h","circulating_supply" = DBT_INTERNAL_SOURCE."circulating_supply","total_supply" = DBT_INTERNAL_SOURCE."total_supply","ath" = DBT_INTERNAL_SOURCE."ath","atl" = DBT_INTERNAL_SOURCE."atl","last_updated" = DBT_INTERNAL_SOURCE."last_updated"
    

    when not matched then insert
        ("bronze_id", "ingested_at", "coin_id", "symbol", "name", "current_price", "market_cap", "market_cap_rank", "total_volume", "high_24h", "low_24h", "price_change_24h", "price_change_percentage_24h", "circulating_supply", "total_supply", "ath", "atl", "last_updated")
    values
        ("bronze_id", "ingested_at", "coin_id", "symbol", "name", "current_price", "market_cap", "market_cap_rank", "total_volume", "high_24h", "low_24h", "price_change_24h", "price_change_percentage_24h", "circulating_supply", "total_supply", "ath", "atl", "last_updated")


  
    OPTION (LABEL = 'dbt-sqlserver');


  