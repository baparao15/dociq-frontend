import { useState, useEffect } from 'react'
import { Send, Loader, AlertCircle, Clock } from 'lucide-react'
import { analyzeText } from '../services/api'
import type { AnalysisResult } from '../pages/Analysis'

interface TextInputProps {
  onAnalysisComplete: (result: AnalysisResult) => void
  setLoading: (loading: boolean) => void
  loading: boolean
}

function TextInput({ onAnalysisComplete, setLoading, loading }: TextInputProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim() || text.trim().length < 10) {
      setError('Please enter at least 10 characters of text to analyze')
      return
    }

    setError(null)
    setLoading(true)
    setElapsedTime(0)
    
    // Estimate time based on text length (rough estimate: 1000 chars = 5 seconds)
    const estimatedSeconds = Math.max(10, Math.min(90, Math.ceil(text.length / 1000 * 5)))
    setEstimatedTime(estimatedSeconds)

    try {
      const result = await analyzeText(text)
      onAnalysisComplete(result)
    } catch (err: any) {
      console.error('Analysis error:', err)
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in to analyze text.')
      } else {
        setError(err.response?.data?.detail || 'Analysis failed. Please try again.')
      }
      setLoading(false)
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
      {loading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center mb-3">
            <Loader className="h-6 w-6 text-primary animate-spin mr-3" />
            <span className="text-gray-700 font-semibold">Analyzing text...</span>
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600 mb-3">
            <Clock className="h-4 w-4 mr-2" />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            <span className="mx-2">•</span>
            <span>Estimated: ~{formatTime(estimatedTime)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` }}
            ></div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-2">Processing legal clauses and risk analysis...</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label htmlFor="text-input" className="block text-lg font-semibold text-gray-700 mb-3">
          Paste Your Legal Document Text
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-gray-100"
          placeholder="Paste the text of your legal document here..."
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {text.length} characters
          </p>
          <button
            type="submit"
            disabled={loading || text.trim().length < 10}
            className="flex items-center px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Analyze Text
              </>
            )}
          </button>
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

export default TextInput
