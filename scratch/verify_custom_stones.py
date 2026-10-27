# -*- coding: utf-8 -*-
import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8128
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

    # 1. Verify 자유시연모드 is NOT in header
    btn_free = page.query_selector("#btnToggleFree")
    print("btnToggleFree in header:", btn_free is not None)
    assert btn_free is None, "btnToggleFree should be removed"

    # 2. Open Settings panel
    page.click("#btnOpenSettings")
    page.wait_for_selector("#settingsModal:not([hidden])")
    time.sleep(0.3)

    # 3. Test Cat stone (고양이)
    page.click('[data-setting="stoneStyle"] [data-val="cat"]')
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/stone_cat_preview.png")
    print("Captured stone_cat_preview.png")

    # 4. Test Cosmos / Galaxy stone (우주)
    page.click('[data-setting="stoneStyle"] [data-val="galaxy"]')
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/stone_galaxy_preview.png")
    print("Captured stone_galaxy_preview.png")

    # 5. Test Black & White Diamond stone (흑백 다이아몬드)
    page.click('[data-setting="stoneStyle"] [data-val="crystal"]')
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/stone_crystal_preview.png")
    print("Captured stone_crystal_preview.png")

    # 6. Close panel to show full board with diamond stones
    page.click("#btnCloseSettings")
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/stone_crystal_full_board.png")
    print("Captured stone_crystal_full_board.png")

    browser.close()

httpd.shutdown()
print("All verifications passed!")
