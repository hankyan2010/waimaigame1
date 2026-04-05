#!/usr/bin/env python3
"""WeChat JS-SDK signature server"""
import json, hashlib, time, os, sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from urllib.request import urlopen

APP_ID = 'wx5fa3f116c72fccb0'
APP_SECRET = '4bddaaf41ad20e0583ac17966cfeaa10'
PORT = 18901

token_cache = {'token': '', 'expires': 0}
ticket_cache = {'ticket': '', 'expires': 0}

def get_access_token():
    now = time.time()
    if token_cache['token'] and now < token_cache['expires']:
        return token_cache['token']
    url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={}&secret={}'.format(APP_ID, APP_SECRET)
    data = json.loads(urlopen(url, timeout=10).read())
    if 'access_token' in data:
        token_cache['token'] = data['access_token']
        token_cache['expires'] = now + data['expires_in'] - 300
        return data['access_token']
    raise Exception('token error: ' + json.dumps(data))

def get_jsapi_ticket():
    now = time.time()
    if ticket_cache['ticket'] and now < ticket_cache['expires']:
        return ticket_cache['ticket']
    token = get_access_token()
    url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token={}&type=jsapi'.format(token)
    data = json.loads(urlopen(url, timeout=10).read())
    if 'ticket' in data and data['ticket']:
        ticket_cache['ticket'] = data['ticket']
        ticket_cache['expires'] = now + data['expires_in'] - 300
        return data['ticket']
    raise Exception('ticket error: ' + json.dumps(data))

def make_signature(ticket, noncestr, timestamp, page_url):
    s = 'jsapi_ticket={}&noncestr={}&timestamp={}&url={}'.format(ticket, noncestr, timestamp, page_url)
    return hashlib.sha1(s.encode()).hexdigest()

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != '/wx-config':
            self.send_response(404)
            self.end_headers()
            return

        params = parse_qs(parsed.query)
        page_url = params.get('url', [None])[0]
        if not page_url:
            self.respond(400, {'error': 'url parameter required'})
            return

        try:
            ticket = get_jsapi_ticket()
            noncestr = hashlib.md5(os.urandom(16)).hexdigest()[:16]
            timestamp = int(time.time())
            clean_url = page_url.split('#')[0]
            signature = make_signature(ticket, noncestr, timestamp, clean_url)
            self.respond(200, {
                'appId': APP_ID,
                'timestamp': timestamp,
                'nonceStr': noncestr,
                'signature': signature,
            })
        except Exception as e:
            self.respond(500, {'error': str(e)})

    def respond(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, fmt, *args):
        pass  # suppress logs

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print('WeChat JS-SDK sign server on port {}'.format(PORT))
    sys.stdout.flush()
    server.serve_forever()
