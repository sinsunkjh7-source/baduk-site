# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 960})
        page = context.new_page()

        page.goto("http://127.0.0.1:9205/teacher/index.html")
        page.wait_for_selector("#pinGate", timeout=5000)
        page.fill("#pinInput", "5840")
        page.click("#btnPinSubmit")
        page.wait_for_selector("#teacherApp", timeout=5000)
        time.sleep(0.8)

        # Go to 씽크탱크 1, Problem 1 (or default problem)
        # Click 놓아보기
        page.click("#btnToggleTrial")
        time.sleep(0.2)

        # Click 백만 to place 1 single white stone in center
        page.click("button[data-place-mode='whiteOnly']")
        time.sleep(0.2)

        # Canvas box
        canvas = page.query_selector("#teachingBoard")
        box = canvas.bounding_box()

        # Let's place a white stone at roughly col 4 (E), row 3 (6)
        # Note: canvas width ~748, height ~678.
        # Let's click at x: 0.45, y: 0.45
        page.mouse.click(box["x"] + box["width"] * 0.45, box["y"] + box["height"] * 0.45)
        time.sleep(0.3)

        # Switch to 흑만 to surround it on 3 sides to create Atari!
        page.click("button[data-place-mode='blackOnly']")
        time.sleep(0.2)

        # Top of white stone
        page.mouse.click(box["x"] + box["width"] * 0.45, box["y"] + box["height"] * 0.35)
        time.sleep(0.3)
        # Left of white stone
        page.mouse.click(box["x"] + box["width"] * 0.35, box["y"] + box["height"] * 0.45)
        time.sleep(0.3)
        # Right of white stone
        page.mouse.click(box["x"] + box["width"] * 0.55, box["y"] + box["height"] * 0.45)
        time.sleep(0.5)

        out_path = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_atari_sweat_verified.png"
        page.screenshot(path=out_path)
        print(f"Atari sweat screenshot saved to {out_path}")

        browser.close()

if __name__ == '__main__':
    run()
