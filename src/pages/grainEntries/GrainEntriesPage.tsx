import React, { useState, useEffect } from 'react';
import { Search, Save, Trash2, ArrowUpDown, Plus } from 'lucide-react';
import { listEntries, insertEntries, softDeleteEntry } from './queries';
import { listCropClasses, listRegions, listRegionsByClass, listRegionAssociations, listElevators, listTowns } from './masterDataQueries';
import { MONTHS } from './utils';
import type { 
  GrainEntry, 
  GrainEntryInsert, 
  GrainEntryFilters, 
  SortConfig,
  CropClass, 
  MasterRegion, 
  RegionAssociation 
} from './types';

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

export const GrainEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<GrainEntry[]>([]);
  const [cropClasses, setCropClasses] = useState<CropClass[]>([]);
  const [regions, setRegions] = useState<MasterRegion[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<MasterRegion[]>([]);
  const [regionAssociations, setRegionAssociations] = useState<RegionAssociation[]>([]);
  const [elevators, setElevators] = useState<any[]>([]);
  const [towns, setTowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  
  // Filters and sorting for existing entries
  const [filters, setFilters] = useState<GrainEntryFilters>({});
  const [sort, setSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Separate state for applied filters (what's actually used in queries)
  const [appliedFilters, setAppliedFilters] = useState<GrainEntryFilters>({});
  const [appliedSort, setAppliedSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  
  // Entry form state - simplified
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryCropClass, setEntryCropClass] = useState('');
  const [entryRegion, setEntryRegion] = useState('');
  const [entryMonths, setEntryMonths] = useState<string[]>(['', '', '', '', '', '']);
  const [entryYears, setEntryYears] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [entryFutures, setEntryFutures] = useState<string[]>(['', '', '', '', '', '']);
  const [entryRows, setEntryRows] = useState<EntryRow[]>([
    { id: '1', elevator_id: '', town_id: '', cash_prices: ['', '', '', '', '', ''] }
  ]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, cropsData, elevatorsData, townsData] = await Promise.all([
        listEntries(appliedFilters, appliedSort),
        listCropClasses(),
        listElevators(),
        listTowns()
      ]);
      
      setEntries(entriesData);
      setCropClasses(cropsData);
      setElevators(elevatorsData);
      setTowns(townsData);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadAllRegions();
  }, [appliedFilters, appliedSort]);

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

  // Auto-populate months and years when start month/year changes
  useEffect(() => {
    // Auto-populate based on first column that has both month and year
    const firstValidIndex = entryMonths.findIndex((month, index) => month && entryYears[index]);
    if (firstValidIndex !== -1) {
      const startMonth = entryMonths[firstValidIndex];
      const startYear = entryYears[firstValidIndex];
      const monthIndex = MONTHS.indexOf(startMonth);
      
      if (monthIndex !== -1) {
        const newMonths = [...entryMonths];
        const newYears = [...entryYears];
        
        // Fill subsequent columns
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
  }, [entryMonths, entryYears]);

  const handleSearch = () => {
    setAppliedFilters(filters);
    setAppliedSort(sort);
    setAppliedSearchTerm(searchTerm);
  };

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: keyof GrainEntryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const calculateBasis = (cashPrice: number | null, futures: number | null): string => {
    if (cashPrice === null || futures === null) return '-';
    const basis = cashPrice - futures;
    const sign = basis >= 0 ? '+' : '';
    return `${sign}$${basis.toFixed(2)}`;
  };

  const formatPrice = (price: number | null): string => {
    if (price === null) return '-';
    return `$${price.toFixed(2)}`;
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await softDeleteEntry(id);
      setEntries(entries.filter(e => e.id !== id));
      showToast('Entry deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete entry', 'error');
    }
  };

  // Manual override for months/years
  const updateEntryMonth = (index: number, value: string) => {
    const newMonths = [...entryMonths];
    newMonths[index] = value;
    setEntryMonths(newMonths);
    
    // Trigger auto-population if this creates a valid starting point
    if (value && entryYears[index]) {
      // The useEffect will handle the auto-population
    }
  };

  const updateEntryYear = (index: number, value: number) => {
    const newYears = [...entryYears];
    newYears[index] = value;
    setEntryYears(newYears);
    
    // Trigger auto-population if this creates a valid starting point
    if (value && entryMonths[index]) {
      // The useEffect will handle the auto-population
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
      const entriesToInsert: GrainEntryInsert[] = [];
      
      for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
        const month = entryMonths[monthIndex];
        const year = entryYears[monthIndex];
        const futures = parseFloat(entryFutures[monthIndex]) || null;
        
        if (!month || !year) continue;
        
        for (const row of entryRows) {
          if (!row.elevator_id || !row.town_id) continue;
          
          const cashPrice = parseFloat(row.cash_prices[monthIndex]) || null;
          if (cashPrice === null) continue; // Skip rows with no cash price
          
          entriesToInsert.push({
            date: entryDate,
            class_id: entryCropClass,
            elevator_id: row.elevator_id,
            town_id: row.town_id,
            month,
            year,
            cash_price: cashPrice,
            futures,
            notes: ''
          });
        }
      }
      
      if (entriesToInsert.length === 0) {
        showToast('Please fill in required fields and cash prices', 'error');
        return;
      }
      
      await insertEntries(entriesToInsert);
      
      // Clear form
      setEntryDate(new Date().toISOString().split('T')[0]);
      setEntryCropClass('');
      setEntryRegion('');
      setEntryMonths(['', '', '', '', '', '']);
      setEntryYears([0, 0, 0, 0, 0, 0]);
      setEntryFutures(['', '', '', '', '', '']);
      setEntryRows([{ id: '1', elevator_id: '', town_id: '', cash_prices: ['', '', '', '', '', ''] }]);
      
      loadData();
      showToast(`${entriesToInsert.length} entries saved successfully`, 'success');
    } catch (error) {
      showToast('Failed to save entries', 'error');
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (!appliedSearchTerm) return true;
    const searchLower = appliedSearchTerm.toLowerCase();
    return (
      entry.crop_classes?.name.toLowerCase().includes(searchLower) ||
      entry.crop_classes?.master_crops?.name.toLowerCase().includes(searchLower) ||
      entry.master_elevators?.name.toLowerCase().includes(searchLower) ||
      entry.master_towns?.name.toLowerCase().includes(searchLower) ||
      entry.month.toLowerCase().includes(searchLower) ||
      entry.year.toString().includes(searchLower) ||
      entry.notes.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tg-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Grain Entries</h1>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

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
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Crop Class</label>
              <select
                value={entryCropClass}
                onChange={(e) => setEntryCropClass(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Crop Class</option>
                {cropClasses.map(cropClass => (
                  <option key={cropClass.id} value={cropClass.id}>
                    {cropClass.master_crops?.name} - {cropClass.name}
                  </option>
                ))}
              </select>
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
          <table className="w-full border-collapse min-w-[1200px]">
            {/* Year Headers */}
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-32"></th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-32"></th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 w-24">
                    <input
                      type="number"
                      value={entryYears[index] || ''}
                      onChange={(e) => updateEntryYear(index, parseInt(e.target.value) || 0)}
                      className="w-full px-1 py-0.5 border-0 bg-transparent text-xs font-medium text-center focus:outline-none focus:bg-white focus:border focus:border-blue-500"
                      placeholder="Year"
                      min="2020"
                      max="2030"
                    />
                  </th>
                ))}
                <th className="border border-gray-300 px-1 py-2 text-xs font-medium text-gray-700 w-8"></th>
              </tr>
              {/* Month Headers */}
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"></th>
                <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"></th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700">
                    <select
                      value={entryMonths[index]}
                      onChange={(e) => updateEntryMonth(index, e.target.value)}
                      className="w-full px-1 py-0.5 border-0 bg-transparent text-xs font-medium focus:outline-none focus:bg-white focus:border focus:border-blue-500"
                    >
                      <option value="">Month</option>
                      {MONTHS.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </th>
                ))}
                <th className="border border-gray-300 px-1 py-1 text-xs font-medium text-gray-700"></th>
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
                <th className="border border-gray-300 px-1 py-2 text-xs font-medium text-gray-700"></th>
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
                <td className="border border-gray-300 px-1 py-2 text-xs font-medium text-gray-700"></td>
              </tr>
            </thead>
            
            {/* Data Rows */}
            <tbody>
              {entryRows.map((row, rowIndex) => (
                <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-1 py-1">
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
                  </td>
                  <td className="border border-gray-300 px-1 py-1">
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
                  </td>
                  {Array.from({ length: 6 }, (_, index) => (
                    <td key={index} className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        step="0.01"
                        value={row.cash_prices[index]}
                        onChange={(e) => updateCashPrice(row.id, index, e.target.value)}
                        className="w-full px-1 py-1 border-0 bg-transparent text-xs text-right focus:outline-none focus:bg-white focus:border focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    {entryRows.length > 1 && (
                      <button
                        onClick={() => removeEntryRow(row.id)}
                        className="text-red-600 hover:text-red-800 p-0.5"
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

      {/* Search and Filters for Existing Entries */}
      <div className="bg-white p-4 border border-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:border-blue-500"
                placeholder="Search entries..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Crop Class</label>
            <select
              value={filters.class_id || ''}
              onChange={(e) => handleFilterChange('class_id', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Crop Classes</option>
              {cropClasses.map(cropClass => (
                <option key={cropClass.id} value={cropClass.id}>
                  {cropClass.master_crops?.name} - {cropClass.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Elevator</label>
            <select
              value={filters.elevator_id || ''}
              onChange={(e) => handleFilterChange('elevator_id', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Elevators</option>
              {elevators.map(elevator => (
                <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Town</label>
            <select
              value={filters.town_id || ''}
              onChange={(e) => handleFilterChange('town_id', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">All Towns</option>
              {towns.map(town => (
                <option key={town.id} value={town.id}>{town.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-3 py-1 bg-tg-primary text-gray-900 hover:bg-opacity-80 font-medium text-xs"
            >
              Search
            </button>
          </div>
        </div>
      </div>
        </div>

      {/* Existing Entries Table */}
      <div className="bg-white border border-gray-300 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-300 bg-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Existing Entries ({filteredEntries.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('crop_classes.name')}
                >
                  <div className="flex items-center">
                    Crop Class
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Elevator
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Town
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Month/Year
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700">
                  Cash Price
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700">
                  Futures
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right text-xs font-medium text-gray-700">
                  Basis
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                    {entry.crop_classes?.master_crops?.name} - {entry.crop_classes?.name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                    {entry.master_elevators?.name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                    {entry.master_towns?.name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                    {entry.month} {entry.year}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 text-right font-mono">
                    {formatPrice(entry.cash_price)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 text-right font-mono">
                    {formatPrice(entry.futures)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 text-right font-mono font-medium">
                    {calculateBasis(entry.cash_price, entry.futures)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={9} className="border border-gray-300 px-6 py-8 text-center text-gray-500 text-sm">
                    No entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
    </div>
  );
};