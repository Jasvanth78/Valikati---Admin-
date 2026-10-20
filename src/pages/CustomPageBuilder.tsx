import React, { useEffect, useState } from 'react'
import { fetchApi, API_BASE_URL } from '../utils/api'
import { ImageUploader } from '../components/ImageUploader'
import './CustomPageBuilder.css'

type Block = { id: string; type: string; titleTa: string; titleEn: string; contentTa: string; contentEn: string; imageUrl: string; background: string; textColor: string; padding: number; radius: number; fontSize: number; columns: number; linkPage: string; children?: Block[] }
type Page = { slug: string; titleTa: string; titleEn: string; subtitleTa: string; subtitleEn: string; imageUrl: string; background: string; textColor: string; order: number; blocks: Block[] }
type Record = { _id: string; draft: Page; published: Page | null }
const blank = (): Page => ({ slug: '', titleTa: '', titleEn: '', subtitleTa: '', subtitleEn: '', imageUrl: '', background: '#FFFAEF', textColor: '#104F43', order: 0, blocks: [] })
const newBlock = (type: string): Block => ({ id: crypto.randomUUID(), type, titleTa: '', titleEn: '', contentTa: '', contentEn: '', imageUrl: '', background: '#FFFFFF', textColor: '#104F43', padding: 16, radius: 16, fontSize: 16, columns: 1, linkPage: '', ...(type === 'container' ? { children: [] } : {}) })
const kinds = ['heading', 'text', 'card', 'image', 'container', 'divider', 'spacer']
function imageSource(value: string) {
  try { const url = new URL(value); if (url.origin === new URL(API_BASE_URL).origin && url.pathname.startsWith('/uploads/')) return url.pathname } catch { /* Relative upload URLs are already valid. */ }
  return value
}

