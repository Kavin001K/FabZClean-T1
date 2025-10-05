#!/usr/bin/env python3
import re
import os

files = [
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/balance-sheet.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/budget-tracker.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/income-statement.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/trial-balance.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/chart-of-accounts.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/general-ledger.tsx",
]

def fix_toLocaleString(content):
    # Pattern: value.toLocaleString('en-US', {...})
    # Replace with: formatUSD(value)
    pattern = r'([a-zA-Z0-9_.()?\[\]]+)\.toLocaleString\(["\']en-US["\']\s*,\s*\{[^}]*\}\)'
    content = re.sub(pattern, r'formatUSD(\1)', content)

    # Pattern: value.toLocaleString('en-IN')
    # Replace with: formatINR(value)
    pattern2 = r'([a-zA-Z0-9_.()?\[\]]+)\.toLocaleString\(["\']en-IN["\']\)'
    content = re.sub(pattern2, r'formatINR(\1)', content)

    return content

def add_formatINR_import(content):
    # Check if formatINR is already imported
    if "formatINR" in content:
        if "import { formatUSD } from" in content and "formatINR" not in content.split("from '@/lib/format'")[0]:
            # Add formatINR to existing import
            content = content.replace(
                "import { formatUSD } from '@/lib/format';",
                "import { formatUSD, formatINR } from '@/lib/format';"
            )
    return content

print("Fixing remaining toLocaleString calls...")
for filepath in files:
    print(f"Processing {os.path.basename(filepath)}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        content = fix_toLocaleString(content)
        content = add_formatINR_import(content)

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Fixed {filepath}")
        else:
            print(f"  • No changes needed for {filepath}")
    except Exception as e:
        print(f"  ✗ Error processing {filepath}: {e}")

print("\n✅ All files processed!")
