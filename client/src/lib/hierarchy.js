// Builds a tree from a flat hierarchy-entry array (CountryAdministration
// .positions or AffiliatePastorsBoard.members — server/src/models/shared/
// hierarchyEntry.schema.js) by following each entry's `parentEntry` pointer.
// No position names or reporting structure are assumed here; the shape of
// the tree is entirely whatever the data says (docs/DESIGN_SPEC.md §6/§7).
export function buildHierarchyTree(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return []

  const byId = new Map(entries.map((entry) => [String(entry._id), { ...entry, children: [] }]))
  const roots = []

  for (const entry of byId.values()) {
    const parentId = entry.parentEntry ? String(entry.parentEntry) : null
    const parent = parentId ? byId.get(parentId) : null
    if (parent) {
      parent.children.push(entry)
    } else {
      // No parent, or parentEntry points outside this array (orphaned data)
      // — treat as a root rather than silently dropping the entry.
      roots.push(entry)
    }
  }

  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)
  for (const entry of byId.values()) entry.children.sort(byOrder)
  roots.sort(byOrder)

  return roots
}
