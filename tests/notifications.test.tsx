import React from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Notifications from '../src/pages/Notifications'

const category = { id: 'cat1', key: 'articles', name: 'Articles', description: 'Article updates', isEnabled: true, counts: { active: 2, inactive: 0 } }
const definitions = [
  { id: 'def1', key: 'article_one', categoryKey: 'articles', name: 'Article One', description: 'First rule', trigger: 'article_published', title: 'One', message: 'One', destination: 'articles', audience: { kind: 'all' }, isEnabled: true },
  { id: 'def2', key: 'article_two', categoryKey: 'articles', name: 'Article Two', description: 'Second rule', trigger: 'article_published', title: 'Two', message: 'Two', destination: 'articles', audience: { kind: 'all' }, isEnabled: true },
]
const dashboard = { globalEnabled: true, categories: [category], definitions, rules: [], templates: [], segments: [], counts: { types: 2, automations: 0, sends: 0, accepted: 0, failed: 0, devices: 1 }, destinations: ['home', 'articles'], triggers: ['manual', 'article_published'], variables: ['article_title'], recent: { items: [] }, scheduled: { items: [] } }

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
function setup() {
  const calls: { url: string; method: string; body: any }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit = {}) => {
    const method = options.method || 'GET', body = options.body ? JSON.parse(options.body as string) : undefined
    calls.push({ url, method, body })
    if (url.includes('/recipients')) return { ok: true, status: 200, json: async () => [] }
    if (url.includes('/definitions?')) return { ok: true, status: 200, json: async () => ({ items: definitions, total: 2, totalPages: 1 }) }
    if (url.includes('/dashboard')) return { ok: true, status: 200, json: async () => dashboard }
    return { ok: true, status: 200, json: async () => ({ ...dashboard, isEnabled: body?.isEnabled }) }
  }))
  render(<Notifications />)
  return calls
}

test('global OFF requires confirmation before the backend update', async () => {
  const calls = setup(), user = userEvent.setup()
  await user.click(await screen.findByRole('checkbox', { name: 'Enable Push Notifications Globally' }))
  expect(calls.some(call => call.url.endsWith('/global') && call.method === 'PUT')).toBe(false)
  await user.click(screen.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(calls.find(call => call.url.endsWith('/global'))?.body).toEqual({ isEnabled: false }))
})

test('category and one notification use independent status endpoints', async () => {
  const calls = setup(), user = userEvent.setup()
  await screen.findByText('2 types · Page 1')
  await user.click(await screen.findByRole('button', { name: 'Expand Articles' }))
  await user.click(screen.getByRole('checkbox', { name: 'Article One enabled' }))
  await waitFor(() => expect(calls.find(call => call.url.includes('/definitions/def1/status'))?.body.isEnabled).toBe(false))
  expect(calls.some(call => call.url.includes('/definitions/def2/status'))).toBe(false)
  await user.click(screen.getByRole('checkbox', { name: 'Articles category enabled' }))
  await waitFor(() => expect(calls.find(call => call.url.includes('/categories/cat1/status'))?.body.isEnabled).toBe(false))
})
