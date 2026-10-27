# -*- coding: utf-8 -*-
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1366, "height": 768})

    page.goto("https://badukschool.com/teacher/index.html")
    page.fill("#pinInput", "5840")
    page.click("#btnPinSubmit")
    time.sleep(1.5)

    out_path = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\live_green_production_verified.png"
    page.screenshot(path=out_path)
    print("Live production screenshot saved to", out_path)
    browser.close()
