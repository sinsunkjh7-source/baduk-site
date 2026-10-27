# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

artifact_dir = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 768})
    url = f"https://sinsunkjh7-source.github.io/baduk-site/teacher/?v={int(time.time())}"
    print("Testing live URL:", url)

    for attempt in range(6):
        try:
            page.goto(url)
            page.wait_for_selector("#pinInput", timeout=8000)
            page.fill("#pinInput", "5840")
            page.click("#btnPinSubmit")
            page.wait_for_selector("#teachingBoard", timeout=8000)
            time.sleep(1)

            page.click("#btnOpenSettings")
            page.wait_for_selector("#settingsModal:not([hidden])", timeout=4000)
            time.sleep(0.5)

            # Check if panel is right-floating (e.g. style or dialog width)
            dialog_box = page.locator(".settings-dialog").bounding_box()
            print("Dialog bounding box:", dialog_box)
            if dialog_box and dialog_box["width"] <= 350:
                page.screenshot(path=f"{artifact_dir}/live_production_right_panel.png")
                print("Live production right panel captured successfully!")
                break
        except Exception as e:
            print("Waiting for CDN cache... attempt", attempt + 1, e)
            time.sleep(5)

    browser.close()
