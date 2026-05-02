from proxy_random import random
from pa13 import modular_exponentiation
from pa14 import mod_inverse
from pa11 import generate_group

def elgamal_keygen(bits: int):
    """
    Generates a new ElGamal keypair.
    bits: approximate size of the prime p
    """
    print("Bits: ", bits)
    p, g, q = generate_group(bits)
    x = random.randint(1, q - 1)
    print("---> Elgama Before Modular Exponentiation")
    h = modular_exponentiation(g, x, p)
    print("---> Elgama After Modular Exponentiation")
    sk = (x, p)  # passing p along with sk for decryption modulus
    pk = (p, g, q, h)
    return sk, pk

def elgamal_enc(pk, m: int):
    """
    Encrypts m under pk. m must be an integer < p.
    """
    p, g, q, h = pk
    r = random.randint(1, q - 1)
    c1 = modular_exponentiation(g, r, p)
    
    h_r = modular_exponentiation(h, r, p)
    c2 = (m * h_r) % p
    
    return (c1, c2)

def elgamal_dec(sk, c1, c2):
    """
    Decrypts (c1, c2) using sk.
    """
    x, p = sk
    # Compute c1^x mod p
    c1_x = modular_exponentiation(c1, x, p)
    # m = c2 * (c1^x)^-1 mod p
    c1_x_inv = mod_inverse(c1_x, p)
    m = (c2 * c1_x_inv) % p
    return m

def elgamal_malleability_attack(c1, c2, p, multiplier):
    """
    Takes a valid ElGamal ciphertext (c1, c2) for m,
    and produces a ciphertext for m * multiplier mod p.
    """
    new_c2 = (c2 * multiplier) % p
    return (c1, new_c2)

def ind_cpa_game_elgamal(adversary, pk, sk):
    """
    IND-CPA Game for ElGamal.
    adversary: a tuple of two functions:
      - adv_phase1(pk) -> (m0, m1, state)
      - adv_phase2(pk, c1, c2, state) -> bit (0 or 1)
    Returns 1 if adversary wins, 0 otherwise.
    """
    p, g, q, h = pk
    
    # Phase 1
    m0, m1, state = adversary[0](pk)
    
    # Challenger
    b = random.choice([0, 1])
    m_b = m1 if b == 1 else m0
    c1, c2 = elgamal_enc(pk, m_b)
    
    # Phase 2
    b_prime = adversary[1](pk, c1, c2, state)
    
    return 1 if b == b_prime else 0
