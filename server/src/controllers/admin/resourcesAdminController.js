import { resourceAdminService } from '../../services/admin/resourceAdminService.js';
import { makeContentAdminController } from './contentAdminController.js';

export default makeContentAdminController(resourceAdminService, {
  label: 'resource',
  sortable: ['order', 'title', 'createdAt'],
  defaultSort: 'order',
  searchFields: ['title'],
  filterFields: ['status', 'resourceType'],
});
