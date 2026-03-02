import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Building2, 
  Trash2, 
  Edit2,
  ExternalLink,
  X,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Vendor } from '../types';
import { cn, formatCurrency, formatCurrencyPDF, formatDate } from '../lib/utils';
import * as XLSX from 'xlsx';
import { generateProfessionalPDF } from '../lib/pdfGenerator';

export default function VendorManagement({ 
  vendors, 
  capexEntries,
  billingRecords,
  onAdd, 
  onDelete,
  isAdmin
}: { 
  vendors: Vendor[];
  capexEntries: any[];
  billingRecords: any[];
  onAdd: (vendor: Partial<Vendor>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAdmin: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');
  
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    name: '',
    service_type: '',
    email: '',
    address: '',
    contact_person: ''
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.service_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name) return;
    try {
      await onAdd(newVendor);
      setNewVendor({ name: '', service_type: '', email: '', address: '', contact_person: '' });
      setIsAdding(false);
      alert('Vendor added successfully!');
    } catch (error: any) {
      console.error('Failed to add vendor:', error);
      alert('Failed to add vendor: ' + (error.message || 'Unknown error'));
    }
  };

  const getFilteredExpenses = (vendorId: string) => {
    let capex = capexEntries.filter(e => e.vendor_id === vendorId);
    let billing = billingRecords.filter(r => r.vendor_id === vendorId);

    const applyFilters = (data: any[], dateField: string) => {
      return data.filter(item => {
        const itemDate = new Date(item[dateField]);
        const yearMatch = filterYear === 'All' || itemDate.getFullYear().toString() === filterYear;
        const monthMatch = filterMonth === 'All' || itemDate.toLocaleString('default', { month: 'long' }) === filterMonth;
        const dateMatch = !filterDate || item[dateField] === filterDate;
        return yearMatch && monthMatch && dateMatch;
      });
    };

    capex = applyFilters(capex, 'entry_date');
    billing = applyFilters(billing, 'bill_date');
    
    const totalCapex = capex.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalBilling = billing.reduce((sum, r) => sum + Number(r.total_amount), 0);
    
    return { capex, billing, totalCapex, totalBilling, total: totalCapex + totalBilling };
  };

  const exportVendorReportExcel = (vendor: Vendor) => {
    const expenses = getFilteredExpenses(vendor.id);
    
    const exportData = [
      ...expenses.capex.map(item => ({
        Type: 'Capex',
        Date: item.entry_date,
        Category: item.category,
        Description: item.description,
        Amount: item.amount
      })),
      ...expenses.billing.map(item => ({
        Type: 'Billing',
        Date: item.bill_date,
        Category: item.service_type,
        Description: `Invoice: ${item.invoice_number || 'N/A'}`,
        Amount: item.total_amount
      }))
    ].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

    if (exportData.length === 0) {
      alert('No expenses found for this vendor with the selected filters.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendor Report");
    XLSX.writeFile(wb, `vendor_report_${vendor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportVendorReportPDF = (vendor: Vendor) => {
    const expenses = getFilteredExpenses(vendor.id);
    
    const exportData = [
      ...expenses.capex.map(item => ({
        type: 'Capex',
        date: item.entry_date,
        category: item.category,
        desc: item.description,
        amount: item.amount
      })),
      ...expenses.billing.map(item => ({
        type: 'Billing',
        date: item.bill_date,
        category: item.service_type,
        desc: `Invoice: ${item.invoice_number || 'N/A'}`,
        amount: item.total_amount
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (exportData.length === 0) {
      alert('No expenses found for this vendor with the selected filters.');
      return;
    }

    let filterText = [];
    if (filterYear !== 'All') filterText.push(`Year: ${filterYear}`);
    if (filterMonth !== 'All') filterText.push(`Month: ${filterMonth}`);
    if (filterDate) filterText.push(`Date: ${formatDate(filterDate)}`);

    const doc = generateProfessionalPDF({
      title: 'Vendor Report',
      subtitle: vendor.name,
      metadata: {
        'Category': vendor.service_type || 'N/A',
        'Contact Info': vendor.contact_person ? `${vendor.contact_person} (${vendor.email || vendor.phone || 'N/A'})` : 'N/A',
        'Filters Applied': filterText.length > 0 ? filterText.join(', ') : 'None',
        'Total Capex': formatCurrencyPDF(expenses.totalCapex),
        'Total Billing': formatCurrencyPDF(expenses.totalBilling),
        'Total Spent': formatCurrencyPDF(expenses.total),
      }
    }, [
      {
        title: 'Detailed Expenses',
        headers: ["Type", "Date", "Category", "Description", "Amount"],
        rows: exportData.map(item => [
          item.type,
          formatDate(item.date),
          item.category,
          item.desc,
          formatCurrencyPDF(item.amount)
        ])
      }
    ]);

    doc.save(`vendor_report_${vendor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-2d w-full !pl-9"
          />
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(true)}
            className="btn-2d flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
        <div className="card-2d p-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Add New Vendor</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              placeholder="Vendor Name *"
              required
              value={newVendor.name}
              onChange={e => setNewVendor({...newVendor, name: e.target.value})}
              className="input-2d"
            />
            <input 
              placeholder="Service Type"
              value={newVendor.service_type}
              onChange={e => setNewVendor({...newVendor, service_type: e.target.value})}
              className="input-2d"
            />
            <input 
              placeholder="Contact Person"
              value={newVendor.contact_person}
              onChange={e => setNewVendor({...newVendor, contact_person: e.target.value})}
              className="input-2d"
            />
            <input 
              type="email"
              placeholder="Email"
              value={newVendor.email}
              onChange={e => setNewVendor({...newVendor, email: e.target.value})}
              className="input-2d"
            />
            <input 
              placeholder="Address"
              value={newVendor.address}
              onChange={e => setNewVendor({...newVendor, address: e.target.value})}
              className="input-2d"
            />
            <div className="flex gap-2">
              <button 
                type="submit"
                className="btn-2d flex-1"
              >
                Save
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-2d-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="card-2d p-6 group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-600">
                <Building2 className="w-5 h-5" />
              </div>
              {isAdmin && (
                <div className="flex gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onDelete(vendor.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            
            <h4 className="text-base font-black text-slate-900 mb-1">{vendor.name}</h4>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-4">{vendor.service_type || 'General Vendor'}</p>
            
            <div className="space-y-2">
              {vendor.contact_person && (
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  <span>{vendor.contact_person}</span>
                </div>
              )}
              {vendor.email && (
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${vendor.email}`} className="hover:text-blue-600">{vendor.email}</a>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{vendor.address}</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setSelectedVendor(vendor)}
              className="btn-2d-outline w-full mt-6 flex items-center justify-center gap-2"
            >
              View History
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedVendor.name}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Expense History</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => exportVendorReportExcel(selectedVendor)}
                  className="btn-2d-outline flex items-center gap-2 text-[10px]"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  Excel
                </button>
                <button 
                  onClick={() => exportVendorReportPDF(selectedVendor)}
                  className="btn-2d-outline flex items-center gap-2 text-[10px]"
                >
                  <FileText className="w-3 h-3 text-rose-600" />
                  PDF
                </button>
                <button 
                  onClick={() => setSelectedVendor(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              {(() => {
                const expenses = getFilteredExpenses(selectedVendor.id);
                const allExpenses = [
                  ...expenses.capex.map(item => ({
                    type: 'Capex',
                    date: item.entry_date,
                    category: item.category,
                    desc: item.description,
                    amount: item.amount
                  })),
                  ...expenses.billing.map(item => ({
                    type: 'Billing',
                    date: item.bill_date,
                    category: item.service_type,
                    desc: `Invoice: ${item.invoice_number || 'N/A'}`,
                    amount: item.total_amount
                  }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                // Get unique years for the filter
                const allVendorData = [...capexEntries.filter(e => e.vendor_id === selectedVendor.id), ...billingRecords.filter(r => r.vendor_id === selectedVendor.id)];
                const years = Array.from(new Set(allVendorData.map(item => new Date(item.entry_date || item.bill_date).getFullYear().toString()))).sort().reverse();

                return (
                  <div className="space-y-6">
                    {/* Filters */}
                    <div className="card-2d p-4 flex flex-wrap gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Year</label>
                        <select 
                          value={filterYear}
                          onChange={(e) => setFilterYear(e.target.value)}
                          className="input-2d w-full"
                        >
                          <option value="All">All Years</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Month</label>
                        <select 
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="input-2d w-full"
                        >
                          <option value="All">All Months</option>
                          {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specific Date</label>
                        <input 
                          type="date"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="input-2d w-full"
                        />
                      </div>
                      <div className="flex items-end pb-0.5">
                        <button 
                          onClick={() => { setFilterYear('All'); setFilterMonth('All'); setFilterDate(''); }}
                          className="btn-2d-outline"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="card-2d p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Capex</p>
                        <p className="text-xl font-black text-blue-600">{formatCurrency(expenses.totalCapex)}</p>
                      </div>
                      <div className="card-2d p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Billing</p>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(expenses.totalBilling)}</p>
                      </div>
                      <div className="card-2d p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Spent</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(expenses.total)}</p>
                      </div>
                    </div>

                    <div className="card-2d overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="table-2d">
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Date</th>
                              <th>Category</th>
                              <th>Description</th>
                              <th className="text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allExpenses.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                  No expenses found
                                </td>
                              </tr>
                            ) : (
                              allExpenses.map((item, i) => (
                                <tr key={i}>
                                  <td>
                                    <span className={cn(
                                      "px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap",
                                      item.type === 'Capex' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                    )}>
                                      {item.type}
                                    </span>
                                  </td>
                                  <td className="font-bold whitespace-nowrap">{formatDate(item.date)}</td>
                                  <td>{item.category}</td>
                                  <td className="max-w-xs truncate" title={item.desc}>{item.desc}</td>
                                  <td className="font-black text-slate-900 text-right whitespace-nowrap">{formatCurrency(item.amount)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
