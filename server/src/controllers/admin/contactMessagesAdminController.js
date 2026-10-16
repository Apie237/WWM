import { contactMessageAdminService } from '../../services/admin/contactMessageAdminService.js';
import { makeContentAdminController } from './contentAdminController.js';

export default makeContentAdminController(contactMessageAdminService, {
  label: 'contact message',
  sortable: ['createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  searchFields: ['name', 'email', 'subject'],
  filterFields: ['status'],
});
