import re

filename = 'client/src/pages/create-order.tsx'
with open(filename, 'r') as f:
    text = f.read()

pattern_a = r'(          <motion\.div\n            initial={{ opacity: 0, x: 20 }}.*?          </motion\.div>\n)'
# Make pattern_b simpler but strict enough to capture the exact block
pattern_b = r'(            <AnimatePresence>\s*\{foundCustomer && \(\s*<motion\.div.*?Customer History.*?</AnimatePresence>\n)'

match_a = re.search(pattern_a, text, re.DOTALL)
match_b = re.search(pattern_b, text, re.DOTALL)

if match_a and match_b:
    start_a, end_a = match_a.start(1), match_a.end(1)
    start_b, end_b = match_b.start(1), match_b.end(1)
    
    if start_a < start_b:
        block_a = text[start_a:end_a]
        gap = text[end_a:start_b]
        block_b = text[start_b:end_b]
        
        # Give block_b a bottom margin so it doesn't collide seamlessly with the sticky Bill Summary?
        # The user has <div className="space-y-6"> wrapped around them, so the gap is handled automatically by Tailwind space-y-6!
        
        new_text = text[:start_a] + block_b + gap + block_a + text[end_b:]
        
        with open(filename, 'w') as f:
            f.write(new_text)
        print("Successfully swapped Bill Summary and Customer History.")
else:
    print(f"Match A: {match_a is not None}")
    print(f"Match B: {match_b is not None}")
