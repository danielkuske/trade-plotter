// Single transaction (buy or sell)
export interface Transaction {
  date: string           // ISO date, e.g. "2024-03-15"
  type: 'buy' | 'sell'
  quantity: number       // Number of shares/units
  totalValue: number     // Total amount in EUR
  pricePerUnit: number   // Calculated: totalValue / quantity
}

// An ETF, stock, or crypto with all its transactions
export interface Asset {
  name: string           // e.g. "iShares Core MSCI World UCITS ETF USD (Acc)"
  isin: string           // e.g. "IE00B4L5Y983"
  transactions: Transaction[]
}

// The full parsed result
export interface Portfolio {
  assets: Asset[]
}

// Single price data point (OHLCV)
export interface PricePoint {
  date: string           // ISO date, e.g. "2024-03-15"
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Historical price data for an asset
export interface PriceData {
  ticker: string         // Yahoo Finance ticker symbol
  currency: string       // e.g. "USD", "EUR"
  prices: PricePoint[]
}
