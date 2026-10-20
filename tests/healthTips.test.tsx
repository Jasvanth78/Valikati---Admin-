import React from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HealthTipsEditor from '../src/components/HealthTipsEditor'
import { fetchApi } from '../src/utils/api'
vi.mock('../src/utils/api', () => ({ fetchApi: vi.fn() }))
afterEach(() => { cleanup(); vi.resetAllMocks() })

test('admin publishes a bilingual health tip to the shared Home slider', async () => {
  vi.mocked(fetchApi).mockResolvedValue([])
  render(<HealthTipsEditor />)
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Add health tip' }))
  await user.type(screen.getByLabelText('Tamil health tip'), 'மருத்துவக் குறிப்பு')
  await user.type(screen.getByLabelText('English health tip'), 'Reviewed health tip')
  await user.click(screen.getByRole('button', { name: 'Publish health tips' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('published'))
  const options = vi.mocked(fetchApi).mock.calls.find(([, options]) => options?.method === 'PUT')![1]!
  const saved = JSON.parse(options.body as string)
  expect(saved.key).toBe('home_health_tips')
  expect(JSON.parse(saved.ta)[0]).toMatchObject({ contentEn: 'Reviewed health tip', enabled: true })
  expect(saved.ta).toBe(saved.en)
})
