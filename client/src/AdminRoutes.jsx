import { useEffect } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/admin/ProtectedRoute.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUnauthorized from "./pages/admin/AdminUnauthorized.jsx";
import ContinentsList from "./pages/admin/continents/ContinentsList.jsx";
import ContinentForm from "./pages/admin/continents/ContinentForm.jsx";
import CountriesList from "./pages/admin/countries/CountriesList.jsx";
import CountryForm from "./pages/admin/countries/CountryForm.jsx";
import PeopleList from "./pages/admin/people/PeopleList.jsx";
import PersonForm from "./pages/admin/people/PersonForm.jsx";
import HistoryList from "./pages/admin/history/HistoryList.jsx";
import HistoryForm from "./pages/admin/history/HistoryForm.jsx";
import OrganizationsList from "./pages/admin/organizations/OrganizationsList.jsx";
import OrganizationForm from "./pages/admin/organizations/OrganizationForm.jsx";
import MinistriesList from "./pages/admin/ministries/MinistriesList.jsx";
import MinistryForm from "./pages/admin/ministries/MinistryForm.jsx";
import NewsList from "./pages/admin/news/NewsList.jsx";
import NewsForm from "./pages/admin/news/NewsForm.jsx";
import EventsList from "./pages/admin/events/EventsList.jsx";
import EventForm from "./pages/admin/events/EventForm.jsx";
import ResourcesList from "./pages/admin/resources/ResourcesList.jsx";
import ResourceForm from "./pages/admin/resources/ResourceForm.jsx";
import PrayerRequestsAdmin from "./pages/admin/inbox/PrayerRequestsAdmin.jsx";
import ContactMessagesAdmin from "./pages/admin/inbox/ContactMessagesAdmin.jsx";
import { CountryAdministrationModule } from "./pages/admin/leadershipStructure/countryAdministrationModule.js";
import { AffiliatePastorsBoardModule } from "./pages/admin/leadershipStructure/affiliatePastorsBoardModule.js";

// The entire administration area lives in this one file so App.jsx can load
// it lazily: public visitors never download the CMS code (Phase 10 — smaller
// first-load bundle). Paths below are relative to /admin.
export default function AdminRoutes() {
  // Keep the admin area out of search engines (robots.txt also disallows it).
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="unauthorized" element={<AdminUnauthorized />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Phase 7 CMS CRUD modules. */}
          <Route path="continents" element={<ContinentsList />} />
          <Route path="continents/new" element={<ContinentForm />} />
          <Route path="continents/:id" element={<ContinentForm />} />

          <Route path="countries" element={<CountriesList />} />
          <Route path="countries/new" element={<CountryForm />} />
          <Route path="countries/:id" element={<CountryForm />} />

          <Route path="people" element={<PeopleList />} />
          <Route path="people/new" element={<PersonForm />} />
          <Route path="people/:id" element={<PersonForm />} />

          <Route path="organizations" element={<OrganizationsList />} />
          <Route path="organizations/new" element={<OrganizationForm />} />
          <Route path="organizations/:id" element={<OrganizationForm />} />

          <Route path="ministries" element={<MinistriesList />} />
          <Route path="ministries/new" element={<MinistryForm />} />
          <Route path="ministries/:id" element={<MinistryForm />} />

          {/* Phase 8 content modules. */}
          <Route path="news" element={<NewsList />} />
          <Route path="news/new" element={<NewsForm />} />
          <Route path="news/:id" element={<NewsForm />} />
          <Route path="events" element={<EventsList />} />
          <Route path="events/new" element={<EventForm />} />
          <Route path="events/:id" element={<EventForm />} />
          <Route path="resources" element={<ResourcesList />} />
          <Route path="resources/new" element={<ResourceForm />} />
          <Route path="resources/:id" element={<ResourceForm />} />
          <Route path="history" element={<HistoryList />} />
          <Route path="history/new" element={<HistoryForm />} />
          <Route path="history/:id" element={<HistoryForm />} />
          <Route path="prayer-requests" element={<PrayerRequestsAdmin />} />
          <Route path="contact-messages" element={<ContactMessagesAdmin />} />

          <Route
            path="country-administrations"
            element={<CountryAdministrationModule.List />}
          />
          <Route
            path="country-administrations/new"
            element={<CountryAdministrationModule.Form />}
          />
          <Route
            path="country-administrations/:id"
            element={<CountryAdministrationModule.Form />}
          />
          <Route
            path="country-administrations/:id/manage"
            element={<CountryAdministrationModule.Detail />}
          />

          <Route
            path="affiliate-pastors-boards"
            element={<AffiliatePastorsBoardModule.List />}
          />
          <Route
            path="affiliate-pastors-boards/new"
            element={<AffiliatePastorsBoardModule.Form />}
          />
          <Route
            path="affiliate-pastors-boards/:id"
            element={<AffiliatePastorsBoardModule.Form />}
          />
          <Route
            path="affiliate-pastors-boards/:id/manage"
            element={<AffiliatePastorsBoardModule.Detail />}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
