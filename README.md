# SoanAI Favicon API

A production-ready Node.js API by **SoanAI** that fetches the favicon link for any public website by scraping its HTML. Built with Express, Cheerio, and robust security features. Perfect for integration, automation, and use on RapidAPI.

---

## 🚀 Features
- Fetches favicon for any public website
- Input validation and SSRF protection
- Rate limiting (60 requests/minute per IP)
- CORS enabled (usable from any frontend)
- Robust error handling and logging

---

## 📦 Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
   The server runs on port 3000 by default, or the `PORT` environment variable if set.

---

## 📚 API Documentation

### Endpoint
```
GET /favicon?url=YOUR_TARGET_URL
```

#### Query Parameters
| Name | Type   | Required | Description                |
|------|--------|----------|----------------------------|
| url  | string | Yes      | The full URL of the website to fetch the favicon from. Must be a public, valid URL. |

#### Example Request
```
GET /favicon?url=https://github.com
```

#### Example Response (Success)
```
{
  "favicon": "https://github.githubassets.com/favicons/favicon.svg"
}
```

#### Example Error Responses
- **Missing URL:**
  ```
  { "error": "Missing url query parameter", "code": "MISSING_URL" }
  ```
- **Invalid or Disallowed URL:**
  ```
  { "error": "Invalid or disallowed URL", "code": "INVALID_URL" }
  ```
- **Target resolves to a private or disallowed IP:**
  ```
  { "error": "Target resolves to a private or disallowed IP", "code": "PRIVATE_IP" }
  ```
- **Failed to resolve target hostname:**
  ```
  { "error": "Failed to resolve target hostname", "code": "DNS_ERROR" }
  ```
- **Rate limit exceeded:**
  ```
  { "error": "Too many requests, please try again later.", "code": "RATE_LIMITED" }
  ```
- **Other errors:**
  ```
  { "error": "Failed to fetch or parse the URL", "code": "INTERNAL_ERROR" }
  ```

#### Error Codes
| Code         | Meaning                                      |
|--------------|----------------------------------------------|
| MISSING_URL  | The `url` query parameter is missing         |
| INVALID_URL  | The provided URL is invalid or not allowed   |
| PRIVATE_IP   | The target resolves to a private/disallowed IP|
| DNS_ERROR    | The target hostname could not be resolved    |
| RATE_LIMITED | Too many requests from this IP               |
| FETCH_FAILED | Could not fetch the target URL               |
| TIMEOUT      | The request to the target timed out          |
| NOT_FOUND    | The target URL was not found                 |
| INTERNAL_ERROR| Other internal server error                 |

---

## 🔒 Security Features
- **Input validation:** Only allows valid, public URLs.
- **SSRF protection:** Blocks requests to private, loopback, and link-local IPs (via DNS lookup).
- **Rate limiting:** 60 requests per minute per IP.
- **CORS:** Enabled for all origins.
- **Error handling:** Consistent, clear error messages and codes.

---

## 📈 Usage Limits
- **60 requests per minute per IP** (returns `RATE_LIMITED` error if exceeded)

---

## 📝 RapidAPI Summary (for portal)
> **Favicon Fetcher API**: Instantly retrieve the favicon URL for any public website. Secure, fast, and easy to integrate. Features input validation, SSRF protection, rate limiting, and CORS. Perfect for web apps, automation, and data enrichment.

---

## 🛠️ Deployment
- Ready for deployment on any Node.js-compatible cloud platform (Render, Railway, Vercel, etc.)
- Uses `PORT` environment variable if set

---

## 🩺 Health Check Endpoint

- **GET /health**
- Returns: `{ "status": "ok" }`
- Useful for deployment platforms and uptime monitoring.

---

## 📬 Contact
- **Company:** SoanAI
- **Email:** ahmedabdulmoid49@gmail.com

---

## 🏢 About SoanAI
SoanAI builds production-ready APIs and automation tools for modern web businesses.

---

## 🤝 License & Terms
- You are responsible for legal compliance and fair use when fetching third-party favicons. 

--- 