import { affiliatePastorsBoardsApi } from '../../../services/adminApi.js'
import { createLeadershipStructureModule } from './createLeadershipStructureModule.jsx'

export const AffiliatePastorsBoardModule = createLeadershipStructureModule({
  api: affiliatePastorsBoardsApi,
  entriesKey: 'members',
  entryNoun: 'member',
  title: 'Affiliate Pastors Board',
  basePath: '/admin/affiliate-pastors-boards',
  addEntry: (id, payload) => affiliatePastorsBoardsApi.addMember(id, payload),
  updateEntry: (id, entryId, payload) => affiliatePastorsBoardsApi.updateMember(id, entryId, payload),
  removeEntry: (id, entryId) => affiliatePastorsBoardsApi.removeMember(id, entryId),
})
