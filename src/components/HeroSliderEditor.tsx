import { BannerDestinationSelect } from './BannerDestinationSelect';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { ImageUploader } from './ImageUploader';

type Slide = { id: string; imageUrl: string; titleTa: string; descriptionTa: string; buttonTextTa: string; destination: string; enabled: boolean };
type Config = { autoplaySeconds: number; slides: Slide[] };
export function HeroSliderEditor({ raw, onSaved }: { raw: string; onSaved: () => void }) {
  const [config, setConfig] = useState<Config>({ autoplaySeconds: 5, slides: [] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try { setConfig(raw ? JSON.parse(raw) : { autoplaySeconds: 5, slides: [] }); }
    catch { setMessage('Saved slider configuration could not be read.'); }
  }, [raw]);
  const update = (id: string, patch: Partial<Slide>) => setConfig(c => ({ ...c, slides: c.slides.map(s => s.id === id ? { ...s, ...patch } : s) }));
  const move = (index: number, delta: number) => setConfig(c => {
    const slides = [...c.slides];
    [slides[index], slides[index + delta]] = [slides[index + delta], slides[index]];
    return { ...c, slides };
  });
  const publish = async () => {
    setBusy(true); setMessage('');
    try {
      const value = JSON.stringify(config);
      await axios.put(`${API_BASE_URL}/api/admin/app-content`, { key: 'home_hero_slider', ta: value, en: value }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setMessage('Slider published. The app receives live updates and refreshes.'); onSaved();
    } catch (error: any) { setMessage(error.response?.data?.error || 'Could not publish. Your edits are still here.'); }
    finally { setBusy(false); }
  };
  return <section className="bg-astrology-card border border-astrology-gold/20 rounded-xl p-6 space-y-4">
    <h3 className="text-xl text-astrology-gold font-bold">Home hero slider</h3>
    <p className="text-gray-400">Edit and preview below, then publish all changes together. Order follows the list. {config.slides.filter(s => s.enabled).length} enabled banners will appear in the app.</p>
    <label className="block">Autoplay seconds <input type="number" min={2} max={120} value={config.autoplaySeconds} onChange={e => setConfig({ ...config, autoplaySeconds: Number(e.target.value) })} className="bg-astrology-dark border rounded p-2 ml-3" /></label>
    <p className="text-sm text-gray-400">Choose where each banner button opens from the destination list.</p>
    {config.slides.map((s, i) => <div key={s.id} className="border border-astrology-gold/20 rounded-xl p-4 space-y-3">
      <div className="flex gap-3 items-center"><strong>Banner {i + 1}</strong><label><input type="checkbox" checked={s.enabled} onChange={e => update(s.id, { enabled: e.target.checked })} /> Enabled</label>
        <button disabled={i === 0} onClick={() => move(i, -1)}>↑</button><button disabled={i === config.slides.length - 1} onClick={() => move(i, 1)}>↓</button>
        <button onClick={() => setConfig(c => ({ ...c, slides: c.slides.filter(x => x.id !== s.id) }))}>Delete</button></div>
      <ImageUploader value={s.imageUrl} onChange={imageUrl => update(s.id, { imageUrl })} folder="home_banners" label="Banner image" />
      {(['titleTa', 'descriptionTa', 'buttonTextTa'] as const).map(field => <label key={field} className="block">{{ titleTa: 'Tamil title', descriptionTa: 'Tamil description', buttonTextTa: 'Tamil button text', destination: 'Button destination' }[field]}<input className="block w-full bg-astrology-dark border border-astrology-gold/20 rounded p-3" value={s[field]} onChange={e => update(s.id, { [field]: e.target.value })} /></label>)}
      <BannerDestinationSelect value={s.destination} onChange={destination => update(s.id, { destination })} />
      <div className="relative overflow-hidden rounded-2xl min-h-48 p-6 flex flex-col justify-center" style={{ background: `linear-gradient(90deg, #003d32ed, #003d3250), url("${s.imageUrl.replace(/["\\\n\r]/g, '')}") center/cover` }}>
        <h4 className="text-3xl text-yellow-200 max-w-[75%]">{s.titleTa}</h4><p className="text-white max-w-[75%] my-3">{s.descriptionTa}</p><span className="rounded-full bg-yellow-200 text-emerald-950 px-4 py-2 self-start">{s.buttonTextTa} →</span>
      </div>
    </div>)}
    <div className="flex gap-4"><button disabled={busy} onClick={() => setConfig(c => ({ ...c, slides: [...c.slides, { id: crypto.randomUUID(), imageUrl: '', titleTa: '', descriptionTa: '', buttonTextTa: '', destination: '', enabled: true }] }))}>Add banner</button><button disabled={busy} onClick={publish} className="bg-astrology-gold text-black rounded px-5 py-2">{busy ? 'Publishing…' : 'Publish slider'}</button></div>
    {config.slides.length > 0 && !config.slides.some(s => s.enabled) && <p role="status" className="text-amber-300">All banners are disabled. Enable at least one and publish to display it in the app.</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
