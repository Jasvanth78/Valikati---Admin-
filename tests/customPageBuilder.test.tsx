import React from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomPageBuilder from '../src/pages/CustomPageBuilder'
import { fetchApi } from '../src/utils/api'
vi.mock('../src/utils/api', () => ({ API_BASE_URL: 'http://localhost:7006', fetchApi: vi.fn() }))
vi.mock('../src/components/ImageUploader', () => ({ ImageUploader: () => <div>Image upload</div> }))
afterEach(() => { cleanup(); vi.restoreAllMocks() })
test('admin creates blocks, previews content, saves a draft and publishes a new page', async () => {
  let record: any
  vi.mocked(fetchApi).mockImplementation(async (path, options) => {
    if (options?.method === 'POST' && path === '/api/admin/custom-pages') { record = { _id: 'my-page', draft: JSON.parse(options.body as string), published: null }; return record }
    if (path.endsWith('/publish')) { record.published = record.draft; return record }
    return record ? [record] : []
  })
  render(<CustomPageBuilder />)
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Page address'), 'my-page')
  await user.type(screen.getByLabelText('English page title'), 'My custom page')
  await user.click(screen.getByRole('button', { name: '+ card', exact: true }))
  await user.type(screen.getByLabelText('English heading'), 'Card heading')
  await user.type(screen.getByLabelText('English content'), 'My published data')
  await user.click(screen.getByLabelText('English preview'))
  expect(screen.getAllByText('My published data').length).toBeGreaterThan(0)
  await user.click(screen.getByRole('button', { name: 'Save draft' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Draft saved'))
  expect(vi.mocked(fetchApi).mock.calls.some(([path]) => path.endsWith('/publish'))).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Publish page' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Sirappu Amsangal'))
  expect(record.published.blocks[0]).toMatchObject({ type: 'card', titleEn: 'Card heading', contentEn: 'My published data' })
})
