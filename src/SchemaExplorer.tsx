import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Play, Copy, Check, X, RefreshCw, AlertCircle, FileText, Loader } from 'lucide-react';
import { supabase } from './lib/supabase';

interface SchemaQuery {
  id: string;
  name: string;
  description: string;
  sql_query: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QueryResult {
  queryId: string;
  queryName: string;
  data: any[] | null;
  error: string | null;
  executionTime: number;
}

interface SchemaExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ isOpen, onClose }) => {
  const [queries, setQueries] = useState<SchemaQuery[]>([]);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [selectedQueryIds, setSelectedQueryIds] = useState<Set<string>>(new Set());
  const [previewQuery, setPreviewQuery] = useState<SchemaQuery | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [runningQueryId, setRunningQueryId] = useState<string | null>(null);

  // Load schema queries from database
  const loadQueries = useCallback(async () => {
    setLoadingQueries(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('schema_queries')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setQueries(data || []);
      // Select all queries by default
      setSelectedQueryIds(new Set((data || []).map(q => q.id)));
    } catch (err) {
      console.error('Error loading schema queries:', err);
      setError('Failed to load schema queries');
    } finally {
      setLoadingQueries(false);
    }
  }, []);

  // Load queries when component opens
  useEffect(() => {
    if (isOpen) {
      loadQueries();
    }
  }, [isOpen, loadQueries]);

