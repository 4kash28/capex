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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

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
      "flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm",
      active 
        ? "bg-blue-600 text-white" 
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    )}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

export default function Layout({ children, activePage, setActivePage, isAdmin, userEmail, onLogout }: { 
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
  isAdmin: boolean;
  userEmail?: string;
  onLogout: () => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (!supabase) {
        setIsSupabaseConnected(false);
        return;
      }
      try {
        const { error } = await supabase.from('vendors').select('id').limit(1);
        setIsSupabaseConnected(!error);
      } catch (e) {
        setIsSupabaseConnected(false);
      }
    };
    checkConnection();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'capex', label: 'Add Capex', icon: PlusCircle },
    { id: 'billing', label: 'Monthly Billing', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'vendors', label: 'Vendors', icon: Users },
    ...(isAdmin ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#0B1F3A] text-white shrink-0 border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xl">S</div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">SmartCapex</span>
              <div 
                className={cn(
                  "w-2.5 h-2.5 rounded-full ml-2",
                  isSupabaseConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                )}
                title={isSupabaseConnected ? "Connected to Supabase" : "Not connected to Supabase"}
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
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-medium text-slate-300">{isAdmin ? 'Admin User' : 'Standard User'}</span>
              <span className="text-[10px] text-slate-400">{userEmail || 'Finance Dept'}</span>
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
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
