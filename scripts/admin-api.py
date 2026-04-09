#!/usr/bin/env python3
"""Admin API for waimai quiz game - questions CRUD + analytics tracking + leaderboard"""
import json, hashlib, time, os, sys, re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta

PORT = 18903
ADMIN_PASSWORD = 'HankyAdmin2024'
DATA_DIR = '/opt/waimai-data'
QUESTIONS_FILE = os.path.join(DATA_DIR, 'questions.json')
STATS_FILE = os.path.join(DATA_DIR, 'stats.json')
LEADERBOARD_FILE = os.path.join(DATA_DIR, 'leaderboard.json')
INVITES_FILE = os.path.join(DATA_DIR, 'invites.json')
INVITE_CREDIT_CAP = 5  # 单个玩家最多通过邀请扫码获得多少次额外挑战
TOKEN_SECRET = 'waimai-quiz-token-2024'

# Ensure data dir exists
os.makedirs(DATA_DIR, exist_ok=True)

# --- Token management ---
active_tokens = {}  # token -> expires_timestamp

def make_token():
    raw = '{}{}{}'.format(TOKEN_SECRET, time.time(), os.urandom(8).hex())
    token = hashlib.sha256(raw.encode()).hexdigest()[:32]
    active_tokens[token] = time.time() + 86400  # 24h
    return token

def verify_token(token):
    if not token:
        return False
    exp = active_tokens.get(token, 0)
    if time.time() > exp:
        active_tokens.pop(token, None)
        return False
    return True

