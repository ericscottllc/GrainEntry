import React, { useState, useEffect } from 'react';
import { Search, Trash2, ArrowUpDown } from 'lucide-react';
import { listEntries, softDeleteEntry } from '../queries';
import { listCropClasses, listElevators, listTowns } from '../masterDataQueries';
import { formatPrice, calculateBasis, formatBasis } from '../utils';
import type { 
  GrainEntry, 
  GrainEntryFilters, 
  SortConfig,
  CropClass 
} from '../types';

interface ViewEntriesTabProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
  refreshTrigger: number;
}

export const ViewEntriesTab: React.FC<ViewEntriesTabProps> = ({ onShowToast, refreshTrigger }) => {
  const [entries, setEntries] = useState<GrainEntry[]>([]);
  const [cropClasses, setCropClasses] = useState<CropClass[]>([]);
  const [elevators, setElevators] = useState<any[]>([]);
  const [towns, setTowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and sorting for existing entries
  const [filters, setFilters] = useState<GrainEntryFilters>({});
  const [sort, setSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Separate state for applied filters (what's actually used in queries)
  const [appliedFilters, setAppliedFilters] = useState<GrainEntryFilters>({});
  const [appliedSort, setAppliedSort] = useState<SortConfig>({ field: 'date', direction: 'desc' });
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

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
      onShowToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [appliedFilters, appliedSort, refreshTrigger]);

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

  const handleDeleteEntry = async (id: string) => {
    try {
      await softDeleteEntry(id);
      setEntries(entries.filter(e => e.id !== id));
      onShowToast('Entry deleted successfully', 'success');
    } catch (error) {
      onShowToast('Failed to delete entry', 'error');
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
    <div className="space-y-6 p-6">
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
                    {formatBasis(calculateBasis(entry.cash_price, entry.futures))}
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
  );
};