import os
from pa2 import prf

MASK = 0xFF

# --- Invertible block cipher via PRF-keyed S-box ---
def _sbox(k):
    box = list(range(256))
    for i in range(256):
        j = (prf(k, i) ^ i) % 256
        box[i], box[j] = box[j], box[i]
    inv = [0] * 256
    for i, v in enumerate(box): inv[v] = i
    return box, inv

_cache = {}
def _boxes(k):
    if k not in _cache: _cache[k] = _sbox(k)
    return _cache[k]

def Ek(k, x):     return _boxes(k)[0][x & MASK]
def Ek_inv(k, x): return _boxes(k)[1][x & MASK]   # true inverse

def rand(): return int.from_bytes(os.urandom(1), "big")

# --- CBC ---
def cbc_enc(k, m: bytes, iv=None):
    iv = iv if iv is not None else rand()
    prev, ct = iv, [iv]
    for b in m:
        prev = Ek(k, prev ^ b)
        ct.append(prev)
    return ct

def cbc_dec(k, ct: list):
    iv, blocks = ct[0], ct[1:]
    prev, pt = iv, []
    for c in blocks:
        pt.append(Ek_inv(k, c) ^ prev)   # FIXED: correct inverse
        prev = c
    return bytes(pt)

# --- OFB ---
def ofb_enc(k, m: bytes, iv=None):
    iv = iv if iv is not None else rand()
    s, ct = iv, [iv]
    for b in m:
        s = Ek(k, s)
        ct.append(s ^ b)
    return ct

def ofb_dec(k, ct: list):
    iv, blocks = ct[0], ct[1:]
    s, pt = iv, []
    for c in blocks:
        s = Ek(k, s)
        pt.append(s ^ c)
    return bytes(pt)

# --- CTR ---
def ctr_enc(k, m: bytes, r=None):
    r = r if r is not None else rand()
    return [r] + [Ek(k, (r+i) & MASK) ^ b for i, b in enumerate(m)]

def ctr_dec(k, ct: list):
    r, blocks = ct[0], ct[1:]
    return bytes(Ek(k, (r+i) & MASK) ^ c for i, c in enumerate(blocks))

# --- Unified API ---
def encrypt(mode, k, m): return {"CBC": cbc_enc, "OFB": ofb_enc, "CTR": ctr_enc}[mode](k, m)
def decrypt(mode, k, ct): return {"CBC": cbc_dec, "OFB": ofb_dec, "CTR": ctr_dec}[mode](k, ct)

# --- CBC IV-reuse attack ---
def cbc_iv_reuse_attack(k):
    iv = rand()
    ct0 = cbc_enc(k, b"AABB", iv=iv)
    ct1 = cbc_enc(k, b"AAXX", iv=iv)
    print("CBC IV-reuse attack:")
    for i in range(1, min(len(ct0), len(ct1))):
        if ct0[i] == ct1[i]:
            print(f"  Block {i-1}: ct0==ct1 → m0[{i-1}] == m1[{i-1}] (leaked!)")

# --- OFB keystream-reuse attack ---
def ofb_iv_reuse_attack(k):
    iv = rand()
    ct0 = ofb_enc(k, b"SECRET", iv)[1:]
    ct1 = ofb_enc(k, b"XXXXXX", iv)[1:]
    xored = bytes(a ^ b for a, b in zip(ct0, ct1))
    expected = bytes(a ^ b for a, b in zip(b"SECRET", b"XXXXXX"))
    print(f"OFB IV-reuse: xor={xored.hex()} == m0^m1={expected.hex()} → {xored==expected}")

# --- Demo ---
if __name__ == "__main__":
    k = rand()
    print("=== Correctness ===")
    for mode in ["CBC", "OFB", "CTR"]:
        for m in [b"A", b"ABC", b"Hello!"]:
            ct = encrypt(mode, k, m)
            pt = decrypt(mode, k, ct)
            print(f"  {'✓' if pt==m else '✗'} {mode} {m!r} → {pt!r}")
    print()
    cbc_iv_reuse_attack(k)
    print()
    ofb_iv_reuse_attack(k)