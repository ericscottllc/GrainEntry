import type { GrainEntryInsert } from '../types';

export interface ValidationError {
  field: string;
  message: string;
  rowIndex?: number;
  columnIndex?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  entries: GrainEntryInsert[];
}

export interface EntryRow {
  id: string;
  elevator_id: string;
  town_id: string;
  cash_prices: string[];
}

export const validateAndPrepareEntries = (
  entryDate: string,
  entryCropClass: string,
  entryCropId: string,
  entryMonths: string[],
  entryYears: number[],
  entryFutures: string[],
  entryRows: EntryRow[]
): ValidationResult => {
  const errors: ValidationError[] = [];
  const entriesToInsert: GrainEntryInsert[] = [];

  // Validate basic required fields
  if (!entryDate) {
    errors.push({
      field: 'date',
      message: 'Entry date is required'
    });
  }

  if (!entryCropClass) {
    errors.push({
      field: 'cropClass',
      message: 'Crop class is required'
    });
  }

  // Check if we have at least one valid month/year combination
  let hasValidMonthYear = false;
  for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
    const month = entryMonths[monthIndex];
    const year = entryYears[monthIndex];
    
    if (month && year && year > 0) {
      hasValidMonthYear = true;
      break;
    }
  }

  if (!hasValidMonthYear) {
    errors.push({
      field: 'monthYear',
      message: 'At least one month/year combination is required'
    });
  }

  // Check if we have at least one row with elevator and town
  let hasValidRow = false;
  entryRows.forEach((row, rowIndex) => {
    if (row.elevator_id && row.town_id) {
      hasValidRow = true;
    }
  });

  if (!hasValidRow) {
    errors.push({
      field: 'rows',
      message: 'At least one row with elevator and town is required'
    });
  }

  // If basic validation fails, return early
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      entries: []
    };
  }

  // Validate and prepare entries for each month/year combination
  let hasAnyEntries = false;
  
  for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
    const month = entryMonths[monthIndex];
    const year = entryYears[monthIndex];
    
    // Skip if month or year is not set
    if (!month || !year || year === 0) {
      continue;
    }
    
    const futures = parseFloat(entryFutures[monthIndex]) || null;
    
    // Check each row for this month
    entryRows.forEach((row, rowIndex) => {
      // Skip rows without elevator and town
      if (!row.elevator_id || !row.town_id) {
        return;
      }
      
      const cashPriceStr = row.cash_prices[monthIndex];
      const cashPrice = parseFloat(cashPriceStr) || null;
      
      // Skip if no cash price for this cell
      if (cashPrice === null || cashPriceStr === '') {
        return;
      }
      
      // This is a valid entry
      hasAnyEntries = true;
      
      entriesToInsert.push({
        date: entryDate,
        crop_id: entryCropId,
        class_id: entryCropClass,
        elevator_id: row.elevator_id,
        town_id: row.town_id,
        month,
        year,
        cash_price: cashPrice,
        futures,
        notes: ''
      });
    });
  }

  // Check if we have any actual entries to insert
  if (!hasAnyEntries) {
    errors.push({
      field: 'cashPrices',
      message: 'At least one cash price must be entered for a valid elevator/town combination'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    entries: entriesToInsert
  };
};

export const getFieldErrors = (
  errors: ValidationError[],
  entryDate: string,
  entryCropClass: string,
  entryCropId: string,
  entryMonths: string[],
  entryYears: number[],
  entryRows: EntryRow[]
) => {
  const fieldErrors = {
    date: errors.some(e => e.field === 'date'),
    cropClass: errors.some(e => e.field === 'cropClass'),
    monthYear: errors.some(e => e.field === 'monthYear'),
    rows: errors.some(e => e.field === 'rows'),
    cashPrices: errors.some(e => e.field === 'cashPrices')
  };

  // Additional specific field checks
  const monthYearErrors: boolean[] = new Array(6).fill(false);
  const rowErrors: boolean[] = new Array(entryRows.length).fill(false);
  const cashPriceErrors: boolean[][] = entryRows.map(() => new Array(6).fill(false));

  // Check for specific month/year issues
  if (fieldErrors.monthYear) {
    let hasAnyValid = false;
    for (let i = 0; i < 6; i++) {
      if (entryMonths[i] && entryYears[i] && entryYears[i] > 0) {
        hasAnyValid = true;
      } else if (entryMonths[i] || entryYears[i]) {
        monthYearErrors[i] = true; // Partial entry
      }
    }
    if (!hasAnyValid) {
      // Highlight first column if no valid combinations
      monthYearErrors[0] = true;
    }
  }

  // Check for specific row issues
  if (fieldErrors.rows) {
    entryRows.forEach((row, index) => {
      if (!row.elevator_id || !row.town_id) {
        rowErrors[index] = true;
      }
    });
  }

  // Check for cash price issues
  if (fieldErrors.cashPrices) {
    let foundAnyPrice = false;
    entryRows.forEach((row, rowIndex) => {
      if (row.elevator_id && row.town_id) {
        row.cash_prices.forEach((price, colIndex) => {
          if (entryMonths[colIndex] && entryYears[colIndex] && entryYears[colIndex] > 0) {
            if (price && parseFloat(price)) {
              foundAnyPrice = true;
            } else {
              cashPriceErrors[rowIndex][colIndex] = true;
            }
          }
        });
      }
    });
    
    // If no prices found at all, highlight available cells
    if (!foundAnyPrice) {
      entryRows.forEach((row, rowIndex) => {
        if (row.elevator_id && row.town_id) {
          for (let colIndex = 0; colIndex < 6; colIndex++) {
            if (entryMonths[colIndex] && entryYears[colIndex] && entryYears[colIndex] > 0) {
              cashPriceErrors[rowIndex][colIndex] = true;
            }
          }
        }
      });
    }
  }

  return {
    ...fieldErrors,
    monthYearErrors,
    rowErrors,
    cashPriceErrors
  };
};