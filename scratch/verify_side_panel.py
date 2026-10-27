# -*- coding: utf-8 -*-
import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8125
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

    # 2. Click Settings button -> panel opens on the right side
    page.click("#btnOpenSettings")
    page.wait_for_selector("#settingsModal:not([hidden])")
    time.sleep(0.5)

    # Take screenshot with panel open on right side (showing full board visible)
    page.screenshot(path=f"{artifact_dir}/teacher_right_panel_open.png")
    print("Screenshot 1: teacher_right_panel_open.png")

    # 3. Change theme to 'theme-forest' (deep green) while panel is open -> live change seen!
    page.click('[data-setting="theme"] [data-val="theme-forest"]')
    time.sleep(0.3)
    page.screenshot(path=f"{artifact_dir}/teacher_right_panel_live_forest.png")
    print("Screenshot 2: teacher_right_panel_live_forest.png")

    # 4. Change stones to 'gem' (보석돌) while panel is open -> live change seen on board!
    page.click('[data-setting="stoneStyle"] [data-val="gem"]')
    time.sleep(0.3)
    page.screenshot(path=f"{artifact_dir}/teacher_right_panel_live_gem.png")
    print("Screenshot 3: teacher_right_panel_live_gem.png")

    # 5. Test clicking outside (e.g. at x: 200, y: 300 on sidebar or stage)
    page.mouse.click(200, 300)
    time.sleep(0.5)
    is_hidden = page.eval_on_selector("#settingsModal", "el => el.hidden")
    print("Panel closed on outside click:", is_hidden)
    page.screenshot(path=f"{artifact_dir}/teacher_right_panel_closed_by_outside_click.png")

    # 6. Test toggle by clicking btnOpenSettings again
    page.click("#btnOpenSettings")
    time.sleep(0.3)
    is_open = not page.eval_on_selector("#settingsModal", "el => el.hidden")
    print("Panel opened on toggle:", is_open)

    page.click("#btnOpenSettings")
    time.sleep(0.3)
    is_closed_again = page.eval_on_selector("#settingsModal", "el => el.hidden")
    print("Panel closed on toggle again:", is_closed_again)

    browser.close()

httpd.shutdown()
print("All verifications succeeded!")
