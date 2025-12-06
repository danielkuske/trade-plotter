import { useState } from 'react'
import { FileUpload } from './components/FileUpload'

type AppState = 'upload' | 'loading' | 'complete'

function App() {
  const [state, setState] = useState<AppState>('upload')
  const [fileName, setFileName] = useState<string>('')

  const handleFileSelected = (file: File) => {
    setFileName(file.name)
    setState('loading')
    
    // Simulate parsing delay (replace with actual parsing later)
    setTimeout(() => {
      setState('complete')
    }, 2000)
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

        {/* Complete State */}
        {state === 'complete' && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium mb-1">Parsing complete</p>
            <p className="text-gray-500 text-sm">{fileName}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
