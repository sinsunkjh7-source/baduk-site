# -*- coding: utf-8 -*-
import os, time, threading, http.server, socketserver
from playwright.sync_api import sync_playwright

PORT = 9205
TEACHER_DIR = r'C:\Users\sinsu\dev\baduk-site'

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=TEACHER_DIR, **kwargs)
    def log_message(self, *args):
        pass

def test_6_points():
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

        # Select 씽크탱크 1 (Series 2, Book 116)
        page.select_option('#seriesSelect', '2')
        page.wait_for_timeout(1000)
        page.select_option('#bookSelect', '116')
        page.wait_for_timeout(1200)

        # Capture Problem 1 before solving (Enlarged board, natural grain, 2 star points, thin lines)
        shot1 = r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_upgraded_p1.png'
        page.screenshot(path=shot1)
        print('Saved shot 1:', shot1)

        # Get board metrics and coordinates for correct click on Problem 1
        # In Problem 1 (code 714): W at (6, 5), answer is B at (6, 4) [po]
        # Let's get startX, startY, cell from JS
        canvas_info = page.evaluate("""() => {
            const c = document.getElementById('teachingBoard');
            const rect = c.getBoundingClientRect();
            return {
                width: c.width,
                height: c.height,
                styleW: c.style.width,
                styleH: c.style.height,
                rectLeft: rect.left,
                rectTop: rect.top,
                rectWidth: rect.width,
                rectHeight: rect.height
            };
        }""")
        print("Canvas info:", canvas_info)

        # Click the answer: in Problem 1, answer is B[po] which is (gx=6, gy=4)
        # In canvas coordinates: px = metrics.startX + 6 * cell, py = metrics.startY + 4 * cell
        page.evaluate("""() => {
            // Trigger answer placement via canvas click
            const c = document.getElementById('teachingBoard');
            const rect = c.getBoundingClientRect();
            // Call simulated click or click canvas at gx=6, gy=4
            // metrics.startX is cell * 0.75
            // Let's find gx=6, gy=4 coordinate
            const cell = parseFloat(c.style.width) / (10 + 0.7);
            const startX = cell * 0.75;
            const startY = cell * 0.75;
            const targetX = rect.left + startX + 6 * cell;
            const targetY = rect.top + startY + 4 * cell;
            const evt = new MouseEvent('click', {
                clientX: targetX,
                clientY: targetY,
                bubbles: true
            });
            c.dispatchEvent(evt);
        }""")
        page.wait_for_timeout(500)

        # Take screenshot right after correct move (Problem 1 solved!)
        shot_solved = r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_p1_solved_toast.png'
        page.screenshot(path=shot_solved)
        print('Saved shot solved:', shot_solved)

        # Wait for auto-advance (1.1s + buffer)
        page.wait_for_timeout(1500)

        # Check if auto-advanced to Problem 2!
        q_badge = page.text_content('#qNumBadge')
        print("Badge after 1.5s:", q_badge)

        # Take screenshot of Problem 2 (showing 1번 is green ✓ solved, 2번 is gold active!)
        shot_auto_p2 = r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_p2_auto_advanced.png'
        page.screenshot(path=shot_auto_p2)
        print('Saved shot auto p2:', shot_auto_p2)

        print('Errors:', errors)
        browser.close()
        server.shutdown()

if __name__ == '__main__':
    test_6_points()
