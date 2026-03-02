import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Receipt, 
  BarChart3, 
  Users, 
  Settings, 
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  Truck,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { AppNotification } from '../types';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 transition-none font-medium text-sm border-l-2",
      active 
        ? "bg-slate-800 text-white border-blue-500" 
        : "text-slate-300 border-transparent hover:bg-slate-800 hover:text-white"
    )}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

export default function Layout({ children, activePage, setActivePage, isAdmin, userEmail, onLogout, isOffline, userProfile, notifications }: { 
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  isAdmin: boolean;
  userEmail?: string;
  onLogout: () => void;
  isOffline?: boolean;
  userProfile?: any;
  notifications: AppNotification[];
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [recentPopup, setRecentPopup] = useState<AppNotification | null>(null);

  useEffect(() => {
    // Only show popup if there are new notifications and it's not the initial load
    if (notifications.length > lastNotificationCount && lastNotificationCount > 0) {
      // Find the newest notification (assuming they are sorted newest first)
      const newNote = notifications[0];
      if (newNote && !newNote.read) {
        setRecentPopup(newNote);
        setTimeout(() => setRecentPopup(null), 5000);
      }
    }
    setLastNotificationCount(notifications.length);
  }, [notifications, lastNotificationCount]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkConnection = async () => {
    if (isOffline) {
      setIsSupabaseConnected(false);
      return;
    }
    
    if (!supabase) {
      setIsSupabaseConnected(false);
      return;
    }
    try {
      const { error } = await supabase.from('vendors').select('id').limit(1);
      setIsSupabaseConnected(!error);
      if (error) console.error('Supabase connection check failed:', error);
    } catch (e) {
      console.error('Supabase connection check exception:', e);
      setIsSupabaseConnected(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, [isOffline]);

  const menuItems = [
    ...(userProfile?.role === 'admin' || userProfile?.role === 'user' ? [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'capex', label: 'Add Capex', icon: PlusCircle },
      { id: 'billing', label: 'Monthly Billing', icon: Receipt },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'vendors', label: 'Vendors', icon: Users },
      { id: 'bill_status', label: 'Bill Status', icon: FileText },
    ] : []),
    ...(userProfile?.role === 'vendor' ? [
      { id: 'vendor_portal', label: 'Vendor Portal', icon: Truck },
    ] : []),
    ...(userProfile?.role === 'security' ? [
      { id: 'security_portal', label: 'Security Portal', icon: Shield },
    ] : []),
    ...(isAdmin && (userProfile?.role === 'admin' || userProfile?.role === 'user') ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#0B1F3A] text-white shrink-0 border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xl">S</div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">ITBMS</span>
              <div 
                className={cn(
                  "w-2.5 h-2.5 rounded-full ml-2 cursor-pointer transition-all hover:scale-125",
                  isOffline 
                    ? "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.8)]" 
                    : isSupabaseConnected 
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
                      : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"
                )}
                title={
                  isOffline 
                    ? "Offline Mode (Local Storage)" 
                    : isSupabaseConnected 
                      ? "Connected to Supabase (Click to refresh)" 
                      : "Not connected to Supabase (Click to retry)"
                }
                onClick={checkConnection}
              />
            </div>

            {/* Desktop Nav */}
            {!isMobile && (
              <nav className="flex items-center gap-1">
                {menuItems.map((item) => (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={activePage === item.id}
                    onClick={() => setActivePage(item.id)}
                  />
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-300 hover:text-white relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#0B1F3A]"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                      <span className="text-[10px] font-bold text-slate-500">{notifications.length} Total</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No notifications</div>
                      ) : (
                        notifications.map(note => (
                          <div key={note.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <p className="text-xs text-slate-800 font-medium mb-1">{note.message}</p>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(note.created_at).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-medium text-slate-300 capitalize">{userProfile?.role || 'User'} Profile</span>
              <span className="text-[10px] text-slate-400">{userEmail || 'ITBMS'}</span>
            </div>
            <div className="w-8 h-8 rounded bg-slate-700 border border-white/10 overflow-hidden">
              <img src="https://picsum.photos/seed/admin/100/100" alt="Avatar" referrerPolicy="no-referrer" />
            </div>
            {isMobile && (
              <button 
                onClick={() => setMobileOpen(!mobileOpen)} 
                className="p-2 text-slate-300 hover:text-white"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white hidden sm:block" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        <AnimatePresence>
          {isMobile && mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#0B1F3A] border-t border-white/10 overflow-hidden"
            >
              <nav className="p-4 flex flex-col gap-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md font-medium text-sm transition-colors",
                      activePage === item.id ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                <button className="flex items-center gap-3 p-3 rounded-md font-medium text-sm text-rose-400 hover:bg-slate-800">
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-[1600px] mx-auto p-6 md:p-8">
          {/* Recent Popup Notification */}
          <AnimatePresence>
            {recentPopup && (
              <motion.div 
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="fixed top-20 right-8 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-[100] border border-white/10 flex items-center gap-4 max-w-md"
              >
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">New Update</h4>
                  <p className="text-xs font-bold leading-relaxed">{recentPopup.message}</p>
                </div>
                <button onClick={() => setRecentPopup(null)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 capitalize">
              {menuItems.find(i => i.id === activePage)?.label || 'Dashboard'}
            </h1>
            <div className="text-sm text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          <motion.div
            key={activePage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="pb-8"
          >
            {children}
          </motion.div>

          <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-medium text-slate-400">
              &copy; {new Date().getFullYear()} ITBMS Portal. All rights reserved.
            </p>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              Designed & Developed by <span className="font-black text-slate-800 tracking-tight">ARtecH Group</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
