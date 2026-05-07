import os
from proxy_random import random
from pa1 import prg

# --- GGM Tree Construction ---
class GGM_PRF:
    def __init__(self, depth=32):
        self.depth = depth

    def G(self, s: int) -> tuple:
        """
        Length-doubling PRG using PA#1.
        Expands a 64-bit seed into two 64-bit halves (128 bits total).
        """
        # Generate 128 bits to split into two 64-bit integers
        bits = prg(s, 128)
        
        def b2i(b):
            res = 0
            for bit in b:
                res = (res << 1) | bit
            return res
            
        return b2i(bits[:64]), b2i(bits[64:])

    def evaluate(self, k: int, x: int) -> int:
        """
        Follows the root-to-leaf path defined by bits of x.
        """
        curr = k
        for i in range(self.depth - 1, -1, -1):
            bit = (x >> i) & 1
            left, right = self.G(curr)
            curr = right if bit else left
        return curr

# --- PRG from PRF (Backward Direction) ---
def prg_from_prf(s: int, depth=8) -> tuple:
    """G(s) = Fs(0) || Fs(1)"""
    prf_inst = GGM_PRF(depth)
    return prf_inst.evaluate(s, 0), prf_inst.evaluate(s, 1)

# --- Unified Interface ---
def F(k: int, x: int) -> int:
    """Exposed PRF interface."""
    return GGM_PRF().evaluate(k, x)

# --- Distinguishing Game ---
def distinguishing_game(prf_fn, q=100):
    """
    Test that distinguishes PRF from a random function.
    q: number of queries.
    """
    print(f"\n--- Distinguishing Game (q={q}) ---")
    k = int.from_bytes(os.urandom(4), "big")
    
    # Real PRF outputs
    prf_outputs = [prf_fn(k, i) for i in range(q)]
    
    # Truly random outputs (simulated)
    random_outputs = [int.from_bytes(os.urandom(4), "big") for _ in range(q)]
    
    # Statistical check: collision frequency
    # In a truly random function with large range, collisions are rare.
    prf_unique = len(set(prf_outputs))
    rand_unique = len(set(random_outputs))
    
    print(f"  PRF Unique Outputs: {prf_unique}/{q}")
    print(f"  Random Unique Outputs: {rand_unique}/{q}")
    
    if prf_unique == q:
        print("  Verdict: PRF looks pseudorandom (no collisions in small sample).")
    else:
        print(f"  Verdict: Observed {q - prf_unique} collisions in PRF.")

if __name__ == "__main__":
    k = int.from_bytes(os.urandom(4), "big")
    ggm = GGM_PRF(depth=8)
    
    print("=== GGM PRF Demo ===")
    for x in [0, 1, 255]:
        print(f"  F(k, {x:08b}) = {ggm.evaluate(k, x)}")

    print("\n=== Backward Reduction: PRG from PRF ===")
    l, r = prg_from_prf(k)
    print(f"  G(k) = {l} || {r}")

    distinguishing_game(F)
