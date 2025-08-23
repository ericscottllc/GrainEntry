import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ValidationError {
  field: string;
  message: string;
  rowIndex?: number;
  columnIndex?: number;
}

interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  onClose: () => void;
}

export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({ errors, onClose }) => {
  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-50 border-2 border-red-300 rounded-lg shadow-xl p-4 max-w-md animate-pulse">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" />
        <div className="flex-1">
          <h3 className="text-base font-bold text-red-800 mb-3">⚠️ Missing Required Fields</h3>
          <ul className="text-sm text-red-700 space-y-2">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2 p-2 bg-red-100 rounded border border-red-200">
                <span className="text-red-600 font-bold">•</span>
                <span className="font-medium">{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
          title="Close"
        >
          <X className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
};

interface FieldErrorProps {
  hasError: boolean;
  children: React.ReactNode;
}

export const FieldWithError: React.FC<FieldErrorProps> = ({ hasError, children }) => {
  return (
    <div className={`relative ${hasError ? 'error-field' : ''}`}>
      {hasError && (
        <>
          <div className="absolute inset-0 border-3 border-red-500 rounded pointer-events-none animate-pulse bg-red-50/30" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce" />
        </>
      )}
      {children}
      <style jsx>{`
        .error-field {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
};