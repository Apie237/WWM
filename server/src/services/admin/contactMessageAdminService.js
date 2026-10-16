import { ContactMessage } from '../../models/index.js';
import { ApiError } from '../../utils/apiError.js';
import { CONTACT_MESSAGE_STATUSES } from '../../models/enums.js';
import { makeContentAdminService } from './contentAdminService.js';

// Admins may only change the triage status of a message.
export const CONTACT_WRITABLE_FIELDS = ['status'];

export async function validateContactTriage(data) {
  if ('status' in data && !CONTACT_MESSAGE_STATUSES.includes(data.status)) {
    throw new ApiError(400, `"status" must be one of: ${CONTACT_MESSAGE_STATUSES.join(', ')}.`);
  }
  return { ...data };
}

export const contactMessageAdminService = makeContentAdminService({
  Model: ContactMessage,
  label: 'Contact message',
  writableFields: CONTACT_WRITABLE_FIELDS,
  validate: validateContactTriage,
});
