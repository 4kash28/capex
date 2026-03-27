import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  X,
  Upload,
  FileCheck,
  Calculator,
  ChevronDown,
  Download,
  Edit
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { BillingRecord, Vendor } from '../types';
import { motion, AnimatePresence } from 'motion/react';

import { generateProfessionalPDF } from '../lib/pdfGenerator';

const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

export default function BillingManagement({ 
  records, 
  vendors,
  onUpdateStatus,
  onAddRecord,
  onUpdateRecord
}: { 
  records: BillingRecord[];
  vendors: Vendor[];
  onUpdateStatus: (id: string, status: 'Paid' | 'Pending' | 'PO Pending') => Promise<void>;
  onAddRecord: (data: any) => Promise<void>;
  onUpdateRecord?: (id: string, data: any) => Promise<void>;
}) {
  const [view, setView] = useState<'landing' | 'records' | 'add' | 'edit'>('landing');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'PO Pending'>('All');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [manualVendorName, setManualVendorName] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{url: string, title: string} | null>(null);

  const generatePDF = (record: BillingRecord) => {
    const doc = generateProfessionalPDF({
      title: 'Billing Expenditure Report',
      subtitle: `Invoice: ${record.invoice_number || 'N/A'}`,
      metadata: {
        'Vendor Name': record.manual_vendor_name || record.vendor?.name || 'N/A',
        'Service Type': record.service_type,
        'Billing Date': formatDate(record.bill_date),
        'Payment Status': record.payment_status,
      }
    }, [
      {
        title: 'Financial Details',
        headers: ['Description', 'Rate (%)', 'Amount (INR)'],
        rows: [
          ['Base Amount', '-', formatCurrency(record.amount).replace('₹', 'Rs. ')],
          [
            record.gst_type === 'CGST + SGST' ? 'CGST' : 'GST',
            record.gst_type === 'CGST + SGST' ? `${record.cgst_rate}%` : `${record.gst_rate}%`,
            formatCurrency(record.gst_type === 'CGST + SGST' ? (record.gst_amount || 0) / 2 : (record.gst_amount || 0)).replace('₹', 'Rs. ')
          ],
          ...(record.gst_type === 'CGST + SGST' ? [[
            'SGST',
            `${record.sgst_rate}%`,
            formatCurrency((record.gst_amount || 0) / 2).replace('₹', 'Rs. ')
          ]] : []),
          [{ content: 'Total Payable', styles: { fontStyle: 'bold' } }, '-', { content: formatCurrency(record.total_amount).replace('₹', 'Rs. '), styles: { fontStyle: 'bold' } }]
        ]
      },
      ...(record.remarks ? [{
        title: 'Internal Remarks',
        headers: ['Remarks'],
        rows: [[record.remarks]]
      }] : [])
    ]);

    doc.save(`Invoice_${record.invoice_number || record.id}.pdf`);
  };

  // Form State
  const [baseAmount, setBaseAmount] = useState<number | ''>('');
  const [gstRate, setGstRate] = useState<number | ''>(18);
  const [cgstRate, setCgstRate] = useState<number | ''>(9);
  const [sgstRate, setSgstRate] = useState<number | ''>(9);
  const [gstType, setGstType] = useState<'CGST + SGST' | 'IGST' | 'Exempted'>('CGST + SGST');
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    const amount = Number(baseAmount) || 0;
    let totalGstRate = 0;
    
    if (gstType === 'CGST + SGST') {
      totalGstRate = (Number(cgstRate) || 0) + (Number(sgstRate) || 0);
    } else if (gstType === 'IGST') {
      totalGstRate = Number(gstRate) || 0;
    }

    const gst = (amount * totalGstRate) / 100;
    setGstAmount(gst);
    setTotalAmount(amount + gst);
  }, [baseAmount, gstRate, cgstRate, sgstRate, gstType]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         record.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || record.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Paid':
        return { label: 'Paid', color: 'bg-emerald-500 text-white', icon: CheckCircle2, border: 'border-emerald-600' };
      case 'PO Pending':
        return { label: 'PO Pending', color: 'bg-amber-500 text-white', icon: Clock, border: 'border-amber-600' };
      default:
        return { label: 'Pending', color: 'bg-slate-400 text-white', icon: Clock, border: 'border-slate-500' };
    }
  };

  const handleEdit = (record: BillingRecord) => {
    setEditingRecord(record);
    setSelectedVendorId(record.vendor_id || 'other');
    setManualVendorName(record.manual_vendor_name || '');
    setBaseAmount(record.amount);
    setGstType(record.gst_type as any);
    setGstRate(record.gst_rate || '');
    setCgstRate(record.cgst_rate || '');
    setSgstRate(record.sgst_rate || '');
    setView('edit');
  };

  if (view === 'landing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl"
        >
          <button 
            onClick={() => setView('records')}
            className="group bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all flex flex-col items-center gap-4 text-center"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">MBR</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Monthly Billing Records</p>
            </div>
            <p className="text-sm text-slate-400 font-medium">View, track and manage all monthly recurring expenditures and invoices.</p>
          </button>

          <button 
            onClick={() => setView('add')}
            className="group bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all flex flex-col items-center gap-4 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Plus className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">New Entry</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Record Expenditure</p>
            </div>
            <p className="text-sm text-slate-400 font-medium">Quickly add a new billing record with GST details and attachments.</p>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => setView('landing')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500"
            title="Back to Menu"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
            {view === 'records' ? 'Monthly Billing Records' : 'New Expenditure Entry'}
          </h2>
          {view === 'records' && (
            <div className="relative flex-1 max-w-md ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search vendor, invoice or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {view === 'records' ? (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['All', 'Paid', 'Pending', 'PO Pending'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    statusFilter === status ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'add' || view === 'edit' ? (
          <motion.div 
            key={view === 'add' ? 'add-form' : 'edit-form'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">
                  {view === 'edit' ? 'Edit IT Expenditure' : 'Record New IT Expenditure'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Audit Protocol V3.0</p>
              </div>
              <button onClick={() => setView('landing')} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              
              const fileToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = error => reject(error);
                });
              };

              const invoiceFile = data.invoice_file as File;
              const poFile = data.po_file as File;
              
              let billUrl = editingRecord?.bill_url;
              let billFileName = editingRecord?.bill_file_name;
              if (invoiceFile && invoiceFile.size > 0) {
                try {
                  billUrl = await fileToBase64(invoiceFile);
                  billFileName = invoiceFile.name;
                } catch (err) {
                  console.error("Error reading invoice file:", err);
                  alert("Failed to read invoice file. Please try again.");
                  return;
                }
              }

              let poUrl = editingRecord?.po_url;
              let poFileName = editingRecord?.po_file_name;
              if (poFile && poFile.size > 0) {
                try {
                  poUrl = await fileToBase64(poFile);
                  poFileName = poFile.name;
                } catch (err) {
                  console.error("Error reading PO file:", err);
                  alert("Failed to read PO file. Please try again.");
                  return;
                }
              }
              
              delete data.invoice_file;
              delete data.po_file;
              
              const isPredefined = selectedVendorId.startsWith('b');
              const vendorName = isPredefined ? vendors.find(v => v.id === selectedVendorId)?.name : (selectedVendorId === 'other' ? manualVendorName : undefined);

              const recordData = {
                ...data,
                service_start_date: data.service_start_date || null,
                vendor_id: data.vendor_id,
                manual_vendor_name: vendorName,
                amount: Number(baseAmount) || 0,
                gst_rate: gstType === 'CGST + SGST' ? (Number(cgstRate) || 0) + (Number(sgstRate) || 0) : (Number(gstRate) || 0),
                cgst_rate: gstType === 'CGST + SGST' ? Number(cgstRate) : undefined,
                sgst_rate: gstType === 'CGST + SGST' ? Number(sgstRate) : undefined,
                gst_type: gstType,
                gst_amount: gstAmount,
                total_amount: totalAmount,
                payment_status: data.payment_status || 'Pending',
                bill_url: billUrl,
                bill_file_name: billFileName,
                po_url: poUrl,
                po_file_name: poFileName,
              };

              try {
                if (view === 'edit' && editingRecord && onUpdateRecord) {
                  await onUpdateRecord(editingRecord.id, recordData);
                  alert('Billing record updated successfully!');
                } else {
                  await onAddRecord(recordData);
                  alert('Billing record added successfully!');
                }
                setView('records');
              } catch (error: any) {
                console.error('Failed to save billing record:', error);
                if (error.message?.includes('vendor_id') && error.message?.includes('not-null constraint')) {
                  alert('Failed to save: The vendor_id column in Supabase must be nullable. Please update your Supabase schema to allow null values for vendor_id.');
                } else {
                  alert('Failed to save billing record: ' + (error.message || 'Unknown error'));
                }
              }
            }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vendor Name *</label>
                    <div className="relative">
                      <select 
                        name="vendor_id" 
                        required 
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {selectedVendorId === 'other' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Manual Vendor Name *</label>
                      <input 
                        name="manual_vendor_name" 
                        required 
                        value={manualVendorName}
                        onChange={(e) => setManualVendorName(e.target.value)}
                        placeholder="Type vendor name here..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Service Type *</label>
                    <input name="service_type" defaultValue={editingRecord?.service_type} required placeholder="e.g. Cloud Hosting, Software License" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Billing Date *</label>
                      <input name="bill_date" type="date" defaultValue={editingRecord?.bill_date} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Status</label>
                      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="payment_status" value="Paid" defaultChecked={editingRecord?.payment_status === 'Paid'} className="sr-only peer" />
                          <div className="py-2 text-center text-[10px] font-black uppercase rounded-lg text-slate-500 peer-checked:bg-emerald-500 peer-checked:text-white transition-all">Paid</div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="payment_status" value="PO Pending" defaultChecked={editingRecord?.payment_status === 'PO Pending'} className="sr-only peer" />
                          <div className="py-2 text-center text-[10px] font-black uppercase rounded-lg text-slate-500 peer-checked:bg-amber-500 peer-checked:text-white transition-all">PO Pending</div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input type="radio" name="payment_status" value="Pending" defaultChecked={!editingRecord || editingRecord.payment_status === 'Pending'} className="sr-only peer" />
                          <div className="py-2 text-center text-[10px] font-black uppercase rounded-lg text-slate-500 peer-checked:bg-slate-500 peer-checked:text-white transition-all">Pending</div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Number *</label>
                    <input name="invoice_number" defaultValue={editingRecord?.invoice_number} required placeholder="e.g. INV-2024-001" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Base Amount (INR) *</label>
                      <input 
                        type="number" 
                        required 
                        value={baseAmount}
                        onChange={(e) => setBaseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        onFocus={(e) => e.target.value === '0' && setBaseAmount('')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GST Type</label>
                      <div className="relative">
                        <select 
                          value={gstType}
                          onChange={(e) => setGstType(e.target.value as any)}
                          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        >
                          <option value="CGST + SGST">CGST + SGST (Intra-state)</option>
                          <option value="IGST">IGST (Inter-state)</option>
                          <option value="Exempted">Exempted / Zero Rated</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                    {gstType === 'CGST + SGST' ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CGST Rate (%)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={cgstRate}
                            onChange={(e) => setCgstRate(e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={(e) => e.target.value === '0' && setCgstRate('')}
                            placeholder="e.g. 9"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SGST Rate (%)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={sgstRate}
                            onChange={(e) => setSgstRate(e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={(e) => e.target.value === '0' && setSgstRate('')}
                            placeholder="e.g. 9"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GST Rate (%)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={gstRate}
                          onChange={(e) => setGstRate(e.target.value === '' ? '' : Number(e.target.value))}
                          onFocus={(e) => e.target.value === '0' && setGstRate('')}
                          disabled={gstType === 'Exempted'}
                          placeholder="e.g. 18"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all disabled:opacity-50" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">GST Amount</p>
                      <p className="text-lg font-black text-blue-600">{formatCurrency(gstAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payable</p>
                      <p className="text-lg font-black text-slate-900">{formatCurrency(totalAmount)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Attachment (PDF)</label>
                  <div className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all text-slate-600">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                      {editingRecord?.bill_file_name || 'Prominent Upload'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      {editingRecord?.bill_url ? 'Click to replace Invoice copy' : 'Click to select Invoice copy'}
                    </p>
                    <input type="file" name="invoice_file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const p = e.target.previousElementSibling as HTMLElement;
                        if (p && p.previousElementSibling) {
                          (p.previousElementSibling as HTMLElement).innerText = file.name;
                        }
                      }
                    }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PO Attachment (PDF)</label>
                  <div className="group relative border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all text-slate-600">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                      {editingRecord?.po_file_name || 'Attach Purchase Order'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      {editingRecord?.po_url ? 'Click to replace PO document' : 'Click to select PO document'}
                    </p>
                    <input type="file" name="po_file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const p = e.target.previousElementSibling as HTMLElement;
                        if (p && p.previousElementSibling) {
                          (p.previousElementSibling as HTMLElement).innerText = file.name;
                        }
                      }
                    }} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Remarks</label>
                <textarea name="remarks" defaultValue={editingRecord?.remarks} rows={3} placeholder="Context or escalation notes for the sourcing team..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none" />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setView('landing')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border border-slate-200 text-slate-600 font-black rounded-xl hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                >
                  <X className="w-4 h-4" />
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20"
                >
                  <FileText className="w-4 h-4" />
                  {view === 'edit' ? 'Update Database' : 'Commit to Database'}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="records-table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendor & Invoice</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Billing Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Base Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">GST</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Payable</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Documents</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => {
                    const statusInfo = getStatusInfo(record.payment_status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-sm">{record.manual_vendor_name || record.vendor?.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">{record.service_type}</span>
                              <span className="text-[10px] text-blue-600 font-black px-1.5 py-0.5 bg-blue-50 rounded">{record.invoice_number}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-bold">{formatDate(record.bill_date)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-600 text-sm">{formatCurrency(record.amount)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-900">{formatCurrency(record.gst_amount || 0)}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase">{record.gst_rate}%</span>
                              <span className="text-[8px] font-black text-blue-500 uppercase">{record.gst_type}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">{formatCurrency(record.total_amount)}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider",
                            statusInfo.color,
                            statusInfo.border
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            {record.bill_url ? (
                              <button 
                                onClick={() => setViewingDoc({ url: record.bill_url!, title: 'Invoice Document' })}
                                className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors w-fit max-w-[120px]"
                                title={record.bill_file_name || 'View Invoice'}
                              >
                                <FileText className="w-3 h-3 shrink-0" /> 
                                <span className="truncate">{record.bill_file_name || 'Invoice'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">No Invoice</span>
                            )}
                            {record.po_url ? (
                              <button 
                                onClick={() => setViewingDoc({ url: record.po_url!, title: 'Purchase Order' })}
                                className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors w-fit max-w-[120px]"
                                title={record.po_file_name || 'View PO'}
                              >
                                <FileCheck className="w-3 h-3 shrink-0" /> 
                                <span className="truncate">{record.po_file_name || 'PO'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">No PO</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {record.payment_status !== 'Paid' && (
                              <>
                                <button 
                                  onClick={() => handleEdit(record)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                  title="Edit Record"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => onUpdateStatus(record.id, 'Paid')}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <div className="flex gap-1">
                              <button 
                                onClick={() => generatePDF(record)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" 
                                title="Download PDF Report"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Calculator className="w-10 h-10 opacity-20" />
                          <p className="text-xs font-black uppercase tracking-widest">No billing records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
