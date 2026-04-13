/**
 * Handles sending email notifications and auto-replies.
 * Assumes `env.SEND_EMAIL` is a function binding to a Cloudflare Worker Email service or similar.
 */

export async function sendEmails(env, toEmail, subject, notificationHtml, clientReplyMessage, corsHeaders) {
    try {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Notification to you
        const notificationPayload = {
            from: { email: 'FROM_EMAIL', name: 'FROM_NAME' },
            to: [{ email: 'aalba@albaweb.dev' }],
            subject: `📬 New Contact Form Submission - ${subject}`,
            html: notificationHtml,
        };

        // Auto-reply to client
        const clientReplyPayload = {
            from: { email: 'aalba@albaweb.dev', name: 'Andrew Alba' },
            to: [{ email: toEmail, name: 'Client' }],
            subject: `✅ Thank you for reaching out, ${toEmail}! - Re: ${subject}`,
            html: clientReplyMessage,
        };

        // Send both emails in parallel
        const [notificationRes, clientReplyRes] = await Promise.all([
            /*fetch('https://send.api.mailtrap.io/api/send', {
                method: 'POST',
                headers,
                body: JSON.stringify(notificationPayload),
            }),*/

            // Or send a new email using the send_email binding
            env.SEND_EMAIL.send(notificationPayload),
            /*fetch('https://send.api.mailtrap.io/api/send', {
                method: 'POST',
                headers,
                body: JSON.stringify(clientReplyPayload),
            }),*/
            env.SEND_EMAIL.send(clientReplyPayload),
        ]);

        // Handle failures
        if (!notificationRes.ok || !clientReplyRes.ok) {
            console.error('Notification:', await notificationRes.text());
            console.error('Client Reply:', await clientReplyRes.text());
            return new Response('Failed to send email', {
                status: 500,
                headers: corsHeaders,
            });
        }

        // Success
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Form submitted successfully and confirmation email sent!',
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                },
            }
        );
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Unexpected error' }), {
            status: 500,
            headers: corsHeaders,
        });
    }
}
