// The wording these seed entries carried BEFORE the professional rewrite.
//
// The normal seed (`npm run seed:history`) only inserts missing entries and
// never overwrites anything, so records that were seeded earlier still hold this
// older text. `npm run seed:history:update-text` uses this table to upgrade a
// stored text field ONLY when it still equals the earlier wording exactly —
// a field someone has edited in Admin → History is never touched.
//
// Only text fields that were reworded appear here. Image fields, status, order,
// section, people and review fields are never part of a text update.
export const LEGACY_TEXT = {
  "intro": {
    "description": "World Wide Missions International traces its story through ministers, missionaries and Christian workers: from Basil Miller, a minister and author whose missionary writing connected believers around the world, to Bearl and Virginia Smalldridge, who served in Cameroon, and the leaders who have carried the work forward. The account below was supplied by the founder and is presented as the organization’s own history."
  },
  "basil-miller": {
    "description": "The founder’s notes identify Basil Miller as a Church of the Nazarene minister, pastor, teacher and Christian author. They state that he later founded the mission organization that became World-Wide Missions, and that his missionary literature helped build connections with Christian workers around the world.",
    "dateLabel": "Born February 26, 1897"
  },
  "basil-miller-writing": {
    "description": "The notes state that Basil Miller wrote approximately 200 books and thousands of articles over a 35-year writing career. They cite Heroine of Burma, published by World-Wide Missions in 1947."
  },
  "smalldridge-couple": {
    "description": "According to the founder’s notes, Bearl Darwin Smalldridge (1928–2016) was commissioned by WWMI as the first missionary to Cameroon in the 1960s. He and his wife, Virginia Smalldridge, moved to Cameroon after earlier mission work in the Bahamas and Liberia during the 1950s and 1960s."
  },
  "churches-established": {
    "description": "The notes state that Bearl and Virginia Smalldridge established over 50 churches across West and East Cameroon."
  },
  "secondary-school": {
    "description": "The notes state that the Smalldridges founded the World Wide Missions Secondary School in Mupundu-Muyuka in 1969, and served as proprietors of the school for more than five years."
  },
  "jonathan-smalldridge": {
    "description": "The notes state that Jonathan Smalldridge returned to Cameroon in 2008 to continue his father’s mission and became Director of World Wide Missions Cameroon."
  },
  "ebai-superintendent": {
    "description": "Identified in the founder’s notes as the first official superintendent of World Wide Missions Cameroon (WWMC)."
  },
  "fang-superintendent": {
    "description": "Identified in the founder’s notes as the present, or second, official superintendent of World Wide Missions Cameroon (WWMC)."
  },
  "fred-johnson": {
    "description": "The notes state that Rev. Fred M. Johnson served for 36 years (1985–2021) as CEO of World-Wide Missions and directed support for churches and humanitarian ministries in over 50 nations, including Christian orphanages, schools, pastoral colleges, AIDS ministries, disaster relief and the provision of food, clothing and medicine."
  },
  "expansion-countries": {
    "description": "The notes state that mission work expanded to other countries, including Uganda, Kenya, India and the Philippines, after the Smalldridges had served as proprietors of the secondary school for more than five years."
  }
};
