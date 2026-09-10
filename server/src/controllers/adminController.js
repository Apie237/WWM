import { asyncHandler } from '../utils/asyncHandler.js';

// Phase 6 admin foundation only — a shell payload for the admin dashboard
// frontend to render (docs/CLAUDE.md Phase 6 §12: "The dashboard can remain
// a foundation/shell"). No CMS content/CRUD is exposed here; that is Phase 7.
export const getDashboard = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      admin: req.admin,
      message: 'Admin foundation established. CMS modules will be added in Phase 7.',
    },
  });
});
