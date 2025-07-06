const express = require('express');
const cheerio = require('cheerio');
const urlModule = require('url');
const net = require('net');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const dns = require('dns').promises;

function isValidUrl(userUrl) {
  try {
    const parsed = new URL(userUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Block localhost and loopback
    if ([
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1'
    ].includes(parsed.hostname)) return false;
    // Block private IPs
    const parts = parsed.hostname.split('.').map(Number);
    if (
      (parts[0] === 10) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    ) return false;
    // Block IPv6 private addresses
    if (net.isIP(parsed.hostname) === 6 && parsed.hostname.startsWith('fd')) return false;
    return true;
  } catch {
    return false;
  }
}

function isPrivateIp(ip) {
  const parts = ip.split('.').map(Number);
  return (
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip === '::1' ||
    (parts[0] === 10) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 169 && parts[1] === 254) // link-local
  );
}

// Standard error response helper
function sendError(res, status, message, code) {
  return res.status(status).json({ error: message, code });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting: 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMITED' }
});

app.use(cors());
app.use(limiter);
app.use(morgan('combined'));

app.get('/favicon', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return sendError(res, 400, 'Missing url query parameter', 'MISSING_URL');
  }
  if (!isValidUrl(url)) {
    return sendError(res, 400, 'Invalid or disallowed URL', 'INVALID_URL');
  }

  // Enhanced SSRF protection: DNS lookup
  try {
    const parsed = new URL(url);
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    if (addresses.some(addr => isPrivateIp(addr.address))) {
      return sendError(res, 400, 'Target resolves to a private or disallowed IP', 'PRIVATE_IP');
    }
  } catch (err) {
    return sendError(res, 400, 'Failed to resolve target hostname', 'DNS_ERROR');
  }

  try {
    // Fetch the HTML of the page
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FaviconFetcher/1.0)' }
    });
    const html = response.data;
    const $ = cheerio.load(html);

    // Try to find favicon link tags
    let favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href') ||
      '/favicon.ico';

    // If the favicon is a relative URL, resolve it to absolute
    if (!/^https?:\/\//i.test(favicon)) {
      const baseUrl = urlModule.parse(url);
      const origin = `${baseUrl.protocol}//${baseUrl.host}`;
      if (favicon.startsWith('/')) {
        favicon = origin + favicon;
      } else {
        favicon = origin + '/' + favicon;
      }
    }

    return res.json({ favicon });
  } catch (error) {
    // Improved error logging
    console.error('Error fetching/parsing URL:', error);
    // Handle axios errors
    if (error.response) {
      return sendError(res, 502, 'Failed to fetch the target URL', 'FETCH_FAILED');
    } else if (error.code === 'ECONNABORTED') {
      return sendError(res, 504, 'Request to target URL timed out', 'TIMEOUT');
    } else if (error.code === 'ENOTFOUND') {
      return sendError(res, 404, 'Target URL not found', 'NOT_FOUND');
    }
    return sendError(res, 500, 'Failed to fetch or parse the URL', 'INTERNAL_ERROR');
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler (for unexpected errors)
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 