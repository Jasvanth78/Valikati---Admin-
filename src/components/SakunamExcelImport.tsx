import { useState } from 'react'
import { fetchApi } from '../utils/api'
import { columns, downloadSakunamTemplate, examples, readSakunamExcel, type PreviewRow } from '../utils/sakunamExcel'

export default function SakunamExcelImport({ categories, onImported }: { categories: { value: string; label: string }[]; onImported: () => void }) {
  const [rows, setRows] = useState<PreviewRow[]>([]), [example, setExample] = useState(false), [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(''), [selected, setSelected] = useState(0), [english, setEnglish] = useState(false), [imported, setImported] = useState(false)
  const errors = rows.filter(row => row.errors.length)
  const active = rows[selected]?.data
  async function upload(file: File) {
    setMessage(''); setRows([]); setSelected(0); setExample(false); setImported(false); setBusy(true)
    try {
      if (!/\.(xlsx|xls)$/i.test(file.name) || file.size > 5 * 1024 * 1024) throw Error('Choose an .xlsx or .xls file up to 5 MB.')
      setRows(readSakunamExcel(await file.arrayBuffer(), categories.map(category => category.value)))
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  async function publish() {
    if (errors.length || !rows.length || example || imported) return
    setBusy(true); setMessage('')
    try {
      const result = await fetchApi('/api/admin/sakunam/import', { method: 'POST', body: JSON.stringify({ rows: rows.map(row => row.data) }) })
      setImported(true); setMessage(`Import complete: ${result.created} added, ${result.skipped} existing entries skipped. Existing content was kept.`); onImported()
    } catch (error) { setMessage((error as Error).message) }
    finally { setBusy(false) }
  }
  return <section aria-label="Excel import" className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
    <h3 className="text-lg font-bold text-teal-800">Excel upload & preview</h3>
    <p className="text-sm text-gray-500">Download the example workbook, replace its sample rows, then upload it. Review everything before importing. Mixed categories are supported; existing category/title entries are skipped.</p>
    <div className="flex flex-wrap gap-3 items-center">
      <button type="button" disabled={busy} onClick={() => downloadSakunamTemplate(categories)} className="border border-teal-700 text-teal-800 rounded px-4 py-2">Download Excel template</button>
      <button type="button" disabled={busy} onClick={() => { setRows(examples.map((data, index) => ({ row: index + 2, data, errors: [] }))); setSelected(0); setExample(true); setImported(false); setMessage('Example preview only. Upload your edited workbook to import your content.') }} className="border rounded px-4 py-2">Show example preview</button>
      <label className="border rounded px-4 py-2 cursor-pointer text-teal-800">Upload Excel<input aria-label="Upload Sakunam Excel" type="file" accept=".xlsx,.xls" disabled={busy} className="block mt-2 text-sm" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = '' }} /></label>
    </div>
    {message && <p role="status" className="text-sm text-teal-800">{message}</p>}
    {rows.length > 0 && <>
      <p className="text-sm font-semibold">{example ? 'Example preview' : 'Import preview'} · {rows.length} rows · {errors.length} rows with errors</p>
      <div className="overflow-auto max-h-80 border rounded"><table className="w-full text-sm text-left"><thead className="bg-gray-50 sticky top-0"><tr><th className="p-3">Excel row</th><th className="p-3">Category</th><th className="p-3">Tamil title</th><th className="p-3">English title</th><th className="p-3">Validation</th><th className="p-3">Preview</th></tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.row} className={selected === index ? 'bg-teal-50' : 'border-t'}><td className="p-3">{row.row}</td><td className="p-3">{row.data.category}</td><td className="p-3 max-w-60">{row.data.titleTa || '—'}</td><td className="p-3 max-w-60">{row.data.titleEn || 'Auto-translate when available'}</td>
          <td className="p-3">{row.errors.length ? <span className="text-red-700">{row.errors.join(' ')}</span> : <span className="text-teal-700">Ready</span>}</td><td className="p-3"><button type="button" onClick={() => setSelected(index)} className="border rounded px-3 py-1">View row {row.row}</button></td></tr>)}</tbody>
      </table></div>
      {active && <div className="border rounded-xl p-5 bg-gray-50 space-y-3">
        <div className="flex flex-wrap gap-4 justify-between"><h4 className="font-bold">Entry preview · row {rows[selected].row}</h4><label><input type="checkbox" checked={english} onChange={event => setEnglish(event.target.checked)} /> English preview</label></div>
        <p className="text-xs text-gray-500">{categories.find(category => category.value === active.category)?.label || active.category}</p>
        <h4 className="font-bold text-lg text-teal-900">{(english ? active.titleEn : active.titleTa) || active.titleTa || active.titleEn}</h4>
        <p className="whitespace-pre-wrap break-words text-gray-700 max-h-60 overflow-auto">{(english ? active.contentEn : active.contentTa) || active.contentTa || active.contentEn}</p>
        {active.imageUrl && <p className="text-xs break-all">Image: {active.imageUrl}</p>}
        {english && !active.contentEn && <p className="text-xs text-gray-500">English is blank. Tamil is shown until automatic translation is available.</p>}
      </div>}
      {!example && <button type="button" disabled={busy || errors.length > 0 || imported} onClick={() => void publish()} className="bg-teal-700 text-white px-5 py-2 rounded disabled:opacity-50">{busy ? 'Importing…' : imported ? 'Imported' : `Import ${rows.length} entries`}</button>}
      {errors.length > 0 && <p className="text-red-700 text-sm">Fix the listed Excel rows and upload the file again. Nothing has been imported.</p>}
    </>}
    {!rows.length && <p className="text-xs text-gray-500">Columns: {columns.join(', ')}. Maximum 200 rows. The template includes category keys and instructions.</p>}
  </section>
}
