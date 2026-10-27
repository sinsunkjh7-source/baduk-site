# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

artifact_dir = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 768})

    url = f"https://sinsunkjh7-source.github.io/baduk-site/teacher/?v={int(time.time())}"
    print("Testing live URL:", url)

    page.goto(url)
    try:
        page.wait_for_selector("#pinGate:not([hidden])", timeout=3000)
        page.fill("#pinInput", "5840")
        page.click("#btnPinSubmit")
    except Exception:
        pass

    page.wait_for_selector("#teachingBoard", timeout=10000)
    time.sleep(1)

    # Open Settings panel
    page.click("#btnOpenSettings")
    page.wait_for_selector("#settingsModal:not([hidden])", timeout=4000)
    time.sleep(0.5)

    # Click darkwood option
    darkwood_btn = page.wait_for_selector('[data-setting="boardSkin"] [data-val="darkwood"]', timeout=4000)
    darkwood_btn.click()
    time.sleep(0.5)

    # Screenshot with panel open
    page.screenshot(path=f"{artifact_dir}/live_production_darkwood_board.png")
    print("Captured live_production_darkwood_board.png!")

    # Close panel and screenshot
    page.click("#btnCloseSettings")
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/live_production_darkwood_full.png")
    print("Captured live_production_darkwood_full.png!")

    browser.close()
