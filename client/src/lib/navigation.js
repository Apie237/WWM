// Shared primary-navigation structure for Header, MobileNavigation, and
// Footer. Centralized here so the three components never drift out of sync
// with the approved grouping (Phase 4 instructions / docs/DESIGN_SPEC.md
// §2.3). Entries are UI labels/routes only — no organizational data lives
// here (continent tiles in the Mission Locations mega-menu are fetched from
// the API at render time, not listed statically).

export const NAV_ITEMS = [
  { label: "Home", to: "/" },
  {
    label: "About Us",
    to: "/about",
    children: [
      { label: "Who We Are", to: "/about#who-we-are" },
      { label: "Mission", to: "/about#mission" },
      { label: "Vision", to: "/about#vision" },
      { label: "Values", to: "/about#values" },
      { label: "Beliefs", to: "/about#beliefs" },
      { label: "Purpose", to: "/about#purpose" },
      { label: "Our Approach", to: "/about#our-approach" },
      { label: "National Leadership", to: "/about#national-leadership" },
      { label: "Our History", to: "/history" },
      { label: "International Administration", to: "/about#international-administration" },
      { label: "Legal & Organizational Information", to: "/about#legal" },
    ],
  },
  {
    label: "Missions",
    to: "/missions",
    children: [
      { label: "Mission Areas", to: "/missions#mission-areas" },
      { label: "Missionaries", to: "/missions#missionaries" },
      { label: "Ministries", to: "/missions#ministries" },
      { label: "Where We Serve", to: "/missions#where-we-serve" },
    ],
  },
  {
    label: "Mission Locations",
    to: "/mission-locations",
    mega: true,
  },
  {
    label: "Church Institutions",
    to: "/church-institutions",
    children: [
      { label: "Find a Church", to: "/church-institutions#find-a-church" },
      { label: "About Our Churches", to: "/church-institutions#about" },
      { label: "Church Network", to: "/church-institutions#network" },
      { label: "Ministries", to: "/church-institutions#ministries" },
      { label: "Resources", to: "/church-institutions#resources" },
    ],
  },
  {
    label: "Non-Church Institutions",
    to: "/non-church-institutions",
    children: [
      { label: "Schools", to: "/non-church-institutions#schools" },
      { label: "Hospitals & Clinics", to: "/non-church-institutions#hospitals-clinics" },
      { label: "Orphanages", to: "/non-church-institutions#orphanages" },
      { label: "Bible Colleges", to: "/non-church-institutions#bible-colleges" },
      { label: "Skills Training", to: "/non-church-institutions#skills-training" },
      { label: "Community Projects", to: "/non-church-institutions#community-projects" },
    ],
  },
  {
    label: "Resources",
    to: "/resources",
    children: [
      { label: "News & Events", to: "/resources#news-events" },
      { label: "Resources", to: "/resources#resources" },
      { label: "Prayer Requests", to: "/resources#prayer-requests" },
    ],
  },
];

export const FOOTER_GROUPS = [
  {
    heading: "Quick Links",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Missions", to: "/missions" },
      { label: "Mission Locations", to: "/mission-locations" },
      { label: "Church Institutions", to: "/church-institutions" },
      { label: "Non-Church Institutions", to: "/non-church-institutions" },
      { label: "Contact", to: "/resources#contact" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "News & Events", to: "/resources#news-events" },
      { label: "Prayer Requests", to: "/resources#prayer-requests" },
      { label: "Missionaries", to: "/missions#missionaries" },
      { label: "Resources", to: "/resources#resources" },
    ],
  },
  {
    heading: "Get Involved",
    links: [
      { label: "Pray", to: "/resources#prayer-requests" },
      { label: "Give", to: "/resources#give" },
      { label: "Go", to: "/missions#missionaries" },
      { label: "Partner With Us", to: "/resources#give" },
    ],
  },
];
