# -*- coding: utf-8 -*-
import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8124
Handler = http.server.SimpleHTTPRequestHandler

os.chdir(r"C:\Users\sinsu\dev\baduk-site")

class QuietServer(socketserver.TCPServer):
    allow_reuse_address = True

httpd = QuietServer(("", PORT), Handler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()
print("Local server running on port", PORT)

artifact_dir = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 768})

    # 1. Access teacher/index.html
    page.goto(f"http://localhost:{PORT}/teacher/index.html")
    page.wait_for_selector("#pinInput")
    page.fill("#pinInput", "5840")
    page.click("#btnPinSubmit")
    page.wait_for_selector("#teachingBoard", state="visible")
    time.sleep(1)

    # 2. Open Settings Modal
    page.click("#btnOpenSettings")
    page.wait_for_selector("#settingsModal:not([hidden])")
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/teacher_settings_modal_open.png")
    print("Screenshot taken: teacher_settings_modal_open.png")

    # 3. Change theme to 'theme-forest' (깊은 대국실 딥그린) & stones to 'gem' (보석돌)
    page.click('[data-setting="theme"] [data-val="theme-forest"]')
    page.click('[data-setting="stoneStyle"] [data-val="gem"]')
    time.sleep(0.3)

    # Close modal
    page.click("#btnCloseSettings")
    time.sleep(0.5)

    # Take screenshot of deep forest theme + gem stones
    page.screenshot(path=f"{artifact_dir}/teacher_theme_forest_gem.png")
    print("Screenshot taken: teacher_theme_forest_gem.png")

    # 4. Open Settings again, switch to 'cute' stone style, and 'theme-cream'
    page.click("#btnOpenSettings")
    time.sleep(0.3)
    page.click('[data-setting="stoneStyle"] [data-val="cute"]')
    page.click('[data-setting="theme"] [data-val="theme-cream"]')
    page.click("#btnCloseSettings")
    time.sleep(0.5)

    page.screenshot(path=f"{artifact_dir}/teacher_theme_cream_cute.png")
    print("Screenshot taken: teacher_theme_cream_cute.png")

    # 5. Open Settings again, switch back to 'theme-green' with classic stones, save
    page.click("#btnOpenSettings")
    time.sleep(0.3)
    page.click('[data-setting="theme"] [data-val="theme-green"]')
    page.click('[data-setting="stoneStyle"] [data-val="classic"]')
    page.click("#btnSaveSettings")
    time.sleep(0.5)

    page.screenshot(path=f"{artifact_dir}/teacher_theme_green_classic_woodframe.png")
    print("Screenshot taken: teacher_theme_green_classic_woodframe.png")

    browser.close()

httpd.shutdown()
print("Verification complete!")
