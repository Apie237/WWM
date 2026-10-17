import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard } from '../controllers/adminController.js';
import continentsAdminRouter from './admin/continents.js';
import countriesAdminRouter from './admin/countries.js';
import peopleAdminRouter from './admin/people.js';
import organizationsAdminRouter from './admin/organizations.js';
import ministriesAdminRouter from './admin/ministries.js';
import countryAdministrationsAdminRouter from './admin/countryAdministrations.js';
import affiliatePastorsBoardsAdminRouter from './admin/affiliatePastorsBoards.js';
import newsAdminRouter from './admin/news.js';
import eventsAdminRouter from './admin/events.js';
import resourcesAdminRouter from './admin/resources.js';
import prayerRequestsAdminRouter from './admin/prayerRequests.js';
import contactMessagesAdminRouter from './admin/contactMessages.js';
import mediaAdminRouter from './admin/media.js';

const router = Router();

// Any authenticated admin role may load the dashboard shell — Phase 7's CMS
// modules are what will actually differentiate by role/country.
router.get('/dashboard', requireAuth, getDashboard);

// Phase 7 CMS CRUD modules. Each sub-router applies its own `requireAuth`/
// `requireRole` and country-scoping, so nothing additional is layered on
// here — this file just centralizes where every /api/admin/* route is
// mounted, matching how app.js expects one adminRouter for the whole prefix.
router.use('/continents', continentsAdminRouter);
router.use('/countries', countriesAdminRouter);
router.use('/people', peopleAdminRouter);
router.use('/organizations', organizationsAdminRouter);
router.use('/ministries', ministriesAdminRouter);
router.use('/country-administrations', countryAdministrationsAdminRouter);
router.use('/affiliate-pastors-boards', affiliatePastorsBoardsAdminRouter);

// Phase 8 content modules.
router.use('/news', newsAdminRouter);
router.use('/events', eventsAdminRouter);
router.use('/resources', resourcesAdminRouter);
router.use('/prayer-requests', prayerRequestsAdminRouter);
router.use('/contact-messages', contactMessagesAdminRouter);

// Phase 9 media uploads.
router.use('/media', mediaAdminRouter);

export default router;
