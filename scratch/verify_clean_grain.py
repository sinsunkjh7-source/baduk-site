# -*- coding: utf-8 -*-
import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8127
Handler = http.server.SimpleHTTPRequestHandler
os.chdir(r"C:\Users\sinsu\dev\baduk-site")

class QuietServer(socketserver.TCPServer):
    allow_reuse_address = True

httpd = QuietServer(("", PORT), Handler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()

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

    # Open settings and choose darkwood
    page.click("#btnOpenSettings")
    page.wait_for_selector("#settingsModal:not([hidden])")
    page.click('[data-setting="boardSkin"] [data-val="darkwood"]')
    time.sleep(0.5)

    # Close settings
    page.click("#btnCloseSettings")
    time.sleep(0.5)

    # Capture the cleaned-up natural grain board
    page.screenshot(path=f"{artifact_dir}/darkwood_clean_natural_grain.png")
    print("Screenshot taken: darkwood_clean_natural_grain.png")

    # Also capture close-up of board area
    board_elem = page.locator("#teachingBoard")
    board_elem.screenshot(path=f"{artifact_dir}/darkwood_board_only_clean.png")
    print("Screenshot taken: darkwood_board_only_clean.png")

    browser.close()

httpd.shutdown()
print("Verification done!")
