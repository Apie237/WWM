// Phase 2 seed infrastructure.
//
// Only the six continents are seeded. Continents are real-world geographic
// facts (Africa, Asia, Europe, North America, South America, Oceania — the
// same set docs/PROJECT_SPEC.md §5 and docs/DESIGN_SPEC.md §4 describe), not
// WWMI-specific organizational data, so seeding them directly does not
// violate the "never invent organizational facts" rule.
//
// Country, Organization, Person, Ministry, CountryAdministration, and
// AffiliatePastorsBoard records are intentionally NOT seeded here.
// docs/PROJECT_SPEC.md §12 explicitly defers even the one verified
// historical/organizational dataset it supplies (e.g. Cameroon specifics,
// founder records) to "later phases", and no other verified WWMI
// organizational data has been supplied. Do not add invented country,
// church, institution, person, or leadership records to this script — wait
// for real, approved data before seeding beyond continents.
//
// This script is intentionally NOT executed as part of Phase 2 delivery: it
// connects to whatever MongoDB instance MONGODB_URI points to, and the
// currently configured server/.env.example references a live remote Atlas
// cluster. Run it manually (`npm run seed` from server/) once you've
// confirmed MONGODB_URI points at a database you intend to write to.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Continent } from '../models/index.js';

const CONTINENTS = [
  { name: 'Africa', order: 1 },
  { name: 'Asia', order: 2 },
  { name: 'Europe', order: 3 },
  { name: 'North America', order: 4 },
  { name: 'South America', order: 5 },
  { name: 'Oceania', order: 6 },
];

async function seedContinents() {
  for (const continent of CONTINENTS) {
    await Continent.findOneAndUpdate(
      { name: continent.name },
      { $set: continent },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`[seed] upserted ${CONTINENTS.length} continents`);
}

async function run() {
  await connectDB();
  await seedContinents();
  await mongoose.disconnect();
  console.log('[seed] done');
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
