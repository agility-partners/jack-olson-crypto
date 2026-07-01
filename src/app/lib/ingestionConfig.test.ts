import { readFileSync } from "node:fs";
import path from "node:path";

describe("Sui live ingestion wiring", () => {
  it("uses Sui's CoinGecko id in the ingester config", () => {
    const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");
    const dockerCompose = readFileSync(dockerComposePath, "utf8");
    const match = dockerCompose.match(/COINGECKO_COIN_IDS=([^\n]+)/);

    expect(match?.[1]).toBeDefined();

    const coinIds = match![1].split(",");

    expect(coinIds).toContain("sui");
    expect(coinIds).not.toContain("pol");
    expect(coinIds).not.toContain("matic-network");
  });

  it("removes the legacy Polygon alias normalization from the silver model", () => {
    const transformPath = path.join(
      process.cwd(),
      "transform/models/silver/stg_coin_markets.sql",
    );
    const transformSql = readFileSync(transformPath, "utf8");

    expect(transformSql).not.toContain("WHEN 'pol' THEN 'polygon'");
    expect(transformSql).not.toContain("WHEN 'matic-network' THEN 'polygon'");
  });

  it("uses Bitcoin Cash instead of Shiba Inu in the ingester config", () => {
    const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");
    const dockerCompose = readFileSync(dockerComposePath, "utf8");
    const match = dockerCompose.match(/COINGECKO_COIN_IDS=([^\n]+)/);

    expect(match?.[1]).toBeDefined();

    const coinIds = match![1].split(",");

    expect(coinIds).toContain("bitcoin-cash");
    expect(coinIds).not.toContain("shiba-inu");
  });
});
