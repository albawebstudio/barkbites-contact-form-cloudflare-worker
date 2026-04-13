import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('contact form worker', () => {
	it('returns 405 for GET (unit style)', async () => {
		const request = new Request('http://example.com', { method: 'GET' });
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(405);
	});

	it('returns 405 for GET (integration style)', async () => {
		const response = await SELF.fetch('http://example.com', { method: 'GET' });
		expect(response.status).toBe(405);
	});
});
