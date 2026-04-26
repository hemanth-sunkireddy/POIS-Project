import os
from pa3 import enc, dec
from pa5 import cbc_mac, cbc_mac_vrfy

# --- Encrypt-then-MAC ---
def cca_enc(kE, kM, m):
    r, ct = enc(kE, m)
    tagged_ct = r.to_bytes(1, "big") + len(ct).to_bytes(2, "big") + ct
    t = cbc_mac(kM, tagged_ct)
    return (r, ct), t

def cca_dec(kE, kM, CE, t):
    r, ct = CE
    tagged_ct = r.to_bytes(1, "big") + len(ct).to_bytes(2, "big") + ct
    if not cbc_mac_vrfy(kM, tagged_ct, t):
        return None
    return dec(kE, r, ct)

# --- Malleability demo ---
def malleability_demo(kE, kM, m):
    (r, ct), t = cca_enc(kE, kM, m)

    # Flip a bit in ciphertext
    tampered_ct = bytes([ct[0] ^ 0x01]) + ct[1:]

    # CCA: MAC check fires → ⊥
    result_cca = cca_dec(kE, kM, (r, tampered_ct), t)
    print(f"CCA dec (tampered): {result_cca!r}  ← should be None (⊥)")

    # CPA: no MAC check → corrupted plaintext returned
    result_cpa = dec(kE, r, tampered_ct)
    print(f"CPA dec (tampered): {result_cpa!r}  ← corrupted plaintext")

# --- IND-CCA2 game ---
def ind_cca2_game(kE, kM, rounds=20):
    correct = 0
    for _ in range(rounds):
        m0, m1 = b"\xAA", b"\xBB"
        b_bit = int.from_bytes(os.urandom(1), "big") & 1
        (r, ct), t = cca_enc(kE, kM, m0 if b_bit == 0 else m1)
        # Adversary tampers → oracle returns ⊥
        tampered = bytes([ct[0] ^ 1]) + ct[1:]
        oracle_result = cca_dec(kE, kM, (r, tampered), t)
        guess = 0
        correct += (guess == b_bit)
    print(f"IND-CCA2 advantage: {abs(correct/rounds - 0.5):.3f} (expect ~0)")

# --- Demo ---
if __name__ == "__main__":
    kE = int.from_bytes(os.urandom(1), "big")
    kM = int.from_bytes(os.urandom(1), "big")
    m  = b"secret"

    CE, t = cca_enc(kE, kM, m)
    pt    = cca_dec(kE, kM, CE, t)
    print(f"Original : {m}")
    print(f"Decrypted: {pt}")
    print()
    malleability_demo(kE, kM, m)
    print()
    ind_cca2_game(kE, kM)