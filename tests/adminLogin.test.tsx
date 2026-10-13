import React from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
vi.mock('../src/components/Layout', () => ({ default: ({ adminEmail, onLogout }: { adminEmail: string; onLogout: () => void }) => <div>Admin dashboard {adminEmail}<button onClick={onLogout}>Sign out</button></div> }))
beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
const response = (status: number, data: unknown) => ({ status, ok: status >= 200 && status < 300, json: async () => data })

test('dashboard stays hidden until existing-account login and server session verification', async () => {
  const calls: { url: string; options: RequestInit }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
    calls.push({ url, options })
    return url.endsWith('/login') ? response(200, { token: 'signed-admin-token' }) : response(200, { email: 'admin@example.com' })
  }))
  const user = userEvent.setup(); render(<App />)
  expect(screen.queryByText(/Admin dashboard/)).toBeNull()
  await user.type(screen.getByLabelText('Email'), 'admin@example.com')
  await user.type(screen.getByLabelText('Password'), 'existing-password')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  await screen.findByText(/Admin dashboard admin@example.com/)
  expect(JSON.parse(calls.find(c => c.url.endsWith('/login'))!.options.body as string)).toEqual({ email: 'admin@example.com', password: 'existing-password' })
  expect(localStorage.getItem('adminToken')).toBe('signed-admin-token')
  expect(calls.find(c => c.url.endsWith('/session'))!.options.headers).toEqual({ Authorization: 'Bearer signed-admin-token' })
  await user.click(screen.getByRole('button', { name: 'Sign out' }))
  expect(screen.getByRole('heading', { name: 'Admin sign-in' })).toBeTruthy()
  expect(localStorage.getItem('adminToken')).toBeNull()
})

test('incorrect credentials show an error without opening dashboard', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response(401, { message: 'Invalid email or password' })))
  const user = userEvent.setup(); render(<App />)
  await user.type(screen.getByLabelText('Email'), 'admin@example.com')
  await user.type(screen.getByLabelText('Password'), 'wrong-password')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByText('Invalid email or password')).toBeTruthy()
  expect(screen.queryByText(/Admin dashboard/)).toBeNull()
})

test('saved token is verified and unauthorized responses return to login', async () => {
  localStorage.setItem('adminToken', 'existing-token')
  vi.stubGlobal('fetch', vi.fn(async () => response(200, { email: 'admin@example.com' })))
  render(<App />)
  await screen.findByText(/Admin dashboard/)
  window.dispatchEvent(new Event('admin-session-expired'))
  await screen.findByRole('heading', { name: 'Admin sign-in' })
  expect(screen.getByText('Your session expired. Please sign in again.')).toBeTruthy()
  expect(localStorage.getItem('adminToken')).toBeNull()
})

test('expired saved token cannot bypass login; backend outages offer retry', async () => {
  localStorage.setItem('adminToken', 'expired-token')
  const fetchMock = vi.fn(async () => response(401, {}))
  vi.stubGlobal('fetch', fetchMock); const view = render(<App />)
  await screen.findByRole('heading', { name: 'Admin sign-in' })
  expect(localStorage.getItem('adminToken')).toBeNull()
  view.unmount(); localStorage.setItem('adminToken', 'valid-token')
  fetchMock.mockImplementation(async () => { throw TypeError('offline') })
  render(<App />)
  await screen.findByRole('button', { name: 'Retry' })
  expect(screen.queryByText(/Admin dashboard/)).toBeNull()
  expect(localStorage.getItem('adminToken')).toBe('valid-token')
  fetchMock.mockImplementation(async () => response(200, { email: 'admin@example.com' }))
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  await waitFor(() => expect(screen.getByText(/Admin dashboard/)).toBeTruthy())
})
