BLOCK_SIZE = 8
IV = 0

# --- MD-Strengthening Padding ---
def md_pad(m: bytes, block_size=BLOCK_SIZE) -> bytes:
    """
    Append 1-bit (0x80), then 0-bits, then 64-bit big-endian length.
    Result is a multiple of block_size bytes.
    """
    length = len(m)
    m += b"\x80"
    while (len(m) + 8) % block_size != 0:
        m += b"\x00"
    m += length.to_bytes(8, "big")
    return m

# --- Merkle-Damgård Framework ---
def merkle_damgard(compress, message: bytes,
                   block_size=BLOCK_SIZE, iv=IV) -> int:
    """
    Generic Merkle-Damgård transform.
    Accepts any compression function: (int, bytes) -> int
    Returns final chaining value as digest.
    """
    padded = md_pad(message, block_size)
    blocks = [padded[i:i+block_size]
              for i in range(0, len(padded), block_size)]
    z = iv
    for block in blocks:
        z = compress(z, block)
    return z

# --- Exposed Interface for PA#8 ---
def hash(message: bytes, compression_fn=None, block_size=BLOCK_SIZE, iv=IV) -> int:
    """
    hash(message, compression_fn) -> digest
    If compression_fn is None, defaults to toy_compress.
    PA#8 plugs in dlp_compress here.
    """
    if compression_fn is None:
        compression_fn = toy_compress
    return merkle_damgard(compression_fn, message, block_size=block_size, iv=iv)

# --- Toy Compression Function (XOR-based) ---
def toy_compress(cv: int, block: bytes) -> int:
    """
    Simple XOR-based compression for testing PA#7 in isolation.
    h(cv, block) = cv XOR int(block)
    """
    return (cv ^ int.from_bytes(block, "big")) & 0xFFFFFFFF

def toy_hash(m: bytes) -> int:
    """Convenience wrapper using toy_compress."""
    return hash(m, toy_compress)

# --- Boundary Case Tests ---
def boundary_tests():
    """
    Verify MD framework handles:
    - Empty message
    - Exactly one block
    - Multiple blocks
    """
    print("\n--- Boundary Case Tests ---")
    cases = [
        ("Empty",          b""),
        ("One block",      b"A" * BLOCK_SIZE),
        ("Multi block",    b"B" * (BLOCK_SIZE * 3)),
        ("Non-multiple",   b"Hello!!"),
    ]
    for label, msg in cases:
        digest = toy_hash(msg)
        padded = md_pad(msg, BLOCK_SIZE)
        n_blocks = len(padded) // BLOCK_SIZE
        print(f"  [{label:15}] len={len(msg):3} -> "
              f"padded={len(padded):3} bytes ({n_blocks} blocks) "
              f"digest={digest:#010x}")

# --- Collision Propagation Demo ---
def find_toy_collision():
    """
    Find two DISTINCT single blocks that collide under toy_compress.
    toy_compress(cv, block) = cv XOR int(block)
    
    For cv=0:
      toy_compress(0, block) = int(block)
    So block1 and block2 collide at cv=0 iff int(block1) == int(block2),
    which means block1 == block2. That's trivial.
    
    Instead, we find collision at the SECOND block level:
    Find block1 != block2 such that:
      compress(compress(0, A), block1) == compress(compress(0, A), block2)
    where A is a fixed first block.
    
    compress(cv, block) = cv XOR int(block)
    So compress(cv, block1) == compress(cv, block2)
    iff cv XOR int(block1) == cv XOR int(block2)
    iff int(block1) == int(block2)  -- still trivial for XOR.
    
    So we demonstrate collision propagation differently:
    Find m1 != m2 such that toy_compress produces same intermediate state,
    then show appending the same suffix preserves the collision.
    
    We use: m1 = block A, m2 = block B where A XOR B = 0 after padding cancels.
    Concretely: choose A and B such that int(A) == int(B) mod 2^32
    by constructing B = A with last 4 bytes adjusted to wrap around.
    """
    import os
    # Strategy: find two different messages that produce same chaining value
    # after first block. Since toy_compress(0, block) = int(block) & 0xFFFFFFFF,
    # we need int(block1) & 0xFFFFFFFF == int(block2) & 0xFFFFFFFF
    # with block1 != block2.
    # Use: block1 = b"\x00" * 4 + b"\x01\x00\x00\x00\x00\x00\x00\x00" (8 bytes)
    # and  block2 = b"\x00" * 4 + b"\x01\x00\x00\x01\x00\x00\x00\x00" 
    # but adjust so lower 32 bits match.
    
    # Simpler: block1 and block2 differ only in upper 4 bytes (which are masked out)
    block1 = b"\xFF\xFF\xFF\xFF" + b"\xAB\xCD\xEF\x12"  # upper 4 bytes masked away
    block2 = b"\x00\x00\x00\x00" + b"\xAB\xCD\xEF\x12"  # different upper bytes
    
    cv1 = toy_compress(IV, block1)
    cv2 = toy_compress(IV, block2)
    
    return block1, block2, cv1, cv2

