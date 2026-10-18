import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import History from './pages/History.jsx'
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
import NewsEventsList from './pages/NewsEventsList.jsx'
import NewsEventsDetail from './pages/NewsEventsDetail.jsx'
import NotFound from './pages/NotFound.jsx'
import LoadingState from './components/ui/LoadingState.jsx'

const AdminRoutes = lazy(() => import('./AdminRoutes.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/history" element={<History />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/mission-locations" element={<MissionLocations />} />
        <Route path="/mission-locations/:continent" element={<ContinentPage />} />
        <Route path="/mission-locations/:continent/:country" element={<CountryPage />} />
        <Route path="/church-institutions" element={<ChurchInstitutions />} />
        <Route path="/non-church-institutions" element={<NonChurchInstitutions />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/news" element={<NewsEventsList kind="news" />} />
        <Route path="/news/:slug" element={<NewsEventsDetail kind="news" />} />
        <Route path="/events" element={<NewsEventsList kind="events" />} />
        <Route path="/events/:slug" element={<NewsEventsDetail kind="events" />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin area: its own shell (AdminLayout), loaded on demand. */}
      <Route
        path="/admin/*"
        element={
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-wwm-bg">
                <LoadingState label="Loading administration…" />
              </div>
            }
          >
            <AdminRoutes />
          </Suspense>
        }
      />
    </Routes>
  )
}
