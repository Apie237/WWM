import mongoose, { Schema } from 'mongoose';
import { CONTACT_MESSAGE_STATUSES } from './enums.js';

// Message from the public Contact form. Never exposed by any public route.
// No IP address or user-agent is stored.
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: CONTACT_MESSAGE_STATUSES, default: 'new' },
  },
  { timestamps: true }
);

contactMessageSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactMessageSchema);
