export type UserRole = 'admin' | 'user' | 'vendor' | 'security';

export interface Vendor {
  id: string;
  name: string;
  service_type?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface CapexEntry {
  id: string;
  vendor_id: string;
  manual_vendor_name?: string;
  department_id: string;
  category: string;
  description: string;
  amount: number;
  entry_date: string;
  invoice_url?: string;
  remarks?: string;
  manual_department_name?: string;
  vendor?: Vendor;
  department?: Department;
  invoice_status?: 'not_generated' | 'invoice_receive' | 'invoice_inward' | 'account_verification' | 'ph_signature' | 'portal_update' | 'delayed' | 'issue';
  invoice_generated_at?: string;
  invoice_mailed_at?: string;
  bill_inwarded_at?: string;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  created_at: string;
  read: boolean;
}

export interface BillingRecord {
  id: string;
  vendor_id: string;
  manual_vendor_name?: string;
  invoice_number?: string;
  service_type: string;
  bill_date: string;
  service_start_date?: string;
  amount: number; // Base amount
  gst_rate?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  gst_amount?: number;
  gst_type?: 'CGST + SGST' | 'IGST' | 'Exempted';
  total_amount: number;
  bill_url?: string; // Invoice attachment
  po_url?: string; // PO attachment
  remarks?: string;
  payment_status: 'Paid' | 'Pending' | 'PO Pending';
  vendor?: Vendor;
  invoice_status?: 'not_generated' | 'invoice_receive' | 'invoice_inward' | 'account_verification' | 'ph_signature' | 'portal_update' | 'delayed' | 'issue';
  invoice_generated_at?: string;
  invoice_mailed_at?: string;
  bill_inwarded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  totalBudget: number;
  monthlyLimit: number;
  totalConsumed: number;
  monthlyConsumed: number;
  remainingBudget: number;
  // Billing stats
  billingTotalBudget: number;
  billingMonthlyLimit: number;
  billingTotalConsumed: number;
  billingMonthlyConsumed: number;
  billingRemainingBudget: number;
}
