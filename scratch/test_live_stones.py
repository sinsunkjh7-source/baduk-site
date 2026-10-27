# -*- coding: utf-8 -*-
import time
import sys
from playwright.sync_api import sync_playwright

artifact_dir = r"C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1366, "height": 768})

    url = f"https://sinsunkjh7-source.github.io/baduk-site/teacher/?v={int(time.time())}"
    print("Testing live URL:", url, flush=True)

    page.goto(url)
    time.sleep(1)

    pin_input = page.query_selector("#pinInput")
    if pin_input and pin_input.is_visible():
        print("PIN input is visible, filling 5840", flush=True)
        pin_input.fill("5840")
        page.click("#btnPinSubmit")
    else:
        print("PIN input not visible or bypassed", flush=True)

    page.wait_for_selector("#teachingBoard", state="visible", timeout=12000)
    print("teachingBoard is visible!", flush=True)
    time.sleep(1)

    # 1. Verify 자유시연모드 is NOT in header
    btn_free = page.query_selector("#btnToggleFree")
    print("btnToggleFree present:", btn_free is not None, flush=True)

    # 2. Open Settings panel
    page.click("#btnOpenSettings")
    page.wait_for_selector("#settingsModal:not([hidden])", timeout=4000)
    print("Settings modal opened!", flush=True)

    # 3. Click cat
    page.click('[data-setting="stoneStyle"] [data-val="cat"]')
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/live_stone_cat_active.png")
    print("Saved live_stone_cat_active.png", flush=True)

    # 4. Click galaxy
    page.click('[data-setting="stoneStyle"] [data-val="galaxy"]')
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/live_stone_galaxy_active.png")
    print("Saved live_stone_galaxy_active.png", flush=True)

    # 5. Click crystal
    page.click('[data-setting="stoneStyle"] [data-val="crystal"]')
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/live_stone_crystal_active.png")
    print("Saved live_stone_crystal_active.png", flush=True)

    page.click("#btnCloseSettings")
    time.sleep(0.5)
    page.screenshot(path=f"{artifact_dir}/live_stone_crystal_full_board.png")
    print("Saved live_stone_crystal_full_board.png", flush=True)

    browser.close()
    print("All live captures completed!", flush=True)
