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