def collision_propagation_demo():
    """
    Show the reduction:
    If block1 != block2 but toy_compress(IV, block1) == toy_compress(IV, block2),
    then for ANY suffix S:
      toy_hash(block1 + S) == toy_hash(block2 + S)
    This concretely shows H's security reduces to h's security.
    """
    print("\n--- Collision Propagation Demo ---")
    
    block1, block2, cv1, cv2 = find_toy_collision()
    
    print(f"  block1 = {block1.hex()}")
    print(f"  block2 = {block2.hex()}")
    print(f"  block1 != block2 : {block1 != block2}")
    print(f"  toy_compress(IV, block1) = {cv1:#010x}")
    print(f"  toy_compress(IV, block2) = {cv2:#010x}")
    print(f"  Compression collision found: {cv1 == cv2}")
    
    if cv1 == cv2:
        # Now show collision propagates to full MD hash
        # Append same suffix to both
        suffix = b"SAME_SUFFIX"
        
        # We need full BLOCK_SIZE blocks, so pad the blocks
        m1 = block1 + suffix
        m2 = block2 + suffix
        
        h1 = toy_hash(m1)
        h2 = toy_hash(m2)
        
        print(f"\n  Appending suffix '{suffix.decode()}' to both:")
        print(f"  toy_hash(block1 + suffix) = {h1:#010x}")
        print(f"  toy_hash(block2 + suffix) = {h2:#010x}")
        print(f"  Full MD hash collision    : {h1 == h2}")
        print(f"\n  => Security of H(.) reduces to security of h(.)")
        print(f"     Any collision in h propagates to collision in H.")
    else:
        print(f"  No compression collision found with these blocks.")
        print(f"  XOR-based toy_compress is too simple for natural collisions.")
        print(f"  Collision propagation property still holds theoretically.")

# --- Demo ---
if __name__ == "__main__":
    # Basic hash demo
    print("=== PA#7 Merkle-Damgård Demo ===")
    for msg in [b"", b"hello", b"hello world!!"]:
        print(f"  hash({msg!r:20}) = {toy_hash(msg):#010x}")

    # Boundary cases
    boundary_tests()

    # Padding demo
    print(f"\n--- Padding Demo ---")
    for msg in [b"", b"test", b"A" * BLOCK_SIZE]:
        padded = md_pad(msg, BLOCK_SIZE)
        print(f"  md_pad({msg!r:15}) -> {padded.hex()} "
              f"(len={len(padded)})")

    # Collision propagation
    collision_propagation_demo()

    # Interface demo for PA#8
    print(f"\n--- Interface Demo (hash with custom compression) ---")
    custom_result = hash(b"test message", toy_compress)
    print(f"  hash('test message', toy_compress) = {custom_result:#010x}")
    print(f"  Ready for PA#8: hash(msg, dlp_compress) will work the same way.")