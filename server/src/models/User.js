import mongoose, { Schema } from 'mongoose';
import { ADMIN_ROLES } from './enums.js';

// The Phase 6 administration/CMS-login model (docs/PROJECT_SPEC.md §6, "User"
// under Administration models). This is deliberately a separate model from
// Person — a User is a login/authorization credential for the admin/CMS
// platform, not an organizational person record, and PROJECT_SPEC.md does not
// specify a Person reference for it, so none is invented here.
//
// `passwordHash` is never returned by default (`select: false`) and is
// stripped again by the toJSON transform below as a second safeguard, so a
// stray `.select('+passwordHash')` elsewhere can never leak it through a
// normal API response.
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 200,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, required: true },
    // Only meaningful for COUNTRY_ADMIN (docs/CLAUDE.md Phase 6 §9) — enforced
    // below rather than left to callers to remember, so a COUNTRY_ADMIN can
    // never be created/left without a country and no other role can be
    // given one it would never legitimately use for scoping.
    country: { type: Schema.Types.ObjectId, ref: 'Country', default: null },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('validate', function enforceCountryScopeInvariant(next) {
  if (this.role === 'COUNTRY_ADMIN' && !this.country) {
    next(new Error('A COUNTRY_ADMIN account must have an assigned country.'));
    return;
  }
  if (this.role !== 'COUNTRY_ADMIN' && this.country) {
    next(new Error('Only a COUNTRY_ADMIN account may have an assigned country.'));
    return;
  }
  next();
});

userSchema.index({ role: 1 });
userSchema.index({ country: 1 });

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model('User', userSchema);
