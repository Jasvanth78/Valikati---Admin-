import { useId, useState } from 'react';

const screens = [
  ['daily_palan', 'Daily Rasi Palan — தினசரி ராசி பலன்'],
  ['monthly_palan', 'Monthly Rasi Palan — மாதாந்திர ராசி பலன்'],
  ['yearly_palan', 'Yearly Rasi Palan — ஆண்டு ராசி பலன்'],
  ['nalla_neram', 'Nalla Neram — நல்ல நேரம்'],
  ['panchangam', 'Panchangam — பஞ்சாங்கம்'],
  ['mugurtham', 'Mugurtha Naal — முகூர்த்த நாட்கள்'],
  ['festivals', 'Festivals — பண்டிகைகள்'],
  ['vastu', 'Vastu Sasthiram — வாஸ்து சாஸ்திரம்'],
  ['ai_jothidar', 'AI Jothidar — AI ஜோதிடர்'],
  ['articles', 'Articles — கட்டுரைகள்'],
  ['videos', 'Videos — வீடியோக்கள்'],
  ['all_features', 'All Features — அனைத்து சேவைகள்'],
  ['settings', 'Profile & Settings — சுயவிவரம்'],
] as const;
const rasis = ['Mesham', 'Rishabam', 'Midhunam', 'Kadagam', 'Simmam', 'Kanni', 'Thulaam', 'Viruchigam', 'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'];
const known = new Set([...screens.map(([key]) => `screen:${key}`), ...rasis.map(rasi => `rasi:${rasi}`)]);

export function BannerDestinationSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [custom, setCustom] = useState(false);
  const showCustom = custom || (value !== '' && !known.has(value));
  const classes = 'block w-full bg-astrology-dark border border-astrology-gold/20 rounded p-3';
  return <div className="space-y-2">
    <label htmlFor={id} className="block">Button destination</label>
    <select id={id} className={classes} value={showCustom ? 'custom' : value} onChange={event => {
      const destination = event.target.value;
      setCustom(destination === 'custom');
      onChange(destination === 'custom' ? '' : destination);
    }}>
      <option value="">Select a destination</option>
      <optgroup label="App screens">
        {screens.map(([key, label]) => <option key={key} value={`screen:${key}`}>{label}</option>)}
      </optgroup>
      <optgroup label="Rasi predictions">
        {rasis.map(rasi => <option key={rasi} value={`rasi:${rasi}`}>{rasi}</option>)}
      </optgroup>
      <option value="custom">Custom link or article</option>
    </select>
    {showCustom && <label className="block text-sm">Custom destination
      <input className={`${classes} mt-1`} value={value} onChange={event => onChange(event.target.value)} placeholder="https://example.com or article:ID" />
    </label>}
  </div>;
}
