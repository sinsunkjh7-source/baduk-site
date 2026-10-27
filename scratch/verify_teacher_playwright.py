# -*- coding: utf-8 -*-
import os, time, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

PORT = 9199
TEACHER_DIR = r'C:\Users\sinsu\dev\baduk-site'

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=TEACHER_DIR, **kwargs)
    def log_message(self, *args):
        pass

def test_teacher():
    server = socketserver.TCPServer(('127.0.0.1', PORT), H)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})

        errors = []
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)

        url = f'http://127.0.0.1:{PORT}/teacher/index.html'
        print('Opening', url)
        page.goto(url)
        page.wait_for_timeout(1000)

        # Unlock PIN
        page.fill('#pinInput', '5840')
        page.click('#btnPinSubmit')
        page.wait_for_timeout(1500)

        # Wait for catalog and series to load (씽크탱크 1 should be selected or select it)
        page.select_option('#seriesSelect', '2') # 씽크탱크시리즈 (0: 10단계, 1: 15대, 2: 씽크탱크)
        page.wait_for_timeout(1500)

        # Select book 116 (씽크탱크 1)
        page.select_option('#bookSelect', '116')
        page.wait_for_timeout(1500)

        # Take screenshot of Problem 1 (씽크탱크 1, 1번 문제)
        shot1 = r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_9x10_open_lines_p1.png'
        page.screenshot(path=shot1)
        print('Saved shot 1:', shot1)

        # Click Problem 7
        page.click('button.prob-btn:has-text("7번")')
        page.wait_for_timeout(1000)
        shot7 = r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_9x10_open_lines_p7.png'
        page.screenshot(path=shot7)
        print('Saved shot 7:', shot7)

        # Click Problem 10
        page.click('button.prob-btn:has-text("10번")')
        page.wait_for_timeout(1000)
        shot10 = r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_9x10_open_lines_p10.png'
        page.screenshot(path=shot10)
        print('Saved shot 10:', shot10)

        # Click Answer button
        page.click('#btnAnswer')
        page.wait_for_timeout(800)
        shot_ans = r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_9x10_answer.png'
        page.screenshot(path=shot_ans)
        print('Saved shot answer:', shot_ans)

        print('Errors:', errors)
        browser.close()
        server.shutdown()

if __name__ == '__main__':
    test_teacher()
