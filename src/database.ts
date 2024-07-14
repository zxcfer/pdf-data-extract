// src/database.ts

import knex, { Knex } from 'knex';

const db: Knex = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database'
  }
});

interface Property {
  title: string;
  price: string;
  location: string;
  type: string;
  size: string;
}

export async function savePropertyToDB(property: Property): Promise<void> {
  await db('properties').insert(property);
}

export async function initDatabase(): Promise<void> {
  await db.schema.createTableIfNotExists('properties', (table) => {
    table.increments('id').primary();
    table.text('title');
    table.text('price');
    table.text('location');
    table.text('type');
    table.text('size');
  });
}

export async function closeDatabase(): Promise<void> {
  await db.destroy();
}