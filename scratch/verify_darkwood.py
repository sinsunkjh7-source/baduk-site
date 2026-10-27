# -*- coding: utf-8 -*-
import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8126
Handler = http.server.SimpleHTTPRequestHandler
os.chdir(r"C:\Users\sinsu\dev\baduk-site")

class QuietServer(socketserver.TCPServer):
    allow_reuse_address = True

httpd = QuietServer(("", PORT), Handler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()
print("Local server on port", PORT)

artifact_dir = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 768})

    page.goto(f"http://localhost:{PORT}/teacher/index.html")
    page.wait_for_selector("#pinInput")
    page.fill("#pinInput", "5840")
    page.click("#btnPinSubmit")
    page.wait_for_selector("#teachingBoard", state="visible")
    time.sleep(1)

    # 1. Take screenshot of 1번 밝은 비자목
    page.screenshot(path=f"{artifact_dir}/board_skin_1_light_wood.png")
    print("Screenshot 1: board_skin_1_light_wood.png")

    # 2. Open Settings panel
    page.click("#btnOpenSettings")
    page.wait_for_selector("#settingsModal:not([hidden])")
    time.sleep(0.3)

    # 3. Click 2번 [진한 원목] (darkwood)
    page.click('[data-setting="boardSkin"] [data-val="darkwood"]')
    time.sleep(0.5)

    # Take screenshot with panel open showing 진한 원목 with clear vertical wood grain
    page.screenshot(path=f"{artifact_dir}/board_skin_2_dark_wood_with_grain.png")
    print("Screenshot 2: board_skin_2_dark_wood_with_grain.png")

    # 4. Close panel to show full board view of 2번 진한 원목
    page.click("#btnCloseSettings")
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/board_skin_2_dark_wood_full_view.png")
    print("Screenshot 3: board_skin_2_dark_wood_full_view.png")

    browser.close()

httpd.shutdown()
print("Verification complete!")
