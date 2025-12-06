import { useEffect, useRef } from 'react'
import { createChart, createSeriesMarkers, IChartApi, ISeriesApi, Time, LineSeries, ISeriesMarkersPluginApi } from 'lightweight-charts'
import type { PriceData, Transaction } from '../types'

interface PriceChartProps {
  priceData: PriceData
  transactions: Transaction[]
}

export function PriceChart({ priceData, transactions }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)

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
      if (markersRef.current) {
        markersRef.current.detach()
      }
      chart.remove()
    }
  }, [])

  // Update data when priceData or transactions change
  useEffect(() => {
    if (!seriesRef.current || !priceData) return

    // Convert price data to chart format
    const lineData = priceData.prices.map((p) => ({
      time: p.date as Time,
      value: p.close,
    }))

    seriesRef.current.setData(lineData)

    // Create markers for transactions (v5 API uses createSeriesMarkers)
    const markerData = transactions
      .filter(tx => {
        // Only show markers for dates within price data range
        const txDate = tx.date
        return priceData.prices.some(p => p.date === txDate)
      })
      .map(tx => ({
        time: tx.date as Time,
        position: tx.type === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
        color: tx.type === 'buy' ? '#22c55e' : '#ef4444',
        shape: tx.type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
        text: tx.type === 'buy' ? 'B' : 'S',
      }))

    // Remove existing markers plugin if any
    if (markersRef.current) {
      markersRef.current.detach()
    }

    // Create new markers plugin (v5 API)
    if (markerData.length > 0) {
      markersRef.current = createSeriesMarkers(seriesRef.current, markerData)
    }

    // Fit content to view
    chartRef.current?.timeScale().fitContent()
  }, [priceData, transactions])

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-full"
    />
  )
}
