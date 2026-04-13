# 📧 Contact Form Cloudflare Worker

A production-ready, secure contact form API built with Cloudflare Workers that automatically sends professional email responses to clients while notifying you of new submissions.

## ✨ Features

### 🔐 **Enterprise-Grade Security**

- **CORS Protection** - Whitelist specific domains only
- **API Key Authentication** - Header-based authentication system
- **Rate Limiting** - 5 requests per 15 minutes per IP address
- **Input Validation** - RFC 5322 compliant email validation
- **Data Sanitization** - XSS and injection attack prevention
- **IP-based Tracking** - Uses Cloudflare's real IP detection

### 📨 **Dual Email System**

- **Admin Notification** - Instant alerts with submission details
- **Auto-Reply** - Professional, branded confirmation emails to clients
- **HTML Templates** - Beautiful, responsive email designs
- **Personalization** - Dynamic content based on submission data

### 🛡️ **Robust Validation**

- **Email Format** - Advanced regex validation
- **Required Fields** - Name, email, subject, message validation
- **Length Constraints** - Minimum character requirements
- **Error Handling** - Detailed, user-friendly error messages

### 🚀 **Performance & Reliability**
- **Cloudflare Edge** - Global CDN with sub-50ms response times
- **KV Storage** - Persistent rate limiting data
- **Concurrent Processing** - Parallel email sending
- **Error Recovery** - Comprehensive error handling

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Cloudflare      │    │   Cloudflare    │
│   Application   │───▶│  Worker API      │───▶│   Email Service │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Cloudflare KV   │
                       │  Rate Limiting   │
                       └──────────────────┘
```

## 🚦 API Specification

### **Endpoint**

```
POST https://<cloudflare-worker>.domain.workers.dev/
```

### **Headers**

```http
Content-Type: application/json
X-API-Key: your-secret-api-key
```

### **Request Body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Tech Corp",
  "subject": "Private Event",
  "message": "We are looking to host a private event...",
  "preferredContact": "Email"
}
```

### **Response Codes**

| Code | Status | Description |
|------|---------|-------------|
| `200` | ✅ Success | Form submitted successfully |
| `400` | ❌ Bad Request | Validation errors |
| `401` | 🔒 Unauthorized | Invalid API key |
| `405` | 🚫 Method Not Allowed | Only POST requests allowed |
| `429` | ⏳ Too Many Requests | Rate limit exceeded |
| `500` | 💥 Server Error | Internal server error |

### **Success Response**

```json
{
  "success": true,
  "message": "Form submitted successfully and confirmation email sent!"
}
```

### **Error Response**

```json
{
  "error": "Validation failed",
  "message": "Please correct the following errors:",
  "errors": [
    "Please provide a valid email address",
    "Message must be at least 10 characters long"
  ]
}
```

### **Rate Limit Response**

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 12 minutes.",
  "retryAfter": 12
}
```

## ⚙️ Configuration

### **Environment Variables**

Create these in your Cloudflare Workers environment:

```bash
# Required
API_KEY=your-secret-api-key-here
FROM_EMAIL=your-email@domain.com

# Optional (configured in code)
RATE_LIMIT_WINDOW=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX=5          # Maximum requests per window
```

## 🛠️ Installation & Deployment

### **Prerequisites**

- Cloudflare account
- Wrangler CLI installed

### **Step 1: Clone & Install**

```bash
git clone <your-repo>
cd <your-repo-name>
npm install -g @cloudflare/wrangler
```

### **Step 2: Configure Environment**

```bash
# Set environment variables
wrangler secret put API_KEY
wrangler secret put FROM_EMAIL
wrangler secret put FROM_NAME
wrangler secret put ALLOWED_ORIGINS
```

You will need to generate an API_KEY. Please follow the instructions below:

- Use cryptographically secure randomness.
- Typical format: long alphanumeric string, optionally with a prefix and version.
- Example: pk-1a2b3c4d5e6f7g8h9i0j or a base64/hex token.
- Length: aim for at least 32–64 random characters (roughly 256–512 bits of entropy).

The FROM_EMAIL is the email address that will be used to send emails.

The ALLOWED_ORIGINS environment variable is a comma-separated list of domains that are allowed to submit the form.

'https://my-web.site', 'http://localhost:3000','http://localhost:8787'

### **Step 3: Create KV Namespace**

**Create KV Namespace:**

```bash
wrangler kv namespace create "BB_BB_RATE_LIMIT_KV"
```

**Add to wrangler.toml:**

```toml
[[kv_namespaces]]
binding = "BB_RATE_LIMIT_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### **Step 4: Deploy**

