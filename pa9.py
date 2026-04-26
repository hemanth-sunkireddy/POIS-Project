import os, math
from pa8 import dlp_hash

# --- Truncated hash ---
def trunc_hash(m: bytes, n: int) -> int:
    return dlp_hash(m) & ((1 << n) - 1)

# --- Approach 1: Naive birthday (dict-based) ---
def birthday_naive(hash_fn, n: int) -> tuple:
    seen = {}
    i = 0
    while True:
        m = i.to_bytes(4, "big")
        h = hash_fn(m, n)
        if h in seen and seen[h] != m:
            return seen[h], m, i
        seen[h] = m
        i += 1

# --- Approach 2: Floyd's cycle detection (FIXED) ---
def birthday_floyd(hash_fn, n: int) -> tuple:
    MASK = (1 << n) - 1
    def f(x): return hash_fn(x.to_bytes(4, "big"), n)

    # Tortoise & hare — find cycle
    t = int.from_bytes(os.urandom(2), "big") & MASK
    h = t
    while True:
        t = f(t)
        h = f(f(h))
        if t == h:
            break

    # Find two distinct inputs with same hash output
    # Walk from a fresh start until t != h but f(t) == f(h)
    t2 = int.from_bytes(os.urandom(2), "big") & MASK
    evals = 0
    while True:
        ft2 = f(t2)
        fh  = f(h)
        if ft2 == fh and t2 != h:          # FIXED: was f(t)!=f(h), now t2!=h
            return t2, h, evals
        t2 = ft2
        h  = fh
        evals += 1
        if evals > 10000:                   # safety limit
            # fallback to naive
            a, b, ev = birthday_naive(hash_fn, n)
            return a, b, ev

# --- Empirical birthday curve ---
def birthday_curve(ns=(8, 10, 12), trials=5):
    print(f"{'n':>4} {'2^(n/2)':>10} {'avg evals':>12} {'ratio':>8}")
    for n in ns:
        counts = [birthday_naive(trunc_hash, n)[2] for _ in range(trials)]
        avg  = sum(counts) / len(counts)
        pred = 2 ** (n / 2)
        print(f"{n:>4} {pred:>10.1f} {avg:>12.1f} {avg/pred:>8.2f}")

# --- MD5/SHA-1 context ---
def md5_sha1_context():
    for name, n in [("MD5", 128), ("SHA-1", 160), ("SHA-256", 256)]:
        ops  = 2 ** (n // 2)
        yrs  = ops / 1e9 / (3600 * 24 * 365)
        print(f"{name:8}: 2^{n//2} ops ≈ {yrs:.2e} years at 10^9 hash/sec")

# --- Demo ---
if __name__ == "__main__":
    x, x2, evals = birthday_naive(trunc_hash, 12)
    print(f"Naive  | Collision: {x.hex()} / {x2.hex()} in {evals} evals")

    x, x2, evals = birthday_floyd(trunc_hash, 12)
    def to_hex(v): return v.hex() if isinstance(v, bytes) else v.to_bytes(4,"big").hex()
    print(f"Floyd  | Collision: {to_hex(x)} / {to_hex(x2)} in {evals} evals")
    print()
    birthday_curve()
    print()
    md5_sha1_context()