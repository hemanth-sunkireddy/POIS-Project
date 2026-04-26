import os
import math

# --- Miller-Rabin (from PA#13, inlined) ---
def miller_rabin(n, k=20):
    if n < 2: return False
    if n == 2: return True
    if n % 2 == 0: return False
    s, d = 0, n - 1
    while d % 2 == 0: s += 1; d //= 2
    for _ in range(k):
        a = int.from_bytes(os.urandom(4), "big") % (n - 3) + 2
        x = pow(a, d, n)
        if x in (1, n - 1): continue
        for _ in range(s - 1):
            x = pow(x, 2, n)
            if x == n - 1: break
        else: return False
    return True

def gen_prime(bits):
    while True:
        n = int.from_bytes(os.urandom(bits // 8), "big") | (1 << (bits-1)) | 1
        if miller_rabin(n): return n

# --- Extended GCD → modular inverse ---
def egcd(a, b):
    if b == 0: return a, 1, 0
    g, x, y = egcd(b, a % b)
    return g, y, x - (a // b) * y

def mod_inv(a, n):
    _, x, _ = egcd(a % n, n)
    return x % n

# --- RSA Key Generation ---
def rsa_keygen(bits=512):
    while True:
        p = gen_prime(bits // 2)
        q = gen_prime(bits // 2)
        
        # Ensure p != q
        if p == q:
            continue
        
        N   = p * q
        phi = (p - 1) * (q - 1)
        e   = 65537
        
        # Ensure gcd(e, phi) == 1 (required for inverse to exist)
        if math.gcd(e, phi) != 1:
            continue
        
        d     = mod_inv(e, phi)
        dp    = d % (p - 1)
        dq    = d % (q - 1)
        q_inv = mod_inv(q, p)
        
        pk = (N, e)
        sk = (N, d, p, q, dp, dq, q_inv)
        return pk, sk

# --- Textbook RSA ---
def rsa_enc(pk, m: int) -> int:
    N, e = pk
    return pow(m, e, N)

def rsa_dec(sk, c: int) -> int:
    N, d = sk[0], sk[1]
    return pow(c, d, N)

# --- PKCS#1 v1.5 ---
def pkcs15_enc(pk, m: bytes) -> int:
    N, _ = pk
    k    = (N.bit_length() + 7) // 8
    assert len(m) <= k - 11
    ps   = b""
    while len(ps) < k - len(m) - 3:
        b = os.urandom(1)
        if b != b"\x00": ps += b
    em = b"\x00\x02" + ps + b"\x00" + m
    return rsa_enc(pk, int.from_bytes(em, "big"))

def pkcs15_dec(sk, c):
    N = sk[0]
    k = (N.bit_length() + 7) // 8
    try:
        em = rsa_dec(sk, c).to_bytes(k, "big")
    except OverflowError:
        return None          # malformed/corrupted ciphertext
    if em[0:2] != b"\x00\x02":
        return None
    try:
        sep = em.index(b"\x00", 2)
    except ValueError:
        return None
    if sep < 10:
        return None
    return em[sep + 1:]

# --- Demo ---
if __name__ == "__main__":
    pk, sk = rsa_keygen(256)
    print(f"N = {pk[0]}")
    print()

    # Textbook determinism attack
    c1 = rsa_enc(pk, 42)
    c2 = rsa_enc(pk, 42)
    print(f"Textbook: c1==c2 (determinism): {c1 == c2}")
    print(f"Textbook dec: {rsa_dec(sk, c1)}")
    print()

    # PKCS#1 v1.5 randomness
    c3 = pkcs15_enc(pk, b"vote:yes")
    c4 = pkcs15_enc(pk, b"vote:yes")
    print(f"PKCS: c3==c4 (should differ): {c3 == c4}")
    print(f"PKCS dec: {pkcs15_dec(sk, c3)}")