import { readFileSync } from "node:fs";
import path from "node:path";

describe("Polygon live ingestion wiring", () => {
  it("uses CoinGecko's current Polygon id in the ingester config", () => {
    const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");
    const dockerCompose = readFileSync(dockerComposePath, "utf8");
    const match = dockerCompose.match(/COINGECKO_COIN_IDS=([^\n]+)/);

    expect(match?.[1]).toBeDefined();

    const coinIds = match![1].split(",");

    expect(coinIds).toContain("pol");
    expect(coinIds).not.toContain("matic-network");
  });

  it("normalizes CoinGecko Polygon ids back to the canonical polygon coin id", () => {
    const transformPath = path.join(
      process.cwd(),
      "transform/models/silver/stg_coin_markets.sql",
    );
    const transformSql = readFileSync(transformPath, "utf8");

    expect(transformSql).toContain("WHEN 'pol' THEN 'polygon'");
    expect(transformSql).toContain("WHEN 'matic-network' THEN 'polygon'");
  });
});
