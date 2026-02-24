-- Database Schema for Smart Capex & Billing Management System

-- Drop existing tables to apply the latest schema (WARNING: This will delete existing data)
DROP TABLE IF EXISTS billing_records CASCADE;
DROP TABLE IF EXISTS capex_entries CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 1. Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Vendors Table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    service_type TEXT,
    contact_person TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Capex Entries Table
CREATE TABLE capex_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id),
    department_id UUID REFERENCES departments(id),
    category TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_url TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Billing Records Table
CREATE TABLE billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id),
    manual_vendor_name TEXT,
    invoice_number TEXT,
    service_type TEXT,
    bill_date DATE NOT NULL,
    service_start_date DATE,
    amount DECIMAL(15, 2) NOT NULL,
    gst_rate DECIMAL(5, 2),
    cgst_rate DECIMAL(5, 2),
    sgst_rate DECIMAL(5, 2),
    gst_amount DECIMAL(15, 2),
    gst_type TEXT,
    total_amount DECIMAL(15, 2) NOT NULL,
    bill_url TEXT,
    po_url TEXT,
    remarks TEXT,
    payment_status TEXT CHECK (payment_status IN ('Paid', 'Pending', 'PO Pending')) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Settings Table (For limits)
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Data
INSERT INTO departments (name) VALUES 
('IT'), ('Finance'), ('Operations'), ('HR'), ('Infrastructure'), ('Marketing');

INSERT INTO settings (key, value) VALUES 
('total_capex_budget', 2700000),
('monthly_capex_limit', 300000),
('total_billing_budget', 1200000),
('monthly_billing_limit', 100000);

-- Enable Row Level Security (RLS)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for anon/public for easy demo setup. In production, use authenticated role and proper user checks)
CREATE POLICY "Allow all for anon" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON capex_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON billing_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON settings FOR ALL USING (true) WITH CHECK (true);
