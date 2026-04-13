/**
 * Sends admin notification + client auto-reply via the Cloudflare `send_email` binding.
 * `env.SEND_EMAIL.send()` resolves when queued or throws on failure (no fetch-style `.ok`).
 */

export async function sendEmails(env, toEmail, subject, notificationHtml, clientReplyMessage, responseHeaders = {}) {
	const headers = {
		'Content-Type': 'application/json',
		...responseHeaders,
	};

	const fromEmail = env.FROM_EMAIL;
	const fromName = env.FROM_NAME || 'Contact Form';
	const ownerInbox = env.OWNER_CONTACT_EMAIL || fromEmail;

	if (!fromEmail) {
		console.error('sendEmails: FROM_EMAIL is not configured');
		return new Response(
			JSON.stringify({ error: 'Server misconfiguration', message: 'FROM_EMAIL is not set' }),
			{ status: 500, headers }
		);
	}
	if (!ownerInbox) {
		console.error('sendEmails: no admin inbox (set OWNER_CONTACT_EMAIL or FROM_EMAIL)');
		return new Response(
			JSON.stringify({ error: 'Server misconfiguration', message: 'No notification recipient configured' }),
			{ status: 500, headers }
		);
	}

	const notificationPayload = {
		from: { email: fromEmail, name: fromName },
		to: [{ email: ownerInbox }],
		subject: `📬 New Contact Form Submission - ${subject}`,
		html: notificationHtml,
	};

	const clientReplyPayload = {
		from: { email: fromEmail, name: fromName },
		to: [{ email: toEmail, name: 'Client' }],
		subject: `✅ Thank you for reaching out, ${toEmail}! - Re: ${subject}`,
		html: clientReplyMessage,
	};

	try {
		await Promise.all([env.SEND_EMAIL.send(notificationPayload), env.SEND_EMAIL.send(clientReplyPayload)]);

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Form submitted successfully and confirmation email sent!',
			}),
			{ status: 200, headers }
		);
	} catch (err) {
		console.error('sendEmails failed:', err);
		return new Response(
			JSON.stringify({
				error: 'Email delivery failed',
				message: 'Could not send email. Please try again later.',
			}),
			{ status: 500, headers }
		);
	}
}
