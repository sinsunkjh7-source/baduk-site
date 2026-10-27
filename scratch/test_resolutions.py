# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

def test_screen(w, h):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": w, "height": h})
        page = context.new_page()

        page.goto("http://127.0.0.1:9205/teacher/index.html")
        page.fill("#pinInput", "5840")
        page.click("#btnPinSubmit")
        time.sleep(1)

        # Check visibility and bounding box of #teachingToolbar
        tb = page.query_selector("#teachingToolbar")
        ctrls = page.query_selector(".teaching-controls")
        tb_box = tb.bounding_box() if tb else None
        ctrls_box = ctrls.bounding_box() if ctrls else None
        
        print(f"Viewport {w}x{h}:")
        print(f"  teachingToolbar: {tb_box}")
        print(f"  teachingControls: {ctrls_box}")
        
        # Is toolbar inside viewport?
        if tb_box:
            is_visible = (tb_box['y'] + tb_box['height'] <= h) and (tb_box['y'] >= 0)
            print(f"  Toolbar fully in viewport? {is_visible}")
        if ctrls_box:
            ctrls_visible = (ctrls_box['y'] + ctrls_box['height'] <= h) and (ctrls_box['y'] >= 0)
            print(f"  Controls fully in viewport? {ctrls_visible}")

        out_path = f"C:\\Users\\sinsu\\.gemini\\antigravity\\brain\\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\\teacher_view_{w}x{h}.png"
        page.screenshot(path=out_path)
        browser.close()

if __name__ == '__main__':
    from http.server import SimpleHTTPRequestHandler
    import socketserver
    import threading
    
    server = socketserver.TCPServer(("127.0.0.1", 9206), SimpleHTTPRequestHandler)
    # serve dev directory
    import os
    os.chdir(r"C:\Users\sinsu\dev\baduk-site")
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    
    # We can use port 9206
    # Let's replace 9205 with 9206 in function
    def test_screen_9206(w, h):
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": w, "height": h})
            page = context.new_page()
            page.goto("http://127.0.0.1:9206/teacher/index.html")
            page.fill("#pinInput", "5840")
            page.click("#btnPinSubmit")
            time.sleep(1)
            tb = page.query_selector("#teachingToolbar")
            ctrls = page.query_selector(".teaching-controls")
            tb_box = tb.bounding_box() if tb else None
            ctrls_box = ctrls.bounding_box() if ctrls else None
            print(f"Viewport {w}x{h}:")
            print(f"  teachingToolbar: {tb_box}")
            print(f"  teachingControls: {ctrls_box}")
            out_path = f"C:\\Users\\sinsu\\.gemini\\antigravity\\brain\\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\\teacher_view_{w}x{h}.png"
            page.screenshot(path=out_path)
            browser.close()

    test_screen_9206(1920, 1080)
    test_screen_9206(1366, 768)
    test_screen_9206(1280, 800)
    server.shutdown()
