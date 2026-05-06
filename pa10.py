# pa10.py

import os
import time
from pa8 import hash_message as dlp_hash
from pa3 import Enc, Dec


# ============================================================
# 1. CONSTANT-TIME COMPARISON
# ============================================================

def secure_compare(a: bytes, b: bytes) -> bool:
    if len(a) != len(b):
        return False
    res = 0
    for x, y in zip(a, b):
        res |= x ^ y
    return res == 0


def insecure_compare(a: bytes, b: bytes) -> bool:
    return a == b


# ============================================================
# 2. HMAC IMPLEMENTATION
# ============================================================

BLOCK_SIZE = 32  # bytes (choose fixed size for your hash)

def HMAC(k: bytes, m: bytes) -> bytes:
    # Step 1: key normalization
    if len(k) > BLOCK_SIZE:
        k = dlp_hash(k)
    if len(k) < BLOCK_SIZE:
        k = k + b'\x00' * (BLOCK_SIZE - len(k))

    # ipad / opad
    ipad = bytes([0x36] * BLOCK_SIZE)
    opad = bytes([0x5c] * BLOCK_SIZE)

    k_ipad = bytes([x ^ y for x, y in zip(k, ipad)])
    k_opad = bytes([x ^ y for x, y in zip(k, opad)])

    # HMAC structure
    inner = dlp_hash(k_ipad + m)
    return dlp_hash(k_opad + inner)


def HMAC_Verify(k: bytes, m: bytes, t: bytes) -> bool:
    return secure_compare(HMAC(k, m), t)


# ============================================================
# 3. EUF-CMA GAME (CRHF ⇒ MAC)
# ============================================================

def euf_cma_game(k: bytes, queries=50, attempts=20):
    print("\n--- EUF-CMA Game (HMAC) ---")

    oracle = {}
    for i in range(queries):
        m = i.to_bytes(4, "big")
        oracle[m] = HMAC(k, m)

    success = 0
    for i in range(attempts):
        m_star = (1000 + i).to_bytes(4, "big")

        # adversary guess
        t_guess = os.urandom(len(oracle[next(iter(oracle))]))

        if HMAC_Verify(k, m_star, t_guess):
            success += 1

    print(f"Forgery success: {success}/{attempts} (should be ~0)")


# ============================================================
# 4. MAC ⇒ CRHF (BUILD HASH FROM HMAC)
# ============================================================

def MAC_Hash(k: bytes, message: bytes) -> bytes:
    state = b'\x00' * 16

    for i in range(0, len(message), 4):
        block = message[i:i+4]
        state = HMAC(k, state + block)

    return state


# ============================================================
# 5. LENGTH EXTENSION ATTACK DEMO
# ============================================================

def naive_mac(k: bytes, m: bytes) -> bytes:
    return dlp_hash(k + m)


def length_extension_demo(k: bytes):
    print("\n--- Length Extension Attack ---")

    m = b"hello"
    t = naive_mac(k, m)

    # attacker extends
    m_ext = m + b"\x00\x00world"
    forged = dlp_hash(k + m_ext)

    real = naive_mac(k, m_ext)

    print(f"Naive MAC forged == real: {forged == real} (BROKEN)")

    # HMAC check
    hmac_orig = HMAC(k, m)
    hmac_ext = HMAC(k, m_ext)

    print(f"HMAC forged == real: {hmac_orig == hmac_ext} (SAFE)")


# ============================================================
# 6. ENCRYPT-THEN-HMAC (CCA SECURE)
# ============================================================

def EtH_Enc(kE: int, kM: bytes, m: bytes):
    r, ct = Enc(kE, m)
    c = r.to_bytes(4, "big") + ct
    t = HMAC(kM, c)
    return (r, ct), t


def EtH_Dec(kE: int, kM: bytes, c, t):
    r, ct = c
    c_bytes = r.to_bytes(4, "big") + ct

    if not HMAC_Verify(kM, c_bytes, t):
        return None

    return Dec(kE, r, ct)


# ============================================================
# 7. CCA2 GAME
# ============================================================

def cca2_game():
    print("\n--- CCA2 Game ---")

    kE = int.from_bytes(os.urandom(1), "big")
    kM = os.urandom(16)

    m = b"secret message"
    c, t = EtH_Enc(kE, kM, m)

    # tamper ciphertext
    r, ct = c
    tampered_ct = bytearray(ct)
    tampered_ct[0] ^= 1

    result = EtH_Dec(kE, kM, (r, bytes(tampered_ct)), t)

    print(f"Tampered decrypt result: {result} (should be None)")


# ============================================================
# 8. TIMING ATTACK DEMO
# ============================================================

def timing_demo():
    print("\n--- Timing Attack Demo ---")

    a = os.urandom(32)
    b1 = bytearray(a)
    b2 = bytearray(a)

    b1[0] ^= 1      # early difference
    b2[-1] ^= 1     # late difference

    start = time.time()
    insecure_compare(a, b1)
    t1 = time.time() - start

    start = time.time()
    insecure_compare(a, b2)
    t2 = time.time() - start

    print(f"Insecure compare time diff: early={t1:.6f}, late={t2:.6f}")

    start = time.time()
    secure_compare(a, b1)
    t3 = time.time() - start

    start = time.time()
    secure_compare(a, b2)
    t4 = time.time() - start

    print(f"Secure compare time diff: early={t3:.6f}, late={t4:.6f}")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("=== PA10: HMAC & CCA-Secure Encryption ===")

    k = os.urandom(16)

    # HMAC demo
    m = b"hello"
    t = HMAC(k, m)
    print(f"HMAC: {t.hex()}")

    print(f"Verify: {HMAC_Verify(k, m, t)}")

    # EUF-CMA
    euf_cma_game(k)

    # MAC ⇒ CRHF
    print("\nMAC-based Hash:", MAC_Hash(k, b"test").hex())

    # Length extension
    length_extension_demo(k)

    # CCA secure encryption
    kE = int.from_bytes(os.urandom(1), "big")
    kM = os.urandom(16)

    msg = b"hello world"
    c, t = EtH_Enc(kE, kM, msg)
    dec = EtH_Dec(kE, kM, c, t)

    print("\nCCA Decryption success:", dec == msg)

    # CCA2 test
    cca2_game()

    # timing demo
    timing_demo()