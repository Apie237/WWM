import * as contactService from '../services/contactService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const submitContactMessage = asyncHandler(async (req, res) => {
  if (req.body?.website) {
    res.status(201).json({ success: true, data: { received: true } });
    return;
  }
  await contactService.createContactMessage(req.body);
  res.status(201).json({ success: true, data: { received: true, message: 'Thank you. Your message has been sent.' } });
});
