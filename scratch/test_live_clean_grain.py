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
            try:
                page.wait_for_selector("#pinGate:not([hidden])", timeout=3000)
                page.fill("#pinInput", "5840")
                page.click("#btnPinSubmit")
            except Exception:
                pass

            page.wait_for_selector("#teachingBoard", timeout=8000)
            time.sleep(1)

            # Open Settings panel
            page.click("#btnOpenSettings")
            page.wait_for_selector("#settingsModal:not([hidden])", timeout=4000)
            page.click('[data-setting="boardSkin"] [data-val="darkwood"]')
            time.sleep(0.5)

            # Close settings
            page.click("#btnCloseSettings")
            time.sleep(0.5)

            board_elem = page.locator("#teachingBoard")
            board_elem.screenshot(path=f"{artifact_dir}/live_clean_darkwood_board.png")
            page.screenshot(path=f"{artifact_dir}/live_clean_darkwood_full.png")
            print("Captured live clean darkwood board screenshot successfully!")
            break
        except Exception as e:
            print("Waiting for CDN cache... attempt", attempt + 1, e)
            time.sleep(5)

    browser.close()
