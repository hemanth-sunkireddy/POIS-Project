import os
from pa8 import dlp_hash
from pa3 import enc, dec

BLOCK = 8
IPAD  = 0x36
OPAD  = 0x5C

# --- Key padding ---
def _pad_key(k: bytes) -> bytes:
    if len(k) > BLOCK:
        k = dlp_hash(k).to_bytes(4, "big")
    return k.ljust(BLOCK, b"\x00")

# --- HMAC = H( (k⊕opad) || H( (k⊕ipad) || m ) ) ---
def hmac(k: bytes, m: bytes) -> int:
    kp    = _pad_key(k)
    ikey  = bytes(b ^ IPAD for b in kp)
    okey  = bytes(b ^ OPAD for b in kp)
    inner = dlp_hash(ikey + m).to_bytes(4, "big")
    return dlp_hash(okey + inner)

# --- Constant-time comparison ---
def secure_cmp(t1: int, t2: int) -> bool:
    a = t1.to_bytes(4, "big")
    b = t2.to_bytes(4, "big")
    diff = 0
    for x, y in zip(a, b): diff |= x ^ y
    return diff == 0

def hmac_verify(k: bytes, m: bytes, t: int) -> bool:
    return secure_cmp(hmac(k, m), t)

# --- MAC⇒CRHF (backward): HMAC as compression fn ---
def mac_compress(cv: int, block: bytes) -> int:
    return hmac(cv.to_bytes(4, "big"), block)

# --- Encrypt-then-HMAC (CCA-secure) ---
def eth_enc(kE, kM, m):
    r, ct = enc(kE, m)
    t = hmac(kM, r.to_bytes(1, "big") + ct)
    return (r, ct), t

def eth_dec(kE, kM, CE, t):
    r, ct = CE
    if not hmac_verify(kM, r.to_bytes(1, "big") + ct, t):
        return None
    return dec(kE, r, ct)            # FIXED: correct dec(k, r, ct) signature

# --- Length-extension demo (naive vs HMAC) ---
def length_extension_demo(k: bytes, m: bytes):
    naive_t  = dlp_hash(k + m)
    suffix   = b"EVIL"
    extended = dlp_hash(k + m + b"\x80\x00" + suffix)
    print(f"Naive  H(k||m||pad||m') forgeable : tag={extended:#010x}")
    hmac_t = hmac(k, m)
    print(f"HMAC   tag={hmac_t:#010x}  ← adversary cannot extend without k")

# --- EUF-CMA game ---
def euf_cma_game(k: bytes, queries=50, attempts=20):
    signed = {i: hmac(k, bytes([i])) for i in range(queries)}
    successes = 0
    for i in range(attempts):
        m_star = (0xD0 + i) & 0xFF
        if m_star in signed: continue
        t_guess = int.from_bytes(os.urandom(4), "big")
        if hmac_verify(k, bytes([m_star]), t_guess):
            successes += 1
    print(f"EUF-CMA: {successes}/{attempts} forgeries (expect 0)")

# --- Demo ---
if __name__ == "__main__":
    k = os.urandom(4)
    m = b"authenticate this"

    t = hmac(k, m)
    print(f"HMAC tag : {t:#010x}")
    print(f"Verify   : {hmac_verify(k, m, t)}")
    print()
    length_extension_demo(k, b"msg")
    print()
    euf_cma_game(k)
    print()
    kE = int.from_bytes(os.urandom(1), "big")
    CE, t2 = eth_enc(kE, k, b"secret")
    pt = eth_dec(kE, k, CE, t2)
    print(f"EtH dec  : {pt}")