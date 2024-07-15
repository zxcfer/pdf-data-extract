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

interface Property {
  title?: string;
  price?: string;
  location?: string;
  type?: string;
  size?: string;
  url: string;
  status: string;
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
      table.text('title');
      table.text('price');
      table.text('location');
      table.text('type');
      table.text('size');
      table.text('url');
      table.enu('status', ['DONE', 'PENDING', 'ERROR'], {
        useNative: true,
        enumName: 'property_status',
      });
  });

  await db.schema.createTableIfNotExists(
    'list', (table) => {
      table.increments('id').primary();
      table.text('url');
      table.enu('status', ['DONE', 'PENDING', 'ERROR'], {
        useNative: true,
        enumName: 'list_status',
      });
  });
}

export async function closeDatabase(): Promise<void> {
  await db.destroy();
}