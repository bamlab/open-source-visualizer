import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { TopNav } from '../components/TopNav';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useConferencesData } from '../hooks/useConferencesData';
import type { ConferenceTalk } from '../types';

const BRAND = '#E63946';

type StatusFilter = 'all' | 'given' | 'accepted';

function isGiven(talk: ConferenceTalk): boolean {
  return talk.status === 'Talk Given';
}

interface CityGroup {
  city: string;
  country: string;
  lat: number;
  lng: number;
  talks: ConferenceTalk[];
}

const STATUS_STYLE: Record<string, string> = {
  'Talk Given': 'bg-green-50 text-green-800 border border-green-300',
  'CFP Accepted': 'bg-purple-50 text-purple-800 border border-purple-300',
  'Other Talk Accepted': 'bg-blue-50 text-blue-800 border border-blue-300',
  'Sponsor talk': 'bg-amber-50 text-amber-800 border border-amber-300',
};
const STATUS_STYLE_FALLBACK = 'bg-gray-50 text-gray-700 border border-gray-300';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function distinctSpeakers(talks: ConferenceTalk[]): string[] {
  return Array.from(new Set(talks.map((t) => t.speaker).filter(Boolean)));
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`;
}

// Deterministic color per speaker for the initials avatar.
const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function SpeakerAvatar({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 ${avatarColor(
        name,
      )} ${className}`}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

/**
 * Tracks the pixel width of a container so the Globe canvas can be sized to it.
 * Uses a callback ref so measurement happens whenever the node actually attaches —
 * the container only mounts after the async data finishes loading.
 */
function useElementWidth() {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;
    setWidth(node.clientWidth);
    const ro = new ResizeObserver(() => setWidth(node.clientWidth));
    ro.observe(node);
    observerRef.current = ro;
  }, []);
  return { ref, width };
}

export function ConferencesPage() {
  const { data, isLoading } = useConferencesData();
  const { talks, unresolvedCount } = data;

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [company, setCompany] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Distinct companies (Related Brand) present in the data, for the company filter.
  const companies = useMemo(
    () => Array.from(new Set(talks.map((t) => t.team).filter(Boolean))).sort(),
    [talks],
  );

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const { ref: globeBoxRef, width: globeWidth } = useElementWidth();
  const globeHeight = 560;

  // Pause auto-rotation for 8s whenever the user clicks the globe, then resume.
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseRotation = useCallback(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = false;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      const c = globeRef.current?.controls();
      if (c) c.autoRotate = true;
    }, 8000);
  }, []);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const filteredTalks = useMemo(
    () =>
      talks.filter((t) => {
        if (company !== 'all' && t.team !== company) return false;
        if (filter === 'given') return isGiven(t);
        if (filter === 'accepted') return !isGiven(t);
        return true;
      }),
    [talks, filter, company],
  );

  // Talks with a resolved location, grouped by city for the globe pins.
  const cityGroups = useMemo<CityGroup[]>(() => {
    const byCity = new Map<string, CityGroup>();
    for (const t of filteredTalks) {
      if (t.lat == null || t.lng == null || !t.city) continue;
      const key = `${t.city}|${t.country}`;
      const group =
        byCity.get(key) ?? { city: t.city, country: t.country ?? '', lat: t.lat, lng: t.lng, talks: [] };
      group.talks.push(t);
      byCity.set(key, group);
    }
    return Array.from(byCity.values()).sort((a, b) => b.talks.length - a.talks.length);
  }, [filteredTalks]);

  const maxCount = useMemo(
    () => cityGroups.reduce((m, g) => Math.max(m, g.talks.length), 1),
    [cityGroups],
  );

  const selectedGroup = cityGroups.find((g) => g.city === selectedCity) ?? null;

  // Header stats (over the filtered set).
  const stats = useMemo(() => {
    const conferences = new Set(filteredTalks.map((t) => t.conference));
    const speakers = new Set(filteredTalks.map((t) => t.speaker).filter(Boolean));
    return {
      talks: filteredTalks.length,
      conferences: conferences.size,
      cities: cityGroups.length,
      speakers: speakers.size,
    };
  }, [filteredTalks, cityGroups]);

  // Auto-rotate the globe, and pause it for 8s on any pointer interaction (click or drag).
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    g.pointOfView({ lat: 30, lng: 5, altitude: 2.2 }, 0);
    controls.addEventListener('start', pauseRotation);
    return () => controls.removeEventListener('start', pauseRotation);
  }, [globeWidth, pauseRotation]);

  const filterBtn = (value: StatusFilter, label: string) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        filter === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background relative pb-24">
      <TopNav />

      <header className="relative w-full pt-24 pb-10">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 max-w-[92rem] mx-auto px-6 md:px-10 flex flex-col items-center text-center">
          <p className="text-xs font-semibold tracking-widest text-brand uppercase mb-2">
            Conferences · Around the world
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">
            Talks on the globe
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">
            Conference talks given and accepted by the team, placed where they happened. Click a pin to
            see the talks at that city.
          </p>
          <div className="mt-6 grid grid-cols-4 gap-6">
            <Stat value={stats.talks} label="Talks" />
            <Stat value={stats.conferences} label="Conferences" />
            <Stat value={stats.cities} label="Cities" />
            <Stat value={stats.speakers} label="People" />
          </div>
        </div>
      </header>

      <main className="max-w-[80rem] mx-auto px-6 md:px-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {filterBtn('all', 'All')}
            {filterBtn('given', 'Given')}
            {filterBtn('accepted', 'Accepted')}
          </div>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 border-0 focus:ring-2 focus:ring-brand/40 cursor-pointer"
          >
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div style={{ height: globeHeight }}>
            <LoadingSkeleton className="rounded-2xl h-full w-full" />
          </div>
        ) : (
          <div className="relative">
            <div
              ref={globeBoxRef}
              className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
              style={{ height: globeHeight, background: '#0b1120' }}
            >
              {globeWidth > 0 && (
                <Globe
                  ref={globeRef}
                  width={globeWidth}
                  height={globeHeight}
                  backgroundColor="#0b1120"
                  globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                  atmosphereColor="#7aa2ff"
                  atmosphereAltitude={0.18}
                  pointsData={cityGroups}
                  pointLat={(d) => (d as CityGroup).lat}
                  pointLng={(d) => (d as CityGroup).lng}
                  pointColor={() => BRAND}
                  pointAltitude={(d) => 0.04 + ((d as CityGroup).talks.length / maxCount) * 0.4}
                  pointRadius={(d) => 0.25 + ((d as CityGroup).talks.length / maxCount) * 0.5}
                  pointLabel={(d) => {
                    const g = d as CityGroup;
                    const people = distinctSpeakers(g.talks).length;
                    return `<div style="font:600 13px sans-serif;color:#fff">${g.city}, ${g.country}</div>
                            <div style="font:400 12px sans-serif;color:#cbd5e1">${plural(
                              g.talks.length,
                              'talk',
                            )} · ${plural(people, 'person').replace('persons', 'people')} · click for details</div>`;
                  }}
                  onGlobeClick={pauseRotation}
                  onPointClick={(d) => {
                    pauseRotation();
                    const g = d as CityGroup;
                    setSelectedCity(g.city);
                    globeRef.current?.pointOfView({ lat: g.lat, lng: g.lng, altitude: 1.6 }, 800);
                  }}
                />
              )}
            </div>

            {selectedGroup && (
              <CityDetails group={selectedGroup} onClose={() => setSelectedCity(null)} />
            )}
          </div>
        )}

        {!isLoading && unresolvedCount > 0 && (
          <p className="text-center text-[12px] text-gray-400">
            {unresolvedCount} talk{unresolvedCount > 1 ? 's' : ''} not shown — their conference has no
            mappable location (online events, webinars, internal meetups).
          </p>
        )}

        {data.generatedAt && (
          <p className="text-center text-[11px] text-gray-400 mt-2">
            Generated {new Date(data.generatedAt).toLocaleString()}
          </p>
        )}
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-black text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-1">{label}</div>
    </div>
  );
}

