import { useState } from 'react'
import { FileText } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import LoadingState from '../ui/LoadingState.jsx'
import ResourceCard from '../content/ResourceCard.jsx'
import { fieldClasses } from '../ui/FormField.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { getResources } from '../../services/api.js'
import { RESOURCE_TYPE_LABELS } from '../../lib/format.js'

export default function ResourceLibrarySection() {
  const [type, setType] = useState('')
  const { status, data } = useFetch(getResources, { type: type || undefined, limit: 50 })

  return (
    <div>
      <div className="flex items-center gap-3">
        <label htmlFor="resource-type" className="text-sm font-semibold text-wwm-navy">Type</label>
        <select id="resource-type" value={type} onChange={(e) => setType(e.target.value)} className={`${fieldClasses} w-auto`}>
          <option value="">All types</option>
          {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="mt-6">
        {status === 'loading' ? (
          <LoadingState label="Loading resources…" />
        ) : status === 'error' ? (
          <EmptyState icon={FileText} title="Resources could not be loaded" description="Please try again later." />
        ) : data.length === 0 ? (
          <EmptyState icon={FileText} title="No resources published yet" description="Sermons, devotionals, tracts, and downloads will appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <ResourceCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
