# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

def test_styles():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1366, "height": 768})

        from http.server import SimpleHTTPRequestHandler
        import socketserver
        import threading
        import os

        os.chdir(r"C:\Users\sinsu\dev\baduk-site")
        server = socketserver.TCPServer(("127.0.0.1", 9210), SimpleHTTPRequestHandler)
        t = threading.Thread(target=server.serve_forever, daemon=True)
        t.start()

        page.goto("http://127.0.0.1:9210/teacher/index.html")
        page.fill("#pinInput", "5840")
        page.click("#btnPinSubmit")
        time.sleep(1)

        # Style 1: Wood Border + Double Shadow (원목 테두리 액자형)
        page.eval_on_selector("#teachingBoard", """
            el => {
                el.style.border = '4px solid #7c481e';
                el.style.borderRadius = '8px';
                el.style.boxShadow = '0 12px 28px rgba(35, 55, 25, 0.35), 0 3px 8px rgba(0, 0, 0, 0.2)';
            }
        """)
        time.sleep(0.3)
        page.screenshot(path=r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\contrast_option_1_wood_frame.png")

        # Style 2: Classic Tournament Felt Mat (대국용 딥그린 펠트 매트 받침)
        page.eval_on_selector("#teachingBoard", """
            el => {
                el.style.border = '2px solid #a1622b';
                el.style.borderRadius = '6px';
                el.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
            }
        """)
        page.eval_on_selector(".board-container", """
            el => {
                el.style.background = '#274720';
                el.style.borderRadius = '16px';
                el.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.35), 0 6px 18px rgba(47, 74, 36, 0.15)';
                el.style.margin = '4px 0';
            }
        """)
        time.sleep(0.3)
        page.screenshot(path=r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\contrast_option_2_dark_felt_mat.png")

        # Style 3: Clean Charcoal Mat (정갈한 다크 슬레이트 린넨 매트)
        page.eval_on_selector(".board-container", """
            el => {
                el.style.background = '#1e2d24';
                el.style.borderRadius = '16px';
                el.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.4)';
            }
        """)
        time.sleep(0.3)
        page.screenshot(path=r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\contrast_option_3_charcoal_mat.png")

        browser.close()
        server.shutdown()
        print("Comparison screenshots generated!")

if __name__ == '__main__':
    test_styles()
