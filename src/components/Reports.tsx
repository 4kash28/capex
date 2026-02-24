import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Calendar,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports({ 
  billingRecords 
}: { 
  billingRecords: any[];
}) {
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  // Derive unique years and months for filters
  const allData = [...billingRecords];
  const years = Array.from(new Set(allData.map(item => new Date(item.bill_date).getFullYear().toString()))).sort().reverse();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const filterData = (data: any[]) => data.filter(item => {
    const date = new Date(item.bill_date);
    const yearMatch = selectedYear === 'All' || date.getFullYear().toString() === selectedYear;
    const monthMatch = selectedMonth === 'All' || date.toLocaleString('default', { month: 'long' }) === selectedMonth;
    return yearMatch && monthMatch;
  });

  const filteredBilling = filterData(billingRecords);

  const exportToExcel = (type: 'billing', data: any[]) => {
    try {
      const exportData = data.map(item => {
        return {
          Date: item.bill_date,
          Vendor: item.vendor?.name || 'N/A',
          'Base Amount': item.amount,
          'GST Amount': item.gst_amount || 0,
          'Total Amount': item.total_amount,
          Status: item.payment_status,
          'Invoice No': item.invoice_number || 'N/A'
        };
      });

      if (exportData.length === 0) {
        alert('No data available to export.');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel Export Error:', error);
      alert('Failed to export Excel file.');
    }
  };

  const renderSection = (title: string, data: any[], type: 'billing') => {
    // Calculate vendor spending summary for billing
    const vendorSpending = data.reduce((acc: any[], record) => {
      const vendorName = record.manual_vendor_name || record.vendor?.name || 'Unknown';
      const existing = acc.find((v: any) => v.vendor === vendorName);
      if (existing) {
        existing.amount += Number(record.total_amount);
      } else {
        acc.push({ vendor: vendorName, amount: Number(record.total_amount) });
      }
      return acc;
    }, []).sort((a: any, b: any) => b.amount - a.amount);

    return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", "bg-emerald-500")}></div>
          {title}
        </h3>
        <button 
          onClick={() => exportToExcel(type, data)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
        >
          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
          Export Excel
        </button>
      </div>

      <div className="space-y-4">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Expenditure Trend</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bill_date" hide />
                <YAxis hide />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="total_amount" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill={`url(#color${type})`} 
                  strokeWidth={2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Spending Summary (Only for Billing) */}
        {vendorSpending.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Spending Summary</h4>
              <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
                {vendorSpending.length} Vendors
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendor Name</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorSpending.map((v: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-black text-slate-900">{v.vendor}</td>
                      <td className="px-4 py-3 text-xs font-black text-slate-900 text-right whitespace-nowrap">{formatCurrency(v.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Records</h4>
            <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
              {data.length} Total
            </span>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendor</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice No</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Type</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Base</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">GST</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No records found</td></tr>
                  ) : data.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-600 font-bold whitespace-nowrap">{formatDate(item.bill_date)}</td>
                      <td className="px-4 py-3 text-xs font-black text-slate-900">{item.manual_vendor_name || item.vendor?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-blue-600 font-bold">{item.invoice_number || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{item.service_type}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{formatCurrency(item.gst_amount || 0)}</td>
                      <td className="px-4 py-3 text-xs font-black text-slate-900 text-right whitespace-nowrap">{formatCurrency(item.total_amount)}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap", 
                          item.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                          item.payment_status === 'Pending' ? 'bg-slate-100 text-slate-700' : 
                          'bg-amber-100 text-amber-700'
                        )}>
                          {item.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div className="space-y-8">
      {/* Global Filters */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-sm">
        <div className="flex flex-wrap gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter by Year</label>
            <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-w-[140px]"
              >
                <option value="All">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter by Month</label>
            <div className="relative">
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-w-[160px]"
              >
                <option value="All">All Months</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <Calendar className="w-4 h-4" />
          Report Period: {selectedMonth} {selectedYear === 'All' ? '' : selectedYear}
        </div>
      </div>

      {/* Monthly Billing Section */}
      {renderSection("Monthly Billing (MBR) Records", filteredBilling, 'billing')}
    </div>
  );
}
