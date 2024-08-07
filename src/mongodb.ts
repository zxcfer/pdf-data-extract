import { MongoClient, Db } from 'mongodb';

let db: Db;
let client: MongoClient;

export async function connectToDatabase(): Promise<void> {
  const uri = 'mongodb://localhost:27017';
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('crexi');
}

export async function updateProperty(property: any): Promise<any> {
  return db.collection('properties').updateOne({url: property.url}, {$set: property});
}

export async function createProperty(property: any): Promise<any> {
  let existing = await db.collection('properties').findOne({url: property.url});
  if (!existing) {
    await db.collection('properties').insertOne(property);
    return null;
  }
  return existing;
}

export async function getPendingProperties(): Promise<any[]> {
  return db.collection('properties').find({status: 'PENDING'}).toArray();
}

export async function closeDatabase(): Promise<void> {
  await client.close();
}
