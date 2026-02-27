import React, { useState } from 'react';
import { Send, Calendar } from 'lucide-react';
import { BillingRecord, AppNotification } from '../types';

export default function VendorDashboard({ 
  onCreateEntry,
}: { 
  onCreateEntry: (data: any) => Promise<void>;
}) {
  const [vendorName, setVendorName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedOption, setSelectedOption] = useState<BillingRecord['invoice_status'] | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendorName || !serviceType || !selectedDate || !selectedOption) {
      alert("Please fill all fields and select an option.");
      return;
    }

    setIsSubmitting(true);
    try {
      let label = '';
      if (selectedOption === 'invoice_receive') label = 'Invoice Generated';
      if (selectedOption === 'issue') label = 'Invoice Issue';
      if (selectedOption === 'delayed') label = 'Invoice Delay';

      const newRecord = {
        manual_vendor_name: vendorName,
        service_type: serviceType,
        bill_date: selectedDate,
        invoice_status: selectedOption,
        remarks: `Vendor selected: ${label} on Date: ${selectedDate}`,
        total_amount: 0,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await onCreateEntry(newRecord);
      alert(`Status submitted successfully. It will now reflect in the Admin Bill Status Tracker.`);
      
      // Reset form
      setVendorName('');
      setServiceType('');
      setSelectedDate('');
      setSelectedOption('');
    } catch (error) {
      console.error(error);
      alert("Failed to submit status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest mb-2">Vendor Portal</h2>
        <p className="text-sm text-slate-500 font-bold">Fill in the details, select a date, tick an option, and submit.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Vendor Name</label>
              <input 
                type="text" 
                required
                placeholder="Enter your vendor name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project / Service Type</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Printer Service"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Date</label>
              <div className="relative max-w-xs">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="date" 
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {selectedDate && (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Status</label>
                
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    id="gen" 
                    name="status" 
                    value="invoice_receive"
                    checked={selectedOption === 'invoice_receive'}
                    onChange={() => setSelectedOption('invoice_receive')}
                    className="w-5 h-5 text-blue-600 cursor-pointer"
                  />
                  <label htmlFor="gen" className="text-base font-bold text-slate-700 cursor-pointer">1. Invoice Generated</label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    id="iss" 
                    name="status" 
                    value="issue"
                    checked={selectedOption === 'issue'}
                    onChange={() => setSelectedOption('issue')}
                    className="w-5 h-5 text-blue-600 cursor-pointer"
                  />
                  <label htmlFor="iss" className="text-base font-bold text-slate-700 cursor-pointer">2. Invoice Issue</label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    id="del" 
                    name="status" 
                    value="delayed"
                    checked={selectedOption === 'delayed'}
                    onChange={() => setSelectedOption('delayed')}
                    className="w-5 h-5 text-blue-600 cursor-pointer"
                  />
                  <label htmlFor="del" className="text-base font-bold text-slate-700 cursor-pointer">3. Invoice Delay</label>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !selectedOption}
                  className="mt-6 w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Status'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
