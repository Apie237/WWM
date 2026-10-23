// Founder-supplied history (WWMI History section brief). This is DATA for the
// seed script, not page content: the public page reads it back from the
// database, and every entry stays editable in Admin → History.
//
// Rules followed here (CLAUDE.md "Data Integrity"):
//  - Only facts supplied by the founder are used; nothing is added or inferred.
//  - Public wording is written as the organization's own institutional history,
//    in plain formal English. It carries no research-note phrasing ("according
//    to…", "the notes state…"); provenance lives in the separate `source` line
//    and in the PRIVATE review fields below, never inside the narrative.
//  - `reviewStatus` / `reviewNote` are PRIVATE and list exactly what still needs
//    founder confirmation. They are never returned by the public API.
//  - Rewording must not change a fact. Text that was reworded is listed in
//    historySeedLegacy.js so `npm run seed:history:update-text` can upgrade
//    records that still hold the earlier wording (and leave admin edits alone).
//  - No dates, titles or relationships beyond the supplied material.
// `people` holds display names to link to EXISTING Person records (the seed never
// creates people); unmatched names are reported by the script.

const NOTES = 'Founder-supplied notes';
const RECORDS = 'Founder-supplied records';
const CONFIRM = 'needs_confirmation';

export const HISTORY_SEED = [
  // ---------------------------------------------------------------- introduction
  {
    key: 'intro',
    section: 'introduction',
    title: 'Our History',
    description:
      'World Wide Missions International traces its history through the ministers, missionaries and Christian workers who have shaped its work: from Basil Miller, a minister and author whose missionary writing connected believers around the world; to Bearl and Virginia Smalldridge, who served in Cameroon; and to the leaders who have carried the work forward.',
    order: 0,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote: 'Editorial introduction written only from the founder’s notes. Confirm the wording is acceptable.',
  },

  // --------------------------------------------------------------------- origins
  {
    key: 'basil-miller',
    section: 'origins',
    title: 'Basil Miller',
    subtitle: 'Minister, pastor, teacher and author',
    dateLabel: 'Born 26 February 1897',
    year: 1897,
    description:
      'Basil Miller was a Church of the Nazarene minister, pastor, teacher and Christian author. He later founded the mission organization that became World-Wide Missions, and his missionary literature helped build connections with Christian workers around the world.',
    people: ['Basil Miller'],
    order: 10,
    source: NOTES,
    imageAlt: 'Portrait of Basil Miller',
    reviewStatus: CONFIRM,
    reviewNote:
      'Confirm: birth date; Church of the Nazarene ministry; that he founded the organization that became World-Wide Missions. docs/PROJECT_SPEC.md §12 also records the original name “Basil Miller Foundation Inc.” and warns of conflicting founding/name-transition dates in other sources — none is stated publicly. Portrait photograph needed (upload on this entry).',
  },
  {
    key: 'basil-miller-writing',
    section: 'origins',
    title: 'A writing ministry',
    dateLabel: '35-year writing career',
    description:
      'Over a writing career of 35 years, Basil Miller wrote approximately 200 books and thousands of articles. His published works include Heroine of Burma, issued by World-Wide Missions in 1947.',
    people: ['Basil Miller'],
    order: 20,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote:
      'Confirm: “approximately 200 books”, “thousands of articles”, “35-year” career, and the title, publisher and 1947 date of Heroine of Burma. No external bibliographic check has been made.',
  },

  // -------------------------------------------------------------------- cameroon
  {
    key: 'smalldridge-couple',
    section: 'cameroon',
    title: 'Bearl and Virginia Smalldridge',
    subtitle: 'First WWMI missionaries to Cameroon',
    dateLabel: '1960s',
    approximateDate: true,
    location: 'Cameroon',
    description:
      'Bearl Darwin Smalldridge (1928–2016) was commissioned by WWMI in the 1960s as its first missionary to Cameroon. Together with his wife, Virginia Smalldridge, he relocated to Cameroon after earlier missionary service in the Bahamas and Liberia during the 1950s and 1960s.',
    people: ['Bearl Darwin Smalldridge', 'Virginia Smalldridge'],
    order: 10,
    source: NOTES,
    imageAlt: 'Bearl and Virginia Smalldridge as a young couple',
    imageCaption: 'Bearl and Virginia Smalldridge',
    reviewStatus: CONFIRM,
    reviewNote:
      'Confirm: 1960s commissioning and “first missionary to Cameroon”; life dates 1928–2016; Bahamas and Liberia service and its dates. The founder’s photograph of the couple as a young couple is needed — upload it on this entry.',
  },
  {
    key: 'churches-established',
    section: 'cameroon',
    title: 'Churches established',
    location: 'West and East Cameroon',
    description:
      'Bearl and Virginia Smalldridge established more than 50 churches across West and East Cameroon.',
    people: ['Bearl Darwin Smalldridge', 'Virginia Smalldridge'],
    order: 20,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote: 'Confirm the number of churches (“over 50”) and the regions named (West and East Cameroon).',
  },
  {
    key: 'secondary-school',
    section: 'cameroon',
    title: 'World Wide Missions Secondary School',
    dateLabel: '1969',
    year: 1969,
    location: 'Mupundu-Muyuka',
    description:
      'In 1969 the Smalldridges founded the World Wide Missions Secondary School in Mupundu-Muyuka, and they served as its proprietors for more than five years.',
    people: ['Bearl Darwin Smalldridge', 'Virginia Smalldridge'],
    order: 30,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote:
      'Confirm: founding year 1969; “more than five years” as proprietors; and the place name. The founder’s brief spells it “Mupundu-Muyuka”; docs/PROJECT_SPEC.md §12 records “Mpundu-Muyuka”. The brief’s spelling is used until the founder confirms.',
  },

  // -------------------------------------------------------- cameroon-leadership
  {
    key: 'jonathan-smalldridge',
    section: 'cameroon-leadership',
    title: 'Jonathan Smalldridge',
    subtitle: 'Director, World Wide Missions Cameroon',
    dateLabel: 'Returned to Cameroon in 2008',
    year: 2008,
    description:
      'Jonathan Smalldridge returned to Cameroon in 2008 to continue his father’s mission and became Director of World Wide Missions Cameroon.',
    people: ['Jonathan Smalldridge'],
    order: 10,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote: 'Confirm the 2008 date and title. Photograph needed unless his Person record already has one. No other appointment dates were supplied.',
  },
  {
    key: 'ebai-superintendent',
    section: 'cameroon-leadership',
    title: 'Rev. Ebai Aloysius',
    subtitle: 'First official WWMC Superintendent',
    description: 'Rev. Ebai Aloysius was the first official superintendent of World Wide Missions Cameroon (WWMC).',
    people: ['Rev. Ebai Aloysius'],
    order: 20,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote:
      'NAME DISCREPANCY: the founder’s brief says “Rev. Ebai Aloysius”; docs/PROJECT_SPEC.md §12 says “Rev. Elias A. Ebai”. Confirm the correct name and the appointment date. Photograph needed.',
  },
  {
    key: 'fang-superintendent',
    section: 'cameroon-leadership',
    title: 'Rev. Anang Christopher Fang',
    subtitle: 'Superintendent, World Wide Missions Cameroon',
    dateLabel: 'Present',
    description: 'Rev. Anang Christopher Fang is the present, and second, official superintendent of World Wide Missions Cameroon (WWMC).',
    people: ['Rev. Anang Christopher Fang'],
    order: 30,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote:
      'Confirm he is the current (second) superintendent and the start date. The founder asked that the supplied Fang photograph REPLACE the image currently used for him: upload it on his Person record (Admin → People); this entry will pick it up automatically.',
  },

  // ------------------------------------------------------ international-leadership
  {
    key: 'fred-johnson',
    section: 'international-leadership',
    title: 'Rev. Fred M. Johnson',
    subtitle: 'CEO of World-Wide Missions',
    dateLabel: '1985–2021',
    description:
      'Rev. Fred M. Johnson served as CEO of World-Wide Missions for 36 years, from 1985 to 2021. He directed support for churches and humanitarian ministries in more than 50 nations, including Christian orphanages, schools, pastoral colleges, AIDS ministries, disaster relief and the provision of food, clothing and medicine.',
    people: ['Rev. Fred M. Johnson'],
    imageAlt: 'Portrait of Rev. Fred M. Johnson',
    order: 10,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote:
      'Founder asked for verification BEFORE publication: confirm the 1985–2021 dates (36 years), “over 50 nations” and the list of ministries. Photograph needed. Set this entry to Draft if it should not be public yet.',
  },

  // ---------------------------------------------------------- international-growth
  {
    key: 'expansion-countries',
    section: 'international-growth',
    title: 'Expansion to other countries',
    description:
      'After the Smalldridges had served as proprietors of the secondary school for more than five years, mission work expanded to other countries, including Uganda, Kenya, India and the Philippines.',
    order: 10,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote: 'Confirm the countries named and the timing. No dates were supplied for any of them.',
  },
  {
    key: 'brazil-pending',
    section: 'international-growth',
    entryType: 'pending',
    title: 'World Wide Mission Brazil',
    description: 'Information about World Wide Mission Brazil will be added when it is available.',
    order: 20,
    source: NOTES,
    reviewStatus: CONFIRM,
    reviewNote:
      'The founder mentioned discovering World Wide Mission Brazil online. NO founding date, activities, leadership or relationship to WWMI was supplied — do not add any without confirmation.',
  },

  // --------------------------------------------------------------------- records
  {
    key: 'record-pasadena',
    section: 'records',
    entryType: 'record',
    title: 'World-Wide Missions, Inc. — historical address',
    description: '1593 East Colorado Boulevard\nPasadena, California, USA\n\nMailing address:\nP.O. Box G, Pasadena, CA 91109',
    order: 10,
    source: RECORDS,
    reviewStatus: CONFIRM,
    reviewNote: 'Confirm the period this address was used and whether it is still operational. It must not be shown as a current address unless confirmed.',
  },
  {
    key: 'record-cameroon',
    section: 'records',
    entryType: 'record',
    title: 'World Wide Mission, Cameroon — historical details',
    description: 'Headquarters: Muyuka\nMailing address: P.O. Box 44, Muyuka, Southwest Region, Cameroon',
    location: 'Muyuka, Cameroon',
    order: 20,
    source: RECORDS,
    reviewStatus: CONFIRM,
    reviewNote: 'Confirm whether the Muyuka headquarters and P.O. Box 44 are still in use before describing them as current.',
  },
  {
    key: 'record-decree',
    section: 'records',
    entryType: 'record',
    title: 'Historical authorization',
    dateLabel: '3 December 1971',
    year: 1971,
    location: 'Muyuka, Cameroon',
    description: '“Officially authorized by Decree No. 71/DF/608 of 3 December 1971. Headquarters historically recorded at Muyuka, Cameroon.”',
    order: 30,
    source: RECORDS,
    reviewStatus: CONFIRM,
    reviewNote: 'Confirm the decree reference and the exact legal wording. No legal conclusion is drawn beyond the supplied sentence. Attach a scan when one is available.',
  },
];
