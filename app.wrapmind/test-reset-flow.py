#!/usr/bin/env python3
"""
Automated password-reset flow tester for WrapMind production.
Opens a browser, clicks "Forgot password?", submits email,
prompts user to paste the reset link from their inbox, then
navigates to it and submits a new password.

Requires: pip install selenium webdriver-manager
"""

import os, time, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).parent
ENV_FILE = HERE / ".env"

def get_email():
    """Read TEST_EMAIL from environment or .env."""
    email = os.environ.get("WRAPMIND_TEST_EMAIL")
    if not email and ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.strip().startswith("WRAPMIND_TEST_EMAIL="):
                email = line.split("=", 1)[1].strip().strip('"\'')
                break
    if not email:
        email = input("Enter test email for reset flow: ").strip()
    return email

def main():
    print("=" * 60)
    print("WrapMind Password Reset Flow Automation")
    print("=" * 60)

    # 1. Ensure env vars
    email = get_email()
    print(f"Test email: {email}")

    # 2. Launch browser automation
    script = f'''
import time, sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Use existing Chrome profile so you're already logged in or can login easily
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")  # remove to see browser
# options.add_argument("--user-data-dir=~/Library/Application Support/Google/Chrome")  # macOS example
# options.add_argument("--profile-directory=Default")

driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 20)

try:
    # Step 1: Go to login page
    driver.get("https://app.wrapmind.ai")
    time.sleep(2)

    # Step 2: Click "Forgot password?" link
    forgot_link = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Forgot password')]"))
    )
    forgot_link.click()
    print("✓ Clicked Forgot password")

    # Step 3: Enter email and submit
    email_input = wait.until(
        EC.presence_of_element_located((By.XPATH, "//input[@type='email' or @name='email']"))
    )
    email_input.clear()
    email_input.send_keys("{email}")
    submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Send') or contains(., 'reset')]")
    submit_btn.click()
    print("✓ Submitted email")

    # Step 4: Wait for success message
    success_msg = wait.until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(., 'reset link') or contains(., 'sent')]"))
    )
    print("✓ Reset email sent message appeared")

    # Step 5: Prompt user to paste the reset link
    print()
    print("📧 Check your inbox, click the reset link, then copy the FULL URL from the address bar.")
    print("   (It should look like: https://app.wrapmind.ai/update-password?...)")
    reset_url = input("Paste the reset URL here: ").strip()
    if not reset_url.startswith("http"):
        print("Invalid URL, aborting.")
        sys.exit(1)

    # Step 6: Navigate to reset URL
    driver.get(reset_url)
    print("✓ Navigated to reset URL")
    time.sleep(2)

    # Step 7: Set new password
    pwd_input = wait.until(
        EC.presence_of_element_located((By.XPATH, "//input[@type='password']"))
    )
    pwd_input.clear()
    pwd_input.send_keys("TestPass123!")
    confirm_input = driver.find_element(By.XPATH, "(//input[@type='password'])[2]")
    confirm_input.clear()
    confirm_input.send_keys("TestPass123!")
    print("✓ Filled password fields")

    submit_btn = driver.find_element(By.XPATH, "//button[contains(., 'Update') or contains(., 'Submit') or contains(., 'Save')]")
    submit_btn.click()
    print("✓ Submitted new password")

    # Step 8: Wait for success redirect
    time.sleep(4)
    if "login" in driver.current_url.lower() or "signin" in driver.current_url.lower():
        print("✓ ✓ ✓ PASSWORD RESET SUCCESSFUL! Redirected to login.")
    else:
        print(f"? Current URL: {driver.current_url}")
        print("   Check page for success message or errors.")

    # Keep browser open for inspection
    input("\\nPress Enter to close browser...")
    driver.quit()

except TimeoutException as e:
    print(f"Timeout: {{e}}")
    print("Current page source snippet:")
    print(driver.page_source[:2000])
    driver.quit()
    sys.exit(1)
except Exception as e:
    print(f"Error: {{e}}")
    driver.quit()
    sys.exit(1)
'''

    # Write script to temp file
    script_path = HERE / "run_reset_test.py"
    script_path.write_text(script)
    print(f"\n✓ Created automation script at {script_path}")
    print("\nTo run it:")
    print(f"  python3 {script_path}")
    print("\nMake sure you have Selenium installed:")
    print("  pip install selenium webdriver-manager")
    print("\nThe script will open a browser window, perform the flow, and prompt you")
    print("to paste the reset link from your email inbox.")
    print("\nAlternatively, if you prefer manual testing, just:")
    print("  1. Hard refresh browser")
    print("  2. Click Forgot password → send email → click link in inbox")
    print("  3. Enter new password (min 8 chars)")
    print("  4. Should redirect to login without errors")
    
    # Offer to run now
    choice = input("\nRun the automation now? (y/n): ").lower().strip()
    if choice == 'y':
        subprocess.run([sys.executable, str(script_path)])

if __name__ == "__main__":
    main()
