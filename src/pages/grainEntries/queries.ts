import { supabase } from '../../lib/supabase';
import type {
  GrainEntry,
  GrainEntryInsert,
  GrainEntryFilters,
  SortConfig,
  CropClass,
  MasterRegion,
  RegionAssociation,
  MasterElevator,
  MasterTown
} from './types';

// Main grain entries queries
export const listEntries = async (
  filters: GrainEntryFilters = {},
  sort: SortConfig = { field: 'date', direction: 'desc' }
): Promise<GrainEntry[]> => {
  let query = supabase
    .from('grain_entries')
    .select(`
      *,
      crop_classes!inner(
        name, 
        code,
        master_crops!inner(name, code)
      ),
      master_elevators!inner(name, code),
      master_towns!inner(name, province)
    `)
    .eq('is_active', true);

  // Apply filters
  if (filters.class_id) {
    query = query.eq('class_id', filters.class_id);
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
  if (sort.field === 'crop_classes.name') {
    query = query.order('name', { ascending, foreignTable: 'crop_classes' });
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