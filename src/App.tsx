import { useState, useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { FileUpload } from './components/FileUpload'
import { AssetList } from './components/AssetList'
import { AssetDetail } from './components/AssetDetail'
import { Logo, LogoIcon } from './components/Logo'
import { parseTradePdf } from './lib/pdfParser'
import { fetchAllPriceData } from './lib/stockApi'
import type { Portfolio, PriceData } from './types'
import { loadPdf } from './lib/pdfLoader'

type AppState = 'upload' | 'parsing' | 'fetching' | 'complete' | 'ready' | 'error'

function App() {
  const [state, setState] = useState<AppState>('upload')
  const [fileName, setFileName] = useState<string>('')
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [priceData, setPriceData] = useState<Map<string, PriceData>>(new Map())
  const [error, setError] = useState<string>('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [selectedIsin, setSelectedIsin] = useState<string | null>(null)

  // Auto-transition from 'complete' to 'ready' after 1 second
  useEffect(() => {
    if (state === 'complete') {
      const timer = setTimeout(() => {
        setState('ready')
        // Auto-select first asset if available
        if (portfolio && portfolio.assets.length > 0) {
          setSelectedIsin(portfolio.assets[0].isin)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state, portfolio])

  const handleFileSelected = async (file: File) => {
    setFileName(file.name)
    setState('parsing')
    setError('')
    setPriceData(new Map())
    setSelectedIsin(null)
    
    try {
      // Step 1: Parse the PDF
      const text = await loadPdf(file)
      const result = await parseTradePdf(text)
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
    setSelectedIsin(null)
  }

  const selectedAsset = portfolio?.assets.find(a => a.isin === selectedIsin) || null
  const selectedPrices = selectedIsin ? priceData.get(selectedIsin) || null : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Upload / Loading States */}
      {state !== 'ready' && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full mx-auto px-6">
            {/* Header */}
            <header className="text-center mb-12">
              <Logo size="lg" className="mb-4" />
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
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-600">Parsing {fileName}...</p>
              </div>
            )}

            {/* Fetching Prices State */}
            {state === 'fetching' && (
              <div className="py-8">
                {/* PDF Loaded Success */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-600">
                    {portfolio?.assets.length} assets found in {fileName}
                  </span>
                </div>

                {/* Fetching Progress */}
                <div className="text-center">
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
              </div>
            )}

            {/* Complete State (brief) */}
            {state === 'complete' && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-4">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-1">Ready to visualize</p>
                <p className="text-gray-500 text-sm">
                  {portfolio?.assets.length} assets • {priceData.size} with price data
                </p>
              </div>
            )}

            {/* Error State */}
            {state === 'error' && (
              <div className="text-center py-8">
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
          </div>
        </div>
      )}

      {/* Main View (Ready State) */}
      {state === 'ready' && portfolio && (
        <div className="h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogoIcon className="text-gray-900" />
              <h1 className="text-xl font-semibold text-gray-900">Trade Plotter</h1>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Upload new file
            </button>
          </header>

          {/* Main Content */}
          <PanelGroup direction="horizontal" className="flex-1">
            {/* Left Sidebar - Asset List */}
            <Panel defaultSize={25} minSize={15} maxSize={50}>
              <AssetList
                assets={portfolio.assets}
                priceData={priceData}
                selectedIsin={selectedIsin}
                onSelectAsset={setSelectedIsin}
              />
            </Panel>

            {/* Resize Handle */}
            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize" />

            {/* Right Panel - Asset Detail */}
            <Panel defaultSize={75} minSize={40}>
              <AssetDetail
                asset={selectedAsset}
                priceData={selectedPrices}
              />
            </Panel>
          </PanelGroup>
        </div>
      )}
    </div>
  )
}

export default App
