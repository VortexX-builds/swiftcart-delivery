import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UseMaintenanceResult {
  isMaintenanceMode: boolean;
  isCheckingMaintenance: boolean;
}

/**
 * Fetches the `maintenance_mode` boolean from the `store_settings` table.
 * Defaults to `false` (non-blocking) on any error or misconfiguration so
 * that a DB hiccup never locks the entire storefront.
 */
export function useMaintenance(): UseMaintenanceResult {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsCheckingMaintenance(false);
      return;
    }

    let cancelled = false;

    async function checkMaintenanceMode() {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('maintenance_mode')
          .limit(1)
          .single();

        if (!cancelled) {
          if (error) {
            // Fail open — if we can't read settings, don't block the store
            console.warn('[useMaintenance] Could not fetch store settings:', error.message);
            setIsMaintenanceMode(false);
          } else {
            setIsMaintenanceMode(data?.maintenance_mode ?? false);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[useMaintenance] Unexpected error:', err);
          setIsMaintenanceMode(false);
        }
      } finally {
        if (!cancelled) setIsCheckingMaintenance(false);
      }
    }

    checkMaintenanceMode();
    return () => { cancelled = true; };
  }, []);

  return { isMaintenanceMode, isCheckingMaintenance };
}