export default function CustomPageBuilder() {
  const [records, setRecords] = useState<Record[]>([]), [page, setPage] = useState<Page>(blank)
  const [selected, setSelected] = useState(''), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(''), [previewEn, setPreviewEn] = useState(false)
  const [uploading, setUploading] = useState(false)
  const disabled = busy || uploading
  async function load() {
    try { const result = await fetchApi('/api/admin/custom-pages'); setRecords(result); setLoaded(true) }
    catch (error) { setMessage((error as Error).message) }
  }
  useEffect(() => { void load() }, [])
  const unsaved = () => JSON.stringify(page) !== JSON.stringify(records.find(record => record._id === selected)?.draft || blank())
  function choose(record?: Record) {
    if (unsaved() && !window.confirm('Open this page? Any unsaved edits in the editor will be lost.')) return
    setSelected(record?._id || ''); setPage(record ? structuredClone(record.draft) : blank()); setMessage('')
  }
  async function save(publish = false) {
    setBusy(true); setMessage('')
    try {
      if (!selected && records.some(row => row._id === page.slug)) throw Error('That page address already exists. Choose it from the page list to edit it, or use a new address.')
      const saved = await fetchApi('/api/admin/custom-pages', { method: 'POST', body: JSON.stringify(page) })
      setSelected(saved._id); setPage(saved.draft)
      if (publish) await fetchApi(`/api/admin/custom-pages/${encodeURIComponent(saved._id)}/publish`, { method: 'POST' })
      await load(); setMessage(publish ? 'Published. This page now appears in Sirappu Amsangal in the app.' : 'Draft saved. Publish when ready to show it in the app.')
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  async function action(record: Record, remove: boolean) {
    if (!window.confirm(remove ? 'Delete this page and its published version?' : 'Unpublish this page from the app? Your draft will be kept.')) return
    setBusy(true)
    try {
      await fetchApi(`/api/admin/custom-pages/${encodeURIComponent(record._id)}${remove ? '' : '/unpublish'}`, { method: remove ? 'DELETE' : 'POST' })
      if (remove && selected === record._id) { setSelected(''); setPage(blank()) }
      await load(); setMessage(remove ? 'Page deleted.' : 'Page unpublished; draft kept.')
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  function update(patch: Partial<Page>) { setPage({ ...page, ...patch }) }
  function textField(label: string, value: string, change: (value: string) => void, multiline = false) {
    return <label>{label}{multiline ? <textarea value={value} maxLength={10000} onChange={e => change(e.target.value)} /> : <input value={value} maxLength={500} onChange={e => change(e.target.value)} />}</label>
  }
  function blocksEditor(blocks: Block[], change: (blocks: Block[]) => void, depth = 0): React.ReactNode {
    const edit = (index: number, patch: Partial<Block>) => change(blocks.map((block, i) => i === index ? { ...block, ...patch } : block))
    return <div className="builder-blocks">{blocks.map((block, index) => <details key={block.id} open className="builder-block">
      <summary>{index + 1}. {block.type}</summary>
      <div className="builder-block-tools"><button type="button" disabled={index === 0} onClick={() => { const next = [...blocks]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; change(next) }}>↑ Move up</button>
        <button type="button" disabled={index === blocks.length - 1} onClick={() => { const next = [...blocks]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; change(next) }}>↓ Move down</button>
        <button type="button" onClick={() => change(blocks.filter((_, i) => i !== index))}>Remove</button></div>
      {!['divider', 'spacer'].includes(block.type) && <>
        <div className="builder-fields">{textField('Tamil heading', block.titleTa, value => edit(index, { titleTa: value }))}{textField('English heading', block.titleEn, value => edit(index, { titleEn: value }))}</div>
        {block.type !== 'heading' && <div className="builder-fields">{textField('Tamil content', block.contentTa, value => edit(index, { contentTa: value }), true)}{textField('English content', block.contentEn, value => edit(index, { contentEn: value }), true)}</div>}
        {['image', 'card', 'container'].includes(block.type) && <ImageUploader label="Block image" rasterOnly value={block.imageUrl} onBusy={setUploading} onChange={value => edit(index, { imageUrl: imageSource(value) })} />}
        <div className="builder-fields"><label>Background<input type="color" value={block.background} onChange={e => edit(index, { background: e.target.value })} /></label>
          <label>Text color<input type="color" value={block.textColor} onChange={e => edit(index, { textColor: e.target.value })} /></label>
          <label>Font size<input type="number" min={12} max={36} value={block.fontSize} onChange={e => edit(index, { fontSize: Number(e.target.value) })} /></label>
          <label>Rounded corners<input type="number" min={0} max={40} value={block.radius} onChange={e => edit(index, { radius: Number(e.target.value) })} /></label></div>
        <label>Link to another page<select value={block.linkPage} onChange={e => edit(index, { linkPage: e.target.value })}><option value="">No link</option>{records.filter(row => row._id !== page.slug).map(row => <option key={row._id} value={row._id}>{row.draft.titleEn || row.draft.titleTa} ({row.published ? 'Published' : 'Draft'})</option>)}</select></label>
      </>}
      {['card', 'container', 'spacer'].includes(block.type) && <label>Spacing<input type="number" min={0} max={48} value={block.padding} onChange={e => edit(index, { padding: Number(e.target.value) })} /></label>}
      {block.type === 'container' && <><label>Columns<select value={block.columns} onChange={e => edit(index, { columns: Number(e.target.value) })}>{[1, 2, 3].map(value => <option key={value}>{value}</option>)}</select></label>
        {blocksEditor(block.children || [], children => edit(index, { children }), depth + 1)}</>}
    </details>)}
      <div className="builder-add">{kinds.filter(kind => depth < 3 || kind !== 'container').map(kind => <button type="button" key={kind} onClick={() => change([...blocks, newBlock(kind)])}>+ {kind}</button>)}</div>
    </div>
  }
  function renderBlock(block: Block): React.ReactNode {
    const title = previewEn ? block.titleEn || block.titleTa : block.titleTa || block.titleEn
    const content = previewEn ? block.contentEn || block.contentTa : block.contentTa || block.contentEn
    if (block.type === 'divider') return <hr key={block.id} />
    if (block.type === 'spacer') return <div key={block.id} style={{ height: block.padding }} />
    const box = ['card', 'container'].includes(block.type)
    return <div key={block.id} style={{ marginBottom: 14, padding: box ? block.padding : 0, borderRadius: block.radius, background: box ? block.background : undefined, color: block.textColor, fontSize: block.fontSize, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {block.imageUrl && <img alt="" src={block.imageUrl.startsWith('/') ? API_BASE_URL + block.imageUrl : block.imageUrl} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: block.radius }} />}
      {title && <strong style={{ display: 'block', fontSize: block.type === 'heading' ? block.fontSize + 6 : block.fontSize }}>{title}</strong>}{content}
      {block.children && <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.columns}, minmax(0, 1fr))`, gap: 12 }}>{block.children.map(renderBlock)}</div>}
      {block.linkPage && <small style={{ display: 'block' }}>→ {block.linkPage}</small>}
    </div>
  }
  return <div className="page-builder">
    <h1>Page Builder · சிறப்பம்சங்கள்</h1><p>Create 5, 10 or more pages. Published pages appear automatically in the app’s Sirappu Amsangal section. Blank English fields use automatic translation when available.</p>
    {message && <p role="status" className="builder-message">{message}</p>}
    {!loaded ? <button onClick={load}>Retry loading pages</button> : <div className="builder-layout">
      <aside><button disabled={disabled} onClick={() => choose()}>+ New page</button>{records.map(record => <article key={record._id}>
        <button disabled={disabled} className={selected === record._id ? 'selected' : ''} onClick={() => choose(record)}>{record.draft.titleEn || record.draft.titleTa}<small>{record.published ? 'Published' : 'Draft'} · {record._id}</small></button>
        <button disabled={disabled} onClick={() => { if (window.confirm('Duplicate this page into a new draft? Unsaved editor changes will be lost.')) { setSelected(''); setPage({ ...structuredClone(record.draft), slug: '' }); setMessage('Enter a new page address, then save or publish the copy.') } }}>Duplicate</button>
        {record.published && <button disabled={disabled} onClick={() => action(record, false)}>Unpublish</button>}<button disabled={disabled} onClick={() => action(record, true)}>Delete</button>
      </article>)}</aside>
      <form onSubmit={event => { event.preventDefault(); void save(false) }}><fieldset disabled={disabled}>
        <h2>{selected ? 'Edit page' : 'New page'}</h2>
        <label>Page address<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} readOnly={!!selected} placeholder="my-new-page" value={page.slug} onChange={e => update({ slug: e.target.value })} /></label>
        <div className="builder-fields">{textField('Tamil page title', page.titleTa, titleTa => update({ titleTa }))}{textField('English page title', page.titleEn, titleEn => update({ titleEn }))}
          {textField('Tamil description', page.subtitleTa, subtitleTa => update({ subtitleTa }))}{textField('English description', page.subtitleEn, subtitleEn => update({ subtitleEn }))}</div>
        <ImageUploader rasterOnly value={page.imageUrl} label="Page cover image" onBusy={setUploading} onChange={value => update({ imageUrl: imageSource(value) })} />
        <div className="builder-fields"><label>Page background<input type="color" value={page.background} onChange={e => update({ background: e.target.value })} /></label>
          <label>Page text color<input type="color" value={page.textColor} onChange={e => update({ textColor: e.target.value })} /></label>
          <label>Display order<input type="number" min={0} max={10000} value={page.order} onChange={e => update({ order: Number(e.target.value) })} /></label></div>
        <h2>Content & design</h2>{blocksEditor(page.blocks, blocks => update({ blocks }))}
        <div className="builder-save"><button type="submit">Save draft</button><button type="button" onClick={() => void save(true)}>Publish page</button></div>
      </fieldset></form>
      <section className="builder-preview"><h2>Page preview</h2><label><input type="checkbox" checked={previewEn} onChange={e => setPreviewEn(e.target.checked)} /> English preview</label>
        <div style={{ background: page.background, color: page.textColor, padding: 18, borderRadius: 18, minHeight: 500 }}>
          {page.imageUrl && <img alt="Page cover" src={page.imageUrl.startsWith('/') ? API_BASE_URL + page.imageUrl : page.imageUrl} style={{ width: '100%', borderRadius: 16 }} />}
          <h2>{previewEn ? page.titleEn || page.titleTa : page.titleTa || page.titleEn}</h2><p>{previewEn ? page.subtitleEn || page.subtitleTa : page.subtitleTa || page.subtitleEn}</p>{page.blocks.map(renderBlock)}
        </div>
      </section>
    </div>}
  </div>
}
