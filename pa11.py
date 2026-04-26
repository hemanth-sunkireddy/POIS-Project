import os

# --- Group parameters (safe prime p = 2q+1) ---
P = 0xFFFFFFFB
Q = (P - 1) // 2
G = 3

def rand_exp() -> int:
    return int.from_bytes(os.urandom(4), "big") % Q + 1

# --- Alice ---
def dh_alice_step1():
    a = rand_exp()
    A = pow(G, a, P)
    return a, A

def dh_alice_step2(a: int, B: int) -> int:
    return pow(B, a, P)

# --- Bob ---
def dh_bob_step1():
    b = rand_exp()
    B = pow(G, b, P)
    return b, B

def dh_bob_step2(b: int, A: int) -> int:
    return pow(A, b, P)

# --- MITM attack (Eve intercepts) ---
def mitm_attack(A: int, B: int):
    e    = rand_exp()
    E    = pow(G, e, P)
    K_alice = pow(A, e, P)
    K_bob   = pow(B, e, P)
    return E, K_alice, K_bob

# --- CDH hardness (brute force for tiny Q) ---
def cdh_brute(gA: int, gB: int, target: int, limit=100000):
    for a in range(1, limit):
        if pow(G, a, P) == gA:
            K = pow(gB, a, P)
            return K == target, a
    return False, -1

# --- Demo ---
if __name__ == "__main__":
    a, A = dh_alice_step1()
    b, B = dh_bob_step1()
    Ka   = dh_alice_step2(a, B)
    Kb   = dh_bob_step2(b, A)
    print(f"Alice sends A = g^a = {A}")
    print(f"Bob   sends B = g^b = {B}")
    print(f"Shared secret match: {Ka == Kb}  K={Ka}")
    print()
    E, Kea, Keb = mitm_attack(A, B)
    print(f"MITM: Eve holds K_alice={Kea}, K_bob={Keb}")
    print()
    found, a_found = cdh_brute(A, B, Ka)
    print(f"CDH brute force found: {found} (a={a_found})")