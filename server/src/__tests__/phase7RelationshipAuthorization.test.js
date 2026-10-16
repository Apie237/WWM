// Regression tests for the Phase 7 security review: relationship-level
// country authorization and ObjectId validation gaps.
//
// There was no existing test setup in this project to extend (confirmed by
// inspection: no test framework dependency, no test script, no *.test.js
// files anywhere in the repo before this file) — docs/PROGRESS.md's Phase
// 7 record and this review's own task both ask for tests "using the
// existing test conventions," so the closest honest reading is "add the
// simplest tests this stack can run without a new dependency." Node's
// built-in test runner (`node --test`, available in the project's Node 22
// without installing anything) is used for exactly that reason — it adds
// zero new dependencies and no lockfile change, per this review's own
// "unnecessary dependency changes" constraint.
//
// No MongoDB is reachable in this sandbox (the same limitation recorded in
// docs/PROGRESS.md's Phase 4-7 entries), so these tests mock the specific
// Mongoose model methods each function under test actually calls
// (`findById`, `find`, `exists`) rather than hitting a real database. That
// means: the *relationship/validation logic itself* (the actual code this
// review changed) is executed and asserted for real, but this is not a
// database-backed integration test — see the delivery report for what
// would still benefit from a real-DB run-through.
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Person, Organization, Country } from '../models/index.js';
import { requireValidObjectIdListField, assertPersonBelongsToCountry, assertOrganizationBelongsToCountry } from '../utils/adminHelpers.js';
import { validateLeaders } from '../services/admin/organizationAdminService.js';
import { validateResponsiblePeople } from '../services/admin/ministryAdminService.js';
import { validateRoles } from '../services/admin/personAdminService.js';

const oid = () => new mongoose.Types.ObjectId().toString();

// A chainable stand-in for `Model.findById(id).select(...).lean()` /
// `Model.find(filter).select(...).lean()` — `.select()` is a no-op here
// (every call site in the real code eventually just awaits `.lean()`), so
// one tiny helper covers both call shapes used across the services under
// test.
function leanChain(result) {
  return { select: () => leanChain(result), lean: async () => result };
}

async function expectApiError(fn, status, messageIncludes) {
  await assert.rejects(fn, (err) => {
    assert.equal(err.status, status, `expected status ${status}, got ${err.status} (${err.message})`);
    if (messageIncludes) assert.ok(err.message.includes(messageIncludes), `expected message to include "${messageIncludes}", got "${err.message}"`);
    return true;
  });
}

describe('requireValidObjectIdListField — malformed ids are 400s, not CastErrors', () => {
  test('accepts a list of well-formed ids (and skips blanks)', () => {
    assert.doesNotThrow(() => requireValidObjectIdListField([oid(), oid(), null, undefined], 'field'));
  });

  test('rejects a malformed id with a 400 ApiError', () => {
    assert.throws(() => requireValidObjectIdListField([oid(), 'not-an-object-id'], 'leaders[].person'), (err) => {
      assert.equal(err.status, 400);
      assert.ok(err.message.includes('leaders[].person'));
      return true;
    });
  });
});

describe('assertPersonBelongsToCountry — the core relationship check', () => {
  const countryA = oid();
  const countryB = oid();
  const personId = oid();

  let originalFindById;
  beforeEach(() => {
    originalFindById = Person.findById;
  });
  function restoreAfter(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } finally {
        Person.findById = originalFindById;
      }
    };
  }

  test(
    'passes when the person has a role in the target country',
    restoreAfter(async () => {
      Person.findById = () => leanChain({ roles: [{ country: countryA }] });
      await assert.doesNotReject(assertPersonBelongsToCountry(personId, countryA));
    })
  );

  test(
    'rejects when the person only has a role in a different country',
    restoreAfter(async () => {
      Person.findById = () => leanChain({ roles: [{ country: countryB }] });
      await expectApiError(() => assertPersonBelongsToCountry(personId, countryA), 400, 'no role in the required country');
    })
  );

  test(
    'passes for any country when the person has an internationally-scoped role (no country) — preserves legitimate international assignments',
    restoreAfter(async () => {
      Person.findById = () => leanChain({ roles: [{ country: null, roleType: 'director' }] });
      await assert.doesNotReject(assertPersonBelongsToCountry(personId, countryA));
      await assert.doesNotReject(assertPersonBelongsToCountry(personId, countryB));
    })
  );

  test(
    'rejects with 400 (not a 500) when the person does not exist',
    restoreAfter(async () => {
      Person.findById = () => leanChain(null);
      await expectApiError(() => assertPersonBelongsToCountry(personId, countryA), 400, 'does not exist');
    })
  );

  test('is a no-op when either id is missing (nothing to check yet)', async () => {
    await assert.doesNotReject(assertPersonBelongsToCountry(null, countryA));
    await assert.doesNotReject(assertPersonBelongsToCountry(personId, null));
  });
});

describe('assertOrganizationBelongsToCountry', () => {
  const countryA = oid();
  const countryB = oid();
  const orgId = oid();
  let originalFindById;
  beforeEach(() => {
    originalFindById = Organization.findById;
  });

  test('passes when the organization belongs to the target country', async () => {
    Organization.findById = () => leanChain({ country: countryA });
    await assert.doesNotReject(assertOrganizationBelongsToCountry(orgId, countryA));
    Organization.findById = originalFindById;
  });

  test('rejects when the organization belongs to a different country', async () => {
    Organization.findById = () => leanChain({ country: countryB });
    await expectApiError(() => assertOrganizationBelongsToCountry(orgId, countryA), 400, 'different country');
    Organization.findById = originalFindById;
  });
});

