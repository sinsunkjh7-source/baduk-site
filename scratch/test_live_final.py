# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

artifact_dir = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # Fresh incognito context
    context = browser.new_context(viewport={"width": 1366, "height": 768})
    page = context.new_page()

    url = f"https://sinsunkjh7-source.github.io/baduk-site/teacher/?v={int(time.time())}"
    print("Testing live URL:", url)

    page.goto(url)
    
    # Handle PIN if visible
    try:
        page.wait_for_selector("#pinGate:not([hidden])", timeout=4000)
        page.fill("#pinInput", "5840")
        page.click("#btnPinSubmit")
    except Exception:
        print("PIN gate already bypassed or not needed")

    page.wait_for_selector("#teachingBoard", timeout=10000)
    time.sleep(1)

    # Click settings button to open the slim right panel
    page.click("#btnOpenSettings")
    page.wait_for_selector("#settingsModal:not([hidden])", timeout=5000)
    time.sleep(0.5)

    # Check bounding box of dialog
    box = page.locator(".settings-dialog").bounding_box()
    print("Live panel bounding box:", box)

    # Capture live production screenshot
    page.screenshot(path=f"{artifact_dir}/live_production_right_panel.png")
    print("Live production right panel screenshot saved!")

    # Click theme-forest live
    page.click('[data-setting="theme"] [data-val="theme-forest"]')
    # Click gem stones live
    page.click('[data-setting="stoneStyle"] [data-val="gem"]')
    time.sleep(0.5)

    # Capture live state change with panel open on right
    page.screenshot(path=f"{artifact_dir}/live_production_right_panel_live_change.png")
    print("Live production right panel with theme & gem stones saved!")

    browser.close()
