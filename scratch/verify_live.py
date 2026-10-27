# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

artifact_dir = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 768})
    url = "https://sinsunkjh7-source.github.io/baduk-site/teacher/?v=" + str(int(time.time()))
    print("Testing URL:", url)
    
    # Retry loop in case GitHub Pages is still building
    for attempt in range(6):
        try:
            page.goto(url)
            page.wait_for_selector("#pinInput", timeout=8000)
            page.fill("#pinInput", "5840")
            page.click("#btnPinSubmit")
            page.wait_for_selector("#teachingBoard", state="visible", timeout=8000)
            time.sleep(1)
            btn = page.query_selector("#btnOpenSettings")
            if btn:
                print("btnOpenSettings found on attempt", attempt + 1)
                page.click("#btnOpenSettings")
                page.wait_for_selector("#settingsModal:not([hidden])", timeout=5000)
                time.sleep(0.5)
                page.screenshot(path=f"{artifact_dir}/live_production_settings_modal.png")
                print("Live production screenshot taken!")
                break
        except Exception as e:
            print("Waiting for GitHub Pages build... attempt", attempt + 1, e)
            time.sleep(5)
            
    browser.close()
