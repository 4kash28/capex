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
import { DashboardStats, AppNotification } from '../types';
import * as XLSX from 'xlsx';
import { Bell, Clock } from 'lucide-react';
import { generateProfessionalPDF } from '../lib/pdfGenerator';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, alert }: any) => (
  <div className={cn(
    "card-2d p-6 relative overflow-hidden",
    alert && "border-red-500 bg-red-50"
  )}>
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border",
          trend === 'up' ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"
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

export default function Dashboard({ stats, monthlyData, quarterlyData, vendorData, capexEntries, onReview, notifications = [] }: { 
  stats: DashboardStats;
  monthlyData: any[];
  quarterlyData: any[];
  vendorData: any[];
  capexEntries: any[];
  onReview: () => void;
  notifications?: AppNotification[];
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
        Department: item.department?.name || item.manual_department_name || 'N/A',
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

      const doc = generateProfessionalPDF({
        title: 'CAPEX Expenditure Report',
        metadata: {
          'Report Period': 'All Time',
          'Total Budget': formatCurrencyPDF(stats.totalBudget),
          'Total Consumed': formatCurrencyPDF(stats.totalConsumed),
          'Remaining Budget': formatCurrencyPDF(stats.remainingBudget),
        }
      }, [
        {
          title: 'Detailed Expenditure',
          headers: ["Date", "Month", "Year", "Vendor", "Category", "Amount"],
          rows: capexEntries.map(item => [
            formatDate(item.entry_date),
            new Date(item.entry_date).toLocaleString('default', { month: 'short' }),
            new Date(item.entry_date).getFullYear().toString(),
            item.vendor?.name || item.manual_vendor_name || 'N/A',
            item.category,
            formatCurrencyPDF(item.amount)
          ])
        }
      ]);

      doc.save(`capex_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF file.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 card-2d p-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Dashboard Overview</h2>
          <p className="text-xs text-slate-500 font-bold">Monitor your Capex and Billing budgets</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 btn-2d-outline text-[10px] uppercase tracking-widest"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Capex Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 btn-2d-outline text-[10px] uppercase tracking-widest"
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
          <div className="card-2d p-6">
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
            <div className="h-2 bg-slate-100 overflow-hidden border border-slate-200">
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

          <div className="card-2d p-6">
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
            <div className="h-2 bg-slate-100 overflow-hidden border border-slate-200">
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
          <div className="card-2d p-6">
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
            <div className="h-2 bg-slate-100 overflow-hidden border border-slate-200">
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

          <div className="card-2d p-6">
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
            <div className="h-2 bg-slate-100 overflow-hidden border border-slate-200">
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
        <div className="lg:col-span-2 card-2d p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-900 uppercase text-xs tracking-widest">
              {chartView === 'monthly' ? 'Monthly' : 'Quarterly'} Capex Usage
            </h4>
            <div className="flex bg-slate-100 p-1">
              <button 
                onClick={() => setChartView('monthly')}
                className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase transition-none",
                  chartView === 'monthly' ? "bg-white text-blue-600 border border-slate-200" : "text-slate-500 hover:text-slate-800"
                )}
              >
                Monthly
              </button>
              <button 
                onClick={() => setChartView('quarterly')}
                className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase transition-none",
                  chartView === 'quarterly' ? "bg-white text-blue-600 border border-slate-200" : "text-slate-500 hover:text-slate-800"
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

        <div className="card-2d p-6">
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

      {/* Activity and Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity / Logs */}
        <div className="card-2d overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recent Activity Logs</h4>
            </div>
          </div>
          <div className="p-0 max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No activity recorded</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {notifications.slice(0, 15).map((note) => (
                  <div key={note.id} className="p-4 hover:bg-slate-50 transition-none">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 bg-blue-50 text-blue-600 border border-blue-100">
                        <Clock className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">{note.message}</p>
                        <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Entries Table */}
        <div className="lg:col-span-2 card-2d overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Capex Entries</h4>
            <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">
              {capexEntries.length} Total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="table-2d">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Department</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {capexEntries.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No entries found</td></tr>
                ) : capexEntries.slice(0, 10).map((item, i) => (
                  <tr key={i}>
                    <td className="font-bold whitespace-nowrap">{formatDate(item.entry_date)}</td>
                    <td className="font-black text-slate-900">{item.vendor?.name || item.manual_vendor_name || 'N/A'}</td>
                    <td className="font-bold">{item.department?.name || item.manual_department_name || 'N/A'}</td>
                    <td>{item.category}</td>
                    <td className="font-black text-slate-900 text-right whitespace-nowrap">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
