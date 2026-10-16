import { newsAdminService } from '../../services/admin/newsAdminService.js';
import { makeContentAdminController } from './contentAdminController.js';

export default makeContentAdminController(newsAdminService, {
  label: 'news article',
  countryScoped: true,
  sortable: ['publishedAt', 'title', 'createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  searchFields: ['title'],
  filterFields: ['status'],
});
