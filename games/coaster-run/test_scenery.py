import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})
        await page.goto('http://127.0.0.1:8999/games/coaster-run/index.html')
        await page.wait_for_timeout(500)
        
        # Click start
        await page.click('#btnStart')
        print("Clicked start")
        
        # Wait 1.8s while cruising through tunnel rings & crystals
        await page.wait_for_timeout(1800)
        await page.screenshot(path='C:/Users/sinsu/.gemini/antigravity/brain/ea5dea20-0869-4b33-9b5e-98aa7963ed2e/coaster_scenery_rushing.png')
        print("Scenery rushing screenshot saved!")
        
        # Wait for gate 1 to appear
        await page.wait_for_selector('#boardModal:not([hidden])', timeout=15000)
        print("Gate 1 reached")
        
        # Click correct point (2, 3)
        box = await page.eval_on_selector('#goCanvas', 'el => el.getBoundingClientRect()')
        await page.mouse.click(box['x'] + 190, box['y'] + 262.5)
        print("Solved gate 1")
        
        # Capture plunging through tunnel rings with high FOV
        await page.wait_for_timeout(1100)
        await page.screenshot(path='C:/Users/sinsu/.gemini/antigravity/brain/ea5dea20-0869-4b33-9b5e-98aa7963ed2e/coaster_scenery_plunge.png')
        print("Plunge screenshot saved!")
        
        await browser.close()

asyncio.run(run())
