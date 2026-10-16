import { prayerRequestAdminService } from '../../services/admin/prayerRequestAdminService.js';
import { makeContentAdminController } from './contentAdminController.js';

// Country-scoped: a COUNTRY_ADMIN moderates only requests tagged with their
// own country; untagged (international) requests belong to international admins.
export default makeContentAdminController(prayerRequestAdminService, {
  label: 'prayer request',
  countryScoped: true,
  sortable: ['createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  searchFields: ['request', 'name'],
  filterFields: ['status'],
});
