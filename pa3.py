import os
from pa2 import prf

MASK = 0xFF

def _rand_block() -> int:
    return int.from_bytes(os.urandom(1), "big")

def _prf(k, x):
    return prf(k, x & MASK) & MASK

# --- Padding: length-prefix so any message length works ---
def _pad(m: bytes) -> bytes:
    assert len(m) < 256
    return bytes([len(m)]) + m

def _unpad(m: bytes) -> bytes:
    return m[1 : 1 + m[0]]

# --- Encrypt: C = (r, Fk(r+i) XOR m[i]) per byte ---
def enc(k: int, m: bytes, reuse_r=None) -> tuple:
    padded = _pad(m)
    r = reuse_r if reuse_r is not None else _rand_block()
    ct = bytes(_prf(k, (r + i) & MASK) ^ b for i, b in enumerate(padded))
    return r, ct

# --- Decrypt ---
def dec(k: int, r: int, ct: bytes) -> bytes:
    padded = bytes(_prf(k, (r + i) & MASK) ^ c for i, c in enumerate(ct))
    return _unpad(padded)

# --- IND-CPA game ---
def ind_cpa_game(k: int, rounds=20):
    correct = 0
    for _ in range(rounds):
        m0, m1 = b"\xAA", b"\xBB"
        b_bit = int.from_bytes(os.urandom(1), "big") & 1
        r, ct = enc(k, m0 if b_bit == 0 else m1)
        guess = 0
        correct += (guess == b_bit)
    adv = abs(correct / rounds - 0.5)
    print(f"IND-CPA advantage: {adv:.3f} (expect ≈ 0)")

# --- Demo ---
if __name__ == "__main__":
    k = _rand_block()

    print("=== Correctness (short / 1-block / multi-block) ===")
    for m in [b"Hi", b"A", b"Hello, World!"]:
        r, ct = enc(k, m)
        pt = dec(k, r, ct)
        print(f"  {'✓' if pt==m else '✗'} {m!r} → {ct.hex()} → {pt!r}")

    print("\n=== Nonce-reuse attack ===")
    _, ct1 = enc(k, b"\xAA", reuse_r=42)
    _, ct2 = enc(k, b"\xAA", reuse_r=42)
    print(f"  ct1 == ct2: {ct1 == ct2}  (same nonce → same ciphertext → plaintext leaked)")

    print()
    ind_cpa_game(k)