import type { PriceData, PricePoint } from '../types'

/**
 * ISIN to Yahoo Finance ticker symbol mapping
 */
const ISIN_TO_TICKER: Record<string, string> = {
  // ETFs - European
  'IE00B4L5Y983': 'EUNL.DE',      // iShares Core MSCI World UCITS ETF
  'IE00B3WJKG14': 'SXR8.DE',      // iShares Core S&P 500 UCITS ETF
  'IE000GWTNRJ7': 'PRAW.DE',      // Amundi Prime Global UCITS ETF
  'IE0008643037': 'XDWD.DE',      // Xtrackers MSCI World UCITS ETF
  'IE00B5BMR087': 'CSPX.L',       // iShares Core S&P 500 UCITS ETF USD
  'IE00BKM4GZ66': 'EMIM.L',       // iShares Core MSCI EM IMI UCITS ETF
  'LU0392494562': 'DBXD.DE',      // Xtrackers DAX UCITS ETF
  
  // US Stocks
  'US5949181045': 'MSFT',         // Microsoft
  'US88160R1014': 'TSLA',         // Tesla
  'US67066G1040': 'NVDA',         // NVIDIA
  'US0378331005': 'AAPL',         // Apple
  'US6974351057': 'PANW',         // Palo Alto Networks
  'US02079K3059': 'GOOGL',        // Alphabet (Google)
  'US88339J1051': 'TTD',          // The Trade Desk
  'US0231351067': 'AMZN',         // Amazon
  'US30303M1027': 'META',         // Meta
  'US64110L1061': 'NFLX',         // Netflix
  'US79466L3024': 'CRM',          // Salesforce
  'US00507V1098': 'ADBE',         // Adobe
  'US4781601046': 'JNJ',          // Johnson & Johnson
  'US7427181091': 'PG',           // Procter & Gamble
  'US2546871060': 'DIS',          // Disney
  'US92826C8394': 'V',            // Visa
  'US0258161092': 'AXP',          // American Express
  'US0846707026': 'BRK-B',        // Berkshire Hathaway
  'US4592001014': 'IBM',          // IBM
  'US17275R1023': 'CSCO',         // Cisco
  'US4370761029': 'HD',           // Home Depot
  
  // German Stocks
  'DE000A161408': 'HFG.DE',       // HelloFresh
  'DE0007164600': 'SAP.DE',       // SAP
  'DE0007236101': 'SIE.DE',       // Siemens
  'DE000BAY0017': 'BAYN.DE',      // Bayer
  'DE0005557508': 'DTE.DE',       // Deutsche Telekom
  'DE0007100000': 'MBG.DE',       // Mercedes-Benz
  'DE0005190003': 'BMW.DE',       // BMW
  'DE0008404005': 'ALV.DE',       // Allianz
  
  // Crypto
  'XF000BTC0017': 'BTC-USD',      // Bitcoin
  'XF000ETH0019': 'ETH-USD',      // Ethereum
}

/**
 * Get Yahoo Finance ticker for an ISIN
 */
export function getTickerForIsin(isin: string): string | null {
  return ISIN_TO_TICKER[isin] || null
}

/**
 * Check if we have a ticker mapping for an ISIN
 */
export function hasTickerMapping(isin: string): boolean {
  return isin in ISIN_TO_TICKER
}

/**
 * Fetch daily price data from Yahoo Finance via CORS proxy
 */
export async function fetchPriceData(
  ticker: string,
  startDate: Date,
  endDate: Date
): Promise<PriceData> {
  // Yahoo Finance API parameters
  const period1 = Math.floor(startDate.getTime() / 1000)
  const period2 = Math.floor(endDate.getTime() / 1000)
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`
  
  // Use a CORS proxy for browser requests
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`
  
  const response = await fetch(proxyUrl)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${ticker}: ${response.statusText}`)
  }
  
  const data = await response.json()
  
  if (data.chart?.error) {
    throw new Error(data.chart.error.description || `No data for ${ticker}`)
  }
  
  const result = data.chart?.result?.[0]
  if (!result) {
    throw new Error(`No data returned for ${ticker}`)
  }
  
  const timestamps = result.timestamp || []
  const quotes = result.indicators?.quote?.[0] || {}
  const { open, high, low, close, volume } = quotes
  
  const prices: PricePoint[] = []
  
  for (let i = 0; i < timestamps.length; i++) {
    // Skip if any required value is null
    if (close[i] == null) continue
    
    prices.push({
      date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
      open: open[i] ?? close[i],
      high: high[i] ?? close[i],
      low: low[i] ?? close[i],
      close: close[i],
      volume: volume[i] ?? 0,
    })
  }
  
  return {
    ticker,
    currency: result.meta?.currency || 'USD',
    prices,
  }
}

/**
 * Fetch price data for an asset by ISIN
 * Returns null if no ticker mapping exists
 */
export async function fetchPriceDataForIsin(
  isin: string,
  startDate: Date,
  endDate: Date
): Promise<PriceData | null> {
  const ticker = getTickerForIsin(isin)
  
  if (!ticker) {
    console.warn(`No ticker mapping for ISIN: ${isin}`)
    return null
  }
  
  try {
    return await fetchPriceData(ticker, startDate, endDate)
  } catch (error) {
    console.error(`Failed to fetch price data for ${isin} (${ticker}):`, error)
    return null
  }
}

/**
 * Fetch price data for multiple ISINs
 */
export async function fetchAllPriceData(
  isins: string[],
  startDate: Date,
  endDate: Date,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>()
  const uniqueIsins = [...new Set(isins)]
  
  for (let i = 0; i < uniqueIsins.length; i++) {
    const isin = uniqueIsins[i]
    
    const data = await fetchPriceDataForIsin(isin, startDate, endDate)
    if (data) {
      results.set(isin, data)
    }
    
    onProgress?.(i + 1, uniqueIsins.length)
    
    // Small delay to avoid rate limiting
    if (i < uniqueIsins.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
  
  return results
}

