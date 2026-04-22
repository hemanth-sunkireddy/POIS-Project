class Feistel:
    """
    Two-round Feistel network built on top of the PRF.
    Turns the PRF (which is not invertible) into a PRP (bijection),
    which is what CBC mode requires for correct decryption.

    Block is split into (L, R) each of HALF_BITS bits.
    Encrypt: L1 = R0, R1 = L0 XOR F(key, R0)   (round 1)
             L2 = R1, R2 = L1 XOR F(key, R1)   (round 2)
    Decrypt: reverse the rounds.
    """
    HALF_BITS = 8   # work with 16-bit blocks split into two 8-bit halves
    MASK = (1 << HALF_BITS) - 1  # 0xFF

    def __init__(self, prf):
        self.prf = prf

    def _split(self, block):
        R = block & self.MASK
        L = (block >> self.HALF_BITS) & self.MASK
        return L, R

    def _join(self, L, R):
        return (L << self.HALF_BITS) | R

    def _round(self, key, L, R):
        f_out = self.prf.F(key, bin(R)[2:]) & self.MASK
        return R, L ^ f_out

    def _round_inv(self, key, L, R):
        f_out = self.prf.F(key, bin(L)[2:]) & self.MASK
        return R ^ f_out, L

    def encrypt_block(self, key, block):
        L, R = self._split(block)
        L, R = self._round(key, L, R)
        L, R = self._round(key, L, R)
        return self._join(L, R)

    def decrypt_block(self, key, block):
        L, R = self._split(block)
        L, R = self._round_inv(key, L, R)
        L, R = self._round_inv(key, L, R)
        return self._join(L, R)


class CBC:
    
    def __init__(self, prf):
        self.prf = prf
        self.feistel = Feistel(prf)

    def encrypt(self, key, blocks, iv):
        C = []
        prev = iv
        for m in blocks:
            x = m ^ prev
            c = self.feistel.encrypt_block(key, x)
            C.append(c)
            prev = c
        return C

    def decrypt(self, key, C, iv):
        M = []
        prev = iv
        for c in C:
            x = self.feistel.decrypt_block(key, c)
            m = x ^ prev
            M.append(m)
            prev = c
        return M


class OFB:
    
    # encrypt and decrypt are identical.
    def __init__(self, prf):
        self.prf = prf

    def encrypt(self, key, blocks, iv):
        keystream = iv
        C = []
        for m in blocks:
            keystream = self.prf.F(key, bin(keystream)[2:])
            c = m ^ keystream
            C.append(c)
        return C

    decrypt = encrypt


class CTR:
    
    def __init__(self, prf):
        self.prf = prf

    def encrypt(self, key, blocks, nonce):
        C = []
        for i, m in enumerate(blocks):
            ctr = nonce + i
            ks = self.prf.F(key, bin(ctr)[2:])
            c = m ^ ks
            C.append(c)
        return C

    decrypt = encrypt