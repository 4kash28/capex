import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Save, X, Plus } from 'lucide-react';
import { Vendor, Department } from '../types';

const capexSchema = z.object({
  vendor_id: z.string().min(1, 'Vendor is required'),
  department_id: z.string().min(1, 'Department is required'),
  manual_department_name: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  manual_category: z.string().optional(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  entry_date: z.string().min(1, 'Date is required'),
  remarks: z.string().optional(),
}).refine((data) => {
  if (data.category === 'Other' && (!data.manual_category || data.manual_category.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Manual category name is required when 'Other' is selected",
  path: ["manual_category"],
}).refine((data) => {
  if (data.department_id === 'other' && (!data.manual_department_name || data.manual_department_name.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Manual department name is required when 'Other' is selected",
  path: ["manual_department_name"],
});

type CapexFormData = z.infer<typeof capexSchema>;

export default function CapexEntryForm({ 
  vendors, 
  departments, 
  onSubmit 
}: { 
  vendors: Vendor[]; 
  departments: Department[];
  onSubmit: (data: any) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CapexFormData>({
    resolver: zodResolver(capexSchema),
    defaultValues: {
      entry_date: new Date().toISOString().split('T')[0],
    }
  });

  const selectedCategory = watch('category');
  const selectedDepartment = watch('department_id');

  const handleFormSubmit = async (data: CapexFormData) => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...data,
        category: data.category === 'Other' ? data.manual_category : data.category,
        department_id: data.department_id === 'other' ? null : data.department_id,
        manual_department_name: data.department_id === 'other' ? data.manual_department_name : null,
        vendor_id: data.vendor_id || null,
      };
      delete submissionData.manual_category;
      if (!submissionData.entry_date) {
        delete submissionData.entry_date;
      }
      
      await onSubmit(submissionData);
      reset();
      alert('Capex entry added successfully!');
    } catch (error: any) {
      console.error(error);
      alert('Failed to add capex entry: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'IT Hardware', 'Software', 'Maintenance', 'AMC', 'Infrastructure', 'Marketing', 'Office Supplies', 'Other'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card-2d overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">New Capex Entry</h3>
          <p className="text-xs text-slate-500">Record a new capital expenditure for tracking and approval.</p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vendor Name</label>
              <select 
                {...register('vendor_id')}
                className="input-2d w-full"
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {errors.vendor_id && <p className="text-xs text-red-500 mt-1">{errors.vendor_id.message}</p>}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Department</label>
              <select 
                {...register('department_id')}
                className="input-2d w-full"
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                <option value="other">Other</option>
              </select>
              {errors.department_id && <p className="text-xs text-red-500 mt-1">{errors.department_id.message}</p>}
            </div>

            {/* Manual Department */}
            {selectedDepartment === 'other' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Manual Department Name *</label>
                <input 
                  type="text"
                  {...register('manual_department_name')}
                  placeholder="Type department name here..."
                  className="input-2d w-full"
                />
                {errors.manual_department_name && <p className="text-xs text-red-500 mt-1">{errors.manual_department_name.message}</p>}
              </div>
            )}

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Service Category</label>
              <select 
                {...register('category')}
                className="input-2d w-full"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
            </div>

            {/* Manual Category */}
            {selectedCategory === 'Other' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Manual Category Name *</label>
                <input 
                  type="text"
                  {...register('manual_category')}
                  placeholder="Type category name here..."
                  className="input-2d w-full"
                />
                {errors.manual_category && <p className="text-xs text-red-500 mt-1">{errors.manual_category.message}</p>}
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Amount (₹)</label>
              <input 
                type="number"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
                className="input-2d w-full"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Entry Date</label>
              <input 
                type="date"
                {...register('entry_date')}
                className="input-2d w-full"
              />
              {errors.entry_date && <p className="text-xs text-red-500 mt-1">{errors.entry_date.message}</p>}
            </div>

            {/* Invoice Upload Placeholder */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Attach Invoice (PDF)</label>
              <div className="relative">
                <input 
                  type="file"
                  className="hidden"
                  id="invoice-upload"
                  accept=".pdf"
                />
                <label 
                  htmlFor="invoice-upload"
                  className="input-2d w-full flex items-center justify-center gap-2 cursor-pointer text-slate-500 hover:bg-slate-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose PDF file</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
            <textarea 
              {...register('description')}
              rows={3}
              placeholder="Provide details about the expenditure..."
              className="input-2d w-full resize-none"
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Remarks (Optional)</label>
            <input 
              {...register('remarks')}
              placeholder="Any additional notes..."
              className="input-2d w-full"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-4">
            <button 
              type="button"
              onClick={() => reset()}
              className="btn-2d-outline"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-2d flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4" />
                  Save Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
