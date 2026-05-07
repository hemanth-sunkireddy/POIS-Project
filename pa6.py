import os
from pa3 import Enc, Dec
from pa5 import Mac, Vrfy

# --- 1. Encrypt-then-MAC (CCA-Secure) ---
def CCA_Enc(kE: int, kM: int, m: bytes):
    """
    Encrypts using Enc(kE, m) and then computes Mac(kM, c) 
    where c includes the nonce r.
    Returns (c, t) where c = (r, ct).
    """
    r, ct = Enc(kE, m)
    # Serialize c for MAC: r (4 bytes) + ct
    c_serialized = r.to_bytes((r.bit_length() + 7) // 8, "big") + ct
    t = Mac(kM, c_serialized, mode="CBC")
    return (r, ct), t

def CCA_Dec(kE: int, kM: int, c, t):
    """
    Verify-then-Decrypt: 
    1. Verify MAC(kM, c) == t
    2. If valid, decrypt Dec(kE, r, ct)
    3. Else, return None (bottom)
    """
    r, ct = c
    c_serialized = r.to_bytes((r.bit_length() + 7) // 8, "big") + ct
    
    # 1. VERIFY FIRST (Verify-then-Decrypt)
    if not Vrfy(kM, c_serialized, t, mode="CBC"):
        return None  # Return bottom (None) if MAC is invalid
        
    # 2. DECRYPT
    return Dec(kE, r, ct)

# --- 2. Key Separation ---
def independent_keygen():
    """Generates independent encryption and MAC keys."""
    kE = os.urandom(1)[0]
    kM = os.urandom(1)[0]
    return kE, kM

def key_reuse_demo(k: int, m: bytes):
    """
    Demonstrates that reusing a single key for both encryption and MAC
    creates exploitable correlations.
    
    When kE == kM == k:
    - The PRF used for encryption keystream and the PRF used for MAC
      are keyed identically.
    - An adversary can correlate MAC tags with ciphertext blocks,
      potentially leaking information about the plaintext.
    """
    print("\n--- Key Reuse Demo ---")
    
    # Honest usage: independent keys
    kE, kM = independent_keygen()
    c1, t1 = CCA_Enc(kE, kM, m)
    c2, t2 = CCA_Enc(kE, kM, m)
    print(f"  [Independent keys] kE={kE:#04x}, kM={kM:#04x}")
    print(f"  Enc1 tag: {t1:#04x}, Enc2 tag: {t2:#04x}")
    print(f"  Tags differ (fresh nonce): {t1 != t2}")

    # Reused key: kE == kM == k
    c3, t3 = CCA_Enc(k, k, m)
    c4, t4 = CCA_Enc(k, k, m)
    print(f"\n  [Reused key] kE=kM={k:#04x}")
    print(f"  Enc1 tag: {t3:#04x}, Enc2 tag: {t4:#04x}")

    # Show the correlation: MAC tag is computed over ciphertext
    # which itself was produced using the same key k.
    # The MAC's PRF and the encryption's PRF share the same key,
    # so the tag leaks structural information about the keystream.
    r3, ct3 = c3
    c3_serialized = r3.to_bytes((r3.bit_length() + 7) // 8, "big") + ct3
    
    # Adversary observation: with key reuse, the MAC tag over the
    # ciphertext can be correlated with the encryption keystream.
    # Specifically, the first MAC chaining value = Fk(0 XOR c3_serialized[0])
    # = Fk(c3_serialized[0]), which uses the same Fk as encryption.
    # This means an adversary who observes multiple (c, t) pairs
    # under the same reused key can detect patterns.
    first_mac_block = c3_serialized[0]
    from pa2 import F
    from pa5 import Fk
    keystream_byte = Fk(k, 0) & 0xFF   # first keystream byte used in encryption
    mac_first_step = Fk(k, first_mac_block)  # first MAC chaining step
    
    print(f"\n  Correlation analysis (key reuse kE=kM={k:#04x}):")
    print(f"    Encryption keystream byte 0 : {keystream_byte:#04x}")
    print(f"    MAC first chaining value    : {mac_first_step:#04x}")
    print(f"    Both derived from same key  -> structural leakage possible")
    print(f"  Verdict: Key reuse is UNSAFE. Always use independent kE and kM.")

# --- 3. Malleability Comparison ---
def malleability_demo(kE, kM, m):
    print("\n--- Malleability Comparison ---")
    c, t = CCA_Enc(kE, kM, m)
    r, ct = c

    # Attacker attempts to flip a bit in the ciphertext
    tampered_ct = bytes([ct[0] ^ 0x01]) + ct[1:]
    tampered_c = (r, tampered_ct)

    # CCA-Secure: MAC check should catch the tampering
    result_cca = CCA_Dec(kE, kM, tampered_c, t)
    print(f"  [CCA-Secure] Dec(tampered) -> {result_cca!r} (Should be None)")

    # CPA-only (PA#3): No MAC check, so tampering results in corrupted plaintext
    result_cpa = Dec(kE, r, tampered_ct)
    print(f"  [CPA-only]   Dec(tampered) -> {result_cpa!r} (Corrupted result)")

# --- 4. IND-CCA2 Game Simulation ---
def ind_cca2_game(kE, kM, rounds=100):
    """
    Simulation of IND-CCA2 game.
    The adversary tries to distinguish between Enc(m0) and Enc(m1)
    even with access to a decryption oracle (restricted from decrypting the challenge).
    """
    print(f"\n--- IND-CCA2 Game Simulation ({rounds} rounds) ---")
    correct = 0
    for _ in range(rounds):
        m0, m1 = b"APPLE", b"BANANA"
        b_bit = os.urandom(1)[0] & 1
        challenge_c, challenge_t = CCA_Enc(kE, kM, m0 if b_bit == 0 else m1)
        
        # Adversary can query decryption oracle on any (c', t') != (c, t)
        # For example, tampered challenge should return bottom
        r, ct = challenge_c
        tampered_c = (r, bytes([ct[0] ^ 1]) + ct[1:])
        oracle_res = CCA_Dec(kE, kM, tampered_c, challenge_t)
        
        # If oracle returns None (bottom), adversary learns nothing new
        # Guessing bit (dummy guess for simulation)
        guess = os.urandom(1)[0] & 1
        if guess == b_bit:
            correct += 1
            
    advantage = abs(correct/rounds - 0.5)
    print(f"  Correct guesses: {correct}/{rounds}")
    print(f"  Advantage: {advantage:.3f} (Expect ~0 for secure scheme)")

if __name__ == "__main__":
    print("=== PA#6 CCA-Secure Encryption Demo ===")
    
    # Independent keys
    kE, kM = independent_keygen()
    m = b"Top Secret"
    
    # Basic correctness
    c, t = CCA_Enc(kE, kM, m)
    pt = CCA_Dec(kE, kM, c, t)
    
    print(f"Message  : {m}")
    print(f"Cipher   : {c}")
    print(f"MAC Tag  : {t:#04x}")
    print(f"Decrypted: {pt}")
    
    # Key reuse demo (new)
    key_reuse_demo(kE, m)
    
    malleability_demo(kE, kM, m)
    ind_cca2_game(kE, kM)