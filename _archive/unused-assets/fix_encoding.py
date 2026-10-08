#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to fix double-encoding issues (UTF-8 incorrectly read as Windows-1252, then saved as UTF-8).
This causes mojibake like: "RomÃ¢nia" instead of "România".

Fix: encode as cp1252 (reverses the incorrect interpretation), then decode as utf-8 (fixes to correct UTF-8).
"""

def fix_encoding(filepath):
    """
    Fix double-encoding in a file.
    
    Args:
        filepath: Path to the HTML file
    
    Returns:
        tuple: (success: bool, before_samples: list, after_samples: list)
    """
    try:
        # Step 1: Read the corrupted content as UTF-8
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        before_samples = extract_samples(content)
        
        # Step 2: Fix the double-encoding
        # The text was incorrectly interpreted as cp1252, so we encode back to cp1252 bytes,
        # then decode properly as UTF-8
        fixed_content = content.encode('cp1252').decode('utf-8')
        
        after_samples = extract_samples(fixed_content)
        
        # Step 3: Write back with explicit UTF-8 encoding
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        return True, before_samples, after_samples
    
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False, [], []


def extract_samples(content):
    """
    Extract sample words to verify encoding was fixed.
    
    Returns:
        list: List of (search_pattern, found_text) tuples
    """
    patterns = [
        ('România', 'RomÃ¢nia'),  # Should find correct, or corrupted before fix
        ('ș', 'È™'),              # Should find correct, or corrupted before fix
        ('ț', 'È›'),              # Should find correct, or corrupted before fix
        ('—', 'â€"'),            # Should find correct, or corrupted before fix
        ('ă', 'Ä…'),              # Should find correct, or corrupted before fix
        ('ț', 'È›'),              # Accent mark (different from above)
    ]
    
    samples = []
    for correct, corrupted in patterns:
        if correct in content:
            samples.append((correct, True))
        elif corrupted in content:
            samples.append((corrupted, False))
    
    return samples


def main():
    files_to_fix = [
        'ugr-variants/variant-2.html',
        'ugr-variants/variant-3.html'
    ]
    
    print("=" * 70)
    print("FIXING DOUBLE-ENCODING IN HTML FILES")
    print("=" * 70)
    
    for filepath in files_to_fix:
        print(f"\n📄 Processing: {filepath}")
        print("-" * 70)
        
        success, before_samples, after_samples = fix_encoding(filepath)
        
        if success:
            print(f"✅ File fixed successfully!")
            
            print("\n  📊 SAMPLES BEFORE FIX:")
            for text, is_correct in before_samples:
                status = "✓ Correct" if is_correct else "✗ Corrupted"
                print(f"     {status}: {repr(text)}")
            
            print("\n  📊 SAMPLES AFTER FIX:")
            for text, is_correct in after_samples:
                status = "✓ Correct" if is_correct else "✗ Corrupted"
                print(f"     {status}: {repr(text)}")
            
            # Re-verify by reading the fixed file
            with open(filepath, 'r', encoding='utf-8') as f:
                fixed_content = f.read()
            
            print("\n  🔍 VERIFICATION - Finding key words in fixed file:")
            key_words = ['România', 'ș', 'ț', '—', 'ă']
            for word in key_words:
                if word in fixed_content:
                    # Find context around the word
                    idx = fixed_content.find(word)
                    start = max(0, idx - 30)
                    end = min(len(fixed_content), idx + len(word) + 30)
                    context = fixed_content[start:end].replace('\n', ' ')
                    print(f"     ✓ '{word}' found: ...{context}...")
                else:
                    print(f"     ✗ '{word}' NOT found")
        else:
            print(f"❌ Failed to fix {filepath}")
    
    print("\n" + "=" * 70)
    print("✨ DONE! All files have been processed.")
    print("=" * 70)


if __name__ == '__main__':
    main()
