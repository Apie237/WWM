// Shared enum value lists used by Phase 2 models. Centralized here so model
// files, and later phases' services/controllers/seed scripts, reference one
// source of truth instead of duplicating string literals.

export const PERSON_ROLE_TYPES = [
  'founder',
  'missionary',
  'pastor',
  'superintendent',
  'administrator',
  'board_member',
  'national_leader',
  'teacher',
  'director',
  'other',
];

// Matches the organization type categories required by docs/PROJECT_SPEC.md §6/§8.
export const ORGANIZATION_TYPES = [
  'wwm_church',
  'school',
  'hospital',
  'clinic',
  'orphanage',
  'bible_college',
  'training_center',
  'community_project',
  'other',
];

// Matches the mission-activity categories shown in docs/DESIGN_SPEC.md §10
// (derived from the approved reference image's Missions section). These are
// classification labels, not organizational facts, so enumerating them here
// does not invent WWMI data.
export const MINISTRY_TYPES = [
  'church_planting',
  'evangelism',
  'leadership_training',
  'education',
  'compassion_ministry',
  'media_publications',
  'missionary_care',
  'other',
];

// Phase 6 administration roles, exactly as specified by
// docs/PROJECT_SPEC.md §14 / docs/CLAUDE.md — no additional roles are
// introduced. COUNTRY_ADMIN accounts are restricted to their assigned
// Country (see models/User.js); the other three are not country-scoped.
export const ADMIN_ROLES = ['SUPER_ADMIN', 'INTERNATIONAL_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_EDITOR'];

// Phase 8 content-module enums (docs/PROJECT_SPEC.md §6 "Content models").
export const CONTENT_STATUSES = ['draft', 'published'];

// Classification labels for the resource library (docs/DESIGN_SPEC.md §11:
// "document/audio/video" plus the sermons/devotionals/tracts named on the
// Resources tile). Not organizational facts.
export const RESOURCE_TYPES = ['sermon', 'devotional', 'tract', 'publication', 'document', 'audio', 'video', 'other'];

// Prayer requests are never public until a moderator approves them.
export const PRAYER_REQUEST_STATUSES = ['pending', 'approved', 'rejected'];

export const CONTACT_MESSAGE_STATUSES = ['new', 'read', 'archived'];

// History page (HistoryEvent — docs/PROJECT_SPEC.md §12). `section` decides where
// an entry appears on the public History page; add a value here (and a section
// heading in the client) to give a future country or theme its own block.
export const HISTORY_SECTIONS = [
  'introduction',
  'origins',
  'cameroon',
  'cameroon-leadership',
  'international-leadership',
  'records',
  'international-growth',
];
// event = a dated/narrative milestone; record = a historical document or address
// shown in the "records" panel; pending = a placeholder for information not yet supplied.
export const HISTORY_ENTRY_TYPES = ['event', 'record', 'pending'];
// PRIVATE editorial status — never returned by the public API.
export const HISTORY_REVIEW_STATUSES = ['unreviewed', 'needs_confirmation', 'confirmed'];
