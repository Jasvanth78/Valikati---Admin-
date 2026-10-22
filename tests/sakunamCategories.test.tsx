import React from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SakunamCategoryManager from '../src/components/SakunamCategoryManager'
import { fetchApi } from '../src/utils/api'
vi.mock('../src/utils/api', () => ({ fetchApi: vi.fn() }))
afterEach(() => { cleanup(); vi.restoreAllMocks() })
test('admin removes and restores a category without deleting entries', async () => {
  vi.mocked(fetchApi).mockResolvedValue([])
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  render(<SakunamCategoryManager categories={[{ value: 'animals', label: 'Animal omens' }]} entries={[{ category: 'animals' }]} onChanged={() => {}} />)
  const user = userEvent.setup()
  await user.click(screen.getByText('Manage / remove Sakunam categories'))
  await user.click(await screen.findByRole('button', { name: 'Remove from app' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Entries kept'))
  const saved = JSON.parse(vi.mocked(fetchApi).mock.calls.find(([, opts]) => opts?.method === 'PUT')![1]!.body as string)
  expect(JSON.parse(saved.en)).toEqual(['animals'])
  expect(vi.mocked(fetchApi).mock.calls.some(([, opts]) => opts?.method === 'DELETE')).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Restore category' }))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('restored'))
})
