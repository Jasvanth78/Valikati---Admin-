import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PosterPosts from '../src/pages/PosterPosts'

const category = { id: '0123456789abcdef01234567', slug: 'morning', nameTa: 'காலை வணக்கம்', nameEn: 'Good morning' }
const fixture = { id: 'abcdef0123456789abcdef01', imageUrl: 'https://example.com/poster.png', caption: 'Greeting', categoryId: category.id, category, status: 'draft', effectiveStatus: 'draft', isEnabled: true, publishedAt: null, createdAt: '2026-10-12T10:00:00Z', likeCount: 0 }
let posters: typeof fixture[], calls: { path: string; options?: RequestInit }[], unauthorized = false
const response = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))
beforeEach(() => {
  localStorage.clear(); localStorage.setItem('adminToken', 'admin-token'); posters = []; calls = []; unauthorized = false
  vi.stubGlobal('fetch', vi.fn((url: string, options?: RequestInit) => {
    const path = new URL(url).pathname; calls.push({ path, options })
    if (path === '/api/admin/login') { unauthorized = false; return response({ token: 'new-admin-token' }) }
    if (unauthorized) return response({ error: 'Admin sign-in required' }, 401)
    if (path.endsWith('/upload')) return response({ url: fixture.imageUrl })
    if (path.endsWith('/categories')) return response([category])
    if (options?.method === 'POST') { const body = JSON.parse(options.body as string); posters = [{ ...fixture, ...body, effectiveStatus: body.status }]; return response(posters[0], 201) }
    if (options?.method === 'PUT') { const body = JSON.parse(options.body as string); posters = [{ ...posters[0], ...body }]; return response(posters[0]) }
    if (options?.method === 'DELETE') { posters = []; return response({ success: true }) }
    return response({ items: posters, total: posters.length, totalPages: posters.length ? 1 : 0, page: 1 })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('Independent Poster Posts admin module', () => {
  it('uploads a poster, shows preview, saves draft and publishes via poster endpoints only', async () => {
    const user = userEvent.setup(); render(<PosterPosts />)
    await screen.findByText('No posters in this view. Create your first greeting poster.')
    await user.click(screen.getByRole('button', { name: 'New poster' }))
    const dialog = screen.getByRole('dialog', { name: 'Create poster' })
    const file = new File(['poster image'], 'morning.png', { type: 'image/png' })
    await user.upload(within(dialog).getByLabelText('Upload poster image'), file)
    expect(await within(dialog).findByAltText('Poster preview')).toBeTruthy()
    await user.type(within(dialog).getByLabelText('Caption (optional)'), 'Tamil morning greeting')
    await user.click(within(dialog).getByRole('button', { name: 'Save draft' }))
    await screen.findByText('Poster saved as draft.')
    const saved = calls.find(c => c.path === '/api/admin/poster-posts' && c.options?.method === 'POST')
    expect(JSON.parse(saved?.options?.body as string)).toMatchObject({ imageUrl: fixture.imageUrl, categoryId: category.id, status: 'draft', caption: 'Tamil morning greeting' })
    const upload = calls.find(c => c.path.endsWith('/upload'))
    expect((upload?.options?.body as FormData).get('folder')).toBe('valikatti_posters')
    await user.click(screen.getByRole('button', { name: 'Edit poster' }))
    const edit = screen.getByRole('dialog', { name: 'Edit poster' })
    await user.selectOptions(within(edit).getByLabelText('Publication'), 'published')
    await user.click(within(edit).getByRole('button', { name: 'Publish poster' }))
    await screen.findByText('Poster published. It is now available in the mobile feed.')
    expect(calls.filter(c => c.options?.method === 'PUT').map(c => c.path)).toEqual(['/api/admin/poster-posts/' + fixture.id])
    expect(calls.every(c => c.path.startsWith('/api/admin/poster-posts'))).toBe(true)
    expect(screen.queryByText('Blog Management')).toBeNull()
  })
  it('edits, disables, enables and deletes the selected poster', async () => {
    posters = [fixture]; const user = userEvent.setup(); render(<PosterPosts />)
    await screen.findByText('Greeting')
    await user.click(screen.getByRole('button', { name: 'Disable poster' })); await screen.findByText('Disabled')
    await user.click(screen.getByRole('button', { name: 'Enable poster' })); await waitFor(() => expect(screen.queryByText('Disabled')).toBeNull())
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'Delete poster' })); await screen.findByText('No posters in this view. Create your first greeting poster.')
    expect(calls.find(c => c.options?.method === 'DELETE')?.path).toBe('/api/admin/poster-posts/' + fixture.id)
  })
  it('existing admin login unlocks the separate poster page', async () => {
    unauthorized = true; const user = userEvent.setup(); render(<PosterPosts />)
    await screen.findByText('Admin sign-in')
    await user.type(screen.getByLabelText('Admin email'), 'admin@example.com'); await user.type(screen.getByLabelText('Admin password'), 'test-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' })); await screen.findByText('No posters in this view. Create your first greeting poster.')
    expect(localStorage.getItem('adminToken')).toBe('new-admin-token')
  })
  it('rejects non-raster uploads and does not create poster metadata', async () => {
    const user = userEvent.setup(); render(<PosterPosts />); await screen.findByText('No posters in this view. Create your first greeting poster.')
    await user.click(screen.getByRole('button', { name: 'New poster' }))
    fireEvent.change(screen.getByLabelText('Upload poster image'), { target: { files: [new File(['bad'], 'bad.svg', { type: 'image/svg+xml' })] } })
    await screen.findByText('Choose a JPG, PNG, WEBP or GIF, up to 10 MB.')
    expect(calls.some(c => c.options?.method === 'POST')).toBe(false)
  })
  it('schedules a poster with an ISO publication timestamp', async () => {
    const user = userEvent.setup(); render(<PosterPosts />); await screen.findByText('No posters in this view. Create your first greeting poster.')
    await user.click(screen.getByRole('button', { name: 'New poster' }))
    await user.upload(screen.getByLabelText('Upload poster image'), new File(['poster'], 'night.png', { type: 'image/png' }))
    await screen.findByAltText('Poster preview')
    await user.selectOptions(screen.getByLabelText('Publication'), 'scheduled')
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    fireEvent.change(screen.getByLabelText('Publication time (your local timezone)'), { target: { value: future } })
    await user.click(screen.getByRole('button', { name: 'Schedule poster' })); await screen.findByText('Poster scheduled.')
    const scheduled = calls.find(c => c.path === '/api/admin/poster-posts' && c.options?.method === 'POST')
    const body = JSON.parse(scheduled?.options?.body as string)
    expect(body.status).toBe('scheduled'); expect(body.publishedAt).toBe(new Date(future).toISOString())
  })
})
