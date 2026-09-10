// Phase 2 model verification. Deliberately does NOT connect to MongoDB — it
// only needs to prove that every model file imports cleanly (schemas
// compile, no circular import errors) and that validation rules, including
// the slug-generating pre('validate') hooks, behave as specified. Mongoose's
// synchronous validateSync() intentionally skips pre/post 'validate'
// middleware, so this script uses the async validate() API throughout to
// match real save()-time behavior.
import mongoose from 'mongoose';
import {
  Continent,
  Country,
  Person,
  Organization,
  Ministry,
  CountryAdministration,
  AffiliatePastorsBoard,
} from '../models/index.js';

const models = {
  Continent,
  Country,
  Person,
  Organization,
  Ministry,
  CountryAdministration,
  AffiliatePastorsBoard,
};

let failures = 0;

async function check(label, fn) {
  try {
    await fn();
    console.log(`[ok]   ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`[fail] ${label}: ${err.message}`);
  }
}

async function expectValidationError(doc, field) {
  try {
    await doc.validate();
  } catch (err) {
    if (!err.errors[field]) {
      throw new Error(`expected a validation error on '${field}', got: ${Object.keys(err.errors)}`);
    }
    return;
  }
  throw new Error(`expected validation to fail on '${field}', but it passed`);
}

async function run() {
  console.log('Verifying Phase 2 Mongoose models (no database connection used)...\n');

  for (const [name, Model] of Object.entries(models)) {
    await check(`${name} model registered correctly`, () => {
      if (Model.modelName !== name) {
        throw new Error(`expected modelName '${name}', got '${Model.modelName}'`);
      }
    });
  }

  await check('Continent requires a name', () => expectValidationError(new Continent({}), 'name'));

  await check('Continent auto-generates a slug from name', async () => {
    const doc = new Continent({ name: 'Africa' });
    await doc.validate();
    if (doc.slug !== 'africa') throw new Error(`expected slug 'africa', got '${doc.slug}'`);
  });

  await check('Country requires a continent reference', () =>
    expectValidationError(new Country({ name: 'Testland' }), 'continent')
  );

  await check('Country accepts a valid document and derives its slug', async () => {
    const doc = new Country({ name: 'Testland', continent: new mongoose.Types.ObjectId() });
    await doc.validate();
    if (doc.slug !== 'testland') throw new Error('expected slug to be auto-generated');
  });

  await check('Person requires a displayName', () => expectValidationError(new Person({}), 'displayName'));

  await check('Person rejects an unknown roleType', () =>
    expectValidationError(
      new Person({ displayName: 'Demo Person', roles: [{ roleType: 'not-a-real-role' }] }),
      'roles.0.roleType'
    )
  );

  await check('Person supports multiple concurrent roles on one record', async () => {
    const countryId = new mongoose.Types.ObjectId();
    const doc = new Person({
      displayName: 'Demo Person',
      roles: [
        { roleType: 'missionary', country: countryId },
        { roleType: 'superintendent', country: countryId, current: true },
      ],
    });
    await doc.validate();
    if (doc.roles.length !== 2) throw new Error('expected both roles to be preserved');
  });

  await check('Organization rejects an unknown type', () =>
    expectValidationError(
      new Organization({ name: 'Demo Org', country: new mongoose.Types.ObjectId(), type: 'not-a-real-type' }),
      'type'
    )
  );

  await check('Organization accepts a valid wwm_church document and derives its slug', async () => {
    const doc = new Organization({ name: 'Demo Church', country: new mongoose.Types.ObjectId(), type: 'wwm_church' });
    await doc.validate();
    if (doc.slug !== 'demo-church') throw new Error('expected slug to be auto-generated');
  });

  await check('Ministry does not require a country (supports international ministries)', async () => {
    const doc = new Ministry({ name: 'Demo Ministry' });
    await doc.validate();
  });

  await check('CountryAdministration requires a country reference', () =>
    expectValidationError(new CountryAdministration({}), 'country')
  );

  await check('CountryAdministration supports a hierarchy of positions, including vacant ones', async () => {
    const superintendentId = new mongoose.Types.ObjectId();
    const doc = new CountryAdministration({
      country: new mongoose.Types.ObjectId(),
      positions: [
        { _id: superintendentId, title: 'Superintendent' },
        { title: 'Secretary', parentEntry: superintendentId },
      ],
    });
    await doc.validate();
    if (doc.positions.length !== 2) throw new Error('expected both positions to be preserved');
    if (doc.positions[1].person !== null) throw new Error('expected a vacant position to be allowed');
    if (!doc.positions[1].parentEntry.equals(superintendentId)) {
      throw new Error('expected parentEntry to link Secretary under Superintendent');
    }
  });

  await check('AffiliatePastorsBoard requires a country reference', () =>
    expectValidationError(new AffiliatePastorsBoard({}), 'country')
  );

  console.log(`\n${Object.keys(models).length} models checked.`);
  if (failures > 0) {
    console.error(`${failures} check(s) failed.`);
    process.exit(1);
  } else {
    console.log('All Phase 2 model checks passed.');
    process.exit(0);
  }
}

run();
