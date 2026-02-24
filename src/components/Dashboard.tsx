import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion } from 'motion/react';
import { formatCurrency, formatCurrencyPDF, cn, formatDate } from '../lib/utils';
import { DashboardStats } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, alert }: any) => (
  <div className={cn(
    "bg-white p-6 rounded-lg border border-slate-200 relative overflow-hidden",
    alert && "border-red-200 bg-red-50/30"
  )}>
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border",
          trend === 'up' ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
    </div>
    {alert && (
      <div className="absolute top-0 right-0 p-2">
        <AlertCircle className="w-4 h-4 text-red-500" />
      </div>
    )}
  </div>
);

export default function Dashboard({ stats, monthlyData, quarterlyData, vendorData, capexEntries, onReview }: { 
  stats: DashboardStats;
  monthlyData: any[];
  quarterlyData: any[];
  vendorData: any[];
  capexEntries: any[];
  onReview: () => void;
}) {
  const [chartView, setChartView] = React.useState<'monthly' | 'quarterly'>('monthly');
  const usagePercent = stats.totalBudget > 0 ? (stats.totalConsumed / stats.totalBudget) * 100 : 0;
  const monthlyPercent = stats.monthlyLimit > 0 ? (stats.monthlyConsumed / stats.monthlyLimit) * 100 : 0;
  const billingUsagePercent = stats.billingTotalBudget > 0 ? (stats.billingTotalConsumed / stats.billingTotalBudget) * 100 : 0;
  const billingMonthlyPercent = stats.billingMonthlyLimit > 0 ? (stats.billingMonthlyConsumed / stats.billingMonthlyLimit) * 100 : 0;

  const exportToExcel = () => {
    try {
      if (!capexEntries || capexEntries.length === 0) {
        alert('No Capex data available to export.');
        return;
      }

      const exportData = capexEntries.map(item => ({
        Date: item.entry_date,
        Month: new Date(item.entry_date).toLocaleString('default', { month: 'long' }),
        Year: new Date(item.entry_date).getFullYear().toString(),
        Vendor: item.vendor?.name || item.manual_vendor_name || 'N/A',
        Category: item.category,
        Department: item.department?.name || 'N/A',
        Amount: item.amount,
        Description: item.description
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Capex Report");
      XLSX.writeFile(wb, `capex_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel Export Error:', error);
      alert('Failed to export Excel file.');
    }
  };

  const exportToPDF = () => {
    try {
      if (!capexEntries || capexEntries.length === 0) {
        alert('No Capex data available to export.');
        return;
      }

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('CAPEX EXPENDITURE REPORT', 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 14, 28);

      // Summary Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Summary', 14, 40);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Budget: ${formatCurrencyPDF(stats.totalBudget)}`, 14, 48);
      doc.text(`Total Consumed: ${formatCurrencyPDF(stats.totalConsumed)}`, 14, 54);
      doc.text(`Remaining Budget: ${formatCurrencyPDF(stats.remainingBudget)}`, 14, 60);

      // Table Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Expenditure', 14, 75);

      // Table
      const tableColumn = ["Date", "Month", "Year", "Vendor", "Category", "Amount"];
      const tableRows = capexEntries.map(item => [
        formatDate(item.entry_date),
        new Date(item.entry_date).toLocaleString('default', { month: 'short' }),
        new Date(item.entry_date).getFullYear().toString(),
        item.vendor?.name || item.manual_vendor_name || 'N/A',
        item.category,
        formatCurrencyPDF(item.amount)
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'plain',
        styles: { 
          fontSize: 9, 
          cellPadding: 3,
          font: 'helvetica',
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          textColor: [0, 0, 0]
        },
        headStyles: { 
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          5: { halign: 'right' }
        }
      });

      doc.save(`capex_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF file.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Dashboard Overview</h2>
          <p className="text-xs text-slate-500 font-bold">Monitor your Capex and Billing budgets</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Capex Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            Export Capex PDF
          </button>
        </div>
      </div>

      {/* Capex Stats Grid */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capex Budget Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Budget" 
            value={formatCurrency(stats.totalBudget)} 
            icon={Wallet} 
            color="bg-blue-600"
          />
          <StatCard 
            title="Consumed Capex" 
            value={formatCurrency(stats.totalConsumed)} 
            icon={TrendingUp} 
            color="bg-emerald-600"
            alert={stats.totalConsumed > stats.totalBudget}
          />
          <StatCard 
            title="Remaining Budget" 
            value={formatCurrency(stats.remainingBudget)} 
            icon={TrendingDown} 
            color="bg-amber-600"
          />
          <StatCard 
            title="Monthly Limit" 
            value={formatCurrency(stats.monthlyLimit)} 
            icon={Calendar} 
            color="bg-indigo-600"
            alert={stats.monthlyConsumed > stats.monthlyLimit}
          />
        </div>
      </div>

      {/* Billing Stats Grid */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Billing Budget Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Billing Budget" 
            value={formatCurrency(stats.billingTotalBudget)} 
            icon={Wallet} 
            color="bg-emerald-600"
          />
          <StatCard 
            title="Consumed Billing" 
            value={formatCurrency(stats.billingTotalConsumed)} 
            icon={TrendingUp} 
            color="bg-blue-600"
            alert={stats.billingTotalConsumed > stats.billingTotalBudget}
          />
          <StatCard 
            title="Remaining Billing" 
            value={formatCurrency(stats.billingRemainingBudget)} 
            icon={TrendingDown} 
            color="bg-rose-600"
          />
          <StatCard 
            title="Monthly Bill Limit" 
            value={formatCurrency(stats.billingMonthlyLimit)} 
            icon={Calendar} 
            color="bg-purple-600"
            alert={stats.billingMonthlyConsumed > stats.billingMonthlyLimit}
          />
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capex Progress */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Total Capex Utilization</h4>
                <p className="text-[10px] text-slate-500">Overall project expenditure</p>
              </div>
              <span className={cn(
                "text-lg font-black",
                usagePercent > 90 ? "text-red-600" : "text-blue-600"
              )}>
                {usagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  usagePercent > 100 ? "bg-red-600" : usagePercent > 80 ? "bg-amber-500" : "bg-blue-600"
                )}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Monthly Capex Utilization</h4>
                <p className="text-[10px] text-slate-500">Current month spending</p>
              </div>
              <span className={cn(
                "text-lg font-black",
                monthlyPercent > 90 ? "text-red-600" : "text-indigo-600"
              )}>
                {monthlyPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(monthlyPercent, 100)}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  monthlyPercent > 100 ? "bg-red-600" : monthlyPercent > 80 ? "bg-amber-500" : "bg-indigo-600"
                )}
              />
            </div>
          </div>
        </div>

        {/* Billing Progress */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Total Billing Utilization</h4>
                <p className="text-[10px] text-slate-500">Overall billing expenditure</p>
              </div>
              <span className={cn(
                "text-lg font-black",
                billingUsagePercent > 90 ? "text-red-600" : "text-emerald-600"
              )}>
                {billingUsagePercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(billingUsagePercent, 100)}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  billingUsagePercent > 100 ? "bg-red-600" : billingUsagePercent > 80 ? "bg-amber-500" : "bg-emerald-600"
                )}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Monthly Billing Utilization</h4>
                <p className="text-[10px] text-slate-500">Current month billing</p>
              </div>
              <span className={cn(
                "text-lg font-black",
                billingMonthlyPercent > 90 ? "text-red-600" : "text-purple-600"
              )}>
                {billingMonthlyPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(billingMonthlyPercent, 100)}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  billingMonthlyPercent > 100 ? "bg-red-600" : billingMonthlyPercent > 80 ? "bg-amber-500" : "bg-purple-600"
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">
              {chartView === 'monthly' ? 'Monthly' : 'Quarterly'} Capex Usage
            </h4>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button 
                onClick={() => setChartView('monthly')}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-black uppercase transition-all",
                  chartView === 'monthly' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setChartView('quarterly')}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-black uppercase transition-all",
                  chartView === 'quarterly' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Quarterly
              </button>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartView === 'monthly' ? monthlyData : quarterlyData}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey={chartView === 'monthly' ? 'month' : 'label'} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none' }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[0, 0, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h4 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Vendor Split</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vendorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {vendorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="rect" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
