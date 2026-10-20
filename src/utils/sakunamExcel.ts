import * as XLSX from 'xlsx'
export const columns = ['category', 'titleTa', 'titleEn', 'contentTa', 'contentEn', 'imageUrl'] as const
export type ImportEntry = { [K in typeof columns[number]]: string }
export type PreviewRow = { row: number; data: ImportEntry; errors: string[] }
export const examples: ImportEntry[] = [
  { category: 'bali_temple', titleTa: 'கோவில் பலி — மாதிரி தலைப்பு', titleEn: 'Temple offering — example title', contentTa: 'இது மாதிரி மட்டுமே. உங்கள் சரிபார்க்கப்பட்ட விளக்கத்தை இங்கே எழுதவும்.', contentEn: 'Example only. Replace this with your reviewed explanation.', imageUrl: '' },
  { category: 'kagam', titleTa: 'பறவை சகுனம் — மாதிரி தலைப்பு', titleEn: 'Bird omen — example title', contentTa: 'உங்கள் பாரம்பரிய குறிப்பின் விளக்கத்தை இங்கே எழுதவும்.', contentEn: 'Add your own explanation of this traditional belief here.', imageUrl: '' },
]
export function readSakunamExcel(buffer: ArrayBuffer, categoryKeys: string[]): PreviewRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames.includes('Entries') ? 'Entries' : workbook.SheetNames[0]]
  if (!sheet || !sheet['!ref']) throw Error('The workbook has no entry rows.')
  if (XLSX.utils.decode_range(sheet['!ref']).e.r > 200) throw Error('Use at most 200 entry rows per file.')
  for (const [key, cell] of Object.entries(sheet)) if (!key.startsWith('!') && cell.f) throw Error('Use plain text cells, not formulas, in the Entries sheet.')
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false })
  const header = (matrix[0] || []).map(value => String(value).trim().toLowerCase())
  if (!header.includes('category') || !header.some(value => ['titleta', 'titleen'].includes(value)) || !header.some(value => ['contentta', 'contenten'].includes(value))) throw Error('Use the template headers: category, titleTa, titleEn, contentTa, contentEn, imageUrl.')
  if (new Set(header.filter(Boolean)).size !== header.filter(Boolean).length) throw Error('The sheet contains duplicate column headers.')
  const seen = new Set<string>()
  const rows = matrix.slice(1).map((cells, index): PreviewRow => {
    const data = Object.fromEntries(columns.map(field => [field, String(cells[header.indexOf(field.toLowerCase())] ?? '').trim()])) as ImportEntry
    const errors: string[] = []
    if (!categoryKeys.includes(data.category)) errors.push('Unknown category. Use a category key from the template.')
    if (!data.titleTa && !data.titleEn) errors.push('Title is required.')
    if (!data.contentTa && !data.contentEn) errors.push('Content is required.')
    for (const field of columns) if (data[field].length > (field.startsWith('content') ? 50000 : field === 'imageUrl' ? 2000 : 250)) errors.push(`${field} is too long.`)
    if (data.imageUrl && !/^\/uploads\/[\w.-]+$/.test(data.imageUrl)) {
      try { const url = new URL(data.imageUrl); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error() }
      catch { errors.push('Image URL must be HTTP(S) or a local upload path.') }
    }
    const identity = JSON.stringify([data.category, data.titleTa || data.titleEn])
    if (seen.has(identity)) errors.push('Duplicate category and title in this file.')
    seen.add(identity)
    return { row: index + 2, data, errors }
  }).filter(row => Object.values(row.data).some(Boolean))
  if (!rows.length) throw Error('No non-empty entries found.')
  return rows
}
export function downloadSakunamTemplate(categories: { value: string; label: string }[]) {
  const book = XLSX.utils.book_new()
  const sheet = XLSX.utils.json_to_sheet(examples, { header: [...columns] })
  sheet['!cols'] = [{ wch: 20 }, { wch: 38 }, { wch: 38 }, { wch: 70 }, { wch: 70 }, { wch: 35 }]
  sheet['!autofilter'] = { ref: 'A1:F3' }
  XLSX.utils.book_append_sheet(book, sheet, 'Entries')
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(categories.map(row => ({ category: row.value, description: row.label }))), 'Categories')
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ['How to import'], ['1. Replace the example rows in Entries with your own content.'],
    ['2. Use a category key from Categories. You can mix categories in one file.'],
    ['3. Enter at least one title and one content field. English may be left blank for automatic translation when available.'],
    ['4. imageUrl is optional. Use plain text, not formulas. Maximum 200 entries and 5 MB per file.'],
    ['5. Upload, review the preview, fix all errors, then click Import. Existing category/title entries are skipped, not overwritten.'],
  ]), 'Instructions')
  XLSX.writeFile(book, 'sakunam_import_template.xlsx')
}
