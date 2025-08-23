import React, { useState, useEffect } from 'react';
import { Search, Save, Trash2, Plus } from 'lucide-react';
import { insertEntries } from '../queries';
import { listCropClasses, listRegions, listRegionsByClass, listRegionAssociations, listElevators, listTowns } from '../masterDataQueries';
import { MONTHS } from '../utils';
import { validateAndPrepareEntries, getFieldErrors } from '../utils/validationUtils';
import { ValidationErrorDisplay, FieldWithError } from './ValidationHelpers';
import type { 
  GrainEntryInsert,
  CropClass, 
  MasterRegion, 
  RegionAssociation 
} from '../types';
import type { ValidationError } from '../utils/validationUtils';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface EntryRow {
  id: string;
  elevator_id: string;
  town_id: string;
  cash_prices: string[];
}

interface NewEntriesTabProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
  onEntriesAdded: () => void;
}

export const NewEntriesTab: React.FC<NewEntriesTabProps> = ({ onShowToast, onEntriesAdded }) => {
  const [cropClasses, setCropClasses] = useState<CropClass[]>([]);
  const [regions, setRegions] = useState<MasterRegion[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<MasterRegion[]>([]);
  const [regionAssociations, setRegionAssociations] = useState<RegionAssociation[]>([]);
  const [elevators, setElevators] = useState<any[]>([]);
  const [towns, setTowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Entry form state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryCropClass, setEntryCropClass] = useState('');
  const [entryRegion, setEntryRegion] = useState('');
  const [entryMonths, setEntryMonths] = useState<string[]>(['', '', '', '', '', '']);
  const [entryYears, setEntryYears] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [entryFutures, setEntryFutures] = useState<string[]>(['', '', '', '', '', '']);
  const [entryRows, setEntryRows] = useState<EntryRow[]>([
    { id: '1', elevator_id: '', town_id: '', cash_prices: ['', '', '', '', '', ''] }
  ]);
  const [isAutoPopulating, setIsAutoPopulating] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Get selected crop class for crop_id
  const selectedCropClass = cropClasses.find(cc => cc.id === entryCropClass);

  // Real-time validation for highlighting
  const realtimeValidation = React.useMemo(() => {
    // Only run real-time validation if user has started interacting with the form
    const hasInteracted = entryDate !== new Date().toISOString().split('T')[0] || 
                         entryCropClass !== '' || 
                         entryMonths.some(m => m !== '') || 
                         entryYears.some(y => y !== 0) ||
                         entryRows.some(row => row.elevator_id !== '' || row.town_id !== '' || row.cash_prices.some(p => p !== ''));
    
    if (!hasInteracted) {
      return {
        isValid: true,
        errors: [],
        entries: []
      };
    }
    
    return validateAndPrepareEntries(
      entryDate,
      entryCropClass,
      selectedCropClass?.crop_id || '',
      entryMonths,
      entryYears,
      entryFutures,
      entryRows
    );
  }, [entryDate, entryCropClass, selectedCropClass?.crop_id, entryMonths, entryYears, entryFutures, entryRows]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cropsData, elevatorsData, townsData] = await Promise.all([
        listCropClasses(),
        listElevators(),
        listTowns()
      ]);
      
      setCropClasses(cropsData);
      setElevators(elevatorsData);
      setTowns(townsData);
    } catch (error) {
      onShowToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAllRegions();
  }, []);

  const loadAllRegions = async () => {
    try {
      const regionsData = await listRegions();
      setRegions(regionsData);
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  // Load filtered regions when crop class changes
  useEffect(() => {
    if (entryCropClass) {
      loadFilteredRegions();
    } else {
      setFilteredRegions([]);
      setEntryRegion('');
    }
  }, [entryCropClass]);

  const loadFilteredRegions = async () => {
    try {
      const regionsData = await listRegionsByClass(entryCropClass);
      setFilteredRegions(regionsData);
    } catch (error) {
      console.error('Failed to load filtered regions:', error);
      setFilteredRegions([]);
    }
  };

  // Load region associations when region and crop class changes
  useEffect(() => {
    if (entryRegion && entryCropClass) {
      if (entryRegion === 'all') {
        loadAllRegionAssociations();
      } else {
        loadRegionAssociations();
      }
    }
  }, [entryRegion, entryCropClass]);

  const loadRegionAssociations = async () => {
    try {
      const associations = await listRegionAssociations(entryRegion, entryCropClass);
      setRegionAssociations(associations);
      
      // Auto-populate rows based on region associations
      if (associations.length > 0) {
        const newRows = associations.map((assoc, index) => ({
          id: `region-${index}`,
          elevator_id: assoc.elevator_id,
          town_id: assoc.town_id,
          cash_prices: ['', '', '', '', '', '']
        }));
        
        // Add one empty row at the end
        newRows.push({
          id: Date.now().toString(),
          elevator_id: '',
          town_id: '',
          cash_prices: ['', '', '', '', '', '']
        });
        
        setEntryRows(newRows);
      }
    } catch (error) {
      console.error('Failed to load region associations:', error);
    }
  };

  const loadAllRegionAssociations = async () => {
    try {
      const associations = await listRegionAssociations(undefined, entryCropClass);
      setRegionAssociations(associations);
      
      // Auto-populate rows based on all region associations for this crop class
      if (associations.length > 0) {
        const newRows = associations.map((assoc, index) => ({
          id: `all-regions-${index}`,
          elevator_id: assoc.elevator_id,
          town_id: assoc.town_id,
          cash_prices: ['', '', '', '', '', '']
        }));
        
        // Add one empty row at the end
        newRows.push({
          id: Date.now().toString(),
          elevator_id: '',
          town_id: '',
          cash_prices: ['', '', '', '', '', '']
        });
        
        setEntryRows(newRows);
      }
    } catch (error) {
      console.error('Failed to load all region associations:', error);
    }
  };

  // Auto-populate months and years from the first filled column
  useEffect(() => {
    if (isAutoPopulating) {
      // Find the first column that has both month and year
      const firstValidIndex = entryMonths.findIndex((month, index) => month && entryYears[index]);
      if (firstValidIndex !== -1) {
        const startMonth = entryMonths[firstValidIndex];
        const startYear = entryYears[firstValidIndex];
        const monthIndex = MONTHS.indexOf(startMonth);
        
        if (monthIndex !== -1) {
          const newMonths = [...entryMonths];
          const newYears = [...entryYears];
          
          // Fill subsequent columns only
          for (let i = firstValidIndex + 1; i < 6; i++) {
            const monthsFromStart = i - firstValidIndex;
            const nextMonthIndex = (monthIndex + monthsFromStart) % 12;
            const yearIncrement = Math.floor((monthIndex + monthsFromStart) / 12);
            newMonths[i] = MONTHS[nextMonthIndex];
            newYears[i] = startYear + yearIncrement;
          }
          
          setEntryMonths(newMonths);
          setEntryYears(newYears);
        }
      }
    }
  }, [entryMonths, entryYears]);

  // Update subsequent columns when user manually changes a month/year
  const updateSubsequentColumns = (changedIndex: number, month: string, year: number) => {
    if (!month || !year) return;
    
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return;
    
    const newMonths = [...entryMonths];
    const newYears = [...entryYears];
    
    // Update the changed column
    newMonths[changedIndex] = month;
    newYears[changedIndex] = year;
    
    // Update all subsequent columns
    for (let i = changedIndex + 1; i < 6; i++) {
      const monthsFromChanged = i - changedIndex;
      const nextMonthIndex = (monthIndex + monthsFromChanged) % 12;
      const yearIncrement = Math.floor((monthIndex + monthsFromChanged) / 12);
      newMonths[i] = MONTHS[nextMonthIndex];
      newYears[i] = year + yearIncrement;
    }
    
    setIsAutoPopulating(false); // Disable auto-population after manual change
    setEntryMonths(newMonths);
    setEntryYears(newYears);
    setTimeout(() => setIsAutoPopulating(true), 100); // Re-enable after update
  };

  // Function to reset the form fields
  const resetForm = () => {
    console.log("🔄 Resetting form fields...");
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryCropClass('');
    setEntryRegion('');
    setEntryMonths(['', '', '', '', '', '']);
    setEntryYears([0, 0, 0, 0, 0, 0]);
    setEntryFutures(['', '', '', '', '', '']);
    setEntryRows([{ id: '1', elevator_id: '', town_id: '', cash_prices: ['', '', '', '', '', ''] }]);
  };

  const updateEntryMonth = (index: number, value: string) => {
    const currentYear = entryYears[index];
    if (value && currentYear) {
      updateSubsequentColumns(index, value, currentYear);
    } else {
      const newMonths = [...entryMonths];
      newMonths[index] = value;
      setEntryMonths(newMonths);
    }
  };

  const updateEntryYear = (index: number, value: number) => {
    const currentMonth = entryMonths[index];
    if (currentMonth && value) {
      updateSubsequentColumns(index, currentMonth, value);
    } else {
      const newYears = [...entryYears];
      newYears[index] = value;
      setEntryYears(newYears);
    }
  };

  const updateEntryFutures = (index: number, value: string) => {
    const newFutures = [...entryFutures];
    newFutures[index] = value;
    setEntryFutures(newFutures);
  };

  const updateEntryRow = (id: string, field: keyof EntryRow, value: string | string[]) => {
    setEntryRows(rows => 
      rows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    
    // Auto-add new row when both elevator and town are filled
    const updatedRow = entryRows.find(row => row.id === id);
    if (updatedRow && field === 'town_id' && value && updatedRow.elevator_id) {
      const lastRow = entryRows[entryRows.length - 1];
      if (lastRow.id === id) {
        addEntryRow();
      }
    }
  };

  const updateCashPrice = (rowId: string, monthIndex: number, value: string) => {
    setEntryRows(rows => 
      rows.map(row => {
        if (row.id === rowId) {
          const newCashPrices = [...row.cash_prices];
          newCashPrices[monthIndex] = value;
          return { ...row, cash_prices: newCashPrices };
        }
        return row;
      })
    );
    
    // Auto-add new row if this is the last row and we just entered a price
    const currentRow = entryRows.find(row => row.id === rowId);
    if (currentRow && value && currentRow.elevator_id && currentRow.town_id) {
      const lastRow = entryRows[entryRows.length - 1];
      if (lastRow.id === rowId) {
        addEntryRow();
      }
    }
  };

  const addEntryRow = () => {
    setEntryRows([
      ...entryRows,
      { id: Date.now().toString(), elevator_id: '', town_id: '', cash_prices: ['', '', '', '', '', ''] }
    ]);
  };

  const removeEntryRow = (id: string) => {
    if (entryRows.length > 1) {
      setEntryRows(entryRows.filter(row => row.id !== id));
    }
  };

  const handleSaveEntries = async () => {
    try {
      // Clear previous validation errors
      
      // Get the selected crop class to extract crop_id
      const selectedCropClass = cropClasses.find(cc => cc.id === entryCropClass);
      if (!selectedCropClass) {
        onShowToast('Invalid crop class selected', 'error');
        return;
      }
      
      // Validate and prepare entries
      const validation = validateAndPrepareEntries(
        entryDate,
        entryCropClass,
        selectedCropClass.crop_id, // Pass the crop_id
        entryMonths,
        entryYears,
        entryFutures,
        entryRows
      );
      
      if (!validation.isValid) {
        // Set validation errors to show highlighting
        setValidationErrors(validation.errors);
        setShowValidationErrors(true);
        console.log("❌ Validation failed. Form will NOT clear.");
        onShowToast(`Please fix the highlighted fields (${validation.errors.length} issues found)`, 'error');
        return;
      }
      
      console.log("Attempting to insert entries into database...");
      await insertEntries(validation.entries);
      
      console.log("✅ Entries inserted successfully. Resetting form.");
      // Clear validation errors before resetting form
      setValidationErrors([]);
      setShowValidationErrors(false);
      resetForm(); // Only reset form on successful save
      
      onEntriesAdded();
      onShowToast(`${validation.entries.length} entries saved successfully`, 'success');
    } catch (error) {
      console.error('❌ Save Error (caught):', error);
      console.log("Form will NOT clear due to error.");
      // Don't clear validation errors on save error - keep them for user to see
      // setValidationErrors([]);
      // setShowValidationErrors(false);
      onShowToast('Failed to save entries', 'error');
    }
  };

  // Get field errors for highlighting
  const fieldErrors = React.useMemo(() => {
    // Use real-time validation for highlighting, but submission validation for error popup
    const errorsToUse = showValidationErrors ? validationErrors : realtimeValidation.errors;
    
    if (errorsToUse.length === 0) {
      return {
        date: false,
        cropClass: false,
        monthYear: false,
        rows: false,
        cashPrices: false,
        monthYearErrors: new Array(6).fill(false),
        rowErrors: new Array(entryRows.length).fill(false),
        cashPriceErrors: entryRows.map(() => new Array(6).fill(false))
      };
    }
    
    const errors = getFieldErrors(
      errorsToUse,
      entryDate,
      entryCropClass,
      selectedCropClass?.crop_id || '',
      entryMonths,
      entryYears,
      entryRows
    );
    return errors;
  }, [realtimeValidation.errors, validationErrors, showValidationErrors, entryDate, entryCropClass, selectedCropClass?.crop_id, entryMonths, entryYears, entryRows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tg-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Validation Error Display */}
      {showValidationErrors && <ValidationErrorDisplay 
        errors={validationErrors}
        onClose={() => {
          setValidationErrors([]);
          setShowValidationErrors(false);
        }}
      />}

      {/* Entry Form */}
      <div className="bg-white border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-300 bg-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">New Entries</h2>
        </div>
        
        {/* Header Controls */}
        <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">As Of Date</label>
              <FieldWithError hasError={fieldErrors.date}>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className={`w-full px-2 py-1 border text-sm focus:outline-none focus:border-blue-500 ${
                    fieldErrors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </FieldWithError>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Crop Class</label>
              <FieldWithError hasError={fieldErrors.cropClass}>
                <select
                  value={entryCropClass}
                  onChange={(e) => setEntryCropClass(e.target.value)}
                  className={`w-full px-2 py-1 border text-sm focus:outline-none focus:border-blue-500 ${
                    fieldErrors.cropClass ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Crop Class</option>
                  {cropClasses.map(cropClass => (
                    <option key={cropClass.id} value={cropClass.id}>
                      {cropClass.master_crops?.name} - {cropClass.name}
                    </option>
                  ))}
                </select>
              </FieldWithError>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Region (Optional)</label>
              <select
                value={entryRegion}
                onChange={(e) => setEntryRegion(e.target.value)}
                disabled={!entryCropClass}
                className="w-full px-2 py-1 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">{entryCropClass ? 'Select Region' : 'Select Crop Class First'}</option>
                {entryCropClass && filteredRegions.length > 0 && (
                  <option value="all">All Regions</option>
                )}
                {filteredRegions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
            <div></div>
          </div>
        </div>
        
        {/* Spreadsheet-like Table */}
        <div className="overflow-x-auto">
          <table className="border-collapse w-full min-w-[800px]">
            {/* Year Headers */}
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-32"></th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-32"></th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    <FieldWithError hasError={fieldErrors.monthYearErrors[index]}>
                      <input
                        type="number"
                        value={entryYears[index] || ''}
                        onChange={(e) => updateEntryYear(index, parseInt(e.target.value) || 0)}
                        className={`w-full px-1 py-0.5 border-0 text-xs font-medium text-center focus:outline-none focus:bg-white focus:border focus:border-blue-500 ${
                          fieldErrors.monthYearErrors[index] ? 'bg-red-50 text-red-700' : 'bg-transparent'
                        }`}
                        placeholder="Year"
                        min="2020"
                        max="2030"
                      />
                    </FieldWithError>
                  </th>
                ))}
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-12"></th>
              </tr>
              {/* Month Headers */}
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"></th>
                <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"></th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700">
                    <FieldWithError hasError={fieldErrors.monthYearErrors[index]}>
                      <select
                        value={entryMonths[index]}
                        onChange={(e) => updateEntryMonth(index, e.target.value)}
                        className={`w-full px-1 py-0.5 border-0 text-xs font-medium focus:outline-none focus:bg-white focus:border focus:border-blue-500 ${
                          fieldErrors.monthYearErrors[index] ? 'bg-red-50 text-red-700' : 'bg-transparent'
                        }`}
                      >
                        <option value="">Month</option>
                        {MONTHS.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                    </FieldWithError>
                  </th>
                ))}
                <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"></th>
              </tr>
              {/* Futures Prices Row */}
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">Elevator</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">Town</th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    Futures Price
                  </th>
                ))}
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700"></th>
              </tr>
              {/* Futures Input Row */}
              <tr className="bg-yellow-50">
                <td className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 bg-gray-100">Futures</td>
                <td className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 bg-gray-100">Prices</td>
                {Array.from({ length: 6 }, (_, index) => (
                  <td key={index} className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">
                    <input
                      type="number"
                      step="0.01"
                      value={entryFutures[index]}
                      onChange={(e) => updateEntryFutures(index, e.target.value)}
                      className="w-full px-1 py-1 border-0 bg-transparent text-xs text-right focus:outline-none focus:bg-white focus:border focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700"></td>
              </tr>
            </thead>
            
            {/* Data Rows */}
            <tbody>
              {entryRows.map((row, rowIndex) => (
                <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-2 py-1">
                    <FieldWithError hasError={fieldErrors.rowErrors[rowIndex]}>
                      <select
                        value={row.elevator_id}
                        onChange={(e) => updateEntryRow(row.id, 'elevator_id', e.target.value)}
                        className="w-full px-1 py-1 border-0 bg-transparent text-xs focus:outline-none focus:bg-white focus:border focus:border-blue-500"
                      >
                        <option value="">Select Elevator</option>
                        {elevators.map(elevator => (
                          <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
                        ))}
                      </select>
                    </FieldWithError>
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <FieldWithError hasError={fieldErrors.rowErrors[rowIndex]}>
                      <select
                        value={row.town_id}
                        onChange={(e) => updateEntryRow(row.id, 'town_id', e.target.value)}
                        className="w-full px-1 py-1 border-0 bg-transparent text-xs focus:outline-none focus:bg-white focus:border focus:border-blue-500"
                      >
                        <option value="">Select Town</option>
                        {towns.map(town => (
                          <option key={town.id} value={town.id}>{town.name}</option>
                        ))}
                      </select>
                    </FieldWithError>
                  </td>
                  {Array.from({ length: 6 }, (_, index) => (
                    <td key={index} className="border border-gray-300 px-2 py-1">
                      <FieldWithError hasError={fieldErrors.cashPriceErrors[rowIndex]?.[index] || false}>
                        <input
                          type="number"
                          step="0.01"
                          value={row.cash_prices[index]}
                          onChange={(e) => updateCashPrice(row.id, index, e.target.value)}
                          className="w-full px-1 py-1 border-0 bg-transparent text-xs text-right focus:outline-none focus:bg-white focus:border focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </FieldWithError>
                    </td>
                  ))}
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    {entryRows.length > 1 && (
                      <button
                        onClick={() => removeEntryRow(row.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-300 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={addEntryRow}
              className="flex items-center px-3 py-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-500"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Row
            </button>
            <div className="text-xs text-gray-600">
              {entryRegion === 'all' ? 'All regions pre-populated. ' : 
               entryRegion ? 'Region pre-populated rows. ' : ''}
              Rows auto-add when you enter data. Use Tab to navigate quickly.
            </div>
          </div>
          <button
            onClick={handleSaveEntries}
            disabled={!entryDate || !entryCropClass}
            className="flex items-center px-4 py-2 bg-tg-primary text-gray-900 hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Entries
          </button>
        </div>
      </div>
    </div>
  );
};