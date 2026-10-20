import React from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as XLSX from 'xlsx'
import { columns, examples, readSakunamExcel } from '../src/utils/sakunamExcel'
import SakunamExcelImport from '../src/components/SakunamExcelImport'
import { fetchApi } from '../src/utils/api'
vi.mock('../src/utils/api', () => ({ fetchApi: vi.fn() }))
afterEach(() => { cleanup(); vi.resetAllMocks() })
const categories = [{ value: 'bali_temple', label: 'Temple offerings' }, { value: 'kagam', label: 'Crow' }]
function bytes(rows: any[], formula = false) {
  const book = XLSX.utils.book_new(), sheet = XLSX.utils.json_to_sheet(rows, { header: [...columns] })
  if (formula) sheet.B2 = { t: 's', v: 'Cached formula', f: 'CONCAT("a","b")' }
  XLSX.utils.book_append_sheet(book, sheet, 'Entries')
  return XLSX.write(book, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}
test('Excel validation flags duplicate titles and invalid categories and rejects formulas', () => {
  const good = readSakunamExcel(bytes(examples), categories.map(row => row.value))
  expect(good).toHaveLength(2); expect(good[0].errors).toEqual([])
  expect(good[0].data.titleTa).toBe(examples[0].titleTa)
  expect(readSakunamExcel(bytes([examples[0], examples[0]]), ['bali_temple'])[1].errors.join()).toContain('Duplicate')
  expect(readSakunamExcel(bytes([{ ...examples[0], category: 'unknown' }]), ['bali_temple'])[0].errors.join()).toContain('Unknown category')
  expect(() => readSakunamExcel(bytes(examples, true), ['bali_temple'])).toThrow('not formulas')
})
test('example preview never imports; uploaded rows require an explicit import click', async () => {
  vi.mocked(fetchApi).mockResolvedValue({ created: 2, skipped: 0 })
  const imported = vi.fn(), user = userEvent.setup()
  render(<SakunamExcelImport categories={categories} onImported={imported} />)
  await user.click(screen.getByRole('button', { name: 'Show example preview' }))
  expect(screen.getByText('Entry preview · row 2')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Import 2 entries' })).toBeNull()
  const file = new File(['file'], 'entries.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes(examples) })
  await user.upload(screen.getByLabelText('Upload Sakunam Excel'), file)
  const button = await screen.findByRole('button', { name: 'Import 2 entries' })
  expect(fetchApi).not.toHaveBeenCalled()
  await user.click(button)
  await waitFor(() => expect(imported).toHaveBeenCalledOnce())
  expect(screen.getByRole('status').textContent).toContain('2 added')
  expect(JSON.parse(vi.mocked(fetchApi).mock.calls[0][1]!.body as string).rows).toHaveLength(2)
})
