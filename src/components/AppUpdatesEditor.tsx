import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

const defaults = {
  enabled: false,
  android: { enabled: false, version: '', build: 0, url: '' },
  ios: { enabled: false, version: '', build: 0, url: '' },
  messageTa: '', messageEn: '',
};
export function AppUpdatesEditor({ raw, onSaved }: { raw: string; onSaved: () => void }) {
  const [policy, setPolicy] = useState(defaults);
  const [busy, setBusy] = useState(false);
  const [valid, setValid] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try {
      const saved = raw ? JSON.parse(raw) : defaults;
      if (!saved || typeof saved.enabled !== 'boolean') throw new Error();
      setPolicy({ ...defaults, ...saved, android: { ...defaults.android, ...saved.android }, ios: { ...defaults.ios, ...saved.ios } });
      setValid(true);
    } catch { setValid(false); setMessage('Saved update configuration is invalid. Correct it before publishing.'); }
  }, [raw]);
  async function publish(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const value = JSON.stringify(policy);
      await axios.put(`${API_BASE_URL}/api/admin/app-content`, { key: 'app_update_policy', ta: value, en: value }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      setMessage('Update policy published.'); onSaved();
    } catch (error) { setMessage(axios.isAxiosError(error) ? error.response?.data?.error || 'Could not publish the update policy.' : 'Could not publish the update policy.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={publish} className="bg-white border rounded-xl p-6 space-y-5">
    <h3 className="font-semibold">App updates</h3>
    <p className="text-sm text-gray-500">Older app versions show an update prompt. Each device can skip three times per release. The next prompt requires Confirm update. Publish after the release is available at its update link. Web and desktop are excluded.</p>
    <fieldset disabled={busy || !valid} className="space-y-5">
      <label className="flex gap-2 items-center"><input type="checkbox" checked={policy.enabled} onChange={e => setPolicy({ ...policy, enabled: e.target.checked })} />Enable update prompts</label>
      {(['android', 'ios'] as const).map(platform => <section key={platform} className="border rounded-lg p-4 space-y-3">
        <h4 className="font-semibold">{platform === 'ios' ? 'iOS' : 'Android'}</h4>
        <label className="flex gap-2 items-center"><input type="checkbox" checked={policy[platform].enabled} onChange={e => setPolicy({ ...policy, [platform]: { ...policy[platform], enabled: e.target.checked } })} />Enable for this platform</label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label>Latest version<input aria-label={`${platform} latest version`} className="block w-full border rounded p-2" required={policy[platform].enabled} pattern="[0-9]+\.[0-9]+\.[0-9]+" placeholder="2.0.3" value={policy[platform].version} onChange={e => setPolicy({ ...policy, [platform]: { ...policy[platform], version: e.target.value } })} /></label>
          <label>Build number<input aria-label={`${platform} build number`} className="block w-full border rounded p-2" type="number" min="0" step="1" required={policy[platform].enabled} value={policy[platform].build} onChange={e => setPolicy({ ...policy, [platform]: { ...policy[platform], build: Number(e.target.value) } })} /></label>
        </div>
        <label className="block">Store / download link (HTTPS)<input aria-label={`${platform} update link`} className="block w-full border rounded p-2" type="url" required={policy[platform].enabled} value={policy[platform].url} onChange={e => setPolicy({ ...policy, [platform]: { ...policy[platform], url: e.target.value } })} /></label>
      </section>)}
      <div className="grid sm:grid-cols-2 gap-4">{(['messageTa', 'messageEn'] as const).map(key => <label key={key}>{key === 'messageTa' ? 'Tamil message (optional)' : 'English message (optional)'}<textarea className="block w-full border rounded p-2" maxLength={2000} value={policy[key]} onChange={e => setPolicy({ ...policy, [key]: e.target.value })} /></label>)}</div>
      <button type="submit" className="primary-button">{busy ? 'Publishing…' : 'Publish update policy'}</button>
    </fieldset>
    {message && <p role="status" className="text-sm">{message}</p>}
  </form>;
}
