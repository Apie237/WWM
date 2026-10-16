import { countryAdministrationsApi } from '../../../services/adminApi.js'
import { createLeadershipStructureModule } from './createLeadershipStructureModule.jsx'

export const CountryAdministrationModule = createLeadershipStructureModule({
  api: countryAdministrationsApi,
  entriesKey: 'positions',
  entryNoun: 'position',
  title: 'Country Administration',
  basePath: '/admin/country-administrations',
  addEntry: (id, payload) => countryAdministrationsApi.addPosition(id, payload),
  updateEntry: (id, entryId, payload) => countryAdministrationsApi.updatePosition(id, entryId, payload),
  removeEntry: (id, entryId) => countryAdministrationsApi.removePosition(id, entryId),
})
