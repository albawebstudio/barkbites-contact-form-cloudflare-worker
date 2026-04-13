import { describe, it, expect } from 'vitest';
import getClientReplyMessage, {
	getClientReplyTemplateHtml,
	hasClientReplyTemplate,
	listClientReplyTemplateKeys,
	renderEmailTemplate,
	escapeHtml,
	escapeHtmlAttributeValue,
	buildMailtoHref,
	buildContactNotificationHtml,
} from '../src/clientReplyTemplate.js';

describe('clientReplyTemplate registry', () => {
	it('lists registered keys including contact', () => {
		expect(listClientReplyTemplateKeys()).toContain('contact');
		expect(hasClientReplyTemplate('contact')).toBe(true);
		expect(hasClientReplyTemplate('missing')).toBe(false);
	});

	it('getClientReplyTemplateHtml(contact) returns HTML document', () => {
		const html = getClientReplyTemplateHtml('contact');
		expect(html).toMatch(/<!doctype html>/i);
		expect(html).toContain('You have a new message!');
		expect(html).toContain('{{ name }}');
	});

	it('getClientReplyTemplateHtml throws for unknown key', () => {
		expect(() => getClientReplyTemplateHtml('not-a-key')).toThrow(/Unknown email template key/);
	});

	it('renderEmailTemplate replaces spaced and compact placeholders', () => {
		const out = renderEmailTemplate('<p>{{ a }} and {{b}}</p>', { a: '1', b: '2' });
		expect(out).toBe('<p>1 and 2</p>');
	});

	it('renderEmailTemplate leaves unknown keys unchanged', () => {
		const out = renderEmailTemplate('{{ known }} {{ unknown }}', { known: 'x' });
		expect(out).toBe('x {{ unknown }}');
	});

	it('escapeHtml escapes special characters', () => {
		expect(escapeHtml('<a>&"\'</a>')).toBe('&lt;a&gt;&amp;&quot;&#39;&lt;/a&gt;');
	});

	it('escapeHtmlAttributeValue escapes quotes and ampersands', () => {
		expect(escapeHtmlAttributeValue('a&b"c')).toBe('a&amp;b&quot;c');
	});

	it('buildMailtoHref encodes email and subject', () => {
		expect(buildMailtoHref('a@b.com', 'Hello & welcome')).toBe(
			'mailto:a%40b.com?subject=Hello%20%26%20welcome',
		);
	});

	it('buildMailtoHref returns # for empty email', () => {
		expect(buildMailtoHref('  ', 'x')).toBe('#');
	});

	it('buildContactNotificationHtml fills placeholders and escapes body', () => {
		const html = buildContactNotificationHtml({
			name: 'Test <User>',
			email: 'u@example.com',
			phone: '555',
			message: 'Line1\nLine2',
			replySubject: 'Subj & "ok"',
		});
		expect(html).toContain('Test &lt;User&gt;');
		expect(html).toContain('u@example.com');
		expect(html).toContain('Line1<br />');
		expect(html).toContain('Line2');
		expect(html).toContain('mailto:u%40example.com');
		expect(html).toContain('subject=Subj%20%26%20%22ok%22');
		expect(html).not.toContain('{{ currentYear }}');
		expect(html).toContain('BarkBites');
		expect(html).toContain(String(new Date().getFullYear()));
	});
});

describe('getClientReplyMessage', () => {
	it('renders selected template with localized body and placeholders', () => {
		const html = getClientReplyMessage(
			{
				name: 'Pat',
				formType: 'message',
				language: 'en',
				email: 'pat@example.com',
				phone: '555',
				mailtoContactEmail: 'owner@example.com',
				mailtoContactSubject: 'Hello',
			},
			'contact',
		);
		expect(html).toContain('Pat');
		expect(html).toContain('pat@example.com');
		expect(html).toContain('thanks for getting in touch');
		expect(html).toContain('mailto:owner%40example.com');
		expect(html).not.toContain('{{ name }}');
	});

	it('throws for unknown template key', () => {
		expect(() =>
			getClientReplyMessage(
				{ name: 'x', formType: 'message', language: 'en', email: 'a@b.com' },
				'no-such-template',
			),
		).toThrow(/Unknown email template key/);
	});
});
