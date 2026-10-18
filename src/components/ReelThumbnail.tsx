import { useEffect, useState } from 'react';
import axios from 'axios';
import { Play } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

export function ReelThumbnail({ id, source, title, thumbnail }: { id: string; source: string; title: string; thumbnail?: string }) {
  const [image, setImage] = useState<string | null>(thumbnail || null);
  const [failed, setFailed] = useState(false);
  const directVideo = /^https?:\/\//i.test(source) && /\.(mp4|webm|mov|m4v)(?:\?|$)/i.test(source);
  useEffect(() => {
    const abort = new AbortController();
    setFailed(false); setImage(thumbnail || null);
    if (!thumbnail) {
      axios.get(`${API_BASE_URL}/api/reels/${encodeURIComponent(id)}/metadata`, { signal: abort.signal })
        .then(({ data }) => setImage(data.thumbnail || null))
        .catch(() => { /* Keep a clear fallback when the provider has no preview. */ });
    }
    return () => abort.abort();
  }, [id, source, thumbnail]);

  if (image && !failed) return <img src={image} alt={title} loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} />;
  if (directVideo && !failed) return <video src={`${source}${source.includes('#') ? '' : '#t=0.1'}`} aria-label={`${title} preview`} muted playsInline preload="metadata" className="w-full h-full object-cover" onError={() => setFailed(true)} />;
  return <div className="w-full h-full flex flex-col gap-3 items-center justify-center text-gray-400"><Play className="w-12 h-12" /><span className="text-xs">Preview unavailable</span></div>;
}
