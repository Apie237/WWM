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
        </Route>
      </Route>
    </Routes>
  )
}
