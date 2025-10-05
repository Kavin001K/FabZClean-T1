#!/usr/bin/env python3
"""
Fix all toLocaleString calls in accounting components to use safe formatUSD helper
"""
import re
import os

files = [
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/trial-balance.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/journal-entries.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/chart-of-accounts.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/budget-tracker.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/accounts-receivable.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/income-statement.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/accounts-payable.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/balance-sheet.tsx",
    "/Users/kavin/Documents/GitHub/facz/client/src/components/accounting/expense-tracker.tsx",
]

def add_import(content):
    """Add formatUSD import if not present"""
    if "import { formatUSD" in content or "import { formatINR" in content:
        return content

    # Find the last import statement
    import_pattern = r"(import .*?;)\n"
    imports = list(re.finditer(import_pattern, content))

    if imports:
        last_import = imports[-1]
        insert_pos = last_import.end()
        return content[:insert_pos] + "import { formatUSD } from '@/lib/format';\n" + content[insert_pos:]

    return content

def fix_toLocaleString(content):
    """Replace all unsafe toLocaleString calls with formatUSD"""

    # Pattern 1: object.property.toLocaleString('en-US', {...})
    pattern1 = r"(\w+)\.toLocaleString\('en-US',\s*\{\s*minimumFractionDigits:\s*2(?:,?\s*maximumFractionDigits:\s*2)?\s*\}\)"
    content = re.sub(pattern1, r"formatUSD(\1)", content)

    # Pattern 2: (expression).toLocaleString('en-US', {...})
    pattern2 = r"\(([^)]+)\)\.toLocaleString\('en-US',\s*\{\s*minimumFractionDigits:\s*2\s*\}\)"
    content = re.sub(pattern2, r"formatUSD(\1)", content)

    # Pattern 3: parseFloat(x).toLocaleString('en-US', {...})
    pattern3 = r"parseFloat\(([^)]+)\)\.toLocaleString\('en-US',\s*\{\s*minimumFractionDigits:\s*2\s*\}\)"
    content = re.sub(pattern3, r"formatUSD(\1)", content)

    # Pattern 4: Math.abs(x).toLocaleString('en-US', {...})
    pattern4 = r"Math\.abs\(([^)]+)\)\.toLocaleString\('en-US',\s*\{\s*minimumFractionDigits:\s*2\s*\}\)"
    content = re.sub(pattern4, r"formatUSD(Math.abs(\1))", content)

    # Pattern 5: value.toLocaleString() without params
    pattern5 = r"(\w+)\.toLocaleString\(\)"
    content = re.sub(pattern5, r"formatUSD(\1)", content)

    return content

def fix_inr_formatting(content):
    """Fix INR formatting"""
    pattern = r"₹\{(\w+)\.toLocaleString\('en-IN'(?:,\s*\{[^}]+\})?\)\}"
    content = re.sub(pattern, r"₹{formatUSD(\1)}", content)
    return content

for filepath in files:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - not found")
        continue

    print(f"Processing {os.path.basename(filepath)}...")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Add import
    content = add_import(content)

    # Fix all toLocaleString calls
    content = fix_toLocaleString(content)
    content = fix_inr_formatting(content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Fixed {filepath}")
    else:
        print(f"  - No changes needed for {filepath}")

print("\n✅ All files processed!")
