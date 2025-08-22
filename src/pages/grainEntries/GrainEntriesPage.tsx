import React, { useState, useEffect } from 'react';
import { Search, Save, Trash2, ArrowUpDown } from 'lucide-react';
import {
  listEntries, listCrops, listElevators, listTowns,
  insertEntries, softDeleteEntry,
  type GrainEntry, type GrainEntryInsert, type GrainEntryFilters, type SortConfig
} from '../../lib/grainEntryQueries';

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const GrainEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<GrainEntry[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
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
  
  // Entry form state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryCrop, setEntryCrop] = useState('');
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
        listCrops(),
        listElevators(),
        listTowns()
      ]);
      
      setEntries(entriesData);
      setCrops(cropsData);
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
  }, [appliedFilters, appliedSort]);

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

  const handleDeleteEntry = async (id: string) => {
    try {
      await softDeleteEntry(id);
      setEntries(entries.filter(e => e.id !== id));
      showToast('Entry deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete entry', 'error');
    }
  };

  // Entry form functions
  const updateEntryMonth = (index: number, value: string) => {
    const newMonths = [...entryMonths];
    newMonths[index] = value;
    setEntryMonths(newMonths);
    
    // Auto-fill subsequent months and years when first month is selected
    if (index === 0 && value) {
      const monthIndex = MONTHS.indexOf(value);
      if (monthIndex !== -1) {
        const currentYear = new Date().getFullYear();
        const newMonthsArray = [value];
        const newYearsArray = [currentYear];
        
        for (let i = 1; i < 6; i++) {
          const nextMonthIndex = (monthIndex + i) % 12;
          const yearIncrement = Math.floor((monthIndex + i) / 12);
          newMonthsArray.push(MONTHS[nextMonthIndex]);
          newYearsArray.push(currentYear + yearIncrement);
        }
        
        setEntryMonths(newMonthsArray);
        setEntryYears(newYearsArray);
      }
    }
  };

  const updateEntryYear = (index: number, value: number) => {
    const newYears = [...entryYears];
    newYears[index] = value;
    setEntryYears(newYears);
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
            crop_id: entryCrop,
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
      setEntryCrop('');
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
      entry.master_crops?.name.toLowerCase().includes(searchLower) ||
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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">New Entries</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 min-w-[1000px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th 
                  className="border border-gray-300 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  style={{ width: '160px' }}
                >
                  Date
                </th>
                <th 
                  className="border border-gray-300 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  style={{ width: '140px' }}
                >
                  Crop
                </th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th 
                    key={index}
                    className="border border-gray-300 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                    style={{ width: '110px' }}
                  >
                    Futures
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-tg-primary bg-opacity-20">
                  Date
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-tg-primary bg-opacity-20">
                  Crop
                </th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-tg-primary bg-opacity-20">
                    <select
                      value={entryMonths[index]}
                      onChange={(e) => updateEntryMonth(index, e.target.value)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs bg-white"
                    >
                      <option value="">Month</option>
                      {MONTHS.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-tg-primary bg-opacity-10">
                  Date
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-tg-primary bg-opacity-10">
                  Crop
                </th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-tg-primary bg-opacity-10">
                    <input
                      type="number"
                      value={entryYears[index] || ''}
                      onChange={(e) => updateEntryYear(index, parseInt(e.target.value) || 0)}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-center bg-white"
                      placeholder="Year"
                      min="2020"
                      max="2030"
                    />
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="border border-gray-300 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Crop
                </th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-tg-primary bg-opacity-30">
                    Futures
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-300 px-3 py-3 bg-tg-primary bg-opacity-20">
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-3 bg-tg-primary bg-opacity-20">
                  <select
                    value={entryCrop}
                    onChange={(e) => setEntryCrop(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Select Crop</option>
                    {crops.map(crop => (
                      <option key={crop.id} value={crop.id}>{crop.name}</option>
                    ))}
                  </select>
                </td>
                {Array.from({ length: 6 }, (_, index) => (
                  <td key={index} className="border border-gray-300 px-3 py-3 bg-tg-primary bg-opacity-10">
                    <input
                      type="number"
                      step="0.01"
                      value={entryFutures[index]}
                      onChange={(e) => updateEntryFutures(index, e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded text-sm text-right"
                      placeholder="0.00"
                    />
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Elevator
                </th>
                <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Town
                </th>
                {Array.from({ length: 6 }, (_, index) => (
                  <th key={index} className="border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-tg-primary bg-opacity-40">
                    <div className="text-center">
                      {entryMonths[index] && entryYears[index] ? 
                        `${entryMonths[index]} ${entryYears[index]}` : 
                        'Month Year'
                      }
                    </div>
                  </th>
                ))}
                <th className="border border-gray-300 px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase" style={{ width: '40px' }}>
                  Del
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {entryRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-3">
                    <select
                      value={row.elevator_id}
                      onChange={(e) => updateEntryRow(row.id, 'elevator_id', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select Elevator</option>
                      {elevators.map(elevator => (
                        <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 px-2 py-3">
                    <select
                      value={row.town_id}
                      onChange={(e) => updateEntryRow(row.id, 'town_id', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Select Town</option>
                      {towns.map(town => (
                        <option key={town.id} value={town.id}>{town.name}</option>
                      ))}
                    </select>
                  </td>
                  {Array.from({ length: 6 }, (_, index) => (
                    <td key={index} className="border border-gray-300 px-2 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.cash_prices[index]}
                        onChange={(e) => updateCashPrice(row.id, index, e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded text-sm text-right"
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-3 text-center">
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
        
        <div className="p-4 bg-gray-50 border-t flex justify-between">
          <div className="text-sm text-gray-600">
            Rows auto-add when you select both elevator and town
          </div>
          <button
            onClick={handleSaveEntries}
            disabled={!entryDate || !entryCrop}
            className="flex items-center px-6 py-2 bg-tg-primary text-gray-900 rounded-md hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Entries
          </button>
        </div>
      </div>

      {/* Search and Filters for Existing Entries */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-tg-primary focus:border-tg-primary"
                placeholder="Search entries..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
            <select
              value={filters.crop_id || ''}
              onChange={(e) => handleFilterChange('crop_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-tg-primary focus:border-tg-primary"
            >
              <option value="">All Crops</option>
              {crops.map(crop => (
                <option key={crop.id} value={crop.id}>{crop.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Elevator</label>
            <select
              value={filters.elevator_id || ''}
              onChange={(e) => handleFilterChange('elevator_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-tg-primary focus:border-tg-primary"
            >
              <option value="">All Elevators</option>
              {elevators.map(elevator => (
                <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
            <select
              value={filters.town_id || ''}
              onChange={(e) => handleFilterChange('town_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-tg-primary focus:border-tg-primary"
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
              className="w-full px-4 py-2 bg-tg-primary text-gray-900 rounded-md hover:bg-opacity-80 font-medium"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Existing Entries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Existing Entries</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('master_crops.name')}
                >
                  <div className="flex items-center">
                    Crop
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Elevator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Town
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month/Year
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cash Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Futures
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.master_crops?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.master_elevators?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.master_towns?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.month} {entry.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {entry.cash_price ? `$${entry.cash_price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {entry.futures ? `$${entry.futures.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {calculateBasis(entry.cash_price, entry.futures)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};