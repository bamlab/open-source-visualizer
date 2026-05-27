import { useEffect, useMemo, useRef, useState } from 'react';
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
  'Talk Given': 'bg-green-100 text-green-700',
  'CFP Accepted': 'bg-purple-100 text-purple-700',
  'Other Talk Accepted': 'bg-blue-100 text-blue-700',
  'Sponsor talk': 'bg-amber-100 text-amber-700',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Tracks the pixel width of a container so the Globe canvas can be sized to it. */
function useElementWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export function ConferencesPage() {
  const { data, isLoading } = useConferencesData();
  const { talks, unresolvedCount } = data;

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const { ref: globeBoxRef, width: globeWidth } = useElementWidth();
  const globeHeight = 560;

  const filteredTalks = useMemo(
    () =>
      talks.filter((t) => {
        if (filter === 'given') return isGiven(t);
        if (filter === 'accepted') return !isGiven(t);
        return true;
      }),
    [talks, filter],
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

  // Auto-rotate the globe.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    g.pointOfView({ lat: 30, lng: 5, altitude: 2.2 }, 0);
  }, [globeWidth]);

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
            <Stat value={stats.speakers} label="Speakers" />
          </div>
        </div>
      </header>

      <main className="max-w-[80rem] mx-auto px-6 md:px-10 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mx-auto">
          {filterBtn('all', 'All')}
          {filterBtn('given', 'Given')}
          {filterBtn('accepted', 'Accepted')}
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
                    return `<div style="font:600 13px sans-serif;color:#fff">${g.city}, ${g.country}</div>
                            <div style="font:400 12px sans-serif;color:#cbd5e1">${g.talks.length} talk${
                      g.talks.length > 1 ? 's' : ''
                    } · click for details</div>`;
                  }}
                  onPointClick={(d) => {
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
  const talks = [...group.talks].sort((a, b) => (b.eventDate ?? '').localeCompare(a.eventDate ?? ''));
  return (
    <div className="absolute top-4 right-4 bottom-4 w-[22rem] max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg flex flex-col">
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">{group.city}</h3>
          <p className="text-xs text-gray-500">
            {group.country} · {group.talks.length} talk{group.talks.length > 1 ? 's' : ''}
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
      <ul className="overflow-y-auto divide-y divide-gray-100 p-2">
        {talks.map((t) => {
          const title = (
            <span className="text-sm font-medium text-gray-900 leading-snug line-clamp-3">
              {t.talkTitle || t.conference}
            </span>
          );
          return (
            <li key={t.id} className="p-2">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    STATUS_STYLE[t.status] ?? 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t.status}
                </span>
                {t.eventDate && <span className="text-[11px] text-gray-500">{formatDate(t.eventDate)}</span>}
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
                {t.speaker && ' · '}
                {t.conference}
              </div>
              {t.team && <div className="text-[11px] text-gray-400 mt-0.5">{t.team}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
