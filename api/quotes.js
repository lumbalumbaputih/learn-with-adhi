// Vercel Edge Function — proxies Yahoo Finance quote data for the AI boom report.
// Cached 5 min at the edge; returns graceful fallback on any error so the page
// still loads with static data.
export const config = { runtime: 'edge' };

const TICKERS = [
  'NVDA','AMD','AVGO','MRVL','TSM','ASML','INTC','ARM',
  'MU','SNDK','WDC','STX','PSTG',
  'VRT','ETN','GEV','CEG','VST','PWR',
  'ANET','CRDO','ALAB','COHR','LITE','CIEN',
  'DELL','SMCI','CRWV','NBIS','DLR','EQIX',
  'MSFT','AMZN','GOOGL','META','ORCL',
  'PLTR','NOW','CRM','SNOW','DDOG','MDB','CRWD','TSLA',
].join(',');

const FIELDS = [
  'regularMarketPrice','regularMarketChangePercent',
  'marketCap','trailingPE','forwardPE',
  'fiftyTwoWeekHigh','fiftyTwoWeekLow','shortName',
].join(',');

export default async function handler(req) {
  const url =
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${TICKERS}&fields=${FIELDS}`;

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!r.ok) {
      throw new Error(`Yahoo Finance returned HTTP ${r.status}`);
    }

    const data = await r.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    // Return empty-result shape so the browser JS just falls back to static data.
    return new Response(
      JSON.stringify({ quoteResponse: { result: [], error: err.message } }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
