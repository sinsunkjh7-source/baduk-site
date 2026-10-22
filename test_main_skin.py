import os
from playwright.sync_api import sync_playwright

file_path = os.path.abspath('baduk/index.html').replace('\\', '/').replace('#', '%23')
file_url = 'file:///' + file_path

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 850})
    page.goto(file_url)
    page.wait_for_timeout(1000)
    
    # Dismiss portal overlay and enter free play / game
    page.evaluate("""() => {
        const overlay = document.getElementById('mainPortalOverlay');
        if (overlay) overlay.style.display = 'none';
        
        if (window.badukApp) {
            window.badukApp.applyBoardSkin('magma');
            window.badukApp.render();
        }
    }""")
    
    page.wait_for_timeout(1000)
    page.screenshot(path='baduk/main_site_magma_skin_preview.png')
    
    board_el = page.locator('#boardWrapper')
    if board_el.count() > 0:
        board_el.first.screenshot(path='baduk/magma_board_zoom.png')
    
    browser.close()

print('Screenshots saved successfully with badukApp!')
