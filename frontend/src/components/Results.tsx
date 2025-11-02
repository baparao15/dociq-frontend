import { useState } from 'react'
import { AlertTriangle, CheckCircle, FileText, RotateCcw, ArrowRight, Eye, EyeOff } from 'lucide-react'
import type { AnalysisResult, Risk } from '../pages/Analysis'

interface ResultsProps {
  result: AnalysisResult
  onNewAnalysis: () => void
}

interface HighlightedText {
  text: string
  isRisky: boolean
  riskIndex?: number
}

function Results({ result, onNewAnalysis }: ResultsProps) {
  const [selectedRiskIndex, setSelectedRiskIndex] = useState<number | null>(null)
  const [showOriginalText, setShowOriginalText] = useState(true)
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  // Function to highlight risky clauses in the original text
  const highlightText = (text: string, risks: Risk[]): HighlightedText[] => {
    if (!text || risks.length === 0) {
      return [{ text, isRisky: false }]
    }

    const segments: HighlightedText[] = []
    let lastIndex = 0

    // Sort risks by their position in the text
    const sortedRisks = risks
      .map((risk, index) => ({ ...risk, originalIndex: index }))
      .filter(risk => text.includes(risk.clause))
      .sort((a, b) => text.indexOf(a.clause) - text.indexOf(b.clause))

    sortedRisks.forEach((risk) => {
      const startIndex = text.indexOf(risk.clause, lastIndex)
      if (startIndex === -1) return

      // Add non-risky text before this risk
      if (startIndex > lastIndex) {
        segments.push({
          text: text.substring(lastIndex, startIndex),
          isRisky: false
        })
      }

      // Add the risky clause
      segments.push({
        text: risk.clause,
        isRisky: true,
        riskIndex: risk.originalIndex
      })

      lastIndex = startIndex + risk.clause.length
    })

    // Add remaining non-risky text
    if (lastIndex < text.length) {
      segments.push({
        text: text.substring(lastIndex),
        isRisky: false
      })
    }

    return segments
  }

  const handleRiskClick = (riskIndex: number) => {
    setSelectedRiskIndex(selectedRiskIndex === riskIndex ? null : riskIndex)
  }

  const handleHighlightClick = (riskIndex: number) => {
    setSelectedRiskIndex(riskIndex)
    // Scroll to the corresponding risk in the right panel
    const riskElement = document.getElementById(`risk-${riskIndex}`)
    if (riskElement) {
      riskElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
          <button
            onClick={onNewAnalysis}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            New Analysis
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start">
            <FileText className="h-6 w-6 text-primary mr-3 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">{result.document_name}</h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Document Length:</span>
                  <span className="ml-2 font-semibold">{result.text_length.toLocaleString()} characters</span>
                </div>
                <div>
                  <span className="text-gray-600">Risks Found:</span>
                  <span className={`ml-2 font-semibold ${result.risks_found > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {result.risks_found}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Analysis ID:</span>
                  <span className="ml-2 font-mono text-xs">#{result.analysis_id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {result.risks_found === 0 ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Great News!</h3>
            <p className="text-gray-700">
              No risky clauses were detected in this document. However, this doesn't replace professional legal advice.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Viewer - Left Panel */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Document Text</h3>
                <button
                  onClick={() => setShowOriginalText(!showOriginalText)}
                  className="flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  {showOriginalText ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showOriginalText ? 'Hide Text' : 'Show Text'}
                </button>
              </div>
              {showOriginalText && (
                <div className="p-6 max-h-96 overflow-y-auto bg-gray-50">
                  <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-mono">
                    {highlightText(result.original_text || '', result.risks).map((segment, index) => (
                      <span
                        key={index}
                        className={`${
                          segment.isRisky
                            ? `cursor-pointer transition-all duration-200 ${
                                selectedRiskIndex === segment.riskIndex
                                  ? 'bg-red-200 border-2 border-red-400 rounded px-1'
                                  : 'bg-yellow-200 hover:bg-yellow-300 rounded px-1'
                              }`
                            : ''
                        }`}
                        onClick={() => segment.isRisky && segment.riskIndex !== undefined && handleHighlightClick(segment.riskIndex)}
                        title={segment.isRisky ? 'Click to view risk details' : undefined}
                      >
                        {segment.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk Analysis - Right Panel */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detected Risks ({result.risks_found})
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-4 p-6">
                  {result.risks.map((risk: Risk, index: number) => (
                    <div 
                      key={index} 
                      id={`risk-${index}`}
                      className={`border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                        selectedRiskIndex === index
                          ? 'border-red-400 shadow-md bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleRiskClick(index)}
                    >
                      <div className={`px-4 py-3 border-l-4 ${getSeverityColor(risk.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start flex-1">
                            <div className="mr-3 mt-1">
                              {getSeverityIcon(risk.severity)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-md font-semibold mb-1">{risk.risk_type}</h4>
                              <p className="text-sm text-gray-600 mb-2">{risk.explanation}</p>
                              <div className="bg-white bg-opacity-70 rounded p-2 text-xs">
                                <span className="font-semibold">Clause: </span>
                                <span className="italic">"{risk.clause.substring(0, 100)}{risk.clause.length > 100 ? '...' : ''}"</span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ml-2 ${getSeverityColor(risk.severity)}`}>
                            {risk.severity}
                          </span>
                        </div>
                      </div>
                      
                      {selectedRiskIndex === index && risk.suggested_rewrite && (
                        <div className="px-4 py-3 bg-gray-50 border-t">
                          <div className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 mb-2 flex items-center text-sm">
                                AI-Suggested Safer Alternative
                                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                  AI Generated
                                </span>
                              </h5>
                              <p className="text-gray-700 bg-white p-2 rounded border border-gray-200 text-sm">
                                {risk.suggested_rewrite}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-gray-700">
          <strong>Disclaimer:</strong> This analysis is for informational purposes only and does not constitute
          legal advice. Always consult with a qualified attorney before making important legal decisions.
        </p>
      </div>
    </div>
  )
}

export default Results
