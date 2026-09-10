import HeroBand from '../components/home/HeroBand.jsx'
import StatsBand from '../components/home/StatsBand.jsx'
import HeritageBand from '../components/home/HeritageBand.jsx'
import AdminBand from '../components/home/AdminBand.jsx'
import MissionsBand from '../components/home/MissionsBand.jsx'
import ChurchInstitutionsBand from '../components/home/ChurchInstitutionsBand.jsx'
import NonChurchInstitutionsBand from '../components/home/NonChurchInstitutionsBand.jsx'
import MissionLocationsBand from '../components/home/MissionLocationsBand.jsx'
import AdditionalFeaturesBand from '../components/home/AdditionalFeaturesBand.jsx'

export default function Home() {
  return (
    <>
      <HeroBand />
      <StatsBand />
      <HeritageBand />
      <AdminBand />
      <MissionsBand />
      <ChurchInstitutionsBand />
      <NonChurchInstitutionsBand />
      <MissionLocationsBand />
      <AdditionalFeaturesBand />
    </>
  )
}
