import os
from pa7 import merkle_damgard

# --- Group parameters (safe prime, toy size) ---
P = 0xFFFB
Q = (P - 1) // 2
G = 3

_alpha = int.from_bytes(os.urandom(2), "big") % (Q - 1) + 1  # alpha in [1, Q-1]
H_HAT  = pow(G, _alpha, P)
del _alpha

# --- DLP Compression: h(x, y) = g^x * H_hat^y mod p ---
def dlp_compress(cv: int, block: bytes) -> int:
    half = max(1, len(block) // 2)
    x = (int.from_bytes(block[:half], "big") ^ cv) % Q
    y = int.from_bytes(block[half:], "big") % Q
    return (pow(G, x, P) * pow(H_HAT, y, P)) % P

# --- Full DLP Hash ---
def dlp_hash(message: bytes) -> int:
    return merkle_damgard(dlp_compress, message, block_size=8, iv=1)

def hash_message(m: bytes) -> int:
    """
    Collision-resistant hash function for PA#15.
    Returns the DLP hash as an integer.
    """
    return dlp_hash(m)

# --- Collision resistance demo ---
def brute_collision(n_bits=12, limit=500):
    seen = {}
    for i in range(limit):
        m = i.to_bytes(4, "big")
        h = dlp_hash(m) & ((1 << n_bits) - 1)
        if h in seen:
            print(f"Collision at i={i} (~2^{n_bits/2:.0f} expected): "
                  f"{seen[h].hex()} and {m.hex()}")
            return i
        seen[h] = m
    print(f"No collision in {limit} tries")

# --- Demo ---
if __name__ == "__main__":
    for m in [b"hello", b"world", b"", b"a"*20, b"test123"]:
        print(f"DLP_Hash({m!r:15}) = {dlp_hash(m):#06x}")
    print()
    brute_collision(n_bits=12)