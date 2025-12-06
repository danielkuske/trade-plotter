import { useState } from 'react'
import { FileUpload } from './components/FileUpload'
import { parseTradePdf } from './lib/pdfParser'
import { fetchAllPriceData, getTickerForIsin } from './lib/stockApi'
import type { Portfolio, PriceData } from './types'

type AppState = 'upload' | 'parsing' | 'fetching' | 'complete' | 'error'

function App() {
  const [state, setState] = useState<AppState>('upload')
  const [fileName, setFileName] = useState<string>('')
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [priceData, setPriceData] = useState<Map<string, PriceData>>(new Map())
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleFileSelected = async (file: File) => {
    setFileName(file.name)
    setState('parsing')
    setError('')
    setPriceData(new Map())
    
    try {
      // Step 1: Parse the PDF
      const result = await parseTradePdf(file)
      setPortfolio(result)
      
      if (result.assets.length === 0) {
        setState('complete')
        return
      }
      
      // Step 2: Fetch price data for all assets
      setState('fetching')
      
      // Calculate date range: from first trade to today
      const allDates = result.assets.flatMap(a => a.transactions.map(t => t.date))
      const minDate = new Date(Math.min(...allDates.map(d => new Date(d).getTime())))
      const maxDate = new Date()
      
      // Add some buffer before first trade
      minDate.setMonth(minDate.getMonth() - 1)
      
      const isins = result.assets.map(a => a.isin)
      setProgress({ current: 0, total: isins.length })
      
      const prices = await fetchAllPriceData(
        isins,
        minDate,
        maxDate,
        (completed, total) => setProgress({ current: completed, total })
      )
      
      setPriceData(prices)
      setState('complete')
      
    } catch (err) {
      console.error('Failed:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('upload')
    setFileName('')
    setPortfolio(null)
    setPriceData(new Map())
    setError('')
    setProgress({ current: 0, total: 0 })
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Trade Plotter
          </h1>
          <p className="text-gray-500">
            Visualize your trades on a price chart
          </p>
        </header>

        {/* Upload State */}
        {state === 'upload' && (
          <div className="space-y-6">
            <FileUpload onFileSelected={handleFileSelected} />
            
            <div className="text-center text-sm text-gray-400">
              <p>Upload your Trade Republic account statement (PDF)</p>
              <p>to see your transactions plotted on a chart.</p>
            </div>
          </div>
        )}

        {/* Parsing State */}
        {state === 'parsing' && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Parsing {fileName}...</p>
          </div>
        )}

        {/* Fetching Prices State */}
        {state === 'fetching' && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600 mb-2">Fetching price data...</p>
            <p className="text-sm text-gray-400">
              {progress.current} of {progress.total} assets
            </p>
            {/* Progress bar */}
            <div className="w-48 mx-auto mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium mb-1">Something went wrong</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Complete State */}
        {state === 'complete' && portfolio && (
          <div className="py-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-1">Ready to visualize</p>
              <p className="text-gray-500 text-sm">
                {portfolio.assets.length} assets • {priceData.size} with price data
              </p>
            </div>

            {/* Portfolio Summary */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Assets
              </h2>
              
              {portfolio.assets.length === 0 ? (
                <p className="text-gray-500 text-sm">No trades found in this PDF.</p>
              ) : (
                <ul className="space-y-4">
                  {portfolio.assets.map((asset) => {
                    const ticker = getTickerForIsin(asset.isin)
                    const hasPrices = priceData.has(asset.isin)
                    const prices = priceData.get(asset.isin)
                    
                    return (
                      <li key={asset.isin} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{asset.name}</p>
                            <p className="text-sm text-gray-400">
                              {asset.isin}
                              {ticker && <span className="ml-2 text-gray-500">({ticker})</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-500">
                              {asset.transactions.length} trade{asset.transactions.length !== 1 ? 's' : ''}
                            </span>
                            {hasPrices && prices && (
                              <p className="text-xs text-green-600">
                                {prices.prices.length} price points
                              </p>
                            )}
                            {!hasPrices && ticker && (
                              <p className="text-xs text-yellow-600">No price data</p>
                            )}
                            {!ticker && (
                              <p className="text-xs text-red-500">No ticker mapping</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Transaction summary */}
                        <div className="mt-2 text-sm text-gray-500">
                          {(() => {
                            const buys = asset.transactions.filter(t => t.type === 'buy')
                            const sells = asset.transactions.filter(t => t.type === 'sell')
                            const totalBought = buys.reduce((sum, t) => sum + t.totalValue, 0)
                            const totalSold = sells.reduce((sum, t) => sum + t.totalValue, 0)
                            return (
                              <span>
                                Bought: €{totalBought.toFixed(2)}
                                {sells.length > 0 && ` • Sold: €${totalSold.toFixed(2)}`}
                              </span>
                            )
                          })()}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="text-center mt-6">
              <button
                onClick={handleReset}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Upload another file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
