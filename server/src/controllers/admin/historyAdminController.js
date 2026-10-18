import { historyAdminService } from '../../services/admin/historyAdminService.js';
import { makeContentAdminController } from './contentAdminController.js';

export default makeContentAdminController(historyAdminService, {
  label: 'history entry',
  sortable: ['order', 'title', 'section', 'year', 'createdAt'],
  defaultSort: 'order',
  searchFields: ['title'],
  filterFields: ['status', 'section', 'reviewStatus'],
});
