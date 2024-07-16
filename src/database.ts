// src/database.ts

import knex, { Knex } from 'knex';

const db: Knex = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    database: 'crexi'
  }
});

export interface Property {
  price?: string;
  location?: string;
  date_added?: string;
  days_on?: number;
  time_since_last_update?: number;
  property_type?: string;
  size?: string;
  url: string;
  status: string;
  investment_type?: string;
  class?: string;
  tenancy?: string;
  square_footage?: number;
  net_rentable?: number;
  price_sq_ft?: number;
  cap_rate?: number;
  pro_forma_cap_rate?: number;
  occupancy?: string;
  noi?: number;
  pro_forma_noi?: number;
  units?: number;
  year_built?: number;
  year_renovated?: number;
  buildings?: number;
  stories?: number;
  zoning?: number;
  lot_size_acres?: number;
  price_unit?: number;
  ceiling_height?: number;
}

interface PropertyList {
  url: string;
  status: string
}

// get property by url
export async function getProperty(url: string): Promise<Property | null> {
  const property = await db('properties').where('url', url).first();
  return property;
}

// get all properties
export async function getProperties(): Promise<Property[]> {
  const properties = await db('properties');
  return properties;
}

// create if property with url does not exists
export async function createPropertyIfNotExists(property: Property): Promise<Property | null> {
  let existing = await getProperty(property.url);
  if (!existing) {
    await db('properties').insert(property);
    return null;
  }
  return existing;
}

export async function saveProperty(property: Property): Promise<void> {
  await db('properties').where('url', property.url).update(property);
}

export async function initDatabase(): Promise<void> {
  await db.schema.createTableIfNotExists(
    'properties', (table) => {
      table.increments('id').primary();
      
      table.enu('status', ['DONE', 'PENDING', 'ERROR'], {
        useNative: true,
        enumName: 'property_status',
      });
  });
}

export async function closeDatabase(): Promise<void> {
  await db.destroy();
}