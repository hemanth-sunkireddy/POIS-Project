BLOCK_SIZE = 8
IV         = 0

# --- MD-Strengthening Padding ---
def md_pad(m: bytes, block_size=BLOCK_SIZE) -> bytes:
    length = len(m)
    m += b"\x80"
    while (len(m) + 8) % block_size != 0:
        m += b"\x00"
    m += length.to_bytes(8, "big")
    return m

# --- Merkle-Damgård Framework ---
def merkle_damgard(compress, message: bytes,
                   block_size=BLOCK_SIZE, iv=IV) -> int:
    padded = md_pad(message, block_size)
    blocks = [padded[i:i+block_size]
              for i in range(0, len(padded), block_size)]
    z = iv
    for block in blocks:
        z = compress(z, block)
    return z

# --- Toy compression (XOR-based) ---
def toy_compress(cv: int, block: bytes) -> int:
    return (cv ^ int.from_bytes(block, "big")) & 0xFFFFFFFF

def toy_hash(m: bytes) -> int:
    return merkle_damgard(toy_compress, m)

# --- Collision propagation demo ---
def collision_demo():
    b1 = b"\xAA" * BLOCK_SIZE
    b2 = b"\xAA" * BLOCK_SIZE
    h1 = toy_hash(b1 + b"\x00" * BLOCK_SIZE)
    h2 = toy_hash(b2 + b"\x00" * BLOCK_SIZE)
    print(f"Collision propagation: h1={h1:#010x}, h2={h2:#010x}, match={h1==h2}")

# --- Demo ---
if __name__ == "__main__":
    for msg in [b"", b"hello", b"hello world!!"]:
        print(f"hash({msg!r:20}) = {toy_hash(msg):#010x}")
    collision_demo()
    print(f"Padded 'test': {md_pad(b'test').hex()}")