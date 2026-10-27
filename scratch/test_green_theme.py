# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1366, "height": 768})

    from http.server import SimpleHTTPRequestHandler
    import socketserver
    import threading
    import os

    os.chdir(r"C:\Users\sinsu\dev\baduk-site")
    server = socketserver.TCPServer(("127.0.0.1", 9209), SimpleHTTPRequestHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()

    page.goto("http://127.0.0.1:9209/teacher/index.html")
    page.fill("#pinInput", "5840")
    page.click("#btnPinSubmit")
    time.sleep(1)

    out_path = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_green_theme_verified.png"
    page.screenshot(path=out_path)
    print("Screenshot saved to", out_path)

    browser.close()
    server.shutdown()