```bash
wrangler publish
```


### **Wrangler Commands You can use**

```bash
wrangler secret put SMTP_USER --env development
wrangler secret put SMTP_PASS --env development

wrangler secret put SMTP_USER --env production
wrangler secret put SMTP_PASS --env production

wrangler dev --env development

```

## 💻 Frontend Integration

### **JavaScript Example**
```javascript
async function submitContactForm(formData) {
  try {
    const response = await fetch('https://your-worker.domain.workers.dev/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key-here'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok) {
      showSuccess(result.message);
    } else {
      showError(result.errors || [result.error]);
    }
  } catch (error) {
    showError(['Network error. Please try again.']);
  }
}
```

## 📊 Rate Limiting Details

### **Configuration**
- **Window**: 15 minutes (900,000ms)
- **Limit**: 5 requests per IP address
- **Storage**: Cloudflare KV with automatic TTL cleanup
- **Headers**: Standard rate limit headers included

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2024-01-15T10:30:00Z
Retry-After: 720
```

### **IP Detection Priority**

1. `CF-Connecting-IP` (Cloudflare's real IP)
2. `X-Forwarded-For` (Proxy forwarded IP)
3. `"unknown"` (Fallback for edge cases)

## 🎨 Email Templates

### **Admin Notification Email**

- Clean, structured format
- All submission details included
- Easy-to-read contact information
- Optimized for mobile devices

### **Client Auto-Reply Email**

- Professional branding with gradients
- Personalized greeting using client's name
- Clear next steps and timeline expectations
- Submission summary for client reference
- Responsive HTML design
- Trust-building elements

## 🔍 Validation Rules

### **Required Fields**

- **Name**: Minimum 2 characters
- **Email**: RFC 5322 compliant format
- **Subject**: Minimum 3 characters
- **Message**: Minimum 10 characters

### **Optional Fields**

- **Phone**: Any format accepted
- **Company**: Free text
- **Budget**: Free text
- **Timeline**: Free text
- **Preferred Contact**: Defaults to "Email"

### **Email Regex Pattern**

```javascript
/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
```

## 🚨 Error Handling

### **Validation Errors**

```json
{
  "error": "Validation failed",
  "message": "Please correct the following errors:",
  "errors": [
    "Name must be at least 2 characters long",
    "Please provide a valid email address"
  ]
}
```

### **Authentication Errors**

```json
{
  "error": "Unauthorized - Invalid API key"
}
```

### **Rate Limiting Errors**

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 12 minutes.",
  "retryAfter": 12
}
```

## 🔧 Monitoring & Debugging

### **Cloudflare Analytics**

- Request volume and response times
- Error rates and status codes
- Geographic distribution of requests
- Rate limiting effectiveness

### **Log Analysis**

```javascript
// Custom logging in worker
console.log('Form submission:', {
  ip: clientIP,
  email: sanitizedData.email,
  timestamp: new Date().toISOString()
});
```

### **Health Check Endpoint**

Consider adding a health check:
```javascript
if (request.url.endsWith('/health')) {
  return new Response('OK', { status: 200 });
}
```

## ⚡ Performance Optimization

### **Response Times**

- **Average**: < 50ms globally
- **P95**: < 100ms
- **Email Processing**: Parallel execution
- **KV Operations**: Minimal latency impact

### **Best Practices**

- Use `Promise.all()` for concurrent operations
- Implement proper error boundaries
- Optimize email template size
- Cache static configuration data

## 🔒 Security Best Practices

### **API Key Management**

- Use strong, randomly generated keys
- Rotate keys regularly
- Store securely in Cloudflare secrets
- Never expose in client-side code

### **CORS Configuration**

- Whitelist only necessary domains
- Avoid wildcards in production
- Include localhost for development
- Regular security audits

### **Input Sanitization**

- Validate all inputs server-side
- Escape HTML entities in emails
- Trim whitespace consistently
- Handle edge cases gracefully

## 📈 Scaling Considerations

### **Current Limits**

- **Requests**: 100,000+ per day on free tier
- **Rate Limiting**: 5 requests per 15 minutes per IP
- **KV Operations**: 1,000+ reads/writes per second
- **Email Volume**: Depends on Mailtrap plan

### **Scaling Options**

- Increase rate limits for authenticated users
- Add geographic load balancing
- Implement request queuing for high volume
- Add monitoring and alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check Cloudflare Workers documentation
- Review Mailtrap API documentation


