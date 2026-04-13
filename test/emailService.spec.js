import { describe, it, expect, vi } from 'vitest';
import { sendEmails } from '../src/emailService.js';

describe('sendEmails', () => {
	it('returns 500 when FROM_EMAIL is not configured', async () => {
		const env = {
			SEND_EMAIL: { send: vi.fn().mockResolvedValue(undefined) },
		};
		const res = await sendEmails(env, 'client@example.com', 'Subj', '<p>n</p>', '<p>r</p>', { 'X-Extra': 'a' });
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.error).toBe('Server misconfiguration');
		expect(res.headers.get('X-Extra')).toBe('a');
		expect(env.SEND_EMAIL.send).not.toHaveBeenCalled();
	});

	it('sends notification and client reply then returns 200', async () => {
		const sends = [];
		const env = {
			FROM_EMAIL: 'from@example.com',
			FROM_NAME: 'Forms',
			OWNER_CONTACT_EMAIL: 'owner@example.com',
			SEND_EMAIL: {
				send: vi.fn(async (payload) => {
					sends.push(payload);
				}),
			},
		};
		const res = await sendEmails(env, 'client@example.com', 'Hello', '<p>n</p>', '<p>r</p>', {
			'Access-Control-Allow-Origin': '*',
		});
		expect(res.status).toBe(200);
		expect(env.SEND_EMAIL.send).toHaveBeenCalledTimes(2);
		expect(sends[0].to[0].email).toBe('owner@example.com');
		expect(sends[1].to[0].email).toBe('client@example.com');
		expect(sends[0].from.email).toBe('from@example.com');
		expect(sends[1].from.email).toBe('from@example.com');
		const body = await res.json();
		expect(body.success).toBe(true);
	});

	it('returns 500 when SEND_EMAIL.send rejects', async () => {
		const env = {
			FROM_EMAIL: 'from@example.com',
			OWNER_CONTACT_EMAIL: 'owner@example.com',
			SEND_EMAIL: {
				send: vi.fn().mockRejectedValue(new Error('internal server error')),
			},
		};
		const res = await sendEmails(env, 'client@example.com', 'S', 'h', 'r', {});
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.error).toBe('Email delivery failed');
	});
});
