import React, { useState } from 'react';
import { BillingRecord } from '../types';
import { CheckCircle2, Circle, Clock, FileText, Search, FileCheck, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [viewingDoc, setViewingDoc] = useState<{url: string, title: string} | null>(null);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-2d p-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Bill Status Tracker</h2>
          <p className="text-sm text-slate-500 mt-1 font-bold">Track and update the progress of vendor invoices</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search projects or vendors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-2d w-full !pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="card-2d p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">No entries found</h3>
            <p className="text-slate-500 font-bold">Try adjusting your search</p>
          </div>
        ) : (
          filteredEntries.map(entry => {
            const currentIndex = getStepIndex(entry.invoice_status);
            
            return (
              <div key={entry.id} className="card-2d p-6">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">{entry.vendor?.name || entry.manual_vendor_name || 'Unknown Vendor'}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm font-bold text-slate-500">
                        Invoice: <span className="text-slate-900">{entry.invoice_number || 'N/A'}</span> | 
                        Amount: <span className="text-slate-900">₹{entry.total_amount.toLocaleString('en-IN')}</span> | 
                        Date: <span className="text-slate-900">{new Date(entry.bill_date).toLocaleDateString('en-IN')}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        {entry.bill_url && (
                          <button 
                            onClick={() => setViewingDoc({ url: entry.bill_url!, title: 'Invoice Document' })}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors w-fit max-w-[120px]"
                            title={entry.bill_file_name || 'View Invoice'}
                          >
                            <FileText className="w-3 h-3 shrink-0" /> 
                            <span className="truncate">{entry.bill_file_name || 'Invoice'}</span>
                          </button>
                        )}
                        {entry.po_url && (
                          <button 
                            onClick={() => setViewingDoc({ url: entry.po_url!, title: 'Purchase Order' })}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors w-fit max-w-[120px]"
                            title={entry.po_file_name || 'View PO'}
                          >
                            <FileCheck className="w-3 h-3 shrink-0" /> 
                            <span className="truncate">{entry.po_file_name || 'PO'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2",
                    entry.payment_status === 'Paid' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    entry.payment_status === 'Pending' ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-700 border-slate-200"
                  )}>
                    {entry.payment_status}
                  </span>
                </div>

                <div className="relative mt-2">
                  {/* Progress Bar Background */}
                  <div className="absolute top-5 left-0 w-full h-2 bg-slate-100 border-y-2 border-slate-900 -z-10"></div>
                  
                  {/* Active Progress Bar */}
                  <div 
                    className="absolute top-5 left-0 h-2 bg-blue-600 border-y-2 border-slate-900 -z-10 transition-all duration-500"
                    style={{ 
                      width: currentIndex >= 0 ? `${(currentIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' 
                    }}
                  ></div>

                  <div className="flex justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const isCompleted = index <= currentIndex;
                      const isCurrent = index === currentIndex;
                      const isNext = index === currentIndex + 1;
                      
                      let isClickable = false;
                      if (userRole === 'admin') {
                        isClickable = true;
                      } else if (userRole === 'security' && step.id === 'invoice_inward') {
                        isClickable = true;
                      } else if (userRole === 'accounts' && step.id === 'account_verification') {
                        isClickable = true;
                      } else if (userRole === 'vendor' && step.id === 'invoice_receive') {
                        isClickable = true;
                      }

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
                            "w-10 h-10 flex items-center justify-center transition-all duration-300 border-2 bg-white",
                            isCompleted ? "border-slate-900 bg-blue-100 text-blue-600 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]" : "border-slate-300 text-slate-300",
                            isCurrent && "scale-110",
                            isNext && "border-blue-200 text-blue-300 group-hover:border-blue-400 group-hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
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
                            "text-[10px] font-black uppercase tracking-widest text-center max-w-[80px] leading-tight mt-2",
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

      {/* Document Viewing Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                  {viewingDoc.title}
                </h3>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-slate-100/50 flex items-center justify-center min-h-[50vh]">
                {viewingDoc.url.startsWith('data:image/') ? (
                  <img 
                    src={viewingDoc.url} 
                    alt={viewingDoc.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  />
                ) : viewingDoc.url.startsWith('data:application/pdf') ? (
                  <iframe 
                    src={viewingDoc.url} 
                    className="w-full h-full min-h-[70vh] rounded-lg shadow-sm border-0"
                    title={viewingDoc.title}
                  />
                ) : (
                  <div className="text-center space-y-4">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto" />
                    <p className="text-slate-500 font-medium">
                      Document format not supported for direct viewing.<br/>
                      <a href={viewingDoc.url} download className="text-blue-600 hover:underline">Click here to download</a>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
