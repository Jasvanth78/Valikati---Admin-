import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

type Card = { titleTa: string; titleEn: string; descriptionTa: string; descriptionEn: string };
type Day = { date: string; cards: Card[] };
export function CalendarHighlightsEditor({ raw, onSaved }: { raw: string; onSaved: () => void }) {
  const [days, setDays] = useState<Day[]>([]);
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [valid, setValid] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try {
      const rows = raw.trim() ? JSON.parse(raw) : [];
      if (!Array.isArray(rows) || rows.some(row => typeof row.date !== 'string' || !Array.isArray(row.cards))) throw Error();
      setDays(rows); setValid(true);
    } catch { setValid(false); setMessage('Saved highlights could not be read. Reload before editing.'); }
  }, [raw]);
  const selected = days.find(day => day.date === date);
  function cards(value: Card[]) {
    setDays(previous => selected ? previous.map(day => day.date === date ? { date, cards: value } : day) : [...previous, { date, cards: value }]);
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const value = JSON.stringify(days);
      await axios.put(`${API_BASE_URL}/api/admin/app-content`, { key: 'calendar_highlights', ta: value, en: value }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
      setMessage('Calendar highlights published.'); onSaved();
    } catch (error: any) { setMessage(error.response?.data?.error || 'Publish failed. Your edits have been kept.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={publish} className="bg-astrology-card border rounded-xl p-6 space-y-4">
    <h3 className="text-xl font-bold">Calendar Highlights — இன்றைய சிறப்பு</h3>
    <p>Choose a date to replace its festival, tithi and star highlight cards. Other dates keep their automatic cards. Leader anniversaries are managed in Calendar Leaders.</p>
    <fieldset disabled={busy || !valid} className="space-y-4">
      <label>Date<input required type="date" value={date} onChange={event => setDate(event.target.value)} className="block bg-black/40 border rounded p-3" /></label>
      <div className="flex gap-2 flex-wrap">{days.map(day => <button type="button" key={day.date} onClick={() => setDate(day.date)} className="border rounded px-3 py-2">{day.date} ({day.cards.length})</button>)}</div>
      {date && <>
        <p>{selected ? 'Custom cards for this date. An empty list hides the automatic cards.' : 'This date currently uses automatic highlights.'}</p>
        {(selected?.cards || []).map((card, index) => <section key={index} className="border rounded p-4 space-y-3">
          <strong>Card {index + 1}</strong>
          {(['titleTa', 'titleEn', 'descriptionTa', 'descriptionEn'] as const).map(field => <label key={field} className="block">
            {{ titleTa: 'Tamil title', titleEn: 'English title', descriptionTa: 'Tamil description', descriptionEn: 'English description' }[field]}
            <textarea required={field === 'titleTa'} placeholder={field.endsWith('En') ? 'Automatically translated from Tamil when blank' : ''} maxLength={field.startsWith('title') ? 200 : 3000} value={card[field]} onChange={event => cards(selected!.cards.map((item, i) => i === index ? { ...item, [field]: event.target.value } : item))} className="block w-full bg-black/40 border rounded p-3" />
          </label>)}
          <button type="button" onClick={() => cards(selected!.cards.filter((_, i) => i !== index))}>Remove card</button>
        </section>)}
        <div className="flex gap-4 flex-wrap">
          <button type="button" disabled={(selected?.cards.length || 0) >= 20} onClick={() => cards([...(selected?.cards || []), { titleTa: '', titleEn: '', descriptionTa: '', descriptionEn: '' }])}>Add highlight card</button>
          {selected && <button type="button" onClick={() => setDays(previous => previous.filter(day => day.date !== date))}>Restore automatic highlights</button>}
        </div>
      </>}
      <button type="submit" className="bg-astrology-gold text-black rounded px-5 py-2">{busy ? 'Publishing…' : 'Publish calendar highlights'}</button>
    </fieldset>
    {message && <p role="status">{message}</p>}
  </form>;
}
