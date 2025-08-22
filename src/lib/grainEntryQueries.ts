import { supabase } from './supabase';

// Types
export interface GrainEntry {
  id: string;
  date: string;
  crop_id: string;
  elevator_id: string;
  town_id: string;
  month: string;
  year: number;
  cash_price: number | null;
  futures: number | null;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_crops?: { name: string; code: string };
  master_elevators?: { name: string; code: string };
  master_towns?: { name: string; province: string };
}

export interface GrainEntryInsert {
  date: string;
  crop_id: string;
  elevator_id: string;
  town_id: string;
  month: string;
  year: number;
  cash_price: number | null;
  futures: number | null;
  notes: string;
}

export interface GrainEntryFilters {
  crop_id?: string;
  elevator_id?: string;
  town_id?: string;
  month?: string;
  year?: number;
  date_from?: string;
  date_to?: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface MasterCrop {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface MasterElevator {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface MasterTown {
  id: string;
  name: string;
  province: string;
  is_active: boolean;
}

// Query functions
export const listEntries = async (
  filters: GrainEntryFilters = {},
  sort: SortConfig = { field: 'date', direction: 'desc' }
): Promise<GrainEntry[]> => {
  let query = supabase
    .from('grain_entries')
    .select(`
      *,
      master_crops!inner(name, code),
      master_elevators!inner(name, code),
      master_towns!inner(name, province)
    `)
    .eq('is_active', true);

  // Apply filters
  if (filters.crop_id) {
    query = query.eq('crop_id', filters.crop_id);
  }
  if (filters.elevator_id) {
    query = query.eq('elevator_id', filters.elevator_id);
  }
  if (filters.town_id) {
    query = query.eq('town_id', filters.town_id);
  }
  if (filters.month) {
    query = query.eq('month', filters.month);
  }
  if (filters.year) {
    query = query.eq('year', filters.year);
  }
  if (filters.date_from) {
    query = query.gte('date', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('date', filters.date_to);
  }

  // Apply sorting
  const ascending = sort.direction === 'asc';
  if (sort.field === 'master_crops.name') {
    query = query.order('name', { ascending, foreignTable: 'master_crops' });
  } else {
    query = query.order(sort.field, { ascending });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching grain entries:', error);
    throw error;
  }

  return data || [];
};

export const insertEntries = async (entries: GrainEntryInsert[]): Promise<void> => {
  const { error } = await supabase
    .from('grain_entries')
    .insert(entries);

  if (error) {
    console.error('Error inserting grain entries:', error);
    throw error;
  }
};

export const softDeleteEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('grain_entries')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting grain entry:', error);
    throw error;
  }
};

export const listCrops = async (): Promise<MasterCrop[]> => {
  const { data, error } = await supabase
    .from('master_crops')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching crops:', error);
    throw error;
  }

  return data || [];
};

export const listElevators = async (): Promise<MasterElevator[]> => {
  const { data, error } = await supabase
    .from('master_elevators')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching elevators:', error);
    throw error;
  }

  return data || [];
};

export const listTowns = async (): Promise<MasterTown[]> => {
  const { data, error } = await supabase
    .from('master_towns')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching towns:', error);
    throw error;
  }

  return data || [];
};

// Utility functions
export const calculateBasis = (cashPrice: number | null, futures: number | null): number | null => {
  if (cashPrice === null || futures === null) return null;
  return cashPrice - futures;
};

export const formatPrice = (price: number | null): string => {
  if (price === null) return '-';
  return `$${price.toFixed(2)}`;
};

export const formatBasis = (basis: number | null): string => {
  if (basis === null) return '-';
  const sign = basis >= 0 ? '+' : '';
  return `${sign}$${basis.toFixed(2)}`;
};