# --- Data helpers ---
def load_questions():
    if os.path.exists(QUESTIONS_FILE):
        with open(QUESTIONS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_questions(questions):
    with open(QUESTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

def load_stats():
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_stats(stats):
    with open(STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False)

def load_leaderboard():
    if os.path.exists(LEADERBOARD_FILE):
        with open(LEADERBOARD_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_leaderboard(entries):
    with open(LEADERBOARD_FILE, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

def load_invites():
    if os.path.exists(INVITES_FILE):
        with open(INVITES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_invites(data):
    with open(INVITES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# --- HTTP Handler ---
class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_cors(204)
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        query = parse_qs(urlparse(self.path).query)

        if path == '/api/questions':
            token = self.get_token()
            if not verify_token(token):
                return self.respond(401, {'error': 'unauthorized'})
            questions = load_questions()
            return self.respond(200, {'questions': questions, 'total': len(questions)})

        elif path == '/api/stats':
            token = self.get_token()
            if not verify_token(token):
                return self.respond(401, {'error': 'unauthorized'})
            stats = load_stats()
            days = int(query.get('days', ['30'])[0])
            result = self.aggregate_stats(stats, days)
            return self.respond(200, result)

        elif path == '/api/leaderboard':
            return self.handle_get_leaderboard(query)

        elif path == '/api/invite/credits':
            return self.handle_get_invite_credits(query)

        self.respond(404, {'error': 'not found'})

    def do_POST(self):
        path = urlparse(self.path).path
        body = self.read_body()

        if path == '/api/auth':
            pwd = body.get('password', '')
            if pwd == ADMIN_PASSWORD:
                token = make_token()
                return self.respond(200, {'token': token})
            return self.respond(403, {'error': 'wrong password'})

        elif path == '/api/questions':
            token = self.get_token()
            if not verify_token(token):
                return self.respond(401, {'error': 'unauthorized'})
            questions = load_questions()
            new_q = body
            new_q['id'] = max((q['id'] for q in questions), default=0) + 1
            questions.append(new_q)
            save_questions(questions)
            return self.respond(200, {'id': new_q['id'], 'total': len(questions)})

        elif path == '/api/track':
            event = body.get('event', '')
            if not event:
                return self.respond(400, {'error': 'event required'})
            today = datetime.now().strftime('%Y-%m-%d')
            stats = load_stats()
            if today not in stats:
                stats[today] = {}
            day = stats[today]
            day[event] = day.get(event, 0) + 1
            # Store extra data
            if body.get('score') is not None and event == 'complete_game':
                scores = day.get('scores', [])
                scores.append(body['score'])
                day['scores'] = scores
            save_stats(stats)
            return self.respond(200, {'ok': True})

        elif path == '/api/leaderboard':
            return self.handle_post_leaderboard(body)

        elif path == '/api/invite/scan':
            return self.handle_post_invite_scan(body)

        self.respond(404, {'error': 'not found'})

    def do_PUT(self):
        path = urlparse(self.path).path
        match = re.match(r'/api/questions/(\d+)', path)
        if match:
            token = self.get_token()
            if not verify_token(token):
                return self.respond(401, {'error': 'unauthorized'})
            qid = int(match.group(1))
            body = self.read_body()
            questions = load_questions()
            for i, q in enumerate(questions):
                if q['id'] == qid:
                    body['id'] = qid
                    questions[i] = body
                    save_questions(questions)
                    return self.respond(200, {'ok': True})
            return self.respond(404, {'error': 'question not found'})
        self.respond(404, {'error': 'not found'})

    def do_DELETE(self):
        path = urlparse(self.path).path
        match = re.match(r'/api/questions/(\d+)', path)
        if match:
            token = self.get_token()
            if not verify_token(token):
                return self.respond(401, {'error': 'unauthorized'})
            qid = int(match.group(1))
            questions = load_questions()
            questions = [q for q in questions if q['id'] != qid]
            save_questions(questions)
            return self.respond(200, {'ok': True, 'total': len(questions)})
        self.respond(404, {'error': 'not found'})

    # --- Leaderboard handlers ---

    def handle_get_leaderboard(self, query):
        """GET /api/leaderboard?userId=xxx - 返回前100名 + 当前用户排名"""
        entries = load_leaderboard()
        user_id = query.get('userId', [''])[0]

        # 排序：分数降序，同分按 updatedAt 升序（更早达成排前面）
        entries.sort(key=lambda e: (-e.get('bestScore', 0), e.get('updatedAt', 0)))

        top100 = entries[:100]

        my_rank = None
        my_entry = None
        for i, e in enumerate(entries):
            if e.get('userId') == user_id:
                my_rank = i + 1
                my_entry = e
                break

        return self.respond(200, {
            'entries': top100,
            'myRank': my_rank,
            'myEntry': my_entry,
            'total': len(entries),
        })

    def handle_post_leaderboard(self, body):
        """POST /api/leaderboard - 提交/更新排行榜成绩"""
        user_id = body.get('userId', '')
        display_name = body.get('displayName', '').strip()[:20]
        best_score = body.get('bestScore', 0)
        best_correct = body.get('bestCorrectCount', 0)
        highest_tier = body.get('highestTier', 'bronze3')

        if not user_id or len(display_name) < 2:
            return self.respond(400, {'error': 'userId and displayName (2-20 chars) required'})

        entries = load_leaderboard()
        now = int(time.time() * 1000)

        # 查找已有记录
        found = False
        for e in entries:
            if e.get('userId') == user_id:
                # 更新：只在分数更高时更新分数/时间
                e['displayName'] = display_name
                e['highestTier'] = highest_tier
                if best_score > e.get('bestScore', 0):
                    e['bestScore'] = best_score
                    e['bestCorrectCount'] = best_correct
                    e['updatedAt'] = now
                found = True
                break

        if not found:
            entries.append({
                'id': 'lb_{}'.format(hashlib.md5(user_id.encode()).hexdigest()[:12]),
                'userId': user_id,
                'displayName': display_name,
                'bestScore': best_score,
                'bestCorrectCount': best_correct,
                'highestTier': highest_tier,
                'createdAt': now,
                'updatedAt': now,
            })

        save_leaderboard(entries)

        # 计算当前排名
        entries.sort(key=lambda e: (-e.get('bestScore', 0), e.get('updatedAt', 0)))
        rank = None
        for i, e in enumerate(entries):
            if e.get('userId') == user_id:
                rank = i + 1
                break

        return self.respond(200, {'ok': True, 'rank': rank})

    # --- Invite handlers ---

    def handle_get_invite_credits(self, query):
        """GET /api/invite/credits?player=ID - 查询某玩家通过被扫码累积的额外挑战次数"""
        player = query.get('player', [''])[0]
        if not player:
            return self.respond(400, {'error': 'player required'})
        invites = load_invites()
        record = invites.get(player, {})
        return self.respond(200, {
            'player': player,
            'credits': record.get('credits', 0),
            'scannerCount': len(record.get('scanners', [])),
            'cap': INVITE_CREDIT_CAP,
        })

    def handle_post_invite_scan(self, body):
        """POST /api/invite/scan body {inviter, scanner} - 记录扫码事件，给 inviter +1 次（去重 + 上限）"""
        inviter = (body.get('inviter') or '').strip()
        scanner = (body.get('scanner') or '').strip()
        if not inviter or not scanner:
            return self.respond(400, {'error': 'inviter and scanner required'})
        if inviter == scanner:
            # 防自刷
            return self.respond(200, {'credited': False, 'reason': 'self', 'credits': 0})

        invites = load_invites()
        record = invites.get(inviter)
        now = int(time.time() * 1000)
        if record is None:
            record = {'credits': 0, 'scanners': [], 'createdAt': now, 'updatedAt': now}
            invites[inviter] = record

        scanners = record.get('scanners', [])
        if scanner in scanners:
            return self.respond(200, {
                'credited': False,
                'reason': 'duplicate',
                'credits': record.get('credits', 0),
                'cap': INVITE_CREDIT_CAP,
            })

        # 新扫码人
        scanners.append(scanner)
        record['scanners'] = scanners
        record['updatedAt'] = now

        # 上限保护：scanners 可以无上限增长（用于统计），但 credits 卡上限
        current_credits = record.get('credits', 0)
        if current_credits < INVITE_CREDIT_CAP:
            record['credits'] = current_credits + 1
            credited = True
        else:
            credited = False  # 已达上限，扫码记录但不再 +1

        save_invites(invites)
        return self.respond(200, {
            'credited': credited,
            'reason': 'ok' if credited else 'cap_reached',
            'credits': record['credits'],
            'cap': INVITE_CREDIT_CAP,
            'scannerCount': len(scanners),
        })

    # --- Helpers ---
    def get_token(self):
        auth = self.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            return auth[7:]
        return ''

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except:
            return {}

    def respond(self, code, data):
        self.send_cors(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def send_cors(self, code):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def aggregate_stats(self, stats, days):
        today = datetime.now()
        daily = []
        totals = {}
        for i in range(days):
            d = (today - timedelta(days=i)).strftime('%Y-%m-%d')
            day_data = stats.get(d, {})
            entry = {'date': d}
            for k, v in day_data.items():
                if k == 'scores':
                    entry['avg_score'] = round(sum(v) / len(v), 1) if v else 0
                    entry['games'] = len(v)
                elif isinstance(v, int):
                    entry[k] = v
                    totals[k] = totals.get(k, 0) + v
            daily.append(entry)
        return {'daily': daily, 'totals': totals, 'days': days}

    def log_message(self, fmt, *args):
        pass

if __name__ == '__main__':
    # Initialize questions from static file if empty
    if not os.path.exists(QUESTIONS_FILE):
        print('Questions file not found, will be created on first add')
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print('Admin API on port {}'.format(PORT))
    sys.stdout.flush()
    server.serve_forever()
