import os
import math
import time
from pa13_primality import gen_prime

def modular_exponentiation(base, exp, mod):
    """
    Computes (base^exp) % mod using square-and-multiply.
    """
    if mod == 1:
        return 0
    res = 1
    base %= mod
    while exp > 0:
        if exp & 1:
            res = (res * base) % mod
        base = (base * base) % mod
        exp >>= 1
    return res

def extended_gcd(a, b):
    """Refined Extended Euclidean Algorithm."""
    if a == 0:
        return b, 0, 1
    gcd, x1, y1 = extended_gcd(b % a, a)
    x = y1 - (b // a) * x1
    y = x1
    return gcd, x, y

def mod_inverse(a, m):
    gcd, x, _ = extended_gcd(a % m, m)
    if gcd != 1:
        raise ValueError("Mod inverse does not exist")
    return x % m

def rsa_keygen(bits, e=65537):
    """
    Generates RSA keys using probable primes from PA#13.
    Returns a dictionary with n, e, d, p, q, dp, dq, q_inv.
    """
    while True:
        p, _ = gen_prime(bits)
        q, _ = gen_prime(bits)
        if p == q:
            continue

        n = p * q
        phi = (p - 1) * (q - 1)
        if math.gcd(e, phi) != 1:
            continue

        d = mod_inverse(e, phi)
        dp = d % (p - 1)
        dq = d % (q - 1)
        q_inv = mod_inverse(q, p)

        return {
            "n": n,
            "e": e,
            "d": d,
            "p": p,
            "q": q,
            "dp": dp,
            "dq": dq,
            "q_inv": q_inv,
        }

def rsa_enc(pk, m):
    """Textbook RSA encryption: c = m^e mod n"""
    n, e = pk
    return modular_exponentiation(m, e, n)

def rsa_dec(sk, c):
    """Textbook RSA decryption: m = c^d mod n"""
    n, d = sk
    return modular_exponentiation(c, d, n)

def crt(residues, moduli):
    """
    Solves x = a_i (mod n_i) using the constructive formula.
    residues: [a1, a2, ..., ak]
    moduli: [n1, n2, ..., nk]
    """
    if len(residues) != len(moduli):
        raise ValueError("Residues and moduli must have the same length")
    
    N = 1
    for n in moduli:
        N *= n
    
    result = 0
    for a, n in zip(residues, moduli):
        Mi = N // n
        yi = mod_inverse(Mi, n)
        result = (result + a * Mi * yi) % N
        
    return result

def rsa_dec_crt(sk, c):
    """
    RSA decryption using Garner's Algorithm.
    sk should contain: p, q, dp, dq, q_inv
    """
    p = sk['p']
    q = sk['q']
    dp = sk['dp']
    dq = sk['dq']
    q_inv = sk['q_inv']
    
    # mp = c^dp mod p
    mp = modular_exponentiation(c, dp, p)
    # mq = c^dq mod q
    mq = modular_exponentiation(c, dq, q)
    
    # Garner's Recombination
    # h = q_inv * (mp - mq) mod p
    h = (q_inv * (mp - mq)) % p
    
    # m = mq + h * q
    m = mq + h * q
    return m

def integer_nth_root(x, e):
    """
    Computes the integer e-th root of x using Newton's method.
    Finds y such that y^e <= x < (y+1)^e
    """
    if x == 0: return 0
    if x < 0: return None # Root of negative only for odd e, but RSA uses e=3 usually
    
    # Initial guess: 2^(bits/e + 1)
    low = 0
    high = 1 << ((x.bit_length() + e - 1) // e + 1)
    
    # Newton's method
    y = high
    while True:
        # y_next = ((e-1)*y + x // y^(e-1)) // e
        y_pow = pow(y, e - 1)
        if y_pow == 0: # Safety
             y_next = 0
        else:
             y_next = ((e - 1) * y + (x // y_pow)) // e
        
        if y_next >= y:
            break
        y = y_next
    
    # Correctness check/refinement because of integer division floor
    # We want max y such that y^e <= x
    # This prevents infinite loops and ensures we reach the floor correctly.
    if y < 0: y = 0
    # Newton's usually converges to y or y+1
    while pow(y + 1, e) <= x:
        y += 1
    while y > 0 and pow(y, e) > x:
        y -= 1
        
    return y

def hastad_attack(ciphertexts, moduli, e):
    """
    Håstad's Broadcast Attack for small exponent e.
    ciphertexts: list of c_i = m^e mod N_i
    moduli: list of N_i
    e: the public exponent
    """
    if len(ciphertexts) < e:
        raise ValueError(f"Need at least {e} ciphertexts for Hastad's attack with e={e}")
    
    # 1. Apply CRT to find x = m^e mod (N1*N2*...*Ne)
    x = crt(ciphertexts[:e], moduli[:e])
    
    # 2. Since m^e < N1*N2*...*Ne, x is exactly m^e as an integer
    m = integer_nth_root(x, e)
    
    return m

def benchmark_decryption(bits=1024, iterations=100):
    """
    Benchmarks standard RSA decryption vs CRT-based decryption.
    Returns (avg_std, avg_crt, speedup)
    """
    keys = rsa_keygen(bits // 2) # n will be roughly bits length
    n = keys['n']
    e = keys['e']
    d = keys['d']
    
    sk_std = (n, d)
    # sk_crt is keys itself
    
    import random
    messages = [random.randint(1, n-1) for _ in range(iterations)]
    ciphertexts = [rsa_enc((n, e), m) for m in messages]
    
    # Standard benchmark
    start = time.time()
    for c in ciphertexts:
        _ = rsa_dec(sk_std, c)
    std_time = time.time() - start
    
    # CRT benchmark
    start = time.time()
    for c in ciphertexts:
        _ = rsa_dec_crt(keys, c)
    crt_time = time.time() - start
    
    avg_std = std_time / iterations
    avg_crt = crt_time / iterations
    speedup = std_time / crt_time if crt_time > 0 else 0
    
    return avg_std, avg_crt, speedup

# --- Benchmark for integer_nth_root ---
if __name__ == "__main__":
    # Test with a very large x that is not a perfect cube
    e = 3
    bits = 10000 # 10k bits
    x = (1 << bits) + 7
    print(f"Testing {bits} bits...")
    start = time.time()
    root = integer_nth_root(x, e)
    end = time.time()
    print(f"Result: {root % 1000}...")
    print(f"Time taken: {end - start:.6f}s")

    # Test with a huge x (e.g. 100k bits)
    bits = 100000
    x = (1 << bits) + 123
    print(f"Testing {bits} bits...")
    start = time.time()
    root = integer_nth_root(x, e)
    end = time.time()
    print(f"Result: {root % 1000}...")
    print(f"Time taken: {end - start:.6f}s")
