import React, { useState } from 'react';
import { FileText, Download, X, Search } from 'lucide-react';
import { BillingRecord } from '../types';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';

export default function DocumentRecords({ records }: { records: BillingRecord[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingDoc, setViewingDoc] = useState<{url: string, title: string} | null>(null);

  // Filter records that have at least one document uploaded
  const docRecords = records.filter(r => r.bill_url || r.po_url);

  const filteredRecords = docRecords.filter(r => {
    const vendorName = r.vendor?.name || r.manual_vendor_name || '';
    const searchLower = searchTerm.toLowerCase();
    return vendorName.toLowerCase().includes(searchLower) ||
           (r.invoice_number && r.invoice_number.toLowerCase().includes(searchLower));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vendor or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">PO Document</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoice Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm font-medium">
                    No documents found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{record.vendor?.name || record.manual_vendor_name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-600">{record.invoice_number || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{formatDate(record.bill_date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {record.po_url ? (
                        <button
                          onClick={() => setViewingDoc({ url: record.po_url!, title: `PO - ${record.po_file_name || 'Document'}` })}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="max-w-[150px] truncate">{record.po_file_name || 'View PO'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Not uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.bill_url ? (
                        <button
                          onClick={() => setViewingDoc({ url: record.bill_url!, title: `Invoice - ${record.bill_file_name || 'Document'}` })}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-bold"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="max-w-[150px] truncate">{record.bill_file_name || 'View Invoice'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Not uploaded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{viewingDoc.title}</h3>
              <div className="flex items-center gap-2">
                <a 
                  href={viewingDoc.url} 
                  download={viewingDoc.title}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-4">
              <iframe src={viewingDoc.url} className="w-full h-full rounded-xl border border-slate-200 shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
