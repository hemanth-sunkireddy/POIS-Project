from pa1 import get_random_range, get_random_bits

def modular_exponentiation(base, exp, mod):
    """
    Computes (base^exp) % mod using the square-and-multiply algorithm.
    Follows the No-Library Rule.
    """
    res = 1
    base = base % mod
    while exp > 0:
        if exp % 2 == 1:
            res = (res * base) % mod
        base = (base * base) % mod
        exp //= 2
    return res

def miller_rabin(n, k=40):
    """
    Performs the Miller-Rabin primality test.
    Returns (result, witnesses) where witnesses is a list of (a, outcome) pairs
    for the React demo.
    """
    if n < 2: return "COMPOSITE", []
    if n == 2 or n == 3: return "PROBABLY PRIME", []
    if n % 2 == 0: return "COMPOSITE", []

    # Step 1: Write n-1 = 2^s * d
    s = 0
    d = n - 1
    while d % 2 == 0:
        d //= 2
        s += 1
    
    witnesses = []
    
    # Step 2: k rounds
    for _ in range(k):
        a = get_random_range(2, n - 2)
        x = modular_exponentiation(a, d, n)
        
        witness_data = {"a": str(a), "rounds": []}
        witness_data["rounds"].append(str(x))
        
        if x == 1 or x == n - 1:
            witnesses.append(witness_data)
            continue
            
        found_witness = False
        for r in range(1, s):
            x = modular_exponentiation(x, 2, n)
            witness_data["rounds"].append(str(x))
            if x == n - 1:
                found_witness = True
                break
        
        if not found_witness:
            witnesses.append(witness_data)
            return "COMPOSITE", witnesses
        
        witnesses.append(witness_data)
            
    return "PROBABLY PRIME", witnesses

def is_prime(n, k=40):
    """
    Public interface as specified in PA#13.
    Returns True if n is probably prime.
    """
    if n < 2: return False
    if n == 2 or n == 3: return True
    if n % 2 == 0: return False
    
    # Simple Fermat check for 561 demo if needed, but we use Miller-Rabin
    result, _ = miller_rabin(n, k)
    return result == "PROBABLY PRIME"

def gen_prime(bits, k=40):
    """
    Generates a probable prime of specified bit length.
    """
    candidates_sampled = 0
    while True:
        candidates_sampled += 1
        # Sample random odd b-bit integer
        p = get_random_bits(bits)
        if p % 2 == 0:
            p += 1
        
        if is_prime(p, k):
            # Sanity check with 100 rounds
            if is_prime(p, 100):
                return p, candidates_sampled

def fermat_test(n, a):
    """Simple Fermat Primality Test for the Carmichael demo."""
    if n < 2: return False
    return modular_exponentiation(a, n-1, n) == 1

# --- Benchmarks and Demos ---
import time
import math

def run_carmichael_demo():
    print("--- Carmichael Number Demo (n=561) ---")
    n = 561
    # 561 = 3 * 11 * 17
    
    # Fermat test with a = 2
    f_res = fermat_test(n, 2)
    print(f"Fermat Test (a=2): {'Passed' if f_res else 'Failed'}")
    
    # Miller-Rabin test
    mr_res, witnesses = miller_rabin(n, k=40)
    print(f"Miller-Rabin Test: {mr_res}")
    print(f"Witnesses tested: {len(witnesses)}")

def get_theoretical_density(bits):
    # Probability of prime is 1 / ln(n)
    # n = 2^bits
    # ln(2^bits) = bits * ln(2)
    return bits * math.log(2)

def run_performance_benchmarks():
    print("\n--- Performance Benchmarks ---")
    bit_lengths = [512, 1024, 2048]
    
    for bits in bit_lengths:
        print(f"Sampling {bits}-bit prime...", end="", flush=True)
        start_time = time.time()
        p, trials = gen_prime(bits)
        end_time = time.time()
        
        theoretical = get_theoretical_density(bits)
        
        print("\r" + " " * 50 + "\r", end="") # Clear line
        print(f"{bits}-bit prime found in {trials} trials.")
        print(f"  Time taken: {end_time - start_time:.4f} seconds")
        print(f"  Theoretical trials (ln n): ~{theoretical:.2f}")
        print(f"  Ratio (actual/theoretical): {trials/theoretical:.4f}")

if __name__ == "__main__":
    run_carmichael_demo()
    run_performance_benchmarks()
