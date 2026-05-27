/**
 * Location resolution for conference talks.
 *
 * The Notion export has no location field, so we derive each conference's city from its name.
 * Two tables drive `resolveCity`:
 *   1. CITY_COORDS           — city (+aliases) -> { country, lat, lng }. The coordinate source.
 *   2. CONFERENCE_CITY_OVERRIDES — series whose NAME does not contain the city -> a CITY_COORDS key.
 *
 * resolveCity() first tries the overrides (substring match on the normalized name), then scans the
 * name for any CITY_COORDS key as a whole word. Returns null when nothing matches (logged by the
 * build script so this table can be extended).
 */

export interface CityCoord {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Keys are matched case-insensitively as whole words against the conference name.
// `aliases` are alternate tokens that map to the same coordinates (e.g. "nyc" -> New York).
export const CITY_COORDS: Record<string, CityCoord & { aliases?: string[] }> = {
  // France
  paris: { city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  lyon: { city: 'Lyon', country: 'France', lat: 45.764, lng: 4.8357 },
  lille: { city: 'Lille', country: 'France', lat: 50.6292, lng: 3.0573, aliases: ['agi’lille', "agi'lille", 'devlille'] },
  nantes: { city: 'Nantes', country: 'France', lat: 47.2184, lng: -1.5536, aliases: ['web2day'] },
  bordeaux: { city: 'Bordeaux', country: 'France', lat: 44.8378, lng: -0.5792 },
  toulouse: { city: 'Toulouse', country: 'France', lat: 43.6047, lng: 1.4442 },
  strasbourg: { city: 'Strasbourg', country: 'France', lat: 48.5734, lng: 7.7521 },
  grenoble: { city: 'Grenoble', country: 'France', lat: 45.1885, lng: 5.7245 },
  dijon: { city: 'Dijon', country: 'France', lat: 47.322, lng: 5.0415 },
  rennes: { city: 'Rennes', country: 'France', lat: 48.1173, lng: -1.6778 },
  rouen: { city: 'Rouen', country: 'France', lat: 49.4432, lng: 1.0993 },
  montpellier: { city: 'Montpellier', country: 'France', lat: 43.6108, lng: 3.8767 },
  tours: { city: 'Tours', country: 'France', lat: 47.3941, lng: 0.6848 },
  'clermont-ferrand': { city: 'Clermont-Ferrand', country: 'France', lat: 45.7772, lng: 3.087 },
  'la rochelle': { city: 'La Rochelle', country: 'France', lat: 46.1591, lng: -1.1521 },
  'aix-en-provence': { city: 'Aix-en-Provence', country: 'France', lat: 43.5297, lng: 5.4474 },
  nice: { city: 'Nice', country: 'France', lat: 43.7102, lng: 7.262 },

  // Europe (non-FR)
  london: { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  manchester: { city: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
  bristol: { city: 'Bristol', country: 'United Kingdom', lat: 51.4545, lng: -2.5879 },
  birmingham: { city: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904 },
  amsterdam: { city: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  berlin: { city: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.405 },
  munich: { city: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.582 },
  lausanne: { city: 'Lausanne', country: 'Switzerland', lat: 46.5197, lng: 6.6323 },
  zurich: { city: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
  brussels: { city: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517, aliases: ['belgium'] },
  leuven: { city: 'Leuven', country: 'Belgium', lat: 50.8798, lng: 4.7005 },
  mons: { city: 'Mons', country: 'Belgium', lat: 50.4542, lng: 3.9523 },
  lisbon: { city: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
  madrid: { city: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
  milan: { city: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.19 },
  dublin: { city: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
  oslo: { city: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
  aarhus: { city: 'Aarhus', country: 'Denmark', lat: 56.1629, lng: 10.2039 },
  krakow: { city: 'Kraków', country: 'Poland', lat: 50.0647, lng: 19.945, aliases: ['kraków'] },
  wroclaw: { city: 'Wrocław', country: 'Poland', lat: 51.1079, lng: 17.0385, aliases: ['wrocław'] },
  budapest: { city: 'Budapest', country: 'Hungary', lat: 47.4979, lng: 19.0402 },
  helsinki: { city: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
  vilnius: { city: 'Vilnius', country: 'Lithuania', lat: 54.6872, lng: 25.2797 },
  athens: { city: 'Athens', country: 'Greece', lat: 37.9838, lng: 23.7275, aliases: ['greece'] },
  stockholm: { city: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
  verona: { city: 'Verona', country: 'Italy', lat: 45.4384, lng: 10.9916 },

  // Americas
  'new york': { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, aliases: ['nyc'] },
  'san francisco': { city: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194 },
  seattle: { city: 'Seattle', country: 'United States', lat: 47.6062, lng: -122.3321 },
  austin: { city: 'Austin', country: 'United States', lat: 30.2672, lng: -97.7431 },
  detroit: { city: 'Detroit', country: 'United States', lat: 42.3314, lng: -83.0458 },
  buffalo: { city: 'Buffalo', country: 'United States', lat: 42.8864, lng: -78.8784 },
  raleigh: { city: 'Raleigh', country: 'United States', lat: 35.7796, lng: -78.6382 },
  denver: { city: 'Denver', country: 'United States', lat: 39.7392, lng: -104.9903 },
  'salt lake city': { city: 'Salt Lake City', country: 'United States', lat: 40.7608, lng: -111.891 },
  provo: { city: 'Provo', country: 'United States', lat: 40.2338, lng: -111.6585 },
  'las vegas': { city: 'Las Vegas', country: 'United States', lat: 36.1699, lng: -115.1398 },
  boston: { city: 'Boston', country: 'United States', lat: 42.3601, lng: -71.0589 },
  'santo domingo': { city: 'Santo Domingo', country: 'Dominican Republic', lat: 18.4861, lng: -69.9312 },

  // Africa / Asia / Oceania
  'cape town': { city: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
  nairobi: { city: 'Nairobi', country: 'Kenya', lat: -1.2864, lng: 36.8172, aliases: ['kenya'] },
  marrakesh: { city: 'Marrakesh', country: 'Morocco', lat: 31.6295, lng: -7.9811, aliases: ['morocco', 'marrakech'] },
  bangalore: { city: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946, aliases: ['bengaluru'] },
  goa: { city: 'Goa', country: 'India', lat: 15.2993, lng: 74.124 },
  sydney: { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, aliases: ['australia'] },
};

// Conferences whose name does NOT contain the city. Keys are matched as substrings against the
// lowercased, year/URL-stripped name. Values must be keys (or aliases) present in CITY_COORDS.
export const CONFERENCE_CITY_OVERRIDES: Record<string, string> = {
  'devoxx france': 'paris',
  'devoxx greece': 'athens',
  'devoxx morocco': 'marrakesh',
  'bdx i/o': 'bordeaux',
  'snow camp': 'grenoble',
  snowcamp: 'grenoble',
  'codeurs en seine': 'rouen',
  'react advanced': 'london',
  'react connection': 'paris',
  'react native connection': 'paris',
  'flutter connection': 'paris',
  'react conf': 'las vegas',
  'react native heroes': 'paris',
  'react universe': 'wroclaw',
  'react india': 'goa',
  'react nexus': 'bangalore',
  sstic: 'rennes',
  'touraine tech': 'tours',
  'sunny tech': 'montpellier',
  'mobilis in mobile': 'nantes',
  breizhcamp: 'rennes',
  volcamp: 'clermont-ferrand',
  'riviera dev': 'nice',
  'jug summer camp': 'la rochelle',
  forumphp: 'paris',
  parisjs: 'paris',
  'ng baguette': 'lyon',
  wax: 'aix-en-provence',
  'we love speed': 'lyon',
  'app.js': 'krakow',
  devday: 'krakow',
  devworld: 'amsterdam',
  'future frontend': 'helsinki',
  'js nation': 'amsterdam',
  'goto amsterdam': 'amsterdam',
  'craft conference': 'budapest',
  monkigras: 'london',
  'berlin buzzwords': 'berlin',
  fluttercon: 'berlin',
  'flutter con europe': 'berlin',
  wearedevelopers: 'berlin',
  'ddd europe': 'amsterdam',
  'world data summit': 'amsterdam',
  'big data europe': 'vilnius',
  'big data conference': 'vilnius',
  'serverless days nyc': 'new york',
  're:invent': 'las vegas',
  singlestore: 'san francisco',
  'cio summit belgium': 'brussels',
  flowcon: 'paris',
  web2day: 'nantes',
  'tech rocks': 'paris',
  'human talk': 'paris',
  humantalk: 'paris',
  codecampsdq: 'santo domingo',
  'android makers': 'paris',
  appdevcon: 'amsterdam',
  'bbc tech': 'london',
  'blender conference': 'amsterdam',
  'bouygues agile': 'paris',
  cloudnord: 'lille',
  cyberwisecon: 'vilnius',
  rockies: 'denver',
  'devops rex': 'paris',
  escp: 'paris',
  'european identity': 'munich',
  flupa: 'paris',
  'flutter & friends': 'stockholm',
  'lean summit france': 'lyon',
  'lean summit uk': 'london',
  'platform summit': 'stockholm',
  pyconde: 'berlin',
  pydataber: 'berlin',
  'state of open': 'london',
  'techlead conference': 'paris',
  wearedevelop: 'berlin',
  'who run the tech': 'nantes',
  'salon data': 'nantes',
  'forward data': 'lille',
  'sre day': 'london',
  'angular day': 'verona',
};

function normalize(eventName: string): string {
  return eventName
    .replace(/\s*\(https?:\/\/[^)]*\)\s*/g, ' ') // strip embedded URL
    .toLowerCase()
    .replace(/[’]/g, "'")
    .trim();
}

function buildCityKeyMatchers(): Array<{ key: string; coord: CityCoord; regex: RegExp }> {
  const out: Array<{ key: string; coord: CityCoord; regex: RegExp }> = [];
  for (const [key, value] of Object.entries(CITY_COORDS)) {
    const coord: CityCoord = { city: value.city, country: value.country, lat: value.lat, lng: value.lng };
    const tokens = [key, ...(value.aliases ?? [])];
    for (const token of tokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out.push({ key: token, coord, regex: new RegExp(`(?:^|[^a-z])${escaped}(?:[^a-z]|$)`, 'i') });
    }
  }
  // Longer tokens first so "san francisco" wins over a stray "san" etc.
  return out.sort((a, b) => b.key.length - a.key.length);
}

const CITY_MATCHERS = buildCityKeyMatchers();

export function resolveCity(eventName: string): CityCoord | null {
  const name = normalize(eventName);

  for (const [needle, cityKey] of Object.entries(CONFERENCE_CITY_OVERRIDES)) {
    if (name.includes(needle)) {
      const v = CITY_COORDS[cityKey];
      if (v) return { city: v.city, country: v.country, lat: v.lat, lng: v.lng };
    }
  }

  for (const m of CITY_MATCHERS) {
    if (m.regex.test(name)) return m.coord;
  }

  return null;
}
