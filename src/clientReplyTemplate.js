/**
 * Client reply / email HTML from `/src/templates` (keyed imports) plus optional helpers
 * for operator notification emails that use the same placeholders.
 */

import contactHtml from './templates/contact.html';

/** @type {Record<string, string>} */
const TEMPLATE_BY_KEY = {
    contact: contactHtml,
};

/**
 * @param {string} key
 * @returns {string}
 */
export function getClientReplyTemplateHtml(key) {
    const html = TEMPLATE_BY_KEY[key];
    if (html === undefined) {
        throw new Error(`Unknown email template key: ${key}`);
    }
    return html;
}

/** @param {string} key */
export function hasClientReplyTemplate(key) {
    return Object.prototype.hasOwnProperty.call(TEMPLATE_BY_KEY, key);
}

/** @returns {string[]} */
export function listClientReplyTemplateKeys() {
    return Object.keys(TEMPLATE_BY_KEY);
}

/**
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * @param {string} s
 * @returns {string}
 */
export function escapeHtmlAttributeValue(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * @param {string} email
 * @param {string} subject
 * @returns {string}
 */
export function buildMailtoHref(email, subject) {
    const e = String(email).trim();
    if (!e) {
        return '#';
    }
    return `mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent(subject)}`;
}

/**
 * @param {string} text
 * @returns {string}
 */
function formatMultilineMessage(text) {
    return escapeHtml(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br />\n');
}

/**
 * @param {string} html
 * @param {Record<string, string>} vars
 * @returns {string}
 */
export function renderEmailTemplate(html, vars) {
    return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, rawKey) => {
        const key = String(rawKey).trim();
        if (!Object.prototype.hasOwnProperty.call(vars, key)) {
            return match;
        }
        return vars[key];
    });
}

/**
 * @param {{ name: string; email: string; phone?: string; message: string; replySubject: string }} fields
 * @returns {string}
 */
export function buildContactNotificationHtml(fields) {
    const html = getClientReplyTemplateHtml('contact');
    const name = fields.name || '';
    const email = fields.email || '';
    const phone = fields.phone || '';
    const message = fields.message || '';
    const replySubject = fields.replySubject || 'Message from contact form';

    const vars = {
        name: escapeHtml(name),
        email: escapeHtml(email),
        phone: escapeHtml(phone),
        message: formatMultilineMessage(message),
        mailtoHref: escapeHtmlAttributeValue(buildMailtoHref(email, replySubject)),
        currentYear: String(new Date().getFullYear()),
    };

    return renderEmailTemplate(html, vars);
}

/**
 * Renders the auto-reply HTML using a template from `/src/templates`.
 *
 * @param {object} sanitizedData
 * @param {string} [sanitizedData.name]
 * @param {string} [sanitizedData.email] — submitter email (shown in template)
 * @param {string} [sanitizedData.phone]
 * @param {string} [sanitizedData.mailtoContactEmail] — address used for `mailtoHref` (e.g. site owner)
 * @param {string} [sanitizedData.mailtoContactSubject]
 * @param {string} [sanitizedData.budget]
 * @param {string} [sanitizedData.timeline]
 * @param {string} [sanitizedData.preferredContact]
 * @param {string} [sanitizedData.formType]
 * @param {string} [sanitizedData.language]
 * @param {string} [templateKey='contact'] — key into `TEMPLATE_BY_KEY`
 * @returns {string}
 */
export default function getClientReplyMessage(sanitizedData, templateKey = 'contact') {
    const {
        name = 'there',
        preferredContact = 'Not specified',
        formType,
        language = 'en',
        email = '',
        phone = '',
        mailtoContactEmail = '',
        mailtoContactSubject = 'Thanks for your message',
    } = sanitizedData;

    const messages = {
        en: {
            message: `Hi ${name}, thanks for getting in touch. I’ve received your message and will respond shortly.`,
            recruiter_query: `Hello ${name}, thank you for reaching out regarding recruitment. I’ll review your inquiry and respond as soon as I can.`,
            default: `Hi ${name}, thank you for reaching out. I'll take a look at your message and get back to you soon.`,
        },
    };

    const t = messages[language] || messages.en;
    const introMessage = t[formType] || t.default;

    const lines = [introMessage, ''];
    const messageBody = lines.join('\n');

    const html = getClientReplyTemplateHtml(templateKey);
    const vars = {
        name: escapeHtml(name),
        email: escapeHtml(email),
        phone: escapeHtml(phone),
        message: formatMultilineMessage(messageBody),
        mailtoHref: escapeHtmlAttributeValue(buildMailtoHref(mailtoContactEmail, mailtoContactSubject)),
        currentYear: String(new Date().getFullYear()),
    };

    return renderEmailTemplate(html, vars);
}
