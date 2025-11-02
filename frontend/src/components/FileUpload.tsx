import { useState, useCallback, useEffect, useRef } from 'react'
import { Upload, FileText, Loader, AlertCircle, Clock } from 'lucide-react'
import { analyzeDocument } from '../services/api'
import type { AnalysisResult } from '../pages/Analysis'

interface FileUploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void
  setLoading: (loading: boolean) => void
  loading: boolean
}

function FileUpload({ onAnalysisComplete, setLoading, loading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, or TXT file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setLoading(true)
    setElapsedTime(0)
    
    // Estimate time based on file size (rough estimate: 1MB = 10 seconds)
    const estimatedSeconds = Math.max(15, Math.min(120, Math.ceil(file.size / (1024 * 1024) * 10)))
    setEstimatedTime(estimatedSeconds)

    try {
      const result = await analyzeDocument(file)
      onAnalysisComplete(result)
    } catch (err: any) {
      console.error('Analysis error:', err)
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in to analyze documents.')
      } else if (err.response?.status === 413) {
        setError('File too large. Please upload a file smaller than 10MB.')
      } else {
        setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
      }
      setLoading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  // Function to open file explorer
  const openFileExplorer = () => {
    console.log('Opening file explorer...')
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Timer effect for elapsed time during analysis
  useEffect(() => {
    let interval: number
    if (loading) {
      interval = window.setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loading])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <form onDragEnter={handleDrag}>
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition cursor-pointer ${
            dragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileExplorer}
        >
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-gray-700 font-semibold">Analyzing document...</p>
              <div className="flex items-center mt-3 text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>Elapsed: {formatTime(elapsedTime)}</span>
                <span className="mx-2">•</span>
                <span>Estimated: ~{formatTime(estimatedTime)}</span>
              </div>
              <div className="w-64 bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` }}
                ></div>
              </div>
              <p className="text-gray-500 text-xs mt-2">Processing legal clauses and risk analysis...</p>
            </div>
          ) : (
            <>
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Drop your file here or click anywhere to browse
              </p>
              <p className="text-gray-500 mb-6">
                Supported formats: PDF, DOCX, TXT (Max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleChange}
                disabled={loading}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileExplorer();
                }}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="h-5 w-5 mr-2" />
                Select File
              </button>
            </>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}

export default FileUpload
