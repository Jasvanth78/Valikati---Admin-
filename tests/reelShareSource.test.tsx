import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { ReelShareSourceEditor } from '../src/components/ReelShareSourceEditor';
vi.mock('axios', () => ({ default: { post: vi.fn(), put: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
test('admin attaches an uploaded share source to an existing embedded video', async () => {
  vi.mocked(axios.post).mockResolvedValue({ data: { url: '/uploads/share.mp4' } });
  vi.mocked(axios.put).mockResolvedValue({ data: {} });
  localStorage.setItem('adminToken', 'admin-test');
  render(<ReelShareSourceEditor id="123456789012345678901234" />);
  await userEvent.setup().upload(screen.getByLabelText('Share video'), new File(['video'], 'share.mp4', { type: 'video/mp4' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Share video saved'));
  expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/api/admin/app-content'), {
    key: 'reel_share_source_123456789012345678901234', ta: '/uploads/share.mp4', en: '/uploads/share.mp4',
  }, { headers: { Authorization: 'Bearer admin-test' } });
});
