import { eventAdminService } from '../../services/admin/eventAdminService.js';
import { makeContentAdminController } from './contentAdminController.js';

export default makeContentAdminController(eventAdminService, {
  label: 'event',
  countryScoped: true,
  sortable: ['startDate', 'title', 'createdAt'],
  defaultSort: 'startDate',
  defaultOrder: 'desc',
  searchFields: ['title'],
  filterFields: ['status'],
});
