import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { HeroSliderEditor } from '../components/HeroSliderEditor';
import { ImageUploader } from '../components/ImageUploader';
import GovtHolidays from './GovtHolidays';
import Proverbs from './Proverbs';

const defaults = ['hero', 'clock', 'services', 'holidays', 'proverb', 'articles'].map(key => ({ key, enabled: true }));
export default function HomeComponents() {
  const [tab, setTab] = useState('Banners');
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState({ latitude: '', longitude: '', label: '' });
  const [background, setBackground] = useState('');
  const [sections, setSections] = useState(defaults);
  const read = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/app-content`);
      setContent(data);
      const value = (key: string) => data.find((c: any) => c.key === key)?.en || '';
      if (value('home_weather_location')) {
        const saved = JSON.parse(value('home_weather_location'));
        setLocation({ latitude: String(saved.latitude), longitude: String(saved.longitude), label: saved.label || '' });
      }
      setBackground(value('home_time_background'));
      if (value('home_layout')) setSections(JSON.parse(value('home_layout')).sections);
    } catch { setMessage('Could not load home components. Check the backend connection and retry.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { read(); }, []);
  const save = async (key: string, value: string) => {
    setBusy(true); setMessage('');
    try {
      await axios.put(`${API_BASE_URL}/api/admin/app-content`, { key, ta: value, en: value }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setMessage('Saved and published to the app.');
      await read();
    } catch (e: any) { setMessage(e.response?.data?.error || 'Save failed. Your edits have been kept.'); }
    finally { setBusy(false); }
  };
  return <div className="space-y-6">
    <h2 className="text-3xl font-bold text-astrology-gold">Home Components</h2>
    <p className="text-gray-400">Manage the existing mobile home screen here. Banners must be enabled and published to appear. Users select their weather city in the app; Weather sets an optional fallback city.</p>
    <div className="flex gap-2 flex-wrap">{['Banners', 'Weather', 'Design', 'Government Holidays', 'Proverbs'].map(t => <button key={t} onClick={() => { setTab(t); setMessage(''); }} className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-astrology-gold text-black' : 'bg-astrology-card text-white'}`}>{t}</button>)}</div>
    {message && <p role="status" className="text-astrology-gold">{message}</p>}
    {loading ? <p>Loading home components…</p> : <>
      {tab === 'Banners' && <HeroSliderEditor raw={content.find(c => c.key === 'home_hero_slider')?.en || ''} onSaved={read} />}
      {tab === 'Weather' && <form className="bg-astrology-card p-6 rounded-xl space-y-4" onSubmit={e => { e.preventDefault(); save('home_weather_location', JSON.stringify({ label: location.label.trim(), latitude: Number(location.latitude), longitude: Number(location.longitude) })); }}>
        <h3 className="text-xl font-bold">Default weather location</h3>
        <p className="text-gray-400">Optional fallback for users who have not selected a city. Each user's selected city takes priority and stays saved on their device.</p>
        <label className="block">City name<input required value={location.label} onChange={e => setLocation({ ...location, label: e.target.value })} className="block w-full bg-black/40 border rounded p-3" /></label>
        <label className="block">Latitude<input required type="number" step="any" min={-90} max={90} value={location.latitude} onChange={e => setLocation({ ...location, latitude: e.target.value })} className="block w-full bg-black/40 border rounded p-3" /></label>
        <label className="block">Longitude<input required type="number" step="any" min={-180} max={180} value={location.longitude} onChange={e => setLocation({ ...location, longitude: e.target.value })} className="block w-full bg-black/40 border rounded p-3" /></label>
        <button disabled={busy} className="bg-astrology-gold text-black px-5 py-2 rounded">{busy ? 'Saving…' : 'Publish weather location'}</button>
      </form>}
      {tab === 'Design' && <section className="bg-astrology-card rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-bold">Home section order and visibility</h3>
        {sections.map((s, i) => <div key={s.key} className="flex gap-4 items-center border rounded p-3"><label className="flex-1 capitalize"><input type="checkbox" checked={s.enabled} onChange={e => setSections(sections.map(x => x.key === s.key ? { ...x, enabled: e.target.checked } : x))} /> {s.key}</label>{[-1, 1].map(delta => <button key={delta} disabled={busy || i + delta < 0 || i + delta >= sections.length} onClick={() => { const next = [...sections]; [next[i], next[i + delta]] = [next[i + delta], next[i]]; setSections(next); }}>{delta < 0 ? '↑' : '↓'}</button>)}</div>)}
        <button disabled={busy} onClick={() => save('home_layout', JSON.stringify({ sections }))} className="bg-astrology-gold text-black px-5 py-2 rounded">Publish home layout</button>
        <ImageUploader label="Clock sunrise background (leave empty to use the existing landscape)" value={background} onChange={setBackground} folder="home_backgrounds" />
        <button disabled={busy} onClick={() => save('home_time_background', background)} className="bg-astrology-gold text-black px-5 py-2 rounded">Publish clock background</button>
      </section>}
      {tab === 'Government Holidays' && <GovtHolidays />}
      {tab === 'Proverbs' && <Proverbs />}
    </>}
  </div>;
}
