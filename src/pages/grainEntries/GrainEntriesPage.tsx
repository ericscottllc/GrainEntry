import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, Calendar, Grain, Save, Loader } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabase';
import { Button, Input, Card } from '../../components/Shared/SharedComponents';

interface GrainEntry {
  id: string;
  date: string;
  crop: string;
  elevator: string;
  town: string;
  month: string;
  year: number;
  cash_price: number;
  futures_price: number;
  basis: number;
  is_active: boolean;
  created_at: string;
}

interface LocationRow {
  id: string;
  elevator: string;
  town: string;
  prices: { [key: string]: string }; // month_year -> price
}

interface FuturesPrice {
  month: string;
  year: number;
  price: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const CROPS = ['Corn', 'Wheat', 'Soybeans', 'Oats', 'Barley'];
const ELEVATORS = ['Grain Co-op', 'Prairie Elevator', 'Harvest Point', 'Golden Grain', 'Farm Fresh'];
const TOWNS = ['Winnipeg', 'Calgary', 'Edmonton', 'Saskatoon', 'Regina', 'Brandon'];

export const GrainEntriesPage: React.FC = () => {
  const { success, error } = useNotifications();
  
  // Form state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [futuresPrices, setFuturesPrices] = useState<FuturesPrice[]>([
    { month: '', year: new Date().getFullYear(), price: '' },
    { month: '', year: new Date().getFullYear(), price: '' },
    { month: '', year: new Date().getFullYear(), price: '' },
    { month: '', year: new Date().getFullYear(), price: '' },
    { month: '', year: new Date().getFullYear(), price: '' },
    { month: '', year: new Date().getFullYear(), price: '' }
  ]);
  const [locationRows, setLocationRows] = useState<LocationRow[]>([
    { id: '1', elevator: '', town: '', prices: {} }
  ]);
  
  // Table state
  const [entries, setEntries] = useState<GrainEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<GrainEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [filterElevator, setFilterElevator] = useState('');
  const [filterTown, setFilterTown] = useState('');
  const [sortField, setSortField] = useState<'date' | 'crop'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Loading states
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-fill futures months when first month is selected
  const handleFuturesMonthChange = (index: number, month: string) => {
    if (index === 0 && month) {
      const newFuturesPrices = [...futuresPrices];
      const startMonthIndex = MONTHS.indexOf(month);
      let currentYear = newFuturesPrices[0].year;
      
      for (let i = 0; i < 6; i++) {
        const monthIndex = (startMonthIndex + i) % 12;
        if (i > 0 && monthIndex === 0) {
          currentYear++;
        }
        newFuturesPrices[i] = {
          ...newFuturesPrices[i],
          month: MONTHS[monthIndex],
          year: currentYear
        };
      }
      setFuturesPrices(newFuturesPrices);
    } else {
      const newFuturesPrices = [...futuresPrices];
      newFuturesPrices[index].month = month;
      setFuturesPrices(newFuturesPrices);
    }
  };

  // Handle futures price changes
  const handleFuturesPriceChange = (index: number, field: 'year' | 'price', value: string | number) => {
    const newFuturesPrices = [...futuresPrices];
    newFuturesPrices[index] = { ...newFuturesPrices[index], [field]: value };
    setFuturesPrices(newFuturesPrices);
  };

  // Handle location row changes
  const handleLocationChange = (rowId: string, field: 'elevator' | 'town', value: string) => {
    const newRows = locationRows.map(row => {
      if (row.id === rowId) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setLocationRows(newRows);

    // Add new row if both elevator and town are selected in the last row
    const lastRow = newRows[newRows.length - 1];
    if (lastRow.elevator && lastRow.town && rowId === lastRow.id) {
      const newRowId = Date.now().toString();
      setLocationRows([...newRows, { id: newRowId, elevator: '', town: '', prices: {} }]);
    }
  };

  // Handle cash price changes
  const handleCashPriceChange = (rowId: string, monthYear: string, price: string) => {
    const newRows = locationRows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          prices: { ...row.prices, [monthYear]: price }
        };
      }
      return row;
    });
    setLocationRows(newRows);
  };

  // Delete location row
  const deleteLocationRow = (rowId: string) => {
    if (locationRows.length > 1) {
      setLocationRows(locationRows.filter(row => row.id !== rowId));
    }
  };

  // Save entries
  const saveEntries = async () => {
    if (!entryDate || !selectedCrop) {
      error('Validation Error', 'Please select a date and crop');
      return;
    }

    setSaving(true);
    try {
      const entriesToSave = [];
      
      // Process each location row
      for (const row of locationRows) {
        if (row.elevator && row.town) {
          // Process each month that has both futures and cash price
          for (let i = 0; i < 6; i++) {
            const futures = futuresPrices[i];
            const monthYear = `${futures.month}_${futures.year}`;
            const cashPrice = row.prices[monthYear];
            
            if (futures.month && futures.price && cashPrice) {
              const futuresPrice = parseFloat(futures.price);
              const cashPriceNum = parseFloat(cashPrice);
              const basis = cashPriceNum - futuresPrice;
              
              entriesToSave.push({
                date: entryDate,
                crop: selectedCrop,
                elevator: row.elevator,
                town: row.town,
                month: futures.month,
                year: futures.year,
                cash_price: cashPriceNum,
                futures_price: futuresPrice,
                basis: basis,
                is_active: true
              });
            }
          }
        }
      }

      if (entriesToSave.length === 0) {
        error('No Valid Entries', 'Please ensure you have complete data for at least one location and month');
        return;
      }

      const { error: saveError } = await supabase
        .from('grain_entries')
        .insert(entriesToSave);

      if (saveError) throw saveError;

      success('Entries Saved', `Successfully saved ${entriesToSave.length} grain entries`);
      
      // Reset form
      setSelectedCrop('');
      setFuturesPrices([
        { month: '', year: new Date().getFullYear(), price: '' },
        { month: '', year: new Date().getFullYear(), price: '' },
        { month: '', year: new Date().getFullYear(), price: '' },
        { month: '', year: new Date().getFullYear(), price: '' },
        { month: '', year: new Date().getFullYear(), price: '' },
        { month: '', year: new Date().getFullYear(), price: '' }
      ]);
      setLocationRows([{ id: '1', elevator: '', town: '', prices: {} }]);
      
      // Refresh entries
      loadEntries();
    } catch (err) {
      console.error('Error saving entries:', err);
      error('Save Failed', 'Failed to save grain entries');
    } finally {
      setSaving(false);
    }
  };

  // Load entries
  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error: loadError } = await supabase
        .from('grain_entries')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false });

      if (loadError) throw loadError;
      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (err) {
      console.error('Error loading entries:', err);
      error('Load Failed', 'Failed to load grain entries');
    } finally {
      setLoading(false);
    }
  };

  // Search and filter entries
  const searchEntries = () => {
    let filtered = [...entries];

    // Apply text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.crop.toLowerCase().includes(term) ||
        entry.elevator.toLowerCase().includes(term) ||
        entry.town.toLowerCase().includes(term) ||
        entry.month.toLowerCase().includes(term) ||
        entry.year.toString().includes(term)
      );
    }

    // Apply dropdown filters
    if (filterCrop) {
      filtered = filtered.filter(entry => entry.crop === filterCrop);
    }
    if (filterElevator) {
      filtered = filtered.filter(entry => entry.elevator === filterElevator);
    }
    if (filterTown) {
      filtered = filtered.filter(entry => entry.town === filterTown);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else {
        aValue = a.crop.toLowerCase();
        bValue = b.crop.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredEntries(filtered);
  };

  // Delete entry (soft delete)
  const deleteEntry = async (entryId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('grain_entries')
        .update({ is_active: false })
        .eq('id', entryId);

      if (deleteError) throw deleteError;

      success('Entry Deleted', 'Entry has been removed');
      loadEntries();
    } catch (err) {
      console.error('Error deleting entry:', err);
      error('Delete Failed', 'Failed to delete entry');
    }
  };

  // Handle column sorting
  const handleSort = (field: 'date' | 'crop') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    searchEntries();
  };

  // Load entries on component mount
  useEffect(() => {
    loadEntries();
  }, []);

  const canSave = entryDate && selectedCrop && !saving;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-tg-green rounded-xl flex items-center justify-center">
            <Grain className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Grain Entries</h1>
        </div>
        <p className="text-gray-600">Manage grain market data and pricing information</p>
      </motion.div>

      {/* New Entry Form */}
      <Card variant="elevated" className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-tg-green" />
          <h2 className="text-xl font-semibold text-gray-800">New Entry Form</h2>
        </div>

        {/* Date and Crop Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date of Entry
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tg-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Grain className="w-4 h-4 inline mr-1" />
              Crop Selection
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tg-green focus:border-transparent"
            >
              <option value="">Select Crop</option>
              {CROPS.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Futures Price Input Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Futures Price Input</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {futuresPrices.map((futures, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                    <select
                      value={futures.month}
                      onChange={(e) => handleFuturesMonthChange(index, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-tg-green"
                    >
                      <option value="">Select</option>
                      {MONTHS.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                    <input
                      type="number"
                      value={futures.year}
                      onChange={(e) => handleFuturesPriceChange(index, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-tg-green"
                      min="2020"
                      max="2030"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Futures Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={futures.price}
                      onChange={(e) => handleFuturesPriceChange(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-tg-green"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location and Cash Price Input Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Location and Cash Price Input</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Elevator</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Town</th>
                  {futuresPrices.map((futures, index) => (
                    <th key={index} className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">
                      {futures.month && futures.year ? `${futures.month} ${futures.year}` : `Month ${index + 1}`}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locationRows.map((row, rowIndex) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <select
                        value={row.elevator}
                        onChange={(e) => handleLocationChange(row.id, 'elevator', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-tg-green"
                      >
                        <option value="">Select Elevator</option>
                        {ELEVATORS.map(elevator => (
                          <option key={elevator} value={elevator}>{elevator}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.town}
                        onChange={(e) => handleLocationChange(row.id, 'town', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-tg-green"
                      >
                        <option value="">Select Town</option>
                        {TOWNS.map(town => (
                          <option key={town} value={town}>{town}</option>
                        ))}
                      </select>
                    </td>
                    {futuresPrices.map((futures, index) => {
                      const monthYear = `${futures.month}_${futures.year}`;
                      return (
                        <td key={index} className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={row.prices[monthYear] || ''}
                            onChange={(e) => handleCashPriceChange(row.id, monthYear, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-tg-green text-center"
                            placeholder="0.00"
                            disabled={!futures.month || !futures.year}
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      {locationRows.length > 1 && (
                        <button
                          onClick={() => deleteLocationRow(row.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveEntries}
            disabled={!canSave}
            loading={saving}
            variant="secondary"
            size="lg"
            icon={Save}
          >
            Save Entries
          </Button>
        </div>
      </Card>

      {/* Existing Entries Table */}
      <Card variant="elevated" className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-tg-primary" />
          <h2 className="text-xl font-semibold text-gray-800">Existing Entries</h2>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">All Crops</option>
              {CROPS.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
            <select
              value={filterElevator}
              onChange={(e) => setFilterElevator(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">All Elevators</option>
              {ELEVATORS.map(elevator => (
                <option key={elevator} value={elevator}>{elevator}</option>
              ))}
            </select>
            <select
              value={filterTown}
              onChange={(e) => setFilterTown(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tg-primary focus:border-transparent"
            >
              <option value="">All Towns</option>
              {TOWNS.map(town => (
                <option key={town} value={town}>{town}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <Button onClick={searchEntries} icon={Search}>
              Search
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-tg-primary" />
              <span className="ml-2 text-gray-600">Loading entries...</span>
            </div>
          ) : (
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('crop')}
                  >
                    Crop {sortField === 'crop' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Elevator</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Town</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Month/Year</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">Cash Price</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">Futures</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">Basis</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      No entries found. Create your first grain entry above.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{entry.crop}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{entry.elevator}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{entry.town}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{entry.month} {entry.year}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 text-right">${entry.cash_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 text-right">${entry.futures_price.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${
                        entry.basis >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.basis >= 0 ? '+' : ''}${entry.basis.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};