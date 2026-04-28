import os, math

P = 0xFFFFFFFFFFFFFFC5
G = 5

def owf(x: int) -> int:
    return pow(G, x, P)

def hcb(x: int) -> int:
    return x & 1

def prg(seed: int, length: int) -> list:
    bits, x = [], seed
    for _ in range(length):
        bits.append(hcb(x))
        x = owf(x)
    return bits

def owf_from_prg(s: int, length=16) -> int:
    bits = prg(s, length)
    return int("".join(str(b) for b in bits), 2)

def _ensure_seed():
    if _state["seed"] is None:
        _state["seed"] = int.from_bytes(os.urandom(8), "big")

def _get_random_int(n_bits: int) -> int:
    if n_bits < 1:
        raise ValueError("n_bits must be >= 1")
    _ensure_seed()
    bits = next_bits(n_bits)
    value = 0
    for b in bits:
        value = (value << 1) | b
    return value

def get_random_bits(n_bits: int) -> int:
    """Returns a random integer with exactly n_bits using the internal PRG."""
    value = _get_random_int(n_bits)
    return value | (1 << (n_bits - 1))

def get_random_range(start: int, end: int) -> int:
    """Returns a random integer in [start, end] using rejection sampling."""
    if start > end:
        raise ValueError("start must be <= end")
    diff = end - start
    if diff == 0:
        return start
    n_bits = diff.bit_length()
    while True:
        value = _get_random_int(n_bits)
        if value <= diff:
            return start + value

# --- NIST Test 1: Frequency ---
def freq_test(bits: list) -> float:
    n = len(bits)
    s = sum(1 if b else -1 for b in bits)
    p = math.erfc(abs(s) / math.sqrt(2 * n))
    ratio = sum(bits) / n
    print(f"Frequency Test: ratio={ratio:.3f}, p={p:.3f} → {'PASS' if p>=0.01 else 'FAIL'}")
    return p

# --- NIST Test 2: Runs ---
def runs_test(bits: list) -> float:
    n = len(bits)
    pi = sum(bits) / n
    v = 1 + sum(1 for i in range(1, n) if bits[i] != bits[i-1])
    p = math.erfc(abs(v - 2*n*pi*(1-pi)) / (2*math.sqrt(2*n)*pi*(1-pi)))
    print(f"Runs Test:      v={v}, p={p:.3f} → {'PASS' if p>=0.01 else 'FAIL'}")
    return p

# --- NIST Test 3: Serial ---
def serial_test(bits: list) -> float:
    n = len(bits)
    counts = {(0,0):0,(0,1):0,(1,0):0,(1,1):0}
    for i in range(n):
        counts[(bits[i], bits[(i+1)%n])] += 1
    exp = n / 4
    chi2 = sum((c - exp)**2 / exp for c in counts.values())
    p = math.exp(-chi2 / 2)
    print(f"Serial Test:    chi2={chi2:.3f}, p≈{p:.3f} → {'PASS' if p>=0.01 else 'FAIL'}")
    return p

# --- Named interface for PA#2 ---
_state = {"seed": None}

def seed(s: int):
    _state["seed"] = s

def next_bits(n: int) -> list:
    _ensure_seed()
    bits = prg(_state["seed"], n)
    _state["seed"] = owf(_state["seed"])
    return bits

# --- Demo ---
if __name__ == "__main__":
    s = int.from_bytes(os.urandom(8), "big")
    out = prg(s, 1000)
    print(f"Seed: {s}")
    print(f"PRG : {''.join(str(b) for b in out[:32])}...")
    freq_test(out)
    runs_test(out)
    serial_test(out)
    print(f"OWF(seed)         : {owf(s)}")
    print(f"OWF_from_PRG(seed): {owf_from_prg(s)}")
    seed(s)
    print(f"next_bits(16)     : {next_bits(16)}")