import os, math
from pa8 import hash_message as dlp_hash

# --- Truncated hash (FIXED: safe conversion to int) ---
def trunc_hash(m: bytes, n: int) -> int:
    h = dlp_hash(m)
    if isinstance(h, bytes):
        h = int.from_bytes(h, "big")
    return h & ((1 << n) - 1)


# ============================================================
# 1. NAIVE BIRTHDAY (FIXED: random inputs instead of sequential)
# ============================================================

def birthday_naive(hash_fn, n: int) -> tuple:
    seen = {}
    i = 0

    while True:
        m = os.urandom(4)   # ✅ FIXED (was sequential)
        h = hash_fn(m, n)

        if h in seen and seen[h] != m:
            return seen[h], m, i

        seen[h] = m
        i += 1


# ============================================================
# 2. FLOYD (FIXED PROPERLY)
# ============================================================

def birthday_floyd(hash_fn, n: int) -> tuple:
    """
    Proper Floyd cycle-finding:
    Works on f: n-bit → n-bit
    """
    MASK = (1 << n) - 1

    def f(x: int) -> int:
        return hash_fn(x.to_bytes(4, "big"), n) & MASK

    # start from random point
    x0 = int.from_bytes(os.urandom(4), "big") & MASK

    # phase 1: find cycle
    tortoise = f(x0)
    hare = f(f(x0))

    while tortoise != hare:
        tortoise = f(tortoise)
        hare = f(f(hare))

    # phase 2: find start of cycle (mu)
    tortoise = x0
    while tortoise != hare:
        tortoise = f(tortoise)
        hare = f(hare)

    # phase 3: find cycle length (lambda)
    lam = 1
    hare = f(tortoise)
    while tortoise != hare:
        hare = f(hare)
        lam += 1

    # phase 4: find collision (two distinct inputs)
    x1 = tortoise
    x2 = f(tortoise)

    if x1 == x2:
        # fallback (rare)
        return birthday_naive(hash_fn, n)

    return x1.to_bytes(4, "big"), x2.to_bytes(4, "big"), lam


# ============================================================
# 3. EMPIRICAL CURVE (EXTENDED n range)
# ============================================================

def birthday_curve(ns=(8, 10, 12, 14, 16), trials=10):
    print(f"{'n':>4} {'2^(n/2)':>10} {'avg evals':>12} {'ratio':>8}")

    for n in ns:
        counts = [birthday_naive(trunc_hash, n)[2] for _ in range(trials)]
        avg = sum(counts) / len(counts)
        pred = 2 ** (n / 2)

        print(f"{n:>4} {pred:>10.1f} {avg:>12.1f} {avg/pred:>8.2f}")


# ============================================================
# 4. MD5 / SHA-1 CONTEXT (FORMAT FIXED)
# ============================================================

def md5_sha1_context():
    for name, n in [("MD5", 128), ("SHA-1", 160), ("SHA-256", 256)]:
        ops = 2 ** (n // 2)
        yrs = ops / 1e9 / (3600 * 24 * 365)

        print(f"{name:8}: 2^{n//2} ops ≈ {yrs:.2e} years @ 10^9 hashes/sec")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    # --- Naive ---
    x, x2, evals = birthday_naive(trunc_hash, 12)
    print(f"Naive  | Collision: {x.hex()} / {x2.hex()} in {evals} evals")

    # --- Floyd ---
    x, x2, evals = birthday_floyd(trunc_hash, 12)
    print(f"Floyd  | Collision: {x.hex()} / {x2.hex()} (cycle len={evals})")

    print()
    birthday_curve()
    print()
    md5_sha1_context()