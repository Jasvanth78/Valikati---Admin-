import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

export function ReelShareSourceEditor({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function upload(file: File) {
    if (!['video/mp4', 'video/webm'].includes(file.type) || file.size > 30 * 1024 * 1024) {
      setMessage('Choose an MP4 or WebM smaller than 30 MB.'); return;
    }
    setBusy(true); setMessage('Uploading share video…');
    try {
      const data = new FormData(); data.append('video', file);
      const headers = { Authorization: `Bearer ${localStorage.getItem('adminToken')}` };
      const result = await axios.post(`${API_BASE_URL}/api/upload/video`, data, { headers });
      const value = result.data.url;
      await axios.put(`${API_BASE_URL}/api/admin/app-content`, { key: `reel_share_source_${id}`, ta: value, en: value }, { headers });
      setMessage('Share video saved. Users will share its first 30 seconds with the Valikati message.');
    } catch { setMessage('Could not save the share video. Please retry.'); }
    finally { setBusy(false); }
  }
  return <div className="border-t border-white/10 pt-3 mt-3 text-sm space-y-2">
    <p>For embedded videos, upload an MP4/WebM copy to enable 30-second video sharing. Direct video files and downloadable Jumpshare videos work automatically.</p>
    <label className="block">Share video (optional)<input aria-label="Share video" disabled={busy} type="file" accept="video/mp4,video/webm" className="block w-full mt-2" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} /></label>
    {message && <p role="status">{message}</p>}
  </div>;
}
