export interface NavigationItem {
  id: string;
  title: string;
  icon_name: string;
  subdomain: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  redirect_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NavigationItemInsert {
  title: string;
  icon_name: string;
  subdomain: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  redirect_active?: boolean;
}

export interface NavigationItemUpdate {
  title?: string;
  icon_name?: string;
  subdomain?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  redirect_active?: boolean;
}