function CityDetails({ group, onClose }: { group: CityGroup; onClose: () => void }) {
  // Group the city's talks by conference, most recent first; each conference shows its people count.
  const conferences = useMemo(() => {
    const byConf = new Map<string, ConferenceTalk[]>();
    for (const t of group.talks) {
      const list = byConf.get(t.conference) ?? [];
      list.push(t);
      byConf.set(t.conference, list);
    }
    return Array.from(byConf.entries())
      .map(([conference, talks]) => ({
        conference,
        talks: talks.sort((a, b) => (b.eventDate ?? '').localeCompare(a.eventDate ?? '')),
        people: distinctSpeakers(talks).length,
        latest: talks.reduce((m, t) => (t.eventDate && t.eventDate > m ? t.eventDate : m), ''),
      }))
      .sort((a, b) => b.latest.localeCompare(a.latest));
  }, [group]);

  const totalPeople = useMemo(() => distinctSpeakers(group.talks).length, [group]);

  return (
    <div className="absolute top-4 right-4 bottom-4 w-[24rem] max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg flex flex-col">
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">{group.city}</h3>
          <p className="text-xs text-gray-500">
            {group.country} · {plural(group.talks.length, 'talk')} ·{' '}
            {plural(totalPeople, 'person').replace('persons', 'people')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-sm shrink-0 ml-2"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="overflow-y-auto p-2 flex flex-col gap-3">
        {conferences.map(({ conference, talks, people }) => (
          <section key={conference}>
            <div className="flex items-center justify-between gap-2 px-2 mb-1">
              <h4 className="text-sm font-semibold text-gray-900 leading-snug">{conference}</h4>
              <span className="shrink-0 text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                {people === 1 ? '1 person' : `${people} people`}
              </span>
            </div>
            <ul className="divide-y divide-gray-100">
              {talks.map((t) => {
                const title = (
                  <span className="text-sm font-medium text-gray-900 leading-snug line-clamp-3">
                    {t.talkTitle || t.conference}
                  </span>
                );
                return (
                  <li key={t.id} className="p-2 flex gap-2.5">
                    {t.speaker && <SpeakerAvatar name={t.speaker} className="w-8 h-8 text-[11px] mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            STATUS_STYLE[t.status] ?? STATUS_STYLE_FALLBACK
                          }`}
                        >
                          {t.status}
                        </span>
                        {t.eventDate && (
                          <span className="text-[11px] text-gray-500">{formatDate(t.eventDate)}</span>
                        )}
                      </div>
                      {t.notionUrl ? (
                        <a href={t.notionUrl} target="_blank" rel="noreferrer" className="hover:text-brand">
                          {title}
                        </a>
                      ) : (
                        title
                      )}
                      <div className="text-xs text-gray-500 mt-0.5">
                        {t.speaker && <span className="font-medium text-gray-700">{t.speaker}</span>}
                        {t.speaker && t.team && ' · '}
                        {t.team && <span className="text-gray-400">{t.team}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
