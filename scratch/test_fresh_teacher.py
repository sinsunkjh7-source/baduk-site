# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1366, "height": 768})

    # Serve locally
    from http.server import SimpleHTTPRequestHandler
    import socketserver
    import threading
    import os

    os.chdir(r"C:\Users\sinsu\dev\baduk-site")
    server = socketserver.TCPServer(("127.0.0.1", 9207), SimpleHTTPRequestHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()

    page.goto("http://127.0.0.1:9207/teacher/index.html")
    page.fill("#pinInput", "5840")
    page.click("#btnPinSubmit")
    time.sleep(1)

    out_path = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\fresh_teacher_coords_on.png"
    page.screenshot(path=out_path)
    print(f"Fresh screenshot saved to {out_path}")

    # Now let's place a stone to put white in Atari to show the red ring and sweat drop
    canvas = page.query_selector("#teachingBoard")
    box = canvas.bounding_box()

    # In Problem 1, White is in the bottom right corner at (K, 1).
    # (K, 1) has 2 liberties: (K, 2) directly above it, and (J, 1) to its left!
    # Let's click (K, 2) to block its top liberty!
    # Problem 1 is '돌의 활로' where user is Black!
    # So clicking (K, 2) places a black stone!
    # The canvas width is ~650px.
    # Col K is col index 9 (x=9). Row 1 is row index 8 (y=8, bottom).
    # So (K, 2) is at x=9, y=7 (one cell above the bottom corner stone)!
    # Let's click right above the bottom-right stone!
    page.mouse.click(box["x"] + box["width"] * 0.92, box["y"] + box["height"] * 0.82)
    time.sleep(0.5)

    out_path_atari = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\fresh_teacher_atari_sweat.png"
    page.screenshot(path=out_path_atari)
    print(f"Atari screenshot saved to {out_path_atari}")

    browser.close()
    server.shutdown()
