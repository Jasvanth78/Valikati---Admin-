import React from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from '../src/pages/Settings'

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('axios', () => ({ default: { create: () => api } }))
vi.mock('../src/components/ImageUploader', () => ({ ImageUploader: () => null }))
vi.mock('../src/components/notificationIconImage', () => ({ normalizeNotificationIcon: async () => new Blob(['normalized'], { type: 'image/png' }) }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })
test('admin saves a bundled notification icon in both content fields', async () => {
  api.get.mockResolvedValue({ data: [] })
  api.put.mockResolvedValue({ data: {} })
  vi.stubGlobal('alert', vi.fn())
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })))
  render(<Settings />)
  const title = await screen.findByText('Android Notification-bar Icon')
  const section = title.closest('section') as HTMLElement
  const user = userEvent.setup()
  await user.click(within(section).getByRole('button', { name: 'Edit Android Notification-bar Icon' }))
  await user.selectOptions(screen.getByRole('combobox', { name: 'Android Notification-bar Icon' }), 'ic_notification_compass')
  await user.click(within(section).getByRole('button', { name: 'Save & publish' }))
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/app-content', { key: 'notification_icon', ta: 'ic_notification_compass', en: 'ic_notification_compass' }, expect.any(Object)))
})
test('admin can upload an SVG and publish its custom notification icon', async () => {
  api.get.mockResolvedValue({ data: [] })
  api.put.mockResolvedValue({ data: {} })
  const icon = { id: 'custom', label: 'flaticon-bell', imageUrl: '/uploads/notification-icons/01234567-89ab-cdef-0123-456789abcdef.png' }
  const requests: RequestInit[] = []
  vi.stubGlobal('fetch', vi.fn(async (_url, options = {}) => {
    requests.push(options)
    return { ok: true, json: async () => options.method === 'POST' ? icon : [] }
  }))
  const user = userEvent.setup()
  render(<Settings />)
  await user.click(await screen.findByRole('button', { name: 'Edit Android Notification-bar Icon' }))
  await user.upload(screen.getByLabelText('Upload notification icon'), new File(['<svg />'], 'flaticon-bell.svg', { type: 'image/svg+xml' }))
  await screen.findByAltText('flaticon-bell notification preview')
  await user.click(screen.getByRole('button', { name: 'Save & publish' }))
  const value = JSON.stringify({ label: icon.label, imageUrl: icon.imageUrl })
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/app-content', { key: 'notification_icon', ta: value, en: value }, expect.any(Object)))
  expect(requests.find(request => request.method === 'POST')?.body).toBeInstanceOf(FormData)
  expect(await screen.findByAltText('Selected notification icon')).toBeTruthy()
})