describe('organizationAdminService.validateLeaders — regression #1', () => {
  const countryA = oid();
  const countryB = oid();
  const leaderInA = oid();
  const leaderInB = oid();
  let origFind, origFindById;

  beforeEach(() => {
    origFind = Person.find;
    origFindById = Person.findById;
  });
  function restore() {
    Person.find = origFind;
    Person.findById = origFindById;
  }

  test('a country administrator cannot assign a person from another country as a leader', async () => {
    Person.find = () => leanChain([{ _id: leaderInB }]); // exists
    Person.findById = () => leanChain({ roles: [{ country: countryB }] });
    await expectApiError(() => validateLeaders([{ person: leaderInB }], countryA), 400, 'no role in the required country');
    restore();
  });

  test('a leader who actually has a role in the organization country is accepted', async () => {
    Person.find = () => leanChain([{ _id: leaderInA }]);
    Person.findById = () => leanChain({ roles: [{ country: countryA }] });
    await assert.doesNotReject(validateLeaders([{ person: leaderInA }], countryA));
    restore();
  });

  test('malformed leader person id returns 400, not a CastError', async () => {
    await expectApiError(() => validateLeaders([{ person: 'not-a-real-id' }], countryA), 400);
    restore();
  });

  test('a well-formed but nonexistent leader person id is still a clear validation error', async () => {
    Person.find = () => leanChain([]); // nothing found
    await expectApiError(() => validateLeaders([{ person: oid() }], countryA), 400, 'does not exist');
    restore();
  });
});

describe('ministryAdminService.validateResponsiblePeople — regression #3', () => {
  const countryA = oid();
  const countryB = oid();
  const personInB = oid();
  let origFind, origFindById;

  beforeEach(() => {
    origFind = Person.find;
    origFindById = Person.findById;
  });
  function restore() {
    Person.find = origFind;
    Person.findById = origFindById;
  }

  test('a country administrator cannot assign an unauthorized (other-country) person to a ministry', async () => {
    Person.find = () => leanChain([{ _id: personInB }]);
    Person.findById = () => leanChain({ roles: [{ country: countryB }] });
    await expectApiError(() => validateResponsiblePeople([{ person: personInB }], countryA), 400, 'no role in the required country');
    restore();
  });

  test('an international (country-less) ministry skips the country-relationship check entirely', async () => {
    Person.find = () => leanChain([{ _id: personInB }]);
    // Person.findById must NOT even need to be relevant here — countryId is
    // falsy, so assertPersonBelongsToCountry is never called.
    await assert.doesNotReject(validateResponsiblePeople([{ person: personInB }], null));
    restore();
  });

  test('malformed responsible-person id returns 400, not a CastError', async () => {
    await expectApiError(() => validateResponsiblePeople([{ person: 'xxx' }], countryA), 400);
    restore();
  });
});

describe('ministryAdminService — organization/country cross-reference (regression #2)', () => {
  const countryA = oid();
  const countryB = oid();
  const orgInA = oid();
  const orgInB = oid();
  let origFindById;
  beforeEach(() => {
    origFindById = Organization.findById;
  });

  test('a ministry cannot reference an organization belonging to a different country', async () => {
    Organization.findById = () => leanChain({ country: countryB });
    await expectApiError(() => assertOrganizationBelongsToCountry(orgInB, countryA), 400, 'different country');
    Organization.findById = origFindById;
  });

  test('a ministry can reference an organization in its own country', async () => {
    Organization.findById = () => leanChain({ country: countryA });
    await assert.doesNotReject(assertOrganizationBelongsToCountry(orgInA, countryA));
    Organization.findById = origFindById;
  });
});

describe('personAdminService.validateRoles — regression #4', () => {
  const countryA = oid();
  const countryB = oid();
  const orgInA = oid();
  const orgInB = oid();
  let origCountryFind, origOrgFind;

  beforeEach(() => {
    origCountryFind = Country.find;
    origOrgFind = Organization.find;
  });
  function restore() {
    Country.find = origCountryFind;
    Organization.find = origOrgFind;
  }

  test('rejects an invalid role type', async () => {
    await expectApiError(() => validateRoles([{ roleType: 'not-a-real-type' }]), 400, 'Invalid role type');
  });

  test('a role naming a country and an organization in a different country is rejected', async () => {
    Country.find = () => leanChain([{ _id: countryA }]);
    Organization.find = () => leanChain([{ _id: orgInB, country: countryB }]);
    await expectApiError(
      () => validateRoles([{ roleType: 'pastor', country: countryA, organization: orgInB }]),
      400,
      'different country'
    );
    restore();
  });

  test('a role naming a country and an organization actually in that country is accepted', async () => {
    Country.find = () => leanChain([{ _id: countryA }]);
    Organization.find = () => leanChain([{ _id: orgInA, country: countryA }]);
    await assert.doesNotReject(validateRoles([{ roleType: 'pastor', country: countryA, organization: orgInA }]));
    restore();
  });

  test('an internationally-scoped role (organization, no country) is accepted — preserves legitimate international roles', async () => {
    Organization.find = () => leanChain([{ _id: orgInA, country: countryA }]);
    await assert.doesNotReject(validateRoles([{ roleType: 'director', organization: orgInA }]));
    restore();
  });

  test('malformed role.country id returns 400, not a CastError', async () => {
    await expectApiError(() => validateRoles([{ roleType: 'pastor', country: 'bad-id' }]), 400);
  });

  test('malformed role.organization id returns 400, not a CastError', async () => {
    await expectApiError(() => validateRoles([{ roleType: 'pastor', organization: 'bad-id' }]), 400);
  });

  test('a valid-format but nonexistent role.country is a clear validation error, not a silent pass', async () => {
    Country.find = () => leanChain([]); // not found
    await expectApiError(() => validateRoles([{ roleType: 'pastor', country: oid() }]), 400, 'does not exist');
    restore();
  });
});
