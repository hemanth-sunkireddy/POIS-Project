import os, random
from pa2 import F

# --- PKCS#7 Padding ---
BLOCK_SIZE = 8  # Matching our 64-bit DLP PRF output size

def pad(m: bytes) -> bytes:
    """Standard PKCS#7 padding."""
    pad_len = BLOCK_SIZE - (len(m) % BLOCK_SIZE)
    return m + bytes([pad_len] * pad_len)

def unpad(m: bytes) -> bytes:
    """Standard PKCS#7 unpadding."""
    if not m: return b""
    pad_len = m[-1]
    if pad_len < 1 or pad_len > BLOCK_SIZE:
        return m  # Invalid padding
    # Check that all padding bytes are the same
    if all(p == pad_len for p in m[-pad_len:]):
        return m[:-pad_len]
    return m

# --- CPA-Secure Encryption (Counter Mode using PRF) ---
def Enc(k: int, m: bytes, r_override: int = None) -> tuple:
    """
    CPA-secure encryption using a PRF in Counter Mode.
    C = (r, Fk(r) ^ m1, Fk(r+1) ^ m2, ...)
    Returns (r, ciphertext_bytes)
    """
    padded_m = pad(m)
    # 64-bit random nonce
    r = r_override if r_override is not None else int.from_bytes(os.urandom(8), "big")
    
    c = []
    num_blocks = len(padded_m) // BLOCK_SIZE
    for i in range(num_blocks):
        # Apply PRF to counter: r + i
        # The result of F(k, x) is a large integer (64-bit from DLP)
        ctr = (r + i) & 0xFFFFFFFFFFFFFFFF
        keystream_int = F(k, ctr)
        keystream = keystream_int.to_bytes(BLOCK_SIZE, "big")
        
        block = padded_m[i * BLOCK_SIZE : (i + 1) * BLOCK_SIZE]
        # XOR block with keystream
        c_block = bytes(a ^ b for a, b in zip(block, keystream))
        c.append(c_block)
    
    return r, b"".join(c)

def Dec(k: int, r: int, c: bytes) -> bytes:
    """
    Decryption is symmetric to encryption in Counter Mode.
    """
    m_blocks = []
    num_blocks = len(c) // BLOCK_SIZE
    for i in range(num_blocks):
        ctr = (r + i) & 0xFFFFFFFFFFFFFFFF
        keystream_int = F(k, ctr)
        keystream = keystream_int.to_bytes(BLOCK_SIZE, "big")
        
        c_block = c[i * BLOCK_SIZE : (i + 1) * BLOCK_SIZE]
        m_blocks.append(bytes(a ^ b for a, b in zip(c_block, keystream)))
    
    return unpad(b"".join(m_blocks))

# --- IND-CPA Game ---
def ind_cpa_game(k: int, queries=20):
    """
    Simulates the IND-CPA game.
    Adversary wins if they can distinguish encryptions of m0 and m1.
    """
    print(f"\n--- IND-CPA Security Game (rounds={queries}) ---")
    correct = 0
    m0 = b"CRYPTOGRAPHY"
    m1 = b"STEGANOGRAPHY"
    
    for _ in range(queries):
        b = random.randint(0, 1)
        challenge_m = m0 if b == 0 else m1
        
        r, c = Enc(k, challenge_m)
        
        # A random guess (simulating an adversary with no advantage)
        guess = random.randint(0, 1)
        if guess == b:
            correct += 1
            
    advantage = abs((correct / queries) - 0.5) * 2 # Scaled to [0, 1]
    print(f"  Result: {correct}/{queries} correct")
    print(f"  Advantage: {advantage:.3f}")
    return advantage

def broken_nonce_demo(k: int):
    """Demonstrates why nonce reuse breaks CPA security."""
    print("\n--- Nonce Reuse Vulnerability Demo ---")
    m = b"Secret Message"
    r_fixed = 0xDEADBEEF
    
    r1, c1 = Enc(k, m, r_override=r_fixed)
    r2, c2 = Enc(k, m, r_override=r_fixed)
    
    print(f"  Enc(m, r1): {c1.hex()}")
    print(f"  Enc(m, r2): {c2.hex()}")
    if c1 == c2:
        print("  [VULNERABILITY] Identical ciphertexts for identical messages!")
        print("  Adversary can detect message repetition (Breaking IND-CPA).")

if __name__ == "__main__":
    test_k = int.from_bytes(os.urandom(8), "big")
    
    print("=== PA#3 CPA-Secure Encryption Test ===")
    msg = b"This is a premium CPA security test for PA3."
    r_val, c_val = Enc(test_k, msg)
    dec = Dec(test_k, r_val, c_val)
    print(f"  Original:  {msg.decode()}")
    print(f"  Decrypted: {dec.decode()}")
    print(f"  Correct:   {msg == dec}")
    
    ind_cpa_game(test_k)
    broken_nonce_demo(test_k)