  // Toggle query selection
  const toggleQuerySelection = (queryId: string) => {
    setSelectedQueryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(queryId)) {
        newSet.delete(queryId);
      } else {
        newSet.add(queryId);
      }
      return newSet;
    });
  };

  // Select/deselect all queries
  const toggleSelectAll = () => {
    if (selectedQueryIds.size === queries.length) {
      setSelectedQueryIds(new Set());
    } else {
      setSelectedQueryIds(new Set(queries.map(q => q.id)));
    }
  };

  // Execute a single query
  const executeQuery = async (query: SchemaQuery): Promise<QueryResult> => {
    const startTime = Date.now();
    
    try {
      const { data, error: queryError } = await supabase.rpc('execute_sql', {
        query: query.sql_query
      });

      const executionTime = Date.now() - startTime;

      if (queryError) {
        return {
          queryId: query.id,
          queryName: query.name,
          data: null,
          error: queryError.message,
          executionTime
        };
      }

      return {
        queryId: query.id,
        queryName: query.name,
        data: data || [],
        error: null,
        executionTime
      };
    } catch (err) {
      const executionTime = Date.now() - startTime;
      return {
        queryId: query.id,
        queryName: query.name,
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        executionTime
      };
    }
  };

  // Run selected queries sequentially
  const runSelectedQueries = async () => {
    const selectedQueries = queries.filter(q => selectedQueryIds.has(q.id));
    
    if (selectedQueries.length === 0) {
      setError('No queries selected to run');
      return;
    }

    setLoading(true);
    setResults([]);
    setError(null);

    const newResults: QueryResult[] = [];

    for (const query of selectedQueries) {
      setRunningQueryId(query.id);
      
      try {
        const result = await executeQuery(query);
        newResults.push(result);
        setResults([...newResults]); // Update results incrementally
      } catch (err) {
        console.error(`Error executing query ${query.name}:`, err);
        newResults.push({
          queryId: query.id,
          queryName: query.name,
          data: null,
          error: err instanceof Error ? err.message : 'Unknown error',
          executionTime: 0
        });
        setResults([...newResults]);
      }
    }

    setRunningQueryId(null);
    setLoading(false);
  };

  // Copy all results to clipboard
  const copyAllResults = async () => {
    if (results.length === 0) return;

    const content = results.map(result => {
      const separator = '='.repeat(80);
      let output = `${separator}\nQUERY: ${result.queryName}\nExecution Time: ${result.executionTime}ms\n${separator}\n\n`;
      
      if (result.error) {
        output += `ERROR: ${result.error}\n`;
      } else if (result.data) {
        output += JSON.stringify(result.data, null, 2);
      } else {
        output += 'No data returned';
      }
      
      output += `\n\n${separator}\nEND OF QUERY: ${result.queryName}\n${separator}`;
      return output;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Control Panel */}
        <div className="w-80 border-r border-gray-700 flex flex-col bg-gray-800">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-200">Schema Explorer</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              Execute database schema queries to analyze table structure, relationships, and policies.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={runSelectedQueries}
                disabled={loading || loadingQueries || selectedQueryIds.size === 0}
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {loading ? 'Running...' : `Run Selected (${selectedQueryIds.size})`}
              </button>
              
              <button
                onClick={copyAllResults}
                disabled={results.length === 0}
                className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy All Results'}
              </button>
              
              <button
                onClick={loadQueries}
                disabled={loadingQueries}
                className="w-full flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingQueries ? 'animate-spin' : ''}`} />
                Refresh Queries
              </button>
            </div>
          </div>

          {/* Query List */}
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Available Queries ({queries.length})</h3>
              <button
                onClick={toggleSelectAll}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {selectedQueryIds.size === queries.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {loadingQueries && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <Loader className="w-4 h-4 animate-spin" />
                Loading queries...
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              {queries.map((query) => (
                <div
                  key={query.id}
                  className={`p-3 rounded-lg border transition-all ${
                    runningQueryId === query.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : selectedQueryIds.has(query.id)
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }`}
                  onClick={() => setPreviewQuery(query)}
                >
                  <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedQueryIds.has(query.id)}
                      onChange={() => toggleQuerySelection(query.id)}
                      className="w-3 h-3 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                    />
                    {runningQueryId === query.id && (
                      <Loader className="w-3 h-3 animate-spin text-blue-400" />
                    )}
                    <h4 className="text-sm font-medium text-gray-200">{query.name}</h4>
                  </div>
                  <p className="text-xs text-gray-400">{query.description}</p>
                </div>
              ))}
            </div>
            
            {!loadingQueries && queries.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No queries configured</p>
                <p className="text-gray-600 text-xs mt-1">Add queries to the schema_queries table</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-200">
                {previewQuery ? 'Query Preview' : 'Query Results'}
              </h3>
              <div className="text-sm text-gray-400">
                {previewQuery ? (
                  <button
                    onClick={() => setPreviewQuery(null)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Back to Results
                  </button>
                ) : (
                  results.length > 0 && `${results.length} queries executed`
                )}
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="flex-1 overflow-auto">
            {previewQuery ? (
              <div className="p-4">
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700 bg-gray-750">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-200">{previewQuery.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {selectedQueryIds.has(previewQuery.id) ? 'Selected' : 'Not Selected'}
                        </span>
                        <input
                          type="checkbox"
                          checked={selectedQueryIds.has(previewQuery.id)}
                          onChange={() => toggleQuerySelection(previewQuery.id)}
                          className="w-3 h-3 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{previewQuery.description}</p>
                  </div>
                  <div className="p-4">
                    <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap overflow-auto bg-gray-900 p-3 rounded border border-gray-600">
                      {previewQuery.sql_query}
                    </pre>
                  </div>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Database className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-400">No Results Yet</h3>
                  <p className="text-sm">Select queries and click "Run Selected" to execute schema analysis</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {results.map((result, index) => (
                  <motion.div
                    key={result.queryId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                  >
                    {/* Result Header */}
                    <div className="px-4 py-3 border-b border-gray-700 bg-gray-750">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-200">{result.queryName}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span>{result.executionTime}ms</span>
                          {result.error ? (
                            <span className="text-red-400">Error</span>
                          ) : (
                            <span className="text-green-400">Success</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Result Content */}
                    <div className="p-4">
                      {result.error ? (
                        <div className="text-red-400 text-sm font-mono bg-red-900/20 p-3 rounded border border-red-800">
                          {result.error}
                        </div>
                      ) : (
                        <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap overflow-auto max-h-96 bg-gray-900 p-3 rounded border border-gray-600">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};