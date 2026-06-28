import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings, Save, ShieldAlert, DollarSign, Wrench } from 'lucide-react';

interface StoreSettings {
  id: string | number;
  maintenance_mode: boolean;
  tax_rate: number;
  support_email: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings>({
    id: '',
    maintenance_mode: false,
    tax_rate: 0,
    support_email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .single();
        
        if (error) {
          // PGRST116 is the error code for "JSON object requested, multiple (or no) rows returned"
          if (error.code !== 'PGRST116') {
            throw error;
          }
        }
        
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching store settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings.id) {
      console.error('No settings ID found to update. Creating new settings not supported in this view.');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          maintenance_mode: settings.maintenance_mode,
          tax_rate: settings.tax_rate,
          support_email: settings.support_email
        })
        .eq('id', settings.id);
        
      if (error) throw error;
      
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating store settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-center py-20">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-brand-accent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Loading platform settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <div className="p-2 bg-brand-accent/10 rounded-lg">
            <Settings className="w-6 h-6 text-brand-accent" />
          </div>
          Platform Settings
        </h2>
        <p className="text-slate-400 mt-2">Manage global configuration, financials, and maintenance mode for the SwiftCart platform.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* General Settings */}
        <div className="bg-brand-surface rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-brand-surface flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-100">General Settings</h3>
          </div>
          <div className="p-6">
            <div className="max-w-xl">
              <label htmlFor="support_email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Support Email Address
              </label>
              <input
                type="email"
                id="support_email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="block w-full px-4 py-2.5 text-slate-100 bg-brand-dark border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors shadow-none"
                placeholder="support@swiftcart.com"
                required
              />
              <p className="mt-2 text-sm text-slate-400">This email will be displayed to customers for support inquiries.</p>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-brand-surface rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-brand-surface flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-100">Financials</h3>
          </div>
          <div className="p-6">
            <div className="max-w-xl">
              <label htmlFor="tax_rate" className="block text-sm font-medium text-slate-300 mb-1.5">
                Global Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="tax_rate"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="block w-full pl-4 pr-12 py-2.5 text-slate-100 bg-brand-dark border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent sm:text-sm transition-colors shadow-none"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 sm:text-sm font-medium">%</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-400">Default tax rate applied to all orders at checkout.</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-brand-surface rounded-xl border border-red-900/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-900/50 bg-red-900/10 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="max-w-xl">
                <h4 className="text-base font-medium text-slate-100 mb-1">Maintenance Mode</h4>
                <p className="text-sm text-slate-400">Enable this to prevent customers from placing new orders while you perform system updates or maintenance.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-900/50 rounded-full peer transition-colors duration-300 ease-in-out peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:shadow-[0_2px_4px_rgba(0,0,0,0.25)] after:transition-transform after:duration-300 after:ease-in-out peer-checked:after:translate-x-7"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          {successMessage && (
            <span className="text-sm font-medium text-emerald-400 bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-800/50 animate-in fade-in slide-in-from-right-4 duration-300">
              Settings saved successfully
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving || !settings.id}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-accent rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-none"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
