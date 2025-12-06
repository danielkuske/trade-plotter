import type { Asset, PriceData } from '../types'
import { getTickerForIsin } from '../lib/stockApi'
import { PriceChart } from './PriceChart'

interface AssetDetailProps {
  asset: Asset | null
  priceData: PriceData | null
}

export function AssetDetail({ asset, priceData }: AssetDetailProps) {
  if (!asset) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p>Select an asset to view details</p>
        </div>
      </main>
    )
  }

  const ticker = getTickerForIsin(asset.isin)
  
  // Calculate stats
  const buys = asset.transactions.filter(t => t.type === 'buy')
  const sells = asset.transactions.filter(t => t.type === 'sell')
  const totalBought = buys.reduce((sum, t) => sum + t.totalValue, 0)
  const totalSold = sells.reduce((sum, t) => sum + t.totalValue, 0)
  const totalQuantityBought = buys.reduce((sum, t) => sum + t.quantity, 0)
  const totalQuantitySold = sells.reduce((sum, t) => sum + t.quantity, 0)
  const netQuantity = totalQuantityBought - totalQuantitySold
  const avgBuyPrice = totalQuantityBought > 0 ? totalBought / totalQuantityBought : 0

  return (
    <main className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">{asset.name}</h2>
          <p className="text-gray-500">
            {ticker && <span className="font-medium">{ticker}</span>}
            {ticker && <span className="mx-2">•</span>}
            <span className="text-sm">{asset.isin}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Invested</p>
            <p className="text-xl font-semibold text-gray-900">€{totalBought.toFixed(2)}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Sold</p>
            <p className="text-xl font-semibold text-gray-900">€{totalSold.toFixed(2)}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Holdings</p>
            <p className="text-xl font-semibold text-gray-900">{netQuantity.toFixed(4)}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Avg. Buy Price</p>
            <p className="text-xl font-semibold text-gray-900">€{avgBuyPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Price Chart</h3>
            {priceData && (
              <span className="text-sm text-gray-400">
                {priceData.prices[0]?.date} → {priceData.prices[priceData.prices.length - 1]?.date}
              </span>
            )}
          </div>
          
          {priceData ? (
            <div className="h-80">
              <PriceChart 
                priceData={priceData} 
                transactions={asset.transactions} 
              />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-center text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="font-medium">No price data available</p>
                <p className="text-sm mt-1">
                  {ticker ? 'Failed to fetch data' : 'No ticker mapping for this asset'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Transactions ({asset.transactions.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {asset.transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-medium rounded-full
                        ${tx.type === 'buy' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                        }
                      `}>
                        {tx.type === 'buy' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {tx.quantity.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      €{tx.pricePerUnit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <span className={tx.type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                        {tx.type === 'buy' ? '-' : '+'}€{tx.totalValue.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
