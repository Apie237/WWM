import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Missions from './pages/Missions.jsx'
import MissionLocations from './pages/MissionLocations.jsx'
import ContinentPage from './pages/ContinentPage.jsx'
import CountryPage from './pages/CountryPage.jsx'
import ChurchInstitutions from './pages/ChurchInstitutions.jsx'
import NonChurchInstitutions from './pages/NonChurchInstitutions.jsx'
import Resources from './pages/Resources.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './components/admin/ProtectedRoute.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminUnauthorized from './pages/admin/AdminUnauthorized.jsx'
import ContinentsList from './pages/admin/continents/ContinentsList.jsx'
import ContinentForm from './pages/admin/continents/ContinentForm.jsx'
import CountriesList from './pages/admin/countries/CountriesList.jsx'
import CountryForm from './pages/admin/countries/CountryForm.jsx'
import PeopleList from './pages/admin/people/PeopleList.jsx'
import PersonForm from './pages/admin/people/PersonForm.jsx'
import OrganizationsList from './pages/admin/organizations/OrganizationsList.jsx'
import OrganizationForm from './pages/admin/organizations/OrganizationForm.jsx'
import MinistriesList from './pages/admin/ministries/MinistriesList.jsx'
import MinistryForm from './pages/admin/ministries/MinistryForm.jsx'
import { CountryAdministrationModule } from './pages/admin/leadershipStructure/countryAdministrationModule.js'
import { AffiliatePastorsBoardModule } from './pages/admin/leadershipStructure/affiliatePastorsBoardModule.js'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/mission-locations" element={<MissionLocations />} />
        <Route path="/mission-locations/:continent" element={<ContinentPage />} />
        <Route path="/mission-locations/:continent/:country" element={<CountryPage />} />
        <Route path="/church-institutions" element={<ChurchInstitutions />} />
        <Route path="/non-church-institutions" element={<NonChurchInstitutions />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin area has its own shell (AdminLayout) — not the public
          Header/Footer Layout above. */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/unauthorized" element={<AdminUnauthorized />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
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

          <Route path="country-administrations" element={<CountryAdministrationModule.List />} />
          <Route path="country-administrations/new" element={<CountryAdministrationModule.Form />} />
          <Route path="country-administrations/:id" element={<CountryAdministrationModule.Form />} />
          <Route path="country-administrations/:id/manage" element={<CountryAdministrationModule.Detail />} />

          <Route path="affiliate-pastors-boards" element={<AffiliatePastorsBoardModule.List />} />
          <Route path="affiliate-pastors-boards/new" element={<AffiliatePastorsBoardModule.Form />} />
          <Route path="affiliate-pastors-boards/:id" element={<AffiliatePastorsBoardModule.Form />} />
          <Route path="affiliate-pastors-boards/:id/manage" element={<AffiliatePastorsBoardModule.Detail />} />
        </Route>
      </Route>
    </Routes>
  )
}
