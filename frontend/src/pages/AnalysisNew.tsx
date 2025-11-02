import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Type, FileText, AlertTriangle, Download, Save, X, Printer, Clock } from 'lucide-react';
import { analyzeDocument, analyzeText, getDocument, updateDocument } from '../services/api';

interface Risk {
  id?: string;
  clause: string;
  risk_type: string;
  severity: string;
  explanation: string;
  original_text?: string;
  suggested_rewrite?: string;
  start_position?: number;
  end_position?: number;
}

const AnalysisNew = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'summary' | 'ask' | 'risks'>('summary');
  const [mode, setMode] = useState<'upload' | 'text'>('upload');
  const [documentText, setDocumentText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [summary, setSummary] = useState('');
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<number | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [error, setError] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const docId = searchParams.get('doc');
    if (docId) {
      loadDocument(parseInt(docId));
    }
  }, [searchParams]);

  const loadDocument = async (docId: number) => {
    setIsLoading(true);
    try {
      const data = await getDocument(docId);
      setDocumentText(data.original_text);
      setEditedText(data.edited_text || data.original_text);
      setSummary(data.summary || '');
      setRisks(data.risks || []);
      setHasAnalysis(true);
      setCurrentDocId(docId);
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setIsLoading(true);
    setError('');
    setElapsedTime(0);
    
    // Estimate time based on file size
    const estimatedSeconds = Math.max(15, Math.min(120, Math.ceil(file.size / (1024 * 1024) * 10)));
    setEstimatedTime(estimatedSeconds);
    
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      const result = await analyzeDocument(file);
      console.log('Analysis result:', result);
      
      // Handle the correct API response structure
      setDocumentText(result.original_text || '');
      setEditedText(result.original_text || '');
      setSummary(result.summary || '');
      setRisks(result.risks || []);
      setHasAnalysis(true);
      setCurrentDocId(result.analysis_id);
      setTab('summary');
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in to analyze documents.');
      } else if (err.response?.status === 413) {
        setError('File too large. Please upload a file smaller than 10MB.');
      } else if (err.response?.status === 422) {
        setError('Invalid file format. Please upload a PDF, DOCX, or TXT file.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to analyze document. Please try again.');
      }
    } finally {
      setIsLoading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleTextAnalyze = async () => {
    if (!documentText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsLoading(true);
    setError('');
    setElapsedTime(0);
    
    // Estimate time based on text length
    const estimatedSeconds = Math.max(10, Math.min(90, Math.ceil(documentText.length / 1000 * 5)));
    setEstimatedTime(estimatedSeconds);
    
    try {
      const result = await analyzeText(documentText);
      setEditedText(documentText);
      setSummary(result.summary || '');
      setRisks(result.risks || []);
      setHasAnalysis(true);
      setCurrentDocId(result.analysis_id);
      setTab('summary');
    } catch (err: any) {
      console.error('Text analysis error:', err);
      setError(err.response?.data?.detail || 'Failed to analyze text');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentDocId) return;
    
    try {
      await updateDocument(currentDocId, editedText);
      alert('Document saved successfully!');
    } catch (err) {
      alert('Failed to save document');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited-document.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Legal Document</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>Legal Document Analysis</h1>
            <div class="content">${editedText}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Timer effect for elapsed time during analysis
  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Function to scroll to specific text in the document
  const scrollToText = (searchText: string) => {
    const textarea = (window as any).documentTextarea;
    if (textarea && searchText) {
      const text = textarea.value;
      const index = text.indexOf(searchText);
      if (index !== -1) {
        textarea.focus();
        textarea.setSelectionRange(index, index + searchText.length);
        textarea.scrollTop = (index / text.length) * textarea.scrollHeight;
      }
    }
  };

  // Function to replace text with selected suggestion
  const replaceTextWithSuggestion = (originalText: string, suggestion: string) => {
    const newText = editedText.replace(originalText, suggestion);
    setEditedText(newText);
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    successMsg.textContent = 'Text replaced successfully!';
    document.body.appendChild(successMsg);
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 3000);
  };

  if (!hasAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-white mb-4">Analyze Your Document</h1>
            <p className="text-dark-400">Upload a document or paste text to detect risky clauses</p>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setMode('upload')}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
                mode === 'upload'
                  ? 'bg-gradient-primary text-white shadow-neon'
                  : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50'
              }`}
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
                mode === 'text'
                  ? 'bg-gradient-primary text-white shadow-neon'
                  : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50'
              }`}
            >
              <Type className="w-5 h-5 mr-2" />
              Paste Text
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <div className="bg-dark-800/50 backdrop-blur-lg rounded-2xl shadow-premium p-8 border border-dark-700">
            {mode === 'upload' ? (
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  disabled={isLoading}
                  id="file-upload-input"
                />
                <div
                  onClick={() => {
                    console.log('Upload area clicked');
                    const input = document.getElementById('file-upload-input') as HTMLInputElement;
                    if (input) {
                      console.log('Triggering file input click');
                      input.click();
                    } else {
                      console.error('File input not found');
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files[0]) {
                      // Create a proper file input event
                      const input = fileInputRef.current;
                      if (input) {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(files[0]);
                        input.files = dataTransfer.files;
                        
                        const event = new Event('change', { bubbles: true });
                        input.dispatchEvent(event);
                      }
                    }
                  }}
                  className="w-full py-16 border-2 border-dashed border-dark-600 rounded-xl hover:border-primary-500 transition-colors cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4"></div>
                      <p className="text-lg font-semibold text-white mb-2">Analyzing document...</p>
                      <div className="flex items-center text-sm text-dark-400 mb-3">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Elapsed: {formatTime(elapsedTime)}</span>
                        <span className="mx-2">•</span>
                        <span>Estimated: ~{formatTime(estimatedTime)}</span>
                      </div>
                      <div className="w-64 bg-dark-700 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-dark-500 text-xs mt-2">Processing legal clauses and risk analysis...</p>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-16 h-16 text-dark-600 group-hover:text-primary-500 mx-auto mb-4 transition-colors" />
                      <p className="text-lg font-semibold text-white mb-2">Click to upload document</p>
                      <p className="text-dark-400">Supports PDF, DOCX, and TXT files</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder="Paste your legal document text here..."
                  className="w-full h-64 px-4 py-3 bg-dark-900/50 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  disabled={isLoading}
                />
                {isLoading && (
                  <div className="mt-4 p-4 bg-primary-600/10 border border-primary-600/30 rounded-lg">
                    <div className="flex items-center justify-center mb-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mr-3"></div>
                      <span className="text-white font-semibold">Analyzing text...</span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-dark-400 mb-3">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Elapsed: {formatTime(elapsedTime)}</span>
                      <span className="mx-2">•</span>
                      <span>Estimated: ~{formatTime(estimatedTime)}</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (elapsedTime / estimatedTime) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-dark-500 text-xs mt-2">Processing legal clauses and risk analysis...</p>
                  </div>
                )}
                <button
                  onClick={handleTextAnalyze}
                  disabled={isLoading || !documentText.trim()}
                  className="mt-4 w-full py-3 bg-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Text'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Document Editor */}
          <div className="w-1/2 border-r border-dark-700 flex flex-col">
            <div className="bg-dark-800/50 border-b border-dark-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-white">Document</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-accent-emerald/20 text-accent-emerald rounded-lg hover:bg-accent-emerald/30 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-primary-600/20 text-primary-400 rounded-lg hover:bg-primary-600/30 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => {
                    setHasAnalysis(false);
                    setDocumentText('');
                    setEditedText('');
                    setSummary('');
                    setRisks([]);
                    setCurrentDocId(null);
                  }}
                  className="px-4 py-2 bg-dark-700/50 text-dark-400 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {/* Single Editable Document with Highlighting */}
              <div className="h-full">
                <h4 className="text-sm font-semibold text-dark-300 mb-2">Document Editor</h4>
                <textarea
                  ref={(el) => {
                    if (el) {
                      // Store reference for scrolling to specific text
                      (window as any).documentTextarea = el;
                    }
                  }}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full h-full bg-dark-900/30 border border-dark-700 rounded-lg p-4 text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono text-sm leading-relaxed"
                  placeholder="Your document will appear here for editing..."
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Tabs */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-dark-800/50 border-b border-dark-700 px-6 py-2 flex items-center gap-1">
              <button
                onClick={() => setTab('summary')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  tab === 'summary'
                    ? 'bg-primary-600/20 text-primary-400 border-b-2 border-primary-500'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setTab('ask')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  tab === 'ask'
                    ? 'bg-primary-600/20 text-primary-400 border-b-2 border-primary-500'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Ask
              </button>
              <button
                onClick={() => setTab('risks')}
                className={`px-6 py-3 rounded-lg font-medium transition-all relative ${
                  tab === 'risks'
                    ? 'bg-primary-600/20 text-primary-400 border-b-2 border-primary-500'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Risky Clauses
                {risks.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {risks.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {tab === 'summary' && (
                <div className="animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-4">Document Summary</h3>
                  <div className="bg-dark-900/30 border border-dark-700 rounded-lg p-6">
                    <p className="text-dark-200 leading-relaxed whitespace-pre-wrap">
                      {summary || 'No summary available'}
                    </p>
                  </div>
                </div>
              )}

              {tab === 'ask' && (
                <div className="animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-4">Ask Questions</h3>
                  <div className="bg-dark-900/30 border border-dark-700 rounded-lg p-6 text-center">
                    <p className="text-dark-400">AI question answering coming soon...</p>
                  </div>
                </div>
              )}

              {tab === 'risks' && (
                <div className="animate-fade-in space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Risky Clauses Detected</h3>
                    <span className="text-dark-400">{risks.length} risks found</span>
                  </div>
                  
                  {risks.length === 0 ? (
                    <div className="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-6 text-center">
                      <p className="text-accent-emerald">No significant risks detected in this document</p>
                    </div>
                  ) : (
                    risks.map((risk, index) => (
                      <div
                        key={risk.id || index}
                        className={`bg-dark-900/30 border rounded-lg overflow-hidden transition-all cursor-pointer ${
                          selectedRisk?.clause === risk.clause 
                            ? 'border-red-400 shadow-lg' 
                            : 'border-dark-700 hover:border-primary-500'
                        }`}
                        onClick={() => {
                          const newSelectedRisk = selectedRisk?.clause === risk.clause ? null : risk;
                          setSelectedRisk(newSelectedRisk);
                          if (newSelectedRisk) {
                            scrollToText(risk.clause);
                          }
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className={`w-5 h-5 ${
                                risk.severity === 'high' ? 'text-red-400' :
                                risk.severity === 'medium' ? 'text-yellow-400' :
                                'text-blue-400'
                              }`} />
                              <h4 className="font-semibold text-white">{risk.risk_type}</h4>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs border ${getSeverityColor(risk.severity)}`}>
                              {risk.severity}
                            </span>
                          </div>
                          <p className="text-dark-300 text-sm mb-3">{risk.explanation}</p>
                          <div className="bg-dark-950/50 rounded p-3 mb-3">
                            <p className="text-dark-200 text-sm italic">"{risk.clause.substring(0, 150)}..."</p>
                          </div>
                          
                          {selectedRisk?.clause === risk.clause && (
                            <div className="mt-4 pt-4 border-t border-dark-700 animate-slide-down">
                              <h5 className="text-sm font-semibold text-accent-neon mb-3">AI-Suggested Alternatives:</h5>
                              
                              {/* Generate multiple suggestions */}
                              {(() => {
                                const baseRewrite = risk.suggested_rewrite || "Consider revising this clause to be more balanced and fair to both parties.";
                                const suggestions = [
                                  baseRewrite,
                                  `Alternative: ${baseRewrite.replace(/\b(shall|must|will)\b/gi, 'may').replace(/\b(required|mandatory)\b/gi, 'recommended')}`,
                                  `Balanced: Both parties agree that ${baseRewrite.toLowerCase()}`
                                ];
                                
                                return suggestions.map((suggestion, idx) => (
                                  <div key={idx} className="mb-3 bg-accent-emerald/10 border border-accent-emerald/30 rounded p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="text-dark-200 text-sm mb-2">{suggestion}</p>
                                        {idx === 0 && !risk.suggested_rewrite && (
                                          <p className="text-yellow-400 text-xs">⚠️ AI suggestion not available - using fallback</p>
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          replaceTextWithSuggestion(risk.clause, suggestion);
                                        }}
                                        className="ml-3 px-3 py-1 bg-accent-emerald/20 text-accent-emerald text-xs rounded hover:bg-accent-emerald/30 transition-colors flex items-center gap-1"
                                      >
                                        <span>Replace</span>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisNew;
