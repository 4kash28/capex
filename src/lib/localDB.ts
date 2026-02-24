import { Vendor, Department, CapexEntry, BillingRecord } from '../types';

const DB_NAME = 'SmartCapexDB';
const DB_VERSION = 1;

export interface Setting {
  key: string;
  value: string;
}

class LocalDB {
  private db: IDBDatabase | null = null;

  async connect(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;

        if (!db.objectStoreNames.contains('vendors')) {
          db.createObjectStore('vendors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('departments')) {
          db.createObjectStore('departments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('capex_entries')) {
          db.createObjectStore('capex_entries', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('billing_records')) {
          db.createObjectStore('billing_records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add<T>(storeName: string, item: T): Promise<T> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, item: T): Promise<T> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async initMockData() {
    const vendors = await this.getAll<Vendor>('vendors');
    if (vendors.length === 0) {
      const MOCK_VENDORS: Vendor[] = [
        { id: '1', name: 'Dell Technologies', service_type: 'IT Hardware', contact_person: 'John Doe', email: 'john@dell.com' },
        { id: '2', name: 'Amazon Web Services', service_type: 'Cloud Services', contact_person: 'Jane Smith', email: 'jane@aws.com' },
        { id: '3', name: 'Local Infrastructure Co', service_type: 'Construction', contact_person: 'Bob Wilson' },
      ];
      for (const v of MOCK_VENDORS) await this.add('vendors', v);
    }

    const departments = await this.getAll<Department>('departments');
    if (departments.length === 0) {
      const MOCK_DEPARTMENTS: Department[] = [
        { id: '1', name: 'IT' },
        { id: '2', name: 'Finance' },
        { id: '3', name: 'Operations' },
      ];
      for (const d of MOCK_DEPARTMENTS) await this.add('departments', d);
    }
    
    const settings = await this.getAll<Setting>('settings');
    if (settings.length === 0) {
        await this.add('settings', { key: 'total_capex_budget', value: '0' });
        await this.add('settings', { key: 'monthly_capex_limit', value: '0' });
        await this.add('settings', { key: 'total_billing_budget', value: '1200000' });
        await this.add('settings', { key: 'monthly_billing_limit', value: '100000' });
    }
  }
}

export const localDB = new LocalDB();
