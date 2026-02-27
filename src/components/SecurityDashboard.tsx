import React from 'react';
import { Shield, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { BillingRecord, AppNotification } from '../types';
import BillStatus from './BillStatus';

export default function SecurityDashboard({ 
  entries, 
  onInward,
  notifications
}: { 
  entries: BillingRecord[]; 
  onInward: (entryId: string, status: BillingRecord['invoice_status'], remarks?: string) => Promise<void>;
  notifications: AppNotification[];
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-2">Security Portal</h2>
        <p className="text-sm text-slate-500 font-bold">Track and update invoice inward status directly.</p>
      </div>

      <BillStatus entries={entries} onUpdateStatus={onInward} userRole="security" />

      {/* Recent Activity Logs */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Recent Activity Logs
        </h3>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium text-center py-4">No recent activity.</p>
          ) : (
            notifications.slice(0, 5).map((note) => (
              <div key={note.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="mt-0.5">
                  {note.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                   note.type === 'warning' ? <AlertCircle className="w-5 h-5 text-amber-500" /> :
                   <Info className="w-5 h-5 text-blue-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{note.message}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">{new Date(note.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
