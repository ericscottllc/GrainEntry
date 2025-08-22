import { supabase } from '../../lib/supabase';
import type {
  CropClass,
  MasterRegion,
  RegionAssociation,
  MasterElevator,
  MasterTown
} from './types';

// Master data queries
export const listCropClasses = async (): Promise<CropClass[]> => {
  const { data, error } = await supabase
    .from('crop_classes')
    .select(`
      *,
      master_crops!inner(name, code)
    `)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching crop classes:', error);
    throw error;
  }

  return data || [];
};

export const listRegions = async (): Promise<MasterRegion[]> => {
  const { data, error } = await supabase
    .from('master_regions')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching regions:', error);
    throw error;
  }

  return data || [];
};

export const listRegionsByClass = async (classId: string): Promise<MasterRegion[]> => {
  const { data, error } = await supabase
    .from('region_associations')
    .select(`
      master_regions!inner(
        id,
        name,
        code,
        is_active
      )
    `)
    .eq('is_active', true)
    .eq('class_id', classId)
    .eq('master_regions.is_active', true);

  if (error) {
    console.error('Error fetching regions by class:', error);
    throw error;
  }

  // Extract unique regions from the associations
  const uniqueRegions = new Map();
  data?.forEach(item => {
    const region = item.master_regions;
    if (region && !uniqueRegions.has(region.id)) {
      uniqueRegions.set(region.id, region);
    }
  });

  return Array.from(uniqueRegions.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const listRegionAssociations = async (
  regionId?: string, 
  classId?: string
): Promise<RegionAssociation[]> => {
  let query = supabase
    .from('region_associations')
    .select(`
      *,
      master_elevators!inner(name, code),
      master_towns!inner(name, province),
      master_regions!inner(name, code),
      crop_classes!inner(name, code)
    `)
    .eq('is_active', true);

  if (regionId) {
    query = query.eq('region_id', regionId);
  }

  if (classId) {
    query = query.eq('class_id', classId);
  }

  // Fix the ordering syntax for Supabase
  const { data, error } = await query.order('name', { 
    ascending: true, 
    foreignTable: 'master_elevators' 
  });

  if (error) {
    console.error('Error fetching region associations:', error);
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