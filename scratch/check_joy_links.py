import sys, ssl, urllib.request, re
sys.stdout.reconfigure(encoding='utf-8')

ajax_url = 'https://www.joyschooledu.com/theme/default/_subpage/education/sample/list.lecture.ajax.php?ca_id=501010'
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(ajax_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

print("HTML length:", len(html))
links = re.findall(r'(?:href|onclick)=["\']([^"\']*)["\']', html)
for l in links:
    if any(k in l for k in ['php', 'html', 'view', 'pop', 'exam', 'quiz', 'prob']):
        print("Link:", l)
