import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  FileText,
  Clock,
  Info
} from 'lucide-react';
import { CapexEntry, AppNotification } from '../types';
import { cn } from '../lib/utils';

export default function VendorDashboard({ 
  entries, 
  onUpdateStatus,
  notifications
}: { 
  entries: CapexEntry[]; 
  onUpdateStatus: (entryId: string, status: CapexEntry['invoice_status'], remarks?: string) => Promise<void>;
  notifications: AppNotification[];
}) {
  const [status, setStatus] = useState<CapexEntry['invoice_status'] | ''>('');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If there are entries, we use the first one as a reference for the update
  // If no entries, we can still send a general update if the backend supports it
  const defaultEntryId = entries.length > 0 ? entries[0].id : 'general_update';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) {
      alert('Please select a status option.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateStatus(defaultEntryId, status as CapexEntry['invoice_status'], remark);
      alert('Update submitted successfully!');
      setStatus('');
      setRemark('');
    } catch (error) {
      console.error(error);
      alert('Failed to submit update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-2">Vendor Portal</h2>
        <p className="text-sm text-slate-500 font-bold">Select a project and submit your invoice status and updates directly to the Admin.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg space-y-8">
        
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Select Invoice Status</label>
          
          <div className="grid grid-cols-1 gap-3">
            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${status === 'generated' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
              <input 
                type="radio" 
                name="status" 
                value="generated"
                checked={status === 'generated'}
                onChange={() => setStatus('generated')}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-5 h-5 ${status === 'generated' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`font-bold ${status === 'generated' ? 'text-blue-900' : 'text-slate-600'}`}>Invoice Generated</span>
              </div>
            </label>

            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${status === 'delayed' ? 'border-amber-600 bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}>
              <input 
                type="radio" 
                name="status" 
                value="delayed"
                checked={status === 'delayed'}
                onChange={() => setStatus('delayed')}
                className="w-5 h-5 text-amber-600"
              />
              <div className="flex items-center gap-3">
                <AlertCircle className={`w-5 h-5 ${status === 'delayed' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className={`font-bold ${status === 'delayed' ? 'text-amber-900' : 'text-slate-600'}`}>Delay in generation</span>
              </div>
            </label>

            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${status === 'issue' ? 'border-rose-600 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}`}>
              <input 
                type="radio" 
                name="status" 
                value="issue"
                checked={status === 'issue'}
                onChange={() => setStatus('issue')}
                className="w-5 h-5 text-rose-600"
              />
              <div className="flex items-center gap-3">
                <AlertCircle className={`w-5 h-5 ${status === 'issue' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className={`font-bold ${status === 'issue' ? 'text-rose-900' : 'text-slate-600'}`}>Other Issue</span>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Remarks / Comments
          </label>
          <textarea 
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Type your message here..."
            className="w-full px-4 py-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all min-h-[120px] font-medium text-slate-700"
          />
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : (
            <>
              <Send className="w-4 h-4" />
              Submit Update to Admin
            </>
          )}
        </button>
      </form>

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
                  <p className="text-sm font-bold text-slate-700">{note.message}</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
