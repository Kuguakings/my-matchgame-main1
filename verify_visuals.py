from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080/index.html")

        # Wait for board to load
        page.wait_for_selector(".cell", timeout=5000)

        # 1. Verify Yellow Level 3 Visuals
        # We need to manually inject a Level 3 Yellow tile to see it.
        page.evaluate("""
            const yellowL3 = { id: 999, color: 'yellow', type: 'normal', state: 'normal', voltage: 3 };
            board[0][0] = yellowL3;
            renderBoard();
        """)
        # Allow render to happen
        page.wait_for_timeout(500)

        # 2. Verify Purple Void Visuals
        # Inject a Purple Match-3 trigger or just the VFX
        # We can call showVFX directly
        page.evaluate("showVFX(2, 2, 'void-vortex')")
        page.wait_for_timeout(500) # Wait for animation to develop

        # 3. Verify Blue Match-4 Laser
        # Trigger the visual
        page.evaluate("showVFX(4, 4, 'hydro-beam', 'row')")
        page.wait_for_timeout(200)

        # Take screenshot
        page.screenshot(path="verification_visuals.png")
        browser.close()

if __name__ == "__main__":
    verify_changes()
