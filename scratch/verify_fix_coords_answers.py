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
    server = socketserver.TCPServer(("127.0.0.1", 9208), SimpleHTTPRequestHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()

    page.goto("http://127.0.0.1:9208/teacher/index.html")
    page.fill("#pinInput", "5840")
    page.click("#btnPinSubmit")
    time.sleep(1)

    # 1. Check default coordinates (우측 세로 숫자 + 하단 가로 알파벳)
    out_default_coords = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_coords_right_bottom.png"
    page.screenshot(path=out_default_coords)
    print("Screenshot 1 (right-bottom coordinates) saved!")

    # 2. Cycle coordinates: right-bottom -> left-top -> all-four
    btn_coords = page.query_selector("#btnToggleCoords")
    # cycle coordinates: right-bottom -> left-top -> all-four
    btn_coords.click()
    time.sleep(0.3)
    btn_coords.click()
    time.sleep(0.3)
    out_all_four = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_coords_all_four.png"
    page.screenshot(path=out_all_four)
    print("Screenshot 2 (all-four coordinates) saved!")

    # Cycle back to right-bottom: all-four -> none -> right-bottom
    btn_coords.click() # none
    time.sleep(0.2)
    btn_coords.click() # right-bottom
    time.sleep(0.2)

    # 3. Test Problem 1 answering:
    # Corner white stone at (K, 1) = (col 9, row 8)
    # Liberty 1: Top (K, 2) = (col 9, row 7)
    # Liberty 2: Left (J, 1) = (col 8, row 8)
    canvas = page.query_selector("#teachingBoard")
    box = canvas.bounding_box()

    # Calculate grid intersection positions on canvas:
    # We know startX is 0.80*cell, cols=10, rows=9
    # Cell size is approximately: (box['width'] - 12) / 10.85
    # Let's verify by clicking on Top Liberty (K, 2)
    # Click at x: 0.92, y: 0.82
    print("Clicking first liberty (top: K, 2)...")
    page.mouse.click(box["x"] + box["width"] * 0.92, box["y"] + box["height"] * 0.82)
    time.sleep(0.6)

    # Toast should say: "좋아요! 👏 남은 활로도 마저 막아보세요! (1개 남음)"
    toast_el = page.query_selector("#teacherToast")
    toast_text = toast_el.text_content() if toast_el else ""
    assert "오답" not in toast_text, "Got wrong toast"
    assert "좋아요" in toast_text, "Expected success toast"

    out_step1 = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_p1_step1_correct.png"
    page.screenshot(path=out_step1)
    print("Screenshot 3 (Problem 1 Step 1 correct & Atari sweat drop) saved!")

    # Click second liberty (left: J, 1)
    # Col index 8, row index 8:
    print("Clicking second liberty (left: J, 1)...")
    page.mouse.click(box["x"] + box["width"] * 0.83, box["y"] + box["height"] * 0.92)
    time.sleep(0.6)

    toast_text2 = toast_el.text_content() if toast_el else ""
    assert "정답입니다" in toast_text2, "Expected solved toast"

    out_solved = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_p1_both_solved.png"
    page.screenshot(path=out_solved)
    print("Screenshot 4 (Problem 1 fully solved & auto-advancing) saved!")

    browser.close()
    server.shutdown()
    print("All tests PASSED flawlessly!")
