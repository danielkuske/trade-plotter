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
