import React from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdManagement from '../src/pages/AdManagement'
const base = { globalEnabled: true, pages: { home: true }, registry: { pages: [{ key: 'home', label: 'Home', slots: [{ key: 'inline_banner', label: 'Existing Home banner', formats: ['banner'] }] }] }, placements: [{ id: 'test-id', pageKey: 'home', placementKey: 'inline_banner', adFormat: 'banner', androidAdUnitId: 'ca-app-pub-3940256099942544/6300978111', iosAdUnitId: '', isEnabled: true, sortOrder: 0, frequencyCap: 120 }] }
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
test('Reels / Videos is selectable and global OFF explains audio reward blocking', async () => {
  const fixture = structuredClone(base)
  fixture.globalEnabled = false
  fixture.registry.pages.push({ key: 'reels', label: 'Reels / Videos', slots: [{ key: 'bottom_banner', label: 'Below the video player', formats: ['banner', 'native'] }] })
  setup(fixture)
  const user = userEvent.setup()
  const page = await screen.findByRole('combobox', { name: 'Page' })
  await user.selectOptions(page, 'reels')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Placement' }), 'bottom_banner')
  expect((page as HTMLSelectElement).value).toBe('reels')
  expect(screen.getByText(/Blocked: Global Ads Status is OFF/)).toBeTruthy()
})
function setup(initial = base) {
  let state = structuredClone(initial)
  const calls: { url: string; method: string; body: any }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
    const body = options.body ? JSON.parse(options.body as string) : undefined
    calls.push({ url, method: options.method || 'GET', body })
    if (url.endsWith('/settings')) state = { ...state, ...body }
    if (url.endsWith('/status')) state.placements.find(row => row.id === url.split('/').at(-2))!.isEnabled = body.isEnabled
    if (options.method === 'PUT' && !url.endsWith('/settings')) state.placements = state.placements.map(row => row.id === url.split('/').at(-1) ? { ...row, ...body } : row)
    if (options.method === 'DELETE') state.placements = state.placements.filter(row => row.id !== url.split('/').at(-1))
    if (options.method === 'POST') state.placements.push({ ...body, id: 'created-id' })
    return { ok: true, json: async () => structuredClone(state) }
  }))
  render(<AdManagement />)
  return calls
}
test('global OFF requires confirmation and page settings save independently', async () => {
  const calls = setup(); const user = userEvent.setup()
  const toggle = await screen.findByRole('checkbox', { name: 'Enable Ads Globally' })
  await user.click(toggle)
  expect(screen.getByRole('dialog', { name: 'Confirm ad change' })).toBeTruthy()
  expect(calls.filter(c => c.method === 'PUT')).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(calls.find(c => c.url.endsWith('/settings'))?.body.globalEnabled).toBe(false))
  await user.click(screen.getByRole('button', { name: 'Page controls' }))
  await user.click(screen.getByRole('checkbox', { name: 'Home ads' }))
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() => expect(calls.filter(c => c.url.endsWith('/settings')).at(-1)?.body.pages.home).toBe(false))
})
test('table search, status and type filters, sorting and pagination work', async () => {
  const fixture = structuredClone(base)
  fixture.registry.pages[0].slots = Array.from({ length: 9 }, (_, i) => ({ key: `slot_${i}`, label: `Slot ${i}`, formats: ['banner'] }))
  fixture.placements = Array.from({ length: 9 }, (_, i) => ({ ...base.placements[0], id: `id-${i}`, placementKey: `slot_${i}`, sortOrder: 9 - i, isEnabled: i !== 0 }))
  setup(fixture); const user = userEvent.setup()
  await screen.findByText('Showing 1 to 8 of 9 placements')
  expect(screen.getAllByTestId('ad-placement-row')).toHaveLength(8)
  await user.click(screen.getByRole('button', { name: 'Next page' }))
  expect(screen.getByText('Showing 9 to 9 of 9 placements')).toBeTruthy()
  await user.type(screen.getByRole('textbox', { name: 'Search pages or placements' }), 'Slot 0')
  expect(screen.getAllByTestId('ad-placement-row')).toHaveLength(1)
  await user.clear(screen.getByRole('textbox', { name: 'Search pages or placements' }))
  await user.click(screen.getByRole('button', { name: 'Filter' }))
  await user.selectOptions(screen.getByRole('combobox', { name: 'Filter status' }), 'disabled')
  expect(screen.getAllByTestId('ad-placement-row')).toHaveLength(1)
  await user.selectOptions(screen.getByRole('combobox', { name: 'Filter ad type' }), 'native')
  expect(screen.queryByTestId('ad-placement-row')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Clear filters' }))
  await user.click(screen.getByRole('button', { name: 'Sort' }))
  await user.click(screen.getByRole('button', { name: 'Enabled first' }))
  expect(screen.getAllByTestId('ad-placement-row')[0].textContent).toContain('Slot 8')
})
test('inline order, duplicate editor, preview and confirmed delete work', async () => {
  const fixture = structuredClone(base)
  fixture.registry.pages[0].slots.push({ key: 'bottom_banner', label: 'Bottom Banner', formats: ['banner'] })
  const calls = setup(fixture); const user = userEvent.setup()
  const order = await screen.findByRole('spinbutton', { name: 'Order for home inline_banner' })
  await user.clear(order); await user.type(order, '3'); await user.tab()
  await waitFor(() => expect(calls.find(c => c.method === 'PUT' && c.url.endsWith('/test-id'))?.body.sortOrder).toBe(3))
  await user.click(screen.getByRole('button', { name: 'Duplicate home inline_banner' }))
  expect((screen.getByRole('combobox', { name: 'Placement' }) as HTMLSelectElement).value).toBe('bottom_banner')
  await user.click(screen.getByRole('button', { name: 'Save Configuration' }))
  await waitFor(() => expect(calls.find(c => c.method === 'POST')?.body.placementKey).toBe('bottom_banner'))
  await user.click(screen.getByRole('button', { name: 'Test Ad' }))
  expect(screen.getByRole('dialog', { name: 'Test ad preview' })).toBeTruthy()
  expect(screen.getByText(/This browser preview does not request a live ad/)).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Close preview' }))
  await user.click(screen.getAllByRole('button', { name: 'Delete' })[0])
  expect(calls.filter(c => c.method === 'DELETE')).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(calls.filter(c => c.method === 'DELETE')).toHaveLength(1))
})
test('individual placement toggle and ID edit use dedicated API', async () => {
  const calls = setup(); const user = userEvent.setup()
  await user.click(await screen.findByRole('checkbox', { name: 'home inline_banner enabled' }))
  await waitFor(() => expect(calls.find(c => c.method === 'PATCH')?.body.isEnabled).toBe(false))
  await user.click(screen.getByRole('button', { name: 'Edit' }))
  const android = screen.getByRole('textbox', { name: 'Android Ad Unit ID' })
  await user.clear(android); await user.type(android, 'ca-app-pub-3940256099942544/6300978112')
  await user.click(screen.getByRole('button', { name: 'Save Configuration' }))
  await waitFor(() => expect(calls.find(c => c.method === 'PUT' && c.url.endsWith('/test-id'))?.body.androidAdUnitId).toBe('ca-app-pub-3940256099942544/6300978112'))
})
test('forms expose only registered placements and reject App IDs', async () => {
  const calls = setup(); const user = userEvent.setup()
  await screen.findByRole('checkbox', { name: 'Enable Ads Globally' })
  await user.click(screen.getByRole('button', { name: 'New Configuration' }))
  await user.selectOptions(screen.getByRole('combobox', { name: 'Page' }), 'home')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Placement' }), 'inline_banner')
  expect(screen.getByRole('combobox', { name: 'Ad Format' }).querySelectorAll('option')).toHaveLength(1)
  await user.type(screen.getByRole('textbox', { name: 'Android Ad Unit ID' }), 'ca-app-pub-3940256099942544~3347511713')
  await user.click(screen.getByRole('button', { name: 'Save Configuration' }))
  expect(calls.filter(c => c.method === 'POST')).toHaveLength(0)
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
})
