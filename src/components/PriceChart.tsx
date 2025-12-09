import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createChart, IChartApi, ISeriesApi, Time, LineSeries } from 'lightweight-charts'
import type { PriceData, Transaction } from '../types'

interface PriceChartProps {
  priceData: PriceData
  transactions: Transaction[]
  highlightedDate?: string | null
}

interface TooltipData {
  x: number
  y: number
  transaction: Transaction
}

interface DotPosition {
  x: number
  y: number
  transaction: Transaction
}

export function PriceChart({ priceData, transactions, highlightedDate }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [dotPositions, setDotPositions] = useState<DotPosition[]>([])
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  // Create a map of dates to transactions for quick lookup
  // If multiple transactions on same day, combine them
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, Transaction>()
    transactions.forEach(tx => {
      const existing = map.get(tx.date)
      if (existing) {
        // Combine transactions on same day - use the type with higher total value
        const combinedQty = existing.quantity + tx.quantity
        const combinedValue = existing.totalValue + tx.totalValue
        map.set(tx.date, {
          ...existing,
          type: existing.totalValue >= tx.totalValue ? existing.type : tx.type,
          quantity: combinedQty,
          totalValue: combinedValue,
          pricePerUnit: combinedValue / combinedQty,
        })
      } else {
        map.set(tx.date, tx)
      }
    })
    return map
  }, [transactions])

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { color: '#f1f5f9' },
        horzLines: { color: '#f1f5f9' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#94a3b8',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#94a3b8',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#e2e8f0',
      },
      timeScale: {
        borderColor: '#e2e8f0',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    })

    chartRef.current = chart

    // Create line series for price (v5 API)
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      priceLineVisible: false,
    })

    seriesRef.current = lineSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    // Initial size
    handleResize()

    // Observe container resize
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [])

  // Function to calculate dot positions based on current chart view
  const updateDotPositions = useCallback(() => {
    if (!chartRef.current || !seriesRef.current || !priceData) return

    const timeScale = chartRef.current.timeScale()
    const positions: DotPosition[] = []

    Array.from(transactionsByDate.values()).forEach(tx => {
      const pricePoint = priceData.prices.find(p => p.date === tx.date)
      if (!pricePoint) return

      const x = timeScale.timeToCoordinate(tx.date as Time)
      const y = seriesRef.current?.priceToCoordinate(pricePoint.close)

      if (x !== null && y !== null) {
        positions.push({ x, y, transaction: tx })
      }
    })

    setDotPositions(positions)
  }, [priceData, transactionsByDate])

  // Update dot positions when chart view changes
  useEffect(() => {
    if (!chartRef.current) return

    const chart = chartRef.current
    const timeScale = chart.timeScale()
    
    // Update on time scale changes (pan/zoom)
    timeScale.subscribeVisibleTimeRangeChange(updateDotPositions)
    
    // Update on size changes
    chart.subscribeCrosshairMove(updateDotPositions)

    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(updateDotPositions)
      chart.unsubscribeCrosshairMove(updateDotPositions)
    }
  }, [updateDotPositions])

  // Update data when priceData changes
  useEffect(() => {
    if (!seriesRef.current || !priceData) return

    // Convert price data to chart format
    const lineData = priceData.prices.map((p) => ({
      time: p.date as Time,
      value: p.close,
    }))

    seriesRef.current.setData(lineData)

    // Fit content to view
    chartRef.current?.timeScale().fitContent()
    
    // Update dot positions after a small delay to ensure chart is rendered
    setTimeout(updateDotPositions, 50)
  }, [priceData, updateDotPositions])

  // Find transaction for highlighted date (from table hover)
  const highlightedTransaction = highlightedDate ? transactionsByDate.get(highlightedDate) : null
  const showHighlightTooltip = highlightedTransaction && !tooltip

  // Determine which date is currently active (hovered dot or highlighted from table)
  const activeDate = hoveredDate || highlightedDate

  return (
    <div className="w-full h-full relative">
      {/* Chart container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full"
      />
      
      {/* Overlay for dots - sits on top of chart canvas */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {/* Custom dots for transactions */}
        {dotPositions.map((dot) => {
          const isActive = activeDate === dot.transaction.date
          const isBuy = dot.transaction.type === 'buy'
          
          return (
            <div
              key={dot.transaction.date}
              className={`
                absolute rounded-full pointer-events-auto cursor-pointer
                transition-all duration-150 ease-out
                ${isBuy ? 'bg-green-500' : 'bg-red-500'}
                ${isActive ? 'ring-4 ring-white shadow-lg' : 'ring-2 ring-white shadow-md'}
              `}
              style={{
                left: dot.x,
                top: dot.y,
                width: isActive ? 14 : 10,
                height: isActive ? 14 : 10,
                transform: `translate(-50%, -50%) ${isActive ? 'scale(1.3)' : 'scale(1)'}`,
              }}
              onMouseEnter={() => {
                setHoveredDate(dot.transaction.date)
                setTooltip({
                  x: dot.x,
                  y: 0,
                  transaction: dot.transaction,
                })
              }}
              onMouseLeave={() => {
                setHoveredDate(null)
                setTooltip(null)
              }}
            />
          )
        })}

        {/* Tooltip on dot hover - positioned at top of chart */}
        {tooltip && (() => {
          const chartPrice = priceData?.prices.find(p => p.date === tooltip.transaction.date)?.close
          return (
            <div
              className="absolute pointer-events-none top-2"
              style={{
                left: Math.max(70, Math.min(tooltip.x, (chartContainerRef.current?.clientWidth || 300) - 70)),
                transform: 'translateX(-50%)',
                zIndex: 100,
              }}
            >
              <div className={`
                px-3 py-2 rounded-lg shadow-xl text-xs font-medium text-white border
                ${tooltip.transaction.type === 'buy' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'}
              `}>
                <div className="font-semibold">{tooltip.transaction.date}</div>
                <div>{tooltip.transaction.type === 'buy' ? 'Buy' : 'Sell'}: €{tooltip.transaction.totalValue.toFixed(2)}</div>
                <div className="text-white/80">Price: €{chartPrice?.toFixed(2) ?? 'N/A'}</div>
              </div>
            </div>
          )
        })()}

        {/* Tooltip for highlighted transaction from table */}
        {showHighlightTooltip && (() => {
          const chartPrice = priceData?.prices.find(p => p.date === highlightedTransaction.date)?.close
          return (
            <div className="absolute top-2 right-2" style={{ zIndex: 100 }}>
              <div className={`
                px-3 py-2 rounded-lg shadow-xl text-sm font-medium text-white border
                ${highlightedTransaction.type === 'buy' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'}
              `}>
                <div className="font-semibold">{highlightedTransaction.date}</div>
                <div>{highlightedTransaction.type === 'buy' ? 'Buy' : 'Sell'}: €{highlightedTransaction.totalValue.toFixed(2)}</div>
                <div className="text-white/80">Price: €{chartPrice?.toFixed(2) ?? 'N/A'}</div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
