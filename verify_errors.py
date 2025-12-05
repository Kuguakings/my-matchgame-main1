from playwright.sync_api import sync_playwright

def verify_errors():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
        
        page.goto("http://localhost:8080/index.html")
        
        try:
            page.wait_for_selector(".cell", timeout=5000)
            print("Board loaded")
        except Exception as e:
            print(f"Wait failed: {e}")
            
        browser.close()

if __name__ == "__main__":
    verify_errors()
