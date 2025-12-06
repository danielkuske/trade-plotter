import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriceChart } from './PriceChart'
import type { PriceData, Transaction } from '../types'

// Mock canvas for lightweight-charts
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: [] })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext

describe('PriceChart', () => {
  const mockPriceData: PriceData = {
    ticker: 'AAPL',
    currency: 'USD',
    prices: [
      { date: '2024-01-01', open: 100, high: 105, low: 98, close: 102, volume: 1000 },
      { date: '2024-01-02', open: 102, high: 108, low: 101, close: 107, volume: 1200 },
      { date: '2024-01-03', open: 107, high: 110, low: 105, close: 108, volume: 900 },
      { date: '2024-01-04', open: 108, high: 112, low: 106, close: 110, volume: 1100 },
      { date: '2024-01-05', open: 110, high: 115, low: 109, close: 114, volume: 1300 },
    ],
  }

  const mockTransactions: Transaction[] = [
    { date: '2024-01-02', type: 'buy', quantity: 10, totalValue: 1070, pricePerUnit: 107 },
    { date: '2024-01-04', type: 'sell', quantity: 5, totalValue: 550, pricePerUnit: 110 },
  ]

  it('renders without crashing', () => {
    const { container } = render(
      <PriceChart priceData={mockPriceData} transactions={mockTransactions} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('creates chart container element', () => {
    const { container } = render(
      <PriceChart priceData={mockPriceData} transactions={mockTransactions} />
    )
    
    // The component should render a div container
    const chartContainer = container.querySelector('div')
    expect(chartContainer).toBeInTheDocument()
    expect(chartContainer).toHaveClass('w-full', 'h-full')
  })

  it('handles empty transactions', () => {
    const { container } = render(
      <PriceChart priceData={mockPriceData} transactions={[]} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it('handles transactions outside price range', () => {
    const outOfRangeTransactions: Transaction[] = [
      { date: '2023-12-01', type: 'buy', quantity: 10, totalValue: 1000, pricePerUnit: 100 },
    ]
    
    const { container } = render(
      <PriceChart priceData={mockPriceData} transactions={outOfRangeTransactions} />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })
})

