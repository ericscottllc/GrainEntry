// Types for Grain Entry system
export interface CropClass {
  id: string;
  crop_id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  master_crops?: { name: string; code: string };
}

export interface MasterRegion {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface RegionAssociation {
  id: string;
  region_id: string;
  elevator_id: string;
  town_id: string;
  class_id: string;
  crop_comparison_id: string;
  is_active: boolean;
  master_elevators?: { name: string; code: string };
  master_towns?: { name: string; province: string };
  master_regions?: { name: string; code: string };
  crop_classes?: { name: string; code: string };
}

export interface GrainEntry {
  id: string;
  date: string;
  class_id: string;
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
  crop_classes?: { 
    name: string; 
    code: string;
    master_crops?: { name: string; code: string };
  };
  master_elevators?: { name: string; code: string };
  master_towns?: { name: string; province: string };
}

export interface GrainEntryInsert {
  date: string;
  class_id: string;
  elevator_id: string;
  town_id: string;
  month: string;
  year: number;
  cash_price: number | null;
  futures: number | null;
  notes: string;
}

export interface GrainEntryFilters {
  class_id?: string;
  elevator_id?: string;
  town_id?: string;
  region_id?: string;
  month?: string;
  year?: number;
  date_from?: string;
  date_to?: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
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