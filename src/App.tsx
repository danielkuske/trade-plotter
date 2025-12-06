import { useState } from 'react'
import { FileUpload } from './components/FileUpload'
import { parseTradePdf } from './lib/pdfParser'
import type { Portfolio } from './types'

type AppState = 'upload' | 'loading' | 'complete' | 'error'

function App() {
  const [state, setState] = useState<AppState>('upload')
  const [fileName, setFileName] = useState<string>('')
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [error, setError] = useState<string>('')

  const handleFileSelected = async (file: File) => {
    setFileName(file.name)
    setState('loading')
    setError('')
    
    try {
      const result = await parseTradePdf(file)
      setPortfolio(result)
      setState('complete')
    } catch (err) {
      console.error('Failed to parse PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to parse PDF')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('upload')
    setFileName('')
    setPortfolio(null)
    setError('')
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

        {/* Loading State */}
        {state === 'loading' && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Parsing {fileName}...</p>
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
            <p className="text-gray-900 font-medium mb-1">Parsing failed</p>
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
              <p className="text-gray-900 font-medium mb-1">Parsing complete</p>
              <p className="text-gray-500 text-sm">{fileName}</p>
            </div>

            {/* Portfolio Summary */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Found {portfolio.assets.length} asset{portfolio.assets.length !== 1 ? 's' : ''}
              </h2>
              
              {portfolio.assets.length === 0 ? (
                <p className="text-gray-500 text-sm">No trades found in this PDF.</p>
              ) : (
                <ul className="space-y-4">
                  {portfolio.assets.map((asset) => (
                    <li key={asset.isin} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{asset.name}</p>
                          <p className="text-sm text-gray-400">{asset.isin}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {asset.transactions.length} trade{asset.transactions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {/* Transaction list */}
                      <div className="mt-3 space-y-1">
                        {asset.transactions.map((tx, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-500">{tx.date}</span>
                            <span className={tx.type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                              {tx.type === 'buy' ? '+' : '-'}{tx.quantity.toFixed(4)} @ €{tx.pricePerUnit.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
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
