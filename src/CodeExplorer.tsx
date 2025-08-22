import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, Copy, Check, Code, X, Download, Search, RefreshCw as Refresh, AlertCircle, FileText, Settings, Image, Database, Globe, Braces, FileCode, Palette } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
}

interface FlatFile {
  path: string;
  content: string;
}

interface CodeExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Vite's glob import to get all files as raw text
const modules = import.meta.glob([
  '../**/*.{ts,tsx,js,jsx,css,html,json,md,sql,toml,yml,yaml}',
  '../../**/*.{ts,tsx,js,jsx,css,html,json,md,sql,toml,yml,yaml}',
  './**/*.{ts,tsx,js,jsx,css,html,json,md,sql,toml,yml,yaml}'
], { 
  query: '?raw', 
  import: 'default' 
});

// File type to icon mapping with VS Code colors
const getFileIcon = (fileName: string, isFolder: boolean = false) => {
  if (isFolder) return null;
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconProps = { className: "w-4 h-4 flex-shrink-0" };
  
  switch (ext) {
    case 'tsx':
      return <FileCode {...iconProps} style={{ color: '#61dafb' }} />;
    case 'ts':
      return <FileCode {...iconProps} style={{ color: '#3178c6' }} />;
    case 'js':
      return <FileCode {...iconProps} style={{ color: '#f7df1e' }} />;
    case 'jsx':
      return <FileCode {...iconProps} style={{ color: '#61dafb' }} />;
    case 'css':
      return <Palette {...iconProps} style={{ color: '#1572b6' }} />;
    case 'scss':
    case 'sass':
      return <Palette {...iconProps} style={{ color: '#cf649a' }} />;
    case 'html':
      return <Globe {...iconProps} style={{ color: '#e34f26' }} />;
    case 'json':
      return <Braces {...iconProps} style={{ color: '#ffd700' }} />;
    case 'md':
      return <FileText {...iconProps} style={{ color: '#083fa1' }} />;
    case 'sql':
      return <Database {...iconProps} style={{ color: '#336791' }} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <Image {...iconProps} style={{ color: '#ff6b6b' }} />;
    case 'toml':
    case 'yaml':
    case 'yml':
      return <Settings {...iconProps} style={{ color: '#6b7280' }} />;
    default:
      return <File {...iconProps} style={{ color: '#9ca3af' }} />;
  }
};

// Basic syntax highlighting
const applySyntaxHighlighting = (content: string, fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  let highlighted = content;
  
  // Escape HTML first
  highlighted = highlighted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  switch (ext) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      // Keywords
      highlighted = highlighted.replace(
        /\b(import|export|const|let|var|function|class|interface|type|return|if|else|for|while|try|catch|async|await|from|default|as)\b/g,
        '<span style="color: #569cd6;">$1</span>'
      );
      // Strings
      highlighted = highlighted.replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span style="color: #ce9178;">$1$2$1</span>'
      );
      // Comments
      highlighted = highlighted.replace(
        /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
        '<span style="color: #6a9955; font-style: italic;">$1</span>'
      );
      break;
    case 'css':
    case 'scss':
      // Properties
      highlighted = highlighted.replace(
        /([a-zA-Z-]+)(\s*:)/g,
        '<span style="color: #9cdcfe;">$1</span>$2'
      );
      break;
    case 'json':
      // Keys
      highlighted = highlighted.replace(
        /"([^"]+)"(\s*:)/g,
        '<span style="color: #9cdcfe;">"$1"</span>$2'
      );
      break;
  }
  
  return highlighted;
};

