import React, { useState } from 'react';
import { BillingRecord } from '../types';
import { CheckCircle2, Circle, Clock, FileText, Search } from 'lucide-react';
import { cn } from '../lib/utils';

const STATUS_STEPS = [
  { id: 'invoice_receive', label: 'Invoice Received' },
  { id: 'invoice_inward', label: 'Invoice Inward' },
  { id: 'account_verification', label: 'Accounts Verification' },
  { id: 'ph_signature', label: 'PH Signature' },
  { id: 'portal_update', label: 'Portal Update' }
];

export default function BillStatus({ 
  entries, 
  onUpdateStatus,
  userRole
}: { 
  entries: BillingRecord[];
  onUpdateStatus: (entryId: string, status: BillingRecord['invoice_status']) => Promise<void>;
  userRole: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredEntries = entries.filter(entry => 
    entry.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.vendor?.name || entry.manual_vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStepIndex = (status?: string) => {
    if (!status) return -1;
    if (status === 'issue' || status === 'delayed') return 0;
    return STATUS_STEPS.findIndex(s => s.id === status);
  };

  const handleStepClick = async (entryId: string, stepId: string, currentStatus?: string) => {
    setUpdatingId(entryId);
    try {
      await onUpdateStatus(entryId, stepId as any);
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Bill Status Tracker</h2>
          <p className="text-sm text-slate-500 mt-1">Track and update the progress of vendor invoices</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search projects or vendors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No entries found</h3>
            <p className="text-slate-500">Try adjusting your search</p>
          </div>
        ) : (
          filteredEntries.slice(0, 1).map(entry => {
            const currentIndex = getStepIndex(entry.invoice_status);
            
            return (
              <div key={entry.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative mt-2">
                  {/* Progress Bar Background */}
                  <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
                  
                  {/* Active Progress Bar */}
                  <div 
                    className="absolute top-5 left-0 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500"
                    style={{ 
                      width: currentIndex >= 0 ? `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' 
                    }}
                  ></div>

                  <div className="flex justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const isCompleted = index <= currentIndex;
                      const isCurrent = index === currentIndex;
                      const isNext = index === currentIndex + 1;
                      
                      let isClickable = true;

                      const isUpdating = updatingId === entry.id;

                      return (
                        <div 
                          key={step.id} 
                          className={cn(
                            "flex flex-col items-center gap-3 relative group",
                            isClickable && !isUpdating ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                          )}
                          onClick={() => {
                            if (isClickable && !isUpdating) {
                              handleStepClick(entry.id, step.id, entry.invoice_status);
                            }
                          }}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 bg-white",
                            isCompleted ? "border-blue-600 text-blue-600" : "border-slate-200 text-slate-300",
                            isCurrent && "shadow-[0_0_0_4px_rgba(37,99,235,0.1)] scale-110",
                            isNext && "border-blue-200 text-blue-300 group-hover:border-blue-400"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isNext ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </div>
                          <span className={cn(
                            "text-xs font-bold text-center max-w-[80px] leading-tight",
                            isCompleted ? "text-slate-900" : "text-slate-400"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
