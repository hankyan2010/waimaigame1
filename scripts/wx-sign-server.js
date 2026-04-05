const http = require('http');
const https = require('https');
const crypto = require('crypto');
const url = require('url');

const APP_ID = 'wx5fa3f116c72fccb0';
const APP_SECRET = '4bddaaf41ad20e0583ac17966cfeaa10';
const PORT = 18901;

let tokenCache = { token: '', expires: 0 };
let ticketCache = { ticket: '', expires: 0 };

function fetch(reqUrl) {
  return new Promise((resolve, reject) => {
    https.get(reqUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }
  const data = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`
  );
  if (data.access_token) {
    tokenCache = { token: data.access_token, expires: Date.now() + (data.expires_in - 300) * 1000 };
    return data.access_token;
  }
  throw new Error('Failed to get access_token: ' + JSON.stringify(data));
}

async function getJsapiTicket() {
  if (ticketCache.ticket && Date.now() < ticketCache.expires) {
    return ticketCache.ticket;
  }
  const token = await getAccessToken();
  const data = await fetch(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`
  );
  if (data.ticket) {
    ticketCache = { ticket: data.ticket, expires: Date.now() + (data.expires_in - 300) * 1000 };
    return data.ticket;
  }
  throw new Error('Failed to get jsapi_ticket: ' + JSON.stringify(data));
}

function makeSignature(ticket, noncestr, timestamp, pageUrl) {
  const str = `jsapi_ticket=${ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${pageUrl}`;
  return crypto.createHash('sha1').update(str).digest('hex');
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/wx-config') {
    const pageUrl = parsed.query.url;
    if (!pageUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'url parameter required' }));
      return;
    }

    try {
      const ticket = await getJsapiTicket();
      const noncestr = crypto.randomBytes(8).toString('hex');
      const timestamp = Math.floor(Date.now() / 1000);
      // Remove hash from URL for signature
      const cleanUrl = pageUrl.split('#')[0];
      const signature = makeSignature(ticket, noncestr, timestamp, cleanUrl);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        appId: APP_ID,
        timestamp,
        nonceStr: noncestr,
        signature,
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`WeChat JS-SDK sign server running on port ${PORT}`);
});
