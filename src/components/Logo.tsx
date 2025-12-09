interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { width: 32, height: 16, textSize: 'text-sm' },
  md: { width: 120, height: 60, textSize: 'text-xl' },
  lg: { width: 200, height: 100, textSize: 'text-2xl' },
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { width, height } = sizes[size]
  
  // Scale factor based on original viewBox (320x160 for full, 100x60 for icon)
  const iconScale = width / 100
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 100 60" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glasses */}
        <circle cx="35" cy="35" r="12" stroke="currentColor" strokeWidth="3" fill="none"/>
        <circle cx="65" cy="35" r="12" stroke="currentColor" strokeWidth="3" fill="none"/>
        <line x1="47" y1="35" x2="53" y2="35" stroke="currentColor" strokeWidth="3"/>
        
        {/* Trendline: up-down-up-down-up (centered over glasses) */}
        <polyline 
          points="31,18 39,12 46,15 53,9 60,12 68,6" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {showText && (
        <span className={`font-semibold text-gray-900 mt-2 ${sizes[size].textSize}`}>
          Trade Plotter
        </span>
      )}
    </div>
  )
}

// Icon-only version for header/navbar
export function LogoIcon({ className = '' }: { className?: string }) {
  return (
    <svg 
      width="28" 
      height="20" 
      viewBox="0 0 100 60" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Glasses */}
      <circle cx="35" cy="35" r="12" stroke="currentColor" strokeWidth="4" fill="none"/>
      <circle cx="65" cy="35" r="12" stroke="currentColor" strokeWidth="4" fill="none"/>
      <line x1="47" y1="35" x2="53" y2="35" stroke="currentColor" strokeWidth="4"/>
      
      {/* Trendline */}
      <polyline 
        points="31,18 39,12 46,15 53,9 60,12 68,6" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
