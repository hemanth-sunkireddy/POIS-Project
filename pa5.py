import os
from pa2 import prf

MASK = 0xFF
def Fk(k, x): return prf(k, x & MASK) & MASK

# --- PRF-MAC ---
def prf_mac(k: int, m: int) -> int:
    return Fk(k, m)

def prf_vrfy(k: int, m: int, t: int) -> bool:
    return prf_mac(k, m) == t

# --- CBC-MAC ---
def cbc_mac(k: int, m: bytes) -> int:
    state = 0
    for byte in m:
        state = Fk(k, state ^ byte)
    return state

def cbc_mac_vrfy(k: int, m: bytes, t: int) -> bool:
    return cbc_mac(k, m) == t

# --- HMAC stub ---
def hmac(k, m):
    raise NotImplementedError("HMAC implemented in PA#10")

# --- MAC => PRF (backward) ---
def mac_as_prf(k, x): return prf_mac(k, x)

# --- EUF-CMA game ---
def euf_cma_game(k, queries=50, attempts=20):
    signed = {i & MASK: prf_mac(k, i & MASK) for i in range(queries)}
    successes = 0
    for i in range(attempts):
        m_star = (0xD0 + i) & MASK
        if m_star in signed: continue
        t_guess = int.from_bytes(os.urandom(1), "big")
        if prf_vrfy(k, m_star, t_guess):
            successes += 1
    print(f"EUF-CMA: {successes}/{attempts} forgeries (expect 0)")

# --- Length-extension attack on naive H(k||m) ---
def naive_mac(k: int, m: bytes) -> int:
    """Broken MAC: state = H(k || m), vulnerable to extension."""
    return cbc_mac(k, bytes([k]) + m)

def length_extension_demo(k: int):
    m = b"hello"
    t = naive_mac(k, m)
    # Attacker continues from state=t without knowing k
    forged = t
    for byte in b"\x00" + b"world":
        forged = Fk(k, forged ^ byte)
    correct = naive_mac(k, m + b"\x00" + b"world")
    print(f"Length-extension attack:")
    print(f"  forged={forged:#x}  correct={correct:#x}  match={forged==correct}")
    print(f"  Same attack on HMAC → impossible (outer hash re-keys with k⊕opad)")

# --- Demo ---
if __name__ == "__main__":
    k = int.from_bytes(os.urandom(1), "big")
    m = b"hello"

    t1 = prf_mac(k, 0x42)
    print(f"PRF-MAC : tag={t1:#04x}  vrfy={prf_vrfy(k, 0x42, t1)}")

    t2 = cbc_mac(k, m)
    print(f"CBC-MAC : tag={t2:#04x}  vrfy={cbc_mac_vrfy(k, m, t2)}")

    outputs = {mac_as_prf(k, x) for x in range(100)}
    print(f"MAC=>PRF: unique/100={len(outputs)}")

    print()
    euf_cma_game(k)
    print()
    length_extension_demo(k)