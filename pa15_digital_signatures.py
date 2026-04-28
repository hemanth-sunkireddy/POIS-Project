import random
from pa8 import hash_message
from pa14_crt_rsa import modular_exponentiation

def rsa_sign(sk, m: bytes) -> int:
    """
    Signs a message using the hashed RSA signature scheme.
    sk: (n, d)
    """
    h = hash_message(m)
    n, d = sk
    return modular_exponentiation(h, d, n)

def rsa_verify(vk, m: bytes, sigma: int) -> bool:
    """
    Verifies a signature using the public key.
    vk: (n, e)
    """
    h = hash_message(m)
    n, e = vk
    recovered_h = modular_exponentiation(sigma, e, n)
    return recovered_h == h % n

def forge_raw_rsa(s1: int, s2: int, n: int) -> int:
    """
    Demonstrates multiplicative homomorphism on RAW RSA without a hash.
    Given valid raw signatures s1 (for m1) and s2 (for m2),
    it generates a valid signature for m1 * m2 mod n.
    """
    return (s1 * s2) % n

def euf_cma_game(adversary, vk, signing_oracle):
    """
    EUF-CMA Game for Digital Signatures.
    adversary: function(vk, oracle_func) -> (m_star: bytes, sigma_star: int)
    vk: public key
    signing_oracle: function(bytes) -> int
    Returns True if the adversary wins.
    """
    queried_messages = set()
    
    def tracked_oracle(m: bytes) -> int:
        queried_messages.add(m)
        return signing_oracle(m)
        
    m_star, sigma_star = adversary(vk, tracked_oracle)
    
    # Check 1: m_star was not previously queried to the oracle
    if m_star in queried_messages:
        return False
        
    # Check 2: sigma_star is a valid signature for m_star
    return rsa_verify(vk, m_star, sigma_star)

