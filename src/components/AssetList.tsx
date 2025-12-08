import type { Asset, PriceData } from '../types'
import { getTickerForIsin } from '../lib/stockApi'

interface AssetListProps {
  assets: Asset[]
  priceData: Map<string, PriceData>
  selectedIsin: string | null
  onSelectAsset: (isin: string) => void
}

export function AssetList({ assets, priceData, selectedIsin, onSelectAsset }: AssetListProps) {
  return (
    <aside className="h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Assets ({assets.length})
        </h2>
        
        <ul className="space-y-1">
          {assets.map((asset) => {
            const isSelected = asset.isin === selectedIsin
            const ticker = getTickerForIsin(asset.isin)
            const hasPrices = priceData.has(asset.isin)
            
            // Calculate totals
            const buys = asset.transactions.filter(t => t.type === 'buy')
            const sells = asset.transactions.filter(t => t.type === 'sell')
            const totalBought = buys.reduce((sum, t) => sum + t.totalValue, 0)
            const totalSold = sells.reduce((sum, t) => sum + t.totalValue, 0)
            
            return (
              <li key={asset.isin}>
                <button
                  onClick={() => onSelectAsset(asset.isin)}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg transition-colors
                    ${isSelected 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {asset.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ticker || asset.isin}
                      </p>
                    </div>
                    
                    {/* Price data indicator */}
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${hasPrices ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </div>
                  
                  {/* Totals */}
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="text-green-600">
                      +€{totalBought.toFixed(0)}
                    </span>
                    {totalSold > 0 && (
                      <span className="text-red-600">
                        -€{totalSold.toFixed(0)}
                      </span>
                    )}
                    <span className="text-gray-400">
                      {asset.transactions.length} trades
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

