import os, hashlib, hmac as _hmac
from pa1 import prg, owf

def G(s: int, n: int = 8) -> tuple:
    bits = prg(s, 2 * n)
    def b2i(b): return int("".join(str(x) for x in b), 2)
    return b2i(bits[:n]), b2i(bits[n:])

def G0(s, n=8): return G(s, n)[0]
def G1(s, n=8): return G(s, n)[1]

def prf(k: int, x: int, depth: int = 8) -> int:
    s = k
    for i in range(depth - 1, -1, -1):
        s = G1(s) if (x >> i) & 1 else G0(s)
    return s

def prg_from_prf(s: int, depth=8) -> tuple:
    return prf(s, 0, depth), prf(s, 1, depth)

# --- AES plugin (substitute with your own AES-128 for full credit) ---
def aes_prf(k: int, x: int) -> int:
    kb = k.to_bytes(max(1, (k.bit_length()+7)//8), "big")
    xb = x.to_bytes(max(1, (x.bit_length()+7)//8), "big")
    return _hmac.new(kb, xb, hashlib.sha256).digest()[0]

# --- Public interface for PA#3, PA#4, PA#5 ---
def F(k: int, x: int) -> int:
    return prf(k, x)

# --- Demo ---
if __name__ == "__main__":
    k = int.from_bytes(os.urandom(4), "big")

    print("=== GGM PRF ===")
    for x in [0b00000000, 0b00000001, 0b11111111]:
        print(f"  PRF(k, {x:08b}) = {prf(k, x):08b}")

    print("\n=== PRG from PRF (backward) ===")
    l, r = prg_from_prf(k)
    print(f"  G(k) = {l:08b} | {r:08b}")

    print("\n=== AES plugin ===")
    for x in [0, 1, 255]:
        print(f"  aes_prf(k, {x}) = {aes_prf(k, x):08b}")

    print("\n=== Distinguishing game (100 queries) ===")
    outputs = {prf(k, x) for x in range(100)}
    print(f"  Unique PRF outputs: {len(outputs)} / 100 (expect ~100)")