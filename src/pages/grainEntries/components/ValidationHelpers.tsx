import React from 'react';
import { AlertCircle } from 'lucide-react';

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
    <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Missing Required Fields</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-red-500">•</span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={onClose}
            className="mt-3 text-xs text-red-600 hover:text-red-800 underline"
          >
            Close
          </button>
        </div>
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
    <div className={`relative ${hasError ? 'animate-pulse' : ''}`}>
      {hasError && (
        <div className="absolute inset-0 border-2 border-red-500 rounded pointer-events-none animate-pulse" />
      )}
      {children}
    </div>
  );
};