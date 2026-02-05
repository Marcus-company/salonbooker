/**
 * Mock Data Factories
 * Generate consistent test data for all test suites
 */

import { randomUUID } from 'crypto';

// Types matching database schema
export interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  icon: string;
  is_active: boolean;
}

export interface Staff {
  id: string;
  salon_id: string;
  auth_user_id?: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff';
  bio: string;
  is_active: boolean;
}

export interface Booking {
  id: string;
  salon_id: string;
  service_id?: string;
  staff_id?: string;
  service_name: string;
  service_duration: string;
  service_price: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

// Factory functions
export const factories = {
  salon: (overrides: Partial<Salon> = {}): Salon => ({
    id: randomUUID(),
    name: 'Test Salon',
    slug: `test-salon-${Date.now()}`,
    address: 'Teststraat 1, 1234 AB Test',
    phone: '+31 6 12345678',
    email: 'test@salon.nl',
    is_active: true,
    ...overrides,
  }),

  service: (salonId: string, overrides: Partial<Service> = {}): Service => ({
    id: randomUUID(),
    salon_id: salonId,
    name: 'Test Service',
    description: 'Een testbehandeling',
    duration: '60 min',
    price: 50.00,
    icon: '✂️',
    is_active: true,
    ...overrides,
  }),

  staff: (salonId: string, overrides: Partial<Staff> = {}): Staff => ({
    id: randomUUID(),
    salon_id: salonId,
    name: 'Test Personeel',
    email: `test${Date.now()}@salon.nl`,
    phone: '+31 6 87654321',
    role: 'staff',
    bio: 'Test bio',
    is_active: true,
    ...overrides,
  }),

  booking: (salonId: string, overrides: Partial<Booking> = {}): Booking => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    return {
      id: randomUUID(),
      salon_id: salonId,
      service_name: 'Knippen dames',
      service_duration: '45 min',
      service_price: 35.00,
      customer_name: 'Test Klant',
      customer_phone: '06-12345678',
      customer_email: 'klant@example.com',
      notes: 'Test boeking',
      booking_date: dateStr,
      booking_time: '10:00',
      status: 'pending',
      ...overrides,
    };
  },
};

// Pre-defined test data sets
export const testData = {
  services: [
    { name: 'Knippen dames', duration: '45 min', price: 35.00, icon: '✂️' },
    { name: 'Knippen heren', duration: '30 min', price: 25.00, icon: '✂️' },
    { name: 'Full color', duration: '90 min', price: 55.00, icon: '🎨' },
  ],
  
  staff: [
    { name: 'Josje', email: 'josje@test.nl', role: 'admin' as const },
    { name: 'Sarah', email: 'sarah@test.nl', role: 'staff' as const },
    { name: 'Lisa', email: 'lisa@test.nl', role: 'staff' as const },
  ],
  
  customers: [
    { name: 'Anna de Vries', phone: '06-12345678', email: 'anna@test.nl' },
    { name: 'Mark Janssen', phone: '06-87654321', email: 'mark@test.nl' },
    { name: 'Lisa Bakker', phone: '06-23456789', email: 'lisa@test.nl' },
  ],
};

// Bulk data generator for load testing
export function generateBulkBookings(count: number, salonId: string): Booking[] {
  return Array.from({ length: count }, (_, i) => 
    factories.booking(salonId, {
      customer_name: `Customer ${i + 1}`,
      customer_phone: `06-${String(10000000 + i).slice(0, 8)}`,
      customer_email: `customer${i + 1}@test.nl`,
    })
  );
}
