import { ContactMessage } from '../models/index.js';
import { cleanString, cleanEmail } from '../utils/inputValidation.js';

// Whitelisted fields only; `status` is always the default ("new").
export async function createContactMessage(body = {}) {
  const data = {
    name: cleanString(body.name, 'name', { required: true, max: 150 }),
    email: cleanEmail(body.email),
    subject: cleanString(body.subject, 'subject', { max: 200 }),
    message: cleanString(body.message, 'message', { required: true, max: 5000 }),
  };
  const doc = await ContactMessage.create(data);
  return { _id: doc._id };
}
