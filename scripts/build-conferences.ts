/**
 * Builds public/conferences.json from the Notion CSV export of the "Talks" database.
 *
 * The export has no location column, so each talk's city is derived from the conference name via
 * scripts/conference-locations.ts. Only "made" talks (given / accepted) are kept by default.
 * The raw CSV contains Speaker Email (PII) which is dropped — only the email-free JSON is committed.
 *
 * Usage:
 *   1. Copy the Notion CSV export to scripts/data/talks.csv (gitignored).
 *   2. bun scripts/build-conferences.ts   (or: bun run build-conferences)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { ConferenceTalk, ConferencesDataFile } from '../src/types';
import { resolveCity } from './conference-locations';

// Statuses that count as a conference "made" (delivered or accepted).
const MADE_STATUSES = new Set(['Talk Given', 'CFP Accepted', 'Other Talk Accepted', 'Sponsor talk']);

/** Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, commas and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
    } else if (c === '\r') {
      // ignore; \n handles the line break
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** "DD/MM/YYYY" or "DD/MM/YYYY → DD/MM/YYYY" (take the first) -> ISO "YYYY-MM-DD". */
function parseDate(raw: string): string | null {
  const first = raw.split('→')[0].trim();
  const m = first.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Splits an Event cell into the conference name and the embedded Notion URL (if any). */
function splitEvent(raw: string): { conference: string; notionUrl: string | null } {
  const m = raw.match(/^(.*?)\s*\((https?:\/\/[^)]*)\)\s*$/);
  if (m) return { conference: m[1].trim(), notionUrl: m[2].trim() };
  return { conference: raw.trim(), notionUrl: null };
}

function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const csvPath = join(__dirname, 'data/talks.csv');
  const outPath = join(__dirname, '../public/conferences.json');

  let csvText: string;
  try {
    csvText = readFileSync(csvPath, 'utf-8');
  } catch {
    console.error(
      `\nERROR: could not read ${csvPath}\n` +
        `Copy the Notion "Talks" CSV export there first (it is gitignored).`
    );
    process.exit(1);
  }

  const rows = parseCsv(csvText);
  const header = rows[0].map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const iTitle = col('Title');
  const iEvent = col('Event');
  const iEventDate = col('Event date');
  const iSpeaker = col('Speaker');
  const iStatus = col('Status');
  const iBrand = col('Related Brand');
  const iTech = col('Technology');

  if ([iTitle, iEvent, iSpeaker, iStatus].some((i) => i === -1)) {
    console.error('ERROR: unexpected CSV header. Got:', header);
    process.exit(1);
  }

  const talks: ConferenceTalk[] = [];
  const unresolvedEvents = new Set<string>();
  let unresolvedCount = 0;
  let id = 0;

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.length < header.length) continue; // skip malformed/blank lines
    const status = (cells[iStatus] ?? '').trim();
    if (!MADE_STATUSES.has(status)) continue;

    const rawEvent = (cells[iEvent] ?? '').trim();
    if (!rawEvent) continue;
    const { conference, notionUrl } = splitEvent(rawEvent);
    const loc = resolveCity(rawEvent);
    if (!loc) {
      unresolvedEvents.add(conference);
      unresolvedCount++;
    }

    talks.push({
      id: String(id++),
      talkTitle: (cells[iTitle] ?? '').trim(),
      speaker: (cells[iSpeaker] ?? '').trim(),
      conference,
      eventDate: iEventDate === -1 ? null : parseDate((cells[iEventDate] ?? '').trim()),
      status,
      team: iBrand === -1 ? '' : (cells[iBrand] ?? '').trim(),
      technology: iTech === -1 ? '' : (cells[iTech] ?? '').trim(),
      notionUrl,
      city: loc?.city ?? null,
      country: loc?.country ?? null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
    });
  }

  const out: ConferencesDataFile = {
    generatedAt: new Date().toISOString(),
    talks,
    unresolvedCount,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));

  const resolved = talks.length - unresolvedCount;
  console.log(`\nDone.`);
  console.log(`  Talks kept (made):  ${talks.length}`);
  console.log(`  With location:      ${resolved} (${Math.round((resolved / talks.length) * 100)}%)`);
  console.log(`  Without location:   ${unresolvedCount} (${unresolvedEvents.size} distinct events)`);
  console.log(`  Written to ${outPath}`);
  if (unresolvedEvents.size) {
    console.log(`\n  Unresolved events (add to conference-locations.ts to map them):`);
    for (const e of Array.from(unresolvedEvents).sort()) console.log(`    - ${e}`);
  }
}

main();
