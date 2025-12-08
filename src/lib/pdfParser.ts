import type { Asset, Portfolio, Transaction } from '../types'


// German month abbreviations to month numbers
const MONTH_MAP: Record<string, string> = {
  'Jan.': '01', 'Feb.': '02', 'Mär.': '03', 'März': '03',
  'Apr.': '04', 'Mai': '05', 'Jun.': '06', 'Juni': '06',
  'Jul.': '07', 'Juli': '07', 'Aug.': '08', 'Sep.': '09',
  'Sept.': '09', 'Okt.': '10', 'Nov.': '11', 'Dez.': '12',
}

/**
 * Main entry point: Parse a PDF file into a Portfolio
 */
export async function parseTradePdf(text: string): Promise<Portfolio> {
  return parseTradeText(text)
}

/**
 * Parse German date format "26 Feb. 2024" or "05 März 2024" to ISO "2024-02-26"
 */
function parseGermanDate(dateStr: string): string {
  // Handle formats like "26 Feb. 2024" or "05März2024"
  const match = dateStr.match(/(\d{1,2})\s*([A-Za-zäöü.]+)\s*(\d{4})/)
  if (!match) return dateStr
  
  const day = match[1].padStart(2, '0')
  const monthStr = match[2]
  const year = match[3]
  
  // Find month number
  let month = '01'
  for (const [abbrev, num] of Object.entries(MONTH_MAP)) {
    if (monthStr.includes(abbrev.replace('.', '')) || monthStr.includes(abbrev)) {
      month = num
      break
    }
  }
  
  return `${year}-${month}-${day}`
}

/**
 * Extract ISIN from text
 * ISIN format: 2 letters + 10 alphanumeric characters
 */
function extractISIN(text: string): string | null {
  const match = text.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/)
  return match ? match[1] : null
}

/**
 * Extract quantity from text
 * Formats: "quantity: 4.467476" or "quantity: 0.754978"
 */
function extractQuantity(text: string): number | null {
  const match = text.match(/quantity[:\s]*([\d.]+)/i)
  return match ? parseFloat(match[1]) : null
}

/**
 * Parse German number format "2.380,90" or "500,00" to number
 */
function parseGermanNumber(str: string): number {
  if (!str) return 0
  const cleaned = str.replace(/[€\s]/g, '')
  // German format: 1.234,56 -> 1234.56
  const normalized = cleaned.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

/**
 * Extract asset name from description
 */
function extractAssetName(text: string, isin: string): string {
  // Common patterns after ISIN
  const patterns = [
    // "ISHSIII-CORE MSCI WLD"
    new RegExp(isin + '\\s+([A-Z0-9\\-\\s]+?)\\s+(?:DL|KW|\\d)', 'i'),
    // "iShares III plc - iShares Core MSCI World UCITS ETF USD (Acc)"
    new RegExp(isin + '\\s+(.+?)(?:,\\s*quantity|$)', 'i'),
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  // Fallback: try to get text after ISIN up to a number
  const isinIndex = text.indexOf(isin)
  if (isinIndex >= 0) {
    const afterIsin = text.substring(isinIndex + isin.length, isinIndex + isin.length + 50)
    const cleaned = afterIsin.replace(/^\s+/, '').split(/\d{5,}/)[0]
    if (cleaned && cleaned.length > 2) {
      return cleaned.trim()
    }
  }
  
  return isin // Fallback to ISIN
}

/**
 * Known asset names for common ISINs
 */
const KNOWN_ASSETS: Record<string, string> = {
  // ETFs
  'IE00B4L5Y983': 'iShares Core MSCI World UCITS ETF',
  'IE00B3WJKG14': 'iShares S&P 500 EUR Hedged UCITS ETF',
  'IE000GWTNRJ7': 'Amundi Prime Global UCITS ETF',
  'IE0008643037': 'Xtrackers MSCI World UCITS ETF',
  // US Stocks
  'US5949181045': 'Microsoft Corp.',
  'US88160R1014': 'Tesla Inc.',
  'US67066G1040': 'NVIDIA Corp.',
  'US0378331005': 'Apple Inc.',
  'US6974351057': 'Palo Alto Networks',
  'US02079K3059': 'Alphabet Inc. (Google)',
  'US88339J1051': 'The Trade Desk Inc.',
  // German Stocks
  'DE000A161408': 'HelloFresh SE',
  // Crypto
  'XF000BTC0017': 'Bitcoin',
  'XF000ETH0019': 'Ethereum',
}

/**
 * Parse extracted PDF text into Portfolio
 */
function parseTradeText(text: string): Portfolio {
  const assetMap = new Map<string, Asset>()
  
  // Find all trade entries
  // Pattern 1: "Savings plan execution ISIN Name, quantity: X.XX" with amount
  // Pattern 2: "Ausführung Handel Direktkauf Kauf ISIN NAME" with amount
  // Pattern 3: "Buy trade ISIN NAME, quantity: X.XX" with amount
  
  // Split by dates to process entries
  // Date pattern: "26 Feb. 2024" or "05 März 2024"
  const monthNames = Object.keys(MONTH_MAP).map(m => m.replace('.', '\\.')).join('|')
  const datePattern = new RegExp(`(\\d{1,2}\\s*(?:${monthNames})\\s*\\d{4})`, 'g')
  
  const segments = text.split(datePattern)
  
  for (let i = 1; i < segments.length; i += 2) {
    const dateStr = segments[i]
    const content = segments[i + 1] || ''
    
    // Check if this is a trade entry
    const isKauf = content.includes('Direktkauf') || content.includes('Kauf') || 
                   content.toLowerCase().includes('buy trade') ||
                   content.toLowerCase().includes('savings plan execution')
    const isVerkauf = content.includes('Direktverkauf') || content.includes('Verkauf') ||
                      content.toLowerCase().includes('sell trade')
    
    if (!isKauf && !isVerkauf) continue
    
    // Skip if it's just header/footer content
    if (content.includes('TRADE REPUBLIC BANK') || content.includes('Erstellt am')) continue
    
    const isin = extractISIN(content)
    if (!isin) continue
    
    const quantity = extractQuantity(content)
    
    // Extract amount - look for Euro amounts
    const amountMatch = content.match(/([\d.]+,\d{2})\s*€/)
    const amount = amountMatch ? parseGermanNumber(amountMatch[1]) : null
    
    if (!amount) continue
    
    const date = parseGermanDate(dateStr)
    const transactionType = isVerkauf ? 'sell' : 'buy'
    
    // Calculate price per unit if we have quantity
    const pricePerUnit = quantity && quantity > 0 ? amount / quantity : amount
    
    const transaction: Transaction = {
      date,
      type: transactionType,
      quantity: quantity || 1, // Default to 1 if no quantity found
      totalValue: amount,
      pricePerUnit,
    }
    
    // Get or create asset
    if (!assetMap.has(isin)) {
      const name = KNOWN_ASSETS[isin] || extractAssetName(content, isin)
      assetMap.set(isin, {
        name,
        isin,
        transactions: [],
      })
    }
    
    assetMap.get(isin)!.transactions.push(transaction)
  }
  
  // Sort transactions by date for each asset
  for (const asset of assetMap.values()) {
    asset.transactions.sort((a, b) => a.date.localeCompare(b.date))
  }
  
  return {
    assets: Array.from(assetMap.values())
  }
}