export const CodeExplorer: React.FC<CodeExplorerProps> = ({ isOpen, onClose }) => {
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['project']);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedFiles, setCopiedFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Load all files using Vite's glob and build a nested tree
  const loadAllFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Available modules:', Object.keys(modules));
      
      const entries = Object.entries(modules);
      const flatFiles: FlatFile[] = await Promise.all(
        entries.map(async ([key, importer]) => {
          // Better path processing to handle different glob patterns
          let relativePath = key;
          
          // Remove leading patterns and normalize
          if (relativePath.startsWith('../')) {
            relativePath = relativePath.slice(3); // Remove "../"
          } else if (relativePath.startsWith('./')) {
            relativePath = relativePath.slice(2); // Remove "./"
          } else if (relativePath.startsWith('../../')) {
            relativePath = relativePath.slice(6); // Remove "../../"
          }
          
          // Ensure we don't have empty path segments
          relativePath = relativePath.replace(/\/+/g, '/'); // Replace multiple slashes
          relativePath = relativePath.replace(/^\//, ''); // Remove leading slash
          
          console.log('Processing file:', key, '->', relativePath);
          
          const content = await importer() as string;
          return { path: relativePath, content };
        })
      );
      
      console.log('Flat files:', flatFiles.map(f => f.path));
      
      const tree = buildTree(flatFiles);
      setFileTree(tree);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load file system');
    } finally {
      setLoading(false);
    }
  }, []);

  // Build a nested tree from an array of file paths and contents
  const buildTree = (files: FlatFile[]): FileNode => {
    const root: FileNode = { name: 'project', type: 'folder', children: [] };

    files.forEach(file => {
      const parts = file.path.split('/').filter(part => part && part !== '.' && part !== '..'); // Filter out empty and relative parts
      let current = root;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // This is a file
          current.children = current.children || [];
          current.children.push({ 
            name: part, 
            type: 'file', 
            content: file.content 
          });
        } else {
          // This is a folder
          current.children = current.children || [];
          let folder = current.children.find(child => child.name === part && child.type === 'folder');
          if (!folder) {
            folder = { name: part, type: 'folder', children: [] };
            current.children.push(folder);
          }
          current = folder;
        }
      });
    });

    // Sort children: folders first, then files, both alphabetically
    const sortChildren = (node: FileNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      }
    };
    
    sortChildren(root);
    return root;
  };

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      loadAllFiles();
    }
  }, [isOpen, loadAllFiles]);

  // Helper: Recursively gather all full paths for a node and its descendants
  const getAllPaths = useCallback((node: FileNode, currentPath: string): string[] => {
    let paths = [currentPath];
    if (node.type === 'folder' && node.children) {
      node.children.forEach(child => {
        paths = paths.concat(getAllPaths(child, `${currentPath}/${child.name}`));
      });
    }
    return paths;
  }, []);

  // Find a node by its full path
  const findNodeByPath = useCallback((node: FileNode, targetPath: string, currentPath: string = 'project'): FileNode | null => {
    if (currentPath === targetPath) return node;
    if (node.type === 'folder' && node.children) {
      for (let child of node.children) {
        const found = findNodeByPath(child, targetPath, `${currentPath}/${child.name}`);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Toggle selection state for a node
  const toggleSelected = useCallback((path: string) => {
    if (!fileTree) return;
    
    const node = findNodeByPath(fileTree, path);
    if (!node) return;
    
    const allPaths = getAllPaths(node, path);
    
    if (selectedNodes.includes(path)) {
      // Deselect: remove all descendant paths
      setSelectedNodes(prev => prev.filter(p => !allPaths.includes(p)));
    } else {
      // Select: add this node and all its descendants
      setSelectedNodes(prev => Array.from(new Set([...prev, ...allPaths])));
    }
  }, [fileTree, selectedNodes, findNodeByPath, getAllPaths]);

  // Toggle expanded state for a node
  const toggleExpanded = useCallback((path: string) => {
    setExpandedNodes(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  }, []);

  // Get combined content of all selected files
  const getCombinedSelectedContent = useCallback((): string => {
    if (!fileTree) return '';
    
    // Get only selected files (not folders)
    const selectedFiles = selectedNodes
      .filter(path => {
        const node = findNodeByPath(fileTree, path);
        return node?.type === 'file';
      })
      .map(path => {
        const node = findNodeByPath(fileTree, path);
        return {
          path,
          content: node?.content || '',
          name: path.split('/').pop() || ''
        };
      });

    // Combine all selected files with headers
    return selectedFiles
      .map(file => {
        const separator = '='.repeat(80);
        return `${separator}
FILE: ${file.path}
${separator}

${file.content}

${separator}
END OF FILE: ${file.path}
${separator}`;
      })
      .join('\n\n');
  }, [fileTree, selectedNodes, findNodeByPath]);

  // Copy selected content to clipboard
  const copySelectedContent = useCallback(async () => {
    const content = getCombinedSelectedContent();
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFiles(new Set(selectedNodes));
      setTimeout(() => setCopiedFiles(new Set()), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
    }
  }, [getCombinedSelectedContent, selectedNodes]);

  // Download selected content as file
  const downloadSelectedContent = useCallback(() => {
    const content = getCombinedSelectedContent();
    if (!content) return;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-files-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getCombinedSelectedContent]);

  // Filter tree based on search term
  const filteredTree = useMemo(() => {
    if (!fileTree || !searchTerm) return fileTree;
    
    const filterNode = (node: FileNode, currentPath: string): FileNode | null => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (node.type === 'file') {
        return matchesSearch ? node : null;
      } else if (node.type === 'folder' && node.children) {
        const filteredChildren = node.children
          .map(child => filterNode(child, `${currentPath}/${child.name}`))
          .filter(Boolean) as FileNode[];
        
        if (matchesSearch || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      
      return null;
    };
    
    return filterNode(fileTree, 'project');
  }, [fileTree, searchTerm]);

  // Auto-expand search results
  useEffect(() => {
    if (searchTerm && filteredTree) {
      const expandAll = (node: FileNode, currentPath: string) => {
        if (node.type === 'folder' && node.children) {
          setExpandedNodes(prev => [...new Set([...prev, currentPath])]);
          node.children.forEach(child => {
            expandAll(child, `${currentPath}/${child.name}`);
          });
        }
      };
      expandAll(filteredTree, 'project');
    }
  }, [searchTerm, filteredTree]);

  // Count selected files (not folders)
  const selectedFileCount = useMemo(() => {
    if (!fileTree) return 0;
    return selectedNodes.filter(path => {
      const node = findNodeByPath(fileTree, path);
      return node?.type === 'file';
    }).length;
  }, [selectedNodes, fileTree, findNodeByPath]);

  // Check if a folder is partially selected
  const isPartiallySelected = useCallback((path: string): boolean => {
    if (!fileTree) return false;
    
    const node = findNodeByPath(fileTree, path);
    if (!node || node.type !== 'folder') return false;
    
    const allPaths = getAllPaths(node, path);
    const filePaths = allPaths.filter(p => {
      const n = findNodeByPath(fileTree, p);
      return n?.type === 'file';
    });
    
    const selectedFilePaths = filePaths.filter(p => selectedNodes.includes(p));
    return selectedFilePaths.length > 0 && selectedFilePaths.length < filePaths.length;
  }, [fileTree, selectedNodes, findNodeByPath, getAllPaths]);

  // Render file tree recursively
  const renderTree = (node: FileNode, currentPath: string = 'project', depth: number = 0) => {
    const fullPath = currentPath;
    const isExpanded = expandedNodes.includes(fullPath);
    const isSelected = selectedNodes.includes(fullPath);
    const isPartial = isPartiallySelected(fullPath);
    
    return (
      <div key={fullPath} className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1 cursor-pointer transition-all duration-150 hover:bg-gray-700/50 ${
            isSelected ? 'bg-blue-600/20' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = isPartial;
              }
            }}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelected(fullPath);
            }}
            className="w-3 h-3 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
          />
          
          <div 
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => {
              if (node.type === 'folder') {
                toggleExpanded(fullPath);
              }
            }}
          >
            {node.type === 'folder' && (
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {node.type === 'folder' ? (
                isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                )
              ) : (
                getFileIcon(node.name)
              )}
              <span className="text-sm text-gray-200 truncate font-mono">
                {node.name}
              </span>
            </div>
          </div>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => 
              renderTree(child, `${fullPath}/${child.name}`, depth + 1)
            )}
          </div>
        )}
      </div>
    );
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
        {/* File Explorer Panel */}
        <div className="w-80 border-r border-gray-700 flex flex-col bg-gray-800">
          {/* Header */}
          <div className="p-3 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Explorer</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={loadAllFiles}
                  disabled={loading}
                  className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <Refresh className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={copySelectedContent}
                disabled={selectedFileCount === 0 || loading}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Copy selected files to clipboard"
              >
                {copiedFiles.size > 0 ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copy ({selectedFileCount})
              </button>
              
              <button
                onClick={downloadSelectedContent}
                disabled={selectedFileCount === 0 || loading}
                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Download selected files"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
            </div>
          </div>
          
          {/* File Tree */}
          <div className="flex-1 overflow-auto">
            {error && (
              <div className="p-3 text-red-400 text-xs flex items-center gap-2 bg-red-900/20 border-b border-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {loading && (
              <div className="p-3 text-blue-400 text-xs flex items-center gap-2">
                <Refresh className="w-4 h-4 animate-spin" />
                Loading file system...
              </div>
            )}
            
            <div className="py-1">
              {filteredTree && renderTree(filteredTree)}
            </div>
          </div>
        </div>

        {/* Code Viewer Panel */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {selectedFileCount > 0 ? (
            <>
              {/* Header */}
              <div className="px-4 py-2 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-200 font-mono">
                    {selectedFileCount} file{selectedFileCount !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
              
              {/* Combined Code Content */}
              <div className="flex-1 overflow-auto bg-gray-900">
                <pre className="p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                  <code 
                    dangerouslySetInnerHTML={{ 
                      __html: applySyntaxHighlighting(getCombinedSelectedContent(), 'combined.txt') 
                    }} 
                  />
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Code className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-semibold mb-2 text-gray-400">No files selected</h3>
                <p className="text-sm text-gray-500">Select files from the tree to view their combined content</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};