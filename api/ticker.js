// Agrega os dados do ticker (dólar, BTC, IBOV, S&P500, ouro, WTI) em uma única
// resposta server-side, evitando o proxy público allorigins (lento/instável) que
// era usado direto do client para contornar CORS do Yahoo Finance.

const YAHOO_SYMBOLS = {
  usd: "BRL=X",
  ibov: "^BVSP",
  spx: "^GSPC",
  gold: "GC=F",
  wti: "CL=F",
};

async function fetchYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  const data = await r.json();
  const meta = data.chart.result[0].meta;
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose || meta.previousClose || price;
  return { price, pct: ((price - prev) / prev) * 100 };
}

async function fetchBTC() {
  const r = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
  );
  const d = await r.json();
  return { price: d.bitcoin.usd, pct: d.bitcoin.usd_24h_change };
}

export default async function handler(req, res) {
  const entries = await Promise.all([
    ["btc", fetchBTC()],
    ...Object.entries(YAHOO_SYMBOLS).map(([key, symbol]) => [key, fetchYahoo(symbol)]),
  ].map(async ([key, promise]) => {
    try {
      return [key, await promise];
    } catch {
      return [key, null];
    }
  }));

  res.setHeader("cache-control", "s-maxage=45, stale-while-revalidate=30");
  res.status(200).json(Object.fromEntries(entries));
}
