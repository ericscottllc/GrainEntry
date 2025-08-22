import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NavigationItem } from '../types/navigation';

export const useNavigation = () => {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNavigationItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setNavigationItems(data || []);
    } catch (err) {
      console.error('Error fetching navigation items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch navigation items');
      
      // Fallback to default navigation items if database fails
      setNavigationItems([
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon_name: 'BarChart3',
          subdomain: 'dashboard.triggergrain.ca',
          color: 'tg-primary',
          sort_order: 1,
          is_active: true,
          redirect_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'grain-entries',
          title: 'Grain Entries',
          icon_name: 'Grain',
          subdomain: 'grainentries.triggergrain.ca',
          color: 'tg-green',
          sort_order: 2,
          is_active: true,
          redirect_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigationItems();

    // Set up real-time subscription for navigation changes
    const subscription = supabase
      .channel('navigation_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'navigation_items'
        },
        () => {
          // Refetch navigation items when changes occur
          fetchNavigationItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshNavigation = () => {
    fetchNavigationItems();
  };

  return {
    navigationItems,
    loading,
    error,
    refreshNavigation
  };
};