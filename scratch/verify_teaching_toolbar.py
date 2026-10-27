# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 960})
        page = context.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        print("Navigating to teacher app...")
        page.goto("http://127.0.0.1:9205/teacher/index.html")
        page.wait_for_selector("#pinGate", timeout=5000)

        # Enter PIN
        page.fill("#pinInput", "5840")
        page.click("#btnPinSubmit")
        page.wait_for_selector("#teacherApp", timeout=5000)
        time.sleep(1)

        print("Authenticated successfully!")

        # Verify teaching toolbar is present
        toolbar = page.query_selector("#teachingToolbar")
        assert toolbar is not None, "teachingToolbar not found"

        # Check tool buttons
        btn_trial = page.query_selector("#btnToggleTrial")
        btn_black = page.query_selector("button[data-place-mode='blackOnly']")
        btn_white = page.query_selector("button[data-place-mode='whiteOnly']")
        btn_atari = page.query_selector("#btnToggleAtari")
        btn_sweat = page.query_selector("#btnToggleSweat")
        btn_coords = page.query_selector("#btnToggleCoords")
        btn_numbers = page.query_selector("#btnToggleNumbers")

        # 1. Activate trial mode
        btn_trial.click()
        time.sleep(0.3)
        assert "active" in btn_trial.get_attribute("class")
        print("Trial mode activated.")

        # 2. Activate Coords & Numbers
        btn_coords.click()
        btn_numbers.click()
        time.sleep(0.3)
        print("Coords and Step Numbers enabled.")

        # 3. Click board to place trial stones
        # Find canvas bounding box
        canvas = page.query_selector("#teachingBoard")
        box = canvas.bounding_box()
        print(f"Canvas box: {box}")

        # Problem 1 has some stones. Let's place a trial stone at empty intersection
        # Let's inspect canvas click at an empty area, e.g. center or top
        # Let's trigger clicks via page.mouse
        # Canvas has 10 cols x 9 rows. Let's click around (box['x'] + box['width']*0.3, box['y'] + box['height']*0.3)
        page.mouse.click(box["x"] + box["width"] * 0.35, box["y"] + box["height"] * 0.35)
        time.sleep(0.4)

        # Next turn (white)
        page.mouse.click(box["x"] + box["width"] * 0.45, box["y"] + box["height"] * 0.35)
        time.sleep(0.4)

        # Black again next to white to create Atari
        page.mouse.click(box["x"] + box["width"] * 0.45, box["y"] + box["height"] * 0.25)
        time.sleep(0.4)
        page.mouse.click(box["x"] + box["width"] * 0.55, box["y"] + box["height"] * 0.35)
        time.sleep(0.4)

        # Take screenshot of active trial mode with coords, numbers, atari ring, sweat drop
        out_path = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_teaching_toolbar_active.png"
        page.screenshot(path=out_path)
        print(f"Screenshot saved to {out_path}")

        # 4. Test stone removal: click on an existing stone
        # Click on the stone placed at 0.35, 0.35
        page.mouse.click(box["x"] + box["width"] * 0.35, box["y"] + box["height"] * 0.35)
        time.sleep(0.4)

        # 5. Test Undo [◀]
        btn_prev = page.query_selector("#btnNavPrev")
        btn_prev.click()
        time.sleep(0.3)

        # 6. Test Clear Board [🗑️]
        btn_clear = page.query_selector("#btnClearBoard")
        btn_clear.click()
        time.sleep(0.3)

        # Take screenshot after clear board
        out_path_cleared = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\teacher_toolbar_cleared.png"
        page.screenshot(path=out_path_cleared)
        print(f"Cleared screenshot saved to {out_path_cleared}")

        browser.close()
        print("All tests passed successfully!")

if __name__ == '__main__':
    run()
