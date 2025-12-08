import { useState } from 'react'
import type { Asset, PriceData } from '../types'
import { getTickerForIsin } from '../lib/stockApi'
import { PriceChart } from './PriceChart'

interface AssetDetailProps {
  asset: Asset | null
  priceData: PriceData | null
}

export function AssetDetail({ asset, priceData }: AssetDetailProps) {
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null)

  if (!asset) {
    return (
      <main className="h-full flex items-center justify-center bg-gray-50">
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

  return (
    <main className="h-full bg-gray-50 overflow-y-auto">
      <div className="p-6 h-full flex flex-col">
        {/* Price Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex-1 min-h-0">
          {priceData ? (
            <div className="h-full">
              <PriceChart 
                priceData={priceData} 
                transactions={asset.transactions}
                highlightedDate={highlightedDate}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
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
        <div className="bg-white rounded-lg border border-gray-200 mt-4 max-h-64 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-sm font-medium text-gray-700">
              Transactions ({asset.transactions.length})
            </h3>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {asset.transactions.map((tx, idx) => (
                  <tr 
                    key={idx} 
                    className={`
                      cursor-pointer transition-colors
                      ${highlightedDate === tx.date 
                        ? 'bg-blue-50' 
                        : 'hover:bg-gray-50'
                      }
                    `}
                    onMouseEnter={() => setHighlightedDate(tx.date)}
                    onMouseLeave={() => setHighlightedDate(null)}
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {tx.date}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`
                        inline-flex px-1.5 py-0.5 text-xs font-medium rounded
                        ${tx.type === 'buy' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                        }
                      `}>
                        {tx.type === 'buy' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                      {tx.quantity.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                      €{tx.pricePerUnit.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-right">
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
