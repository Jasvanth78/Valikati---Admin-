import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { ImageUploader } from './ImageUploader';
import defaults from '../config/calendarLeadersDefaults.json';
import bharathi from '../assets/calendar/calendar_bharathi_wide.png';
import kamaraj from '../assets/calendar/calendar_kamaraj_wide.png';
import kattabomman from '../assets/calendar/calendar_kattabomman_wide.png';

type Leader = typeof defaults[number];
const builtins: Record<string, string> = {
  'assets/images/calendar_bharathi_wide.png': bharathi,
  'assets/images/calendar_kamaraj_wide.png': kamaraj,
  'assets/images/calendar_kattabomman_wide.png': kattabomman,
};

export function CalendarLeadersEditor({ raw, onSaved }: { raw: string; onSaved: () => void }) {
  const [leaders, setLeaders] = useState<Leader[]>(defaults);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [valid, setValid] = useState(true);
  useEffect(() => {
    try {
      const rows = raw.trim() ? JSON.parse(raw) : defaults;
      if (!Array.isArray(rows)) throw new Error();
      setLeaders(rows); setValid(true);
    } catch { setValid(false); setMessage('Saved leader cards could not be read. Reload before editing.'); }
  }, [raw]);
  const update = (id: string, patch: Partial<Leader>) => setLeaders(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row));
  const move = (index: number, delta: number) => setLeaders(rows => {
    const next = [...rows]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next;
  });
  async function publish(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const value = JSON.stringify(leaders);
      await axios.put(`${API_BASE_URL}/api/admin/app-content`, { key: 'calendar_leaders', ta: value, en: value }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setMessage('Calendar leaders published. The app updates the cards and anniversary markers.'); onSaved();
    } catch (error: any) { setMessage(error.response?.data?.error || 'Publish failed. Your edits are still here.'); }
    finally { setBusy(false); }
  }
  const inputClass = 'block w-full bg-astrology-dark border rounded p-3 mt-1';
  return <form onSubmit={publish} className="bg-astrology-card border rounded-xl p-6 space-y-4">
    <h3 className="text-xl font-bold">Calendar Leaders — தலைவர்கள்</h3>
    <p>Update calendar card images and birthday/remembrance dates here. The date includes the original year; calendar markers repeat on its day and month.</p>
    <fieldset disabled={busy || !valid} className="space-y-4">
      {leaders.map((row, index) => <section key={row.id} className="border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3"><strong>Card {index + 1}</strong>
          <label><input type="checkbox" checked={row.enabled} onChange={event => update(row.id, { enabled: event.target.checked })} /> Visible</label>
          <button type="button" aria-label={`Move card ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
          <button type="button" aria-label={`Move card ${index + 1} down`} disabled={index === leaders.length - 1} onClick={() => move(index, 1)}>↓</button>
          <button type="button" onClick={() => setLeaders(rows => rows.filter(item => item.id !== row.id))}>Remove card</button>
        </div>
        {builtins[row.imageUrl] && <div><img src={builtins[row.imageUrl]} alt={row.nameEn} className="w-52 h-28 object-cover rounded" /><p className="text-sm">Current built-in image. Upload below to replace it.</p></div>}
        <ImageUploader label="Leader image" value={builtins[row.imageUrl] ? '' : row.imageUrl} onChange={imageUrl => update(row.id, { imageUrl })} folder="calendar_leaders" rasterOnly onBusy={uploading => setUploads(previous => ({ ...previous, [row.id]: uploading }))} />
        <div className="grid md:grid-cols-2 gap-3">
          {([['nameTa', 'Tamil name'], ['nameEn', 'English name'], ['captionTa', 'Tamil caption'], ['captionEn', 'English caption'], ['sourceUrl', 'Source link (optional)']] as const).map(([field, label]) => <label key={field}>{label}<input required={field === 'nameTa'} type={field === 'sourceUrl' ? 'url' : 'text'} className={inputClass} value={row[field]} onChange={event => update(row.id, { [field]: event.target.value })} /></label>)}
          <label>Birthday / remembrance date<input required type="date" className={inputClass} value={row.date} onChange={event => update(row.id, { date: event.target.value })} /></label>
          <label>Date type<select className={inputClass} value={row.remembrance ? 'remembrance' : 'birthday'} onChange={event => update(row.id, { remembrance: event.target.value === 'remembrance' })}><option value="birthday">Birthday — பிறந்த நாள்</option><option value="remembrance">Remembrance — நினைவு நாள்</option></select></label>
        </div>
      </section>)}
      <div className="flex gap-4">
        <button type="button" onClick={() => setLeaders(rows => [...rows, { id: crypto.randomUUID(), nameTa: '', nameEn: '', imageUrl: '', date: '', captionTa: '', captionEn: '', sourceUrl: '', remembrance: false, enabled: true }])}>Add leader card</button>
        <button type="submit" disabled={Object.values(uploads).some(Boolean)} className="bg-astrology-gold text-black rounded px-5 py-2">{busy ? 'Publishing…' : 'Publish calendar leaders'}</button>
      </div>
    </fieldset>
    {message && <p role="status">{message}</p>}
  </form>;
}
