import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { CalendarLeadersEditor } from '../src/components/CalendarLeadersEditor';
vi.mock('axios', () => ({ default: { put: vi.fn() } }));
vi.mock('../src/components/ImageUploader', () => ({ ImageUploader: ({ value, onChange }: any) => <label>Leader image<input value={value} onChange={event => onChange(event.target.value)} /></label> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

test('admin publishes edited leader image/date/type through existing app content', async () => {
  const onSaved = vi.fn();
  vi.mocked(axios.put).mockResolvedValue({ data: {} });
  render(<CalendarLeadersEditor onSaved={onSaved} raw={JSON.stringify([{ id: 'leader', nameTa: 'தலைவர்', nameEn: 'Leader', imageUrl: 'https://example.com/old.png', date: '1903-07-15', captionTa: '', captionEn: '', sourceUrl: '', enabled: true, remembrance: false }])} />);
  const user = userEvent.setup();
  const image = screen.getByLabelText('Leader image');
  await user.clear(image); await user.type(image, 'https://example.com/new.png');
  const date = screen.getByLabelText('Birthday / remembrance date');
  await user.clear(date); await user.type(date, '1921-09-11');
  await user.selectOptions(screen.getByLabelText('Date type'), 'remembrance');
  await user.click(screen.getByRole('button', { name: 'Publish calendar leaders' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  const body = vi.mocked(axios.put).mock.calls[0][1] as any;
  expect(body.key).toBe('calendar_leaders');
  expect(body.ta).toBe(body.en);
  expect(JSON.parse(body.en)[0]).toMatchObject({ imageUrl: 'https://example.com/new.png', date: '1921-09-11', remembrance: true });
});
