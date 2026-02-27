/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CapexEntryForm from './components/CapexEntryForm';
import BillingManagement from './components/BillingManagement';
import Reports from './components/Reports';
import VendorManagement from './components/VendorManagement';
import VendorDashboard from './components/VendorDashboard';
import SecurityDashboard from './components/SecurityDashboard';
import BillStatus from './components/BillStatus';
import Login from './components/Login';
import { localDB } from './lib/localDB';
import { 
  Vendor, 
  Department, 
  CapexEntry, 
  BillingRecord, 
  DashboardStats,
  UserRole,
  AppNotification
} from './types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { AlertCircle, Settings as SettingsIcon } from 'lucide-react';

const MOCK_VENDORS: Vendor[] = []; // Removed mock data as we use localDB now
const MOCK_DEPARTMENTS: Department[] = [];
const MOCK_CAPEX: CapexEntry[] = [];
const MOCK_BILLING: BillingRecord[] = [];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [billingVendors, setBillingVendors] = useState<Vendor[]>([
    { id: 'b1', name: 'Canon India Pvt Ltd' },
    { id: 'b2', name: 'Airtel Service' },
    { id: 'b3', name: 'EkowebTech' },
    { id: 'b4', name: 'Morya Enterprises' },
    { id: 'b5', name: 'Proline' },
    { id: 'b6', name: 'Enopia' },
    { id: 'other', name: 'Other' }
  ]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [capexEntries, setCapexEntries] = useState<CapexEntry[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBudget: 0,
    monthlyLimit: 0,
    totalConsumed: 0,
    monthlyConsumed: 0,
    remainingBudget: 0,
    billingTotalBudget: 0,
    billingMonthlyLimit: 0,
    billingTotalConsumed: 0,
    billingMonthlyConsumed: 0,
    billingRemainingBudget: 0
  });
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [billingTotalBudget, setBillingTotalBudget] = useState(0);
  const [billingMonthlyLimit, setBillingMonthlyLimit] = useState(0);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase!.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.error('Auth error:', error);
          // Fallback to offline mode on auth fetch failure
          setIsOffline(true);
          const localSession = localStorage.getItem('local_session');
          if (localSession) {
            setSession({ user: { email: localSession } } as any);
          }
        } else {
          setSession(session);
        }
        setSessionChecked(true);
      }).catch(err => {
        console.error('Auth fetch exception:', err);
        setIsOffline(true);
        const localSession = localStorage.getItem('local_session');
        if (localSession) {
          setSession({ user: { email: localSession } } as any);
        }
        setSessionChecked(true);
      });

      const {
        data: { subscription },
      } = supabase!.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    } else {
      const localSession = localStorage.getItem('local_session');
      if (localSession) {
        setSession({ user: { email: localSession } } as any);
      }
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.email) {
        if (isSupabaseConfigured) {
          try {
            const { data, error } = await supabase!
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.email)
              .single();
            
            if (data) {
              setUserProfile(data);
              return;
            }
            if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
              console.error('Error fetching Supabase profile:', error);
            }
          } catch (e) {
            // Silent catch for missing table
          }
        }

        // Fallback to localDB
        await localDB.initMockData();
        const profiles = await localDB.getAll<any>('user_profiles');
        const profile = profiles.find(p => p.id === session.user.email);
        const defaultRole = session.user.email.includes('admin') ? 'admin' : 'user';
        setUserProfile(profile || { id: session.user.email, role: defaultRole, name: defaultRole === 'admin' ? 'Admin' : 'User' });
      } else {
        setUserProfile(null);
      }
    };
    fetchProfile();
  }, [session]);

  const fetchNotifications = useCallback(async () => {
    let notes: AppNotification[] = [];
    try {
      if (isOffline || !isSupabaseConfigured) {
        notes = await localDB.getAll<AppNotification>('notifications');
      } else {
        const { data, error } = await supabase.from('notifications').select('*');
        if (error) {
          if (error.code !== 'PGRST205') console.error('Error fetching notifications:', error);
          notes = await localDB.getAll<AppNotification>('notifications');
        } else {
          notes = data || [];
        }
      }

      // If still empty, add some mock data for better UX
      if (notes.length === 0) {
        notes = [
          {
            id: 'mock-1',
            message: 'System initialized and ready for updates.',
            type: 'info',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            read: true
          },
          {
            id: 'mock-2',
            message: 'Vendor Portal is now active for all assigned vendors.',
            type: 'success',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            read: true
          }
        ];
      }
    } catch (e) {
      console.error('Notification fetch failed:', e);
    }
    
    setNotifications(notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  }, [isOffline]);

  useEffect(() => {
    fetchNotifications();
    
    // Faster polling for real-time feel (2 seconds)
    const interval = setInterval(fetchNotifications, 2000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLogout = async () => {
    if (isOffline) {
      setIsOffline(false);
      setSession(null);
    } else if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    } else {
      localStorage.removeItem('local_session');
      setSession(null);
    }
  };

  const calculateStats = useCallback((
    entries: CapexEntry[], 
    records: BillingRecord[],
    budget: number, 
    limit: number,
    bBudget: number,
    bLimit: number
  ) => {
    // If budget is 0, consider everything as 0 to avoid negative remaining budgets and confusing stats
    const totalConsumed = budget === 0 ? 0 : entries.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const billingTotalConsumed = bBudget === 0 ? 0 : records.reduce((sum, record) => sum + Number(record.total_amount), 0);
    
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const monthlyConsumed = (budget === 0 || limit === 0) ? 0 : entries.reduce((sum, entry) => {
      const entryDate = new Date(entry.entry_date);
      if (isWithinInterval(entryDate, { start: monthStart, end: monthEnd })) {
        return sum + Number(entry.amount);
      }
      return sum;
    }, 0);

    const billingMonthlyConsumed = (bBudget === 0 || bLimit === 0) ? 0 : records.reduce((sum, record) => {
      const billDate = new Date(record.bill_date);
      if (isWithinInterval(billDate, { start: monthStart, end: monthEnd })) {
        return sum + Number(record.total_amount);
      }
      return sum;
    }, 0);

    setStats({
      totalBudget: budget,
      monthlyLimit: limit,
      totalConsumed,
      monthlyConsumed,
      remainingBudget: budget === 0 ? 0 : budget - totalConsumed,
      billingTotalBudget: bBudget,
      billingMonthlyLimit: bLimit,
      billingTotalConsumed,
      billingMonthlyConsumed,
      billingRemainingBudget: bBudget === 0 ? 0 : bBudget - billingTotalConsumed
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!sessionChecked && !isOffline) return;

    setLoading(true);

    if (isOffline || !isSupabaseConfigured) {
      try {
        await localDB.initMockData();
        const vendors = await localDB.getAll<Vendor>('vendors');
        const departments = await localDB.getAll<Department>('departments');
        const capex = await localDB.getAll<CapexEntry>('capex_entries');
        const billing = await localDB.getAll<BillingRecord>('billing_records');
        const settings = await localDB.getAll<{key: string, value: string}>('settings');

        setVendors(vendors);
        setDepartments(departments);
        setCapexEntries(capex.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()));
        setBillingRecords(billing.sort((a, b) => {
          const timeA = new Date(a.updated_at || a.created_at || a.bill_date || 0).getTime();
          const timeB = new Date(b.updated_at || b.created_at || b.bill_date || 0).getTime();
          return timeB - timeA;
        }));

        let currentBudget = 0;
        let currentLimit = 0;
        let bBudget = 0;
        let bLimit = 0;

        const budget = settings.find(s => s.key === 'total_capex_budget');
        const limit = settings.find(s => s.key === 'monthly_capex_limit');
        const billingBudget = settings.find(s => s.key === 'total_billing_budget');
        const billingLimit = settings.find(s => s.key === 'monthly_billing_limit');

        if (budget) currentBudget = Number(budget.value);
        if (limit) currentLimit = Number(limit.value);
        if (billingBudget) bBudget = Number(billingBudget.value);
        if (billingLimit) bLimit = Number(billingLimit.value);

        setTotalBudget(currentBudget);
        setMonthlyLimit(currentLimit);
        setBillingTotalBudget(bBudget);
        setBillingMonthlyLimit(bLimit);
        calculateStats(capex, billing, currentBudget, currentLimit, bBudget, bLimit);
      } catch (error) {
        console.error('Error fetching from LocalDB:', error);
        alert('Failed to load local data.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const [vRes, dRes, cRes, bRes, sRes] = await Promise.all([
        supabase.from('vendors').select('*').order('name'),
        supabase.from('departments').select('*').order('name'),
        supabase.from('capex_entries').select('*, vendor:vendors(*), department:departments(*)').order('entry_date', { ascending: false }),
        supabase.from('billing_records').select('*, vendor:vendors(*)').order('bill_date', { ascending: false }),
        supabase.from('settings').select('*')
      ]);

      if (vRes.error) console.error('Vendors fetch error:', vRes.error);
      if (dRes.error) console.error('Departments fetch error:', dRes.error);
      if (cRes.error) console.error('Capex fetch error:', cRes.error);
      if (bRes.error) console.error('Billing fetch error:', bRes.error);
      if (sRes.error) console.error('Settings fetch error:', sRes.error);

      if (vRes.error || dRes.error || cRes.error || bRes.error) {
        const errorMsg = vRes.error?.message || dRes.error?.message || cRes.error?.message || bRes.error?.message;
        console.error('Full error details:', { vRes, dRes, cRes, bRes });
        
        if (errorMsg && errorMsg !== 'Failed to fetch') {
           if (errorMsg.includes('permission') || errorMsg.includes('does not exist')) {
             alert(`Database Error: ${errorMsg}. Please check your schema and policies.`);
           } else {
             console.warn('Data fetch warning:', errorMsg);
           }
        } else if (errorMsg === 'Failed to fetch' || errorMsg?.includes('Failed to fetch')) {
           console.warn('Network error fetching from Supabase. Falling back to local data.');
           setIsOffline(true);
           return; // The useEffect will re-trigger fetchData with isOffline=true
        }
      }

      if (vRes.data) setVendors(vRes.data);
      if (dRes.data) setDepartments(dRes.data);
      if (cRes.data) setCapexEntries(cRes.data);
      if (bRes.data) {
        setBillingRecords(bRes.data.sort((a: any, b: any) => {
          const timeA = new Date(a.updated_at || a.created_at || a.bill_date || 0).getTime();
          const timeB = new Date(b.updated_at || b.created_at || b.bill_date || 0).getTime();
          return timeB - timeA;
        }));
      }

      let currentBudget = 0;
      let currentLimit = 0;
      let bBudget = 0;
      let bLimit = 0;
      
      if (sRes.data) {
        const budget = sRes.data.find(s => s.key === 'total_capex_budget');
        const limit = sRes.data.find(s => s.key === 'monthly_capex_limit');
        const billingBudget = sRes.data.find(s => s.key === 'total_billing_budget');
        const billingLimit = sRes.data.find(s => s.key === 'monthly_billing_limit');

        if (budget) currentBudget = Number(budget.value);
        if (limit) currentLimit = Number(limit.value);
        if (billingBudget) bBudget = Number(billingBudget.value);
        if (billingLimit) bLimit = Number(billingLimit.value);
      }

      setTotalBudget(currentBudget);
      setMonthlyLimit(currentLimit);
      setBillingTotalBudget(bBudget);
      setBillingMonthlyLimit(bLimit);
      calculateStats(cRes.data || [], bRes.data || [], currentBudget, currentLimit, bBudget, bLimit);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.message === 'Failed to fetch' || error.message?.includes('Failed to fetch')) {
        console.warn('Network error fetching from Supabase. Falling back to local data.');
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
    }
  }, [calculateStats, totalBudget, monthlyLimit, sessionChecked, isOffline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Use fetchData as dependency

  // Recalculate stats whenever entries or limits change
  useEffect(() => {
    calculateStats(capexEntries, billingRecords, totalBudget, monthlyLimit, billingTotalBudget, billingMonthlyLimit);
  }, [capexEntries, billingRecords, totalBudget, monthlyLimit, billingTotalBudget, billingMonthlyLimit, calculateStats]);

  const handleAddCapex = async (data: any) => {
    let newEntries = [...capexEntries];
    if (isOffline || !isSupabaseConfigured) {
      const vendor = vendors.find(v => v.id === data.vendor_id);
      const department = departments.find(d => d.id === data.department_id);
      const newEntry = { 
        ...data, 
        id: Math.random().toString(), 
        vendor, 
        department
      };
      await localDB.add('capex_entries', newEntry);
      await fetchData();
      newEntries = [newEntry, ...capexEntries]; // Optimistic update
    } else {
      // Strip fields that might not exist in Supabase schema to prevent errors
      const { manual_department_name, manual_vendor_name, ...supabaseData } = data;
      
      // If there's a manual name, we can append it to remarks so it's not lost
      if (manual_department_name) {
        supabaseData.remarks = (supabaseData.remarks ? supabaseData.remarks + " | " : "") + `Dept: ${manual_department_name}`;
      }
      if (manual_vendor_name) {
        supabaseData.remarks = (supabaseData.remarks ? supabaseData.remarks + " | " : "") + `Vendor: ${manual_vendor_name}`;
      }

      const { error } = await supabase.from('capex_entries').insert([supabaseData]);
      if (error) throw error;
      await fetchData();
      const { data: cRes } = await supabase.from('capex_entries').select('*');
      if (cRes) newEntries = cRes;
    }

    // Check limits after adding
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const totalConsumed = newEntries.reduce((sum, e) => sum + Number(e.amount), 0);
    const monthlyConsumed = newEntries
      .filter(e => {
        const d = new Date(e.entry_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (totalBudget > 0 && totalConsumed > totalBudget) {
      alert('WARNING: Total CAPEX Budget has been exceeded!');
    } else if (monthlyLimit > 0 && monthlyConsumed > monthlyLimit) {
      alert('WARNING: Monthly CAPEX Limit has been exceeded!');
    }
  };

  const handleUpdateBillingStatus = async (id: string, status: 'Paid' | 'Pending' | 'PO Pending') => {
    if (isOffline || !isSupabaseConfigured) {
      const record = billingRecords.find(r => r.id === id);
      if (record) {
        await localDB.update('billing_records', { ...record, payment_status: status });
        await fetchData();
      }
      return;
    }
    const { error } = await supabase
      .from('billing_records')
      .update({ payment_status: status })
      .eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  const handleUpdateInvoiceStatus = async (entryId: string, status: BillingRecord['invoice_status'], vendorRemarks?: string) => {
    const entry = billingRecords.find(e => e.id === entryId);
    
    let finalRemarks = entry?.remarks || '';
    if (vendorRemarks) {
      const timestamp = new Date().toLocaleString();
      finalRemarks = (finalRemarks ? finalRemarks + "\n\n" : "") + `[Vendor Update ${timestamp}]: ${vendorRemarks}`;
    }

    if (entry) {
      const updatedEntry = { 
        ...entry, 
        invoice_status: status,
        remarks: finalRemarks,
        updated_at: new Date().toISOString(),
        invoice_generated_at: status === 'invoice_receive' ? new Date().toISOString() : entry.invoice_generated_at,
        invoice_mailed_at: status === 'invoice_inward' ? new Date().toISOString() : entry.invoice_mailed_at,
        bill_inwarded_at: status === 'account_verification' ? new Date().toISOString() : entry.bill_inwarded_at,
      };

      if (isOffline || !isSupabaseConfigured) {
        await localDB.update('billing_records', updatedEntry);
      } else {
        const { error } = await supabase.from('billing_records').update({
          invoice_status: status,
          remarks: finalRemarks,
          updated_at: updatedEntry.updated_at,
          invoice_generated_at: updatedEntry.invoice_generated_at,
          invoice_mailed_at: updatedEntry.invoice_mailed_at,
          bill_inwarded_at: updatedEntry.bill_inwarded_at
        }).eq('id', entryId);
        if (error) throw error;
      }
    }
    
    await fetchData();

    // Create notification
    let message = '';
    const vendorName = entry?.vendor?.name || userProfile?.name || 'Vendor';
    const projectDesc = entry?.service_type || 'General Update';

    if (status === 'invoice_receive') message = `Invoice received for ${projectDesc}.`;
    if (status === 'invoice_inward') message = `Invoice inwarded for ${projectDesc}.`;
    if (status === 'account_verification') message = `Account verification completed for ${projectDesc}.`;
    if (status === 'ph_signature') message = `PH Signature completed for ${projectDesc}.`;
    if (status === 'portal_update') message = `Portal update completed for ${projectDesc}.`;
    if (status === 'delayed') message = `Vendor ${vendorName} reported a DELAY in generating invoice for ${projectDesc}.`;
    if (status === 'issue') {
      if (userProfile?.role === 'security') {
        message = `Security reported an INWARD ISSUE for ${projectDesc}.`;
      } else {
        message = `Vendor ${vendorName} reported an ISSUE with ${projectDesc}.`;
      }
    }

    if (vendorRemarks && message) {
      message += ` | Remark: ${vendorRemarks}`;
    }

    const notification: AppNotification = {
      id: Math.random().toString(),
      message,
      type: status === 'issue' || status === 'delayed' ? 'warning' : 'info',
      created_at: new Date().toISOString(),
      read: false
    };
    
    if (isOffline || !isSupabaseConfigured) {
      await localDB.add('notifications', notification);
    } else {
      const { error: nError } = await supabase.from('notifications').insert([notification]);
      if (nError) {
        console.warn('Could not save notification to Supabase. Fallback to local.', nError.message);
        await localDB.add('notifications', notification);
      }
    }

    await fetchNotifications();
  };

  const handleAddVendor = async (vendor: Partial<Vendor>) => {
    if (isOffline || !isSupabaseConfigured) {
      await localDB.add('vendors', { ...vendor, id: Math.random().toString() } as Vendor);
      await fetchData();
      return;
    }
    const { error } = await supabase.from('vendors').insert([vendor]);
    if (error) throw error;
    await fetchData();
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    if (isOffline || !isSupabaseConfigured) {
      await localDB.delete('vendors', id);
      await fetchData();
      return;
    }
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // Prepare Chart Data
  const monthlyChartData = capexEntries.reduce((acc: any[], entry) => {
    const date = new Date(entry.entry_date);
    const month = date.toLocaleString('default', { month: 'short' });
    const existing = acc.find(a => a.month === month);
    if (existing) {
      existing.amount += Number(entry.amount);
    } else {
      acc.push({ month, amount: Number(entry.amount) });
    }
    return acc;
  }, []).reverse();

  const quarterlyChartData = capexEntries.reduce((acc: any[], entry) => {
    const date = new Date(entry.entry_date);
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const year = date.getFullYear();
    const label = `Q${quarter} ${year}`;
    const sortKey = year * 10 + quarter;
    const existing = acc.find(a => a.label === label);
    if (existing) {
      existing.amount += Number(entry.amount);
    } else {
      acc.push({ label, amount: Number(entry.amount), sortKey });
    }
    return acc;
  }, []).sort((a, b) => a.sortKey - b.sortKey);

  const vendorChartData = capexEntries.reduce((acc: any[], entry) => {
    const name = entry.vendor?.name || 'Unknown';
    const existing = acc.find(a => a.name === name);
    if (existing) {
      existing.value += Number(entry.amount);
    } else {
      acc.push({ name, value: Number(entry.amount) });
    }
    return acc;
  }, []);

  const handleUpdateSettings = async (newBudget: number, newLimit: number, newBBudget: number, newBLimit: number) => {
    if (isOffline || !isSupabaseConfigured) {
      await localDB.update('settings', { key: 'total_capex_budget', value: newBudget.toString() });
      await localDB.update('settings', { key: 'monthly_capex_limit', value: newLimit.toString() });
      await localDB.update('settings', { key: 'total_billing_budget', value: newBBudget.toString() });
      await localDB.update('settings', { key: 'monthly_billing_limit', value: newBLimit.toString() });
      await fetchData();
      alert('Settings updated locally!');
      return;
    }
    
    try {
      // Upsert settings to ensure they are created if they don't exist
      await Promise.all([
        supabase.from('settings').upsert({ key: 'total_capex_budget', value: newBudget.toString() }, { onConflict: 'key' }),
        supabase.from('settings').upsert({ key: 'monthly_capex_limit', value: newLimit.toString() }, { onConflict: 'key' }),
        supabase.from('settings').upsert({ key: 'total_billing_budget', value: newBBudget.toString() }, { onConflict: 'key' }),
        supabase.from('settings').upsert({ key: 'monthly_billing_limit', value: newBLimit.toString() }, { onConflict: 'key' })
      ]);
      await fetchData();
      alert('Settings updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update settings.');
    }
  };

  const handleAddBillingRecord = async (data: any) => {
    let newRecords = [...billingRecords];
    if (isOffline || !isSupabaseConfigured) {
      const vendor = vendors.find(v => v.id === data.vendor_id);
      const newRecord = { 
        ...data, 
        id: Math.random().toString(), 
        vendor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await localDB.add('billing_records', newRecord);
      await fetchData();
      newRecords = [newRecord, ...billingRecords];
    } else {
      // Strip fields that might not exist in Supabase schema
      const { manual_vendor_name, ...supabaseData } = data;
      
      if (manual_vendor_name) {
        supabaseData.remarks = (supabaseData.remarks ? supabaseData.remarks + " | " : "") + `Vendor: ${manual_vendor_name}`;
      }

      const { error } = await supabase.from('billing_records').insert([supabaseData]);
      if (error) throw error;
      await fetchData();
      const { data: bRes } = await supabase.from('billing_records').select('*');
      if (bRes) newRecords = bRes;
    }

    // Check limits after adding
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const totalConsumed = newRecords.reduce((sum, r) => sum + Number(r.total_amount), 0);
    const monthlyConsumed = newRecords
      .filter(r => {
        const d = new Date(r.bill_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + Number(r.total_amount), 0);

    if (billingTotalBudget > 0 && totalConsumed > billingTotalBudget) {
      alert('WARNING: Total Billing Budget has been exceeded!');
    } else if (billingMonthlyLimit > 0 && monthlyConsumed > billingMonthlyLimit) {
      alert('WARNING: Monthly Billing Limit has been exceeded!');
    }
  };

  const renderPage = (isAdmin: boolean) => {
    if (userProfile?.role === 'vendor') {
      const vendorEntries = userProfile.vendor_id 
        ? billingRecords.filter(e => e.vendor_id === userProfile.vendor_id)
        : billingRecords;
      
      if (activePage === 'bill_status') {
        return <BillStatus entries={vendorEntries} onUpdateStatus={handleUpdateInvoiceStatus} userRole={userProfile?.role || 'user'} />;
      }
      
      return <VendorDashboard onCreateEntry={handleAddBillingRecord} />;
    }

    if (userProfile?.role === 'security') {
      return <SecurityDashboard entries={billingRecords} onInward={handleUpdateInvoiceStatus} notifications={notifications} />;
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={stats} 
            monthlyData={monthlyChartData} 
            quarterlyData={quarterlyChartData}
            vendorData={vendorChartData} 
            capexEntries={capexEntries}
            onReview={() => setActivePage('alerts')}
            notifications={notifications}
          />
        );
      case 'capex':
        return <CapexEntryForm vendors={vendors} departments={departments} onSubmit={handleAddCapex} />;
      case 'billing':
        return (
          <BillingManagement 
            records={billingRecords} 
            vendors={billingVendors} 
            onUpdateStatus={handleUpdateBillingStatus} 
            onAddRecord={handleAddBillingRecord}
          />
        );
      case 'reports':
        return <Reports billingRecords={billingRecords} />;
      case 'bill_status':
        return <BillStatus entries={billingRecords} onUpdateStatus={handleUpdateInvoiceStatus} userRole={userProfile?.role || 'user'} />;
      case 'vendors':
        return <VendorManagement vendors={vendors} capexEntries={capexEntries} billingRecords={billingRecords} onAdd={handleAddVendor} onDelete={handleDeleteVendor} isAdmin={isAdmin} />;
      case 'settings':
        if (!isAdmin) return <div className="p-8 text-center text-slate-500 font-bold">Access Denied. Admin only.</div>;
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">System Settings</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateSettings(
                Number(formData.get('totalBudget')),
                Number(formData.get('monthlyLimit')),
                Number(formData.get('billingTotalBudget')),
                Number(formData.get('billingMonthlyLimit'))
              );
            }} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Capex Budget Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total CAPEX Budget (₹)</label>
                    <input 
                      name="totalBudget"
                      type="number" 
                      defaultValue={totalBudget}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Capex Limit (₹)</label>
                    <input 
                      name="monthlyLimit"
                      type="number" 
                      defaultValue={monthlyLimit}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Monthly Billing Budget Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total Billing Budget (₹)</label>
                    <input 
                      name="billingTotalBudget"
                      type="number" 
                      defaultValue={billingTotalBudget}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Billing Limit (₹)</label>
                    <input 
                      name="billingMonthlyLimit"
                      type="number" 
                      defaultValue={billingMonthlyLimit}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-black transition-all uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20">
                Update Configuration
              </button>
            </form>
          </div>
        );
      default:
        return (
          <Dashboard 
            stats={stats} 
            monthlyData={monthlyChartData} 
            quarterlyData={quarterlyChartData}
            vendorData={vendorChartData} 
            capexEntries={capexEntries}
            onReview={() => setActivePage('alerts')}
            notifications={notifications}
          />
        );
    }
  };

  if (!session && !isOffline) {
    return <Login 
      onLogin={(email) => {
        localStorage.setItem('local_session', email);
        setSession({ user: { email: email } } as any);
      }} 
      onOfflineLogin={() => {
        setIsOffline(true);
        setSession({ user: { email: 'offline@local' } } as any);
      }}
    />;
  }

  const isAdmin = session?.user?.email?.includes('admin') || isOffline; // Offline user is admin

  return (
    <Layout 
      activePage={activePage} 
      setActivePage={setActivePage} 
      isAdmin={isAdmin} 
      userEmail={isOffline ? 'Offline Mode' : session?.user.email}
      onLogout={handleLogout}
      isOffline={isOffline}
      userProfile={userProfile}
      notifications={notifications}
    >
      {renderPage(isAdmin)}
    </Layout>
  );
}
