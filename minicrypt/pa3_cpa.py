import random

class CPA_Encrypt:
    def __init__(self, prf):
        self.prf = prf

    def _get_pad(self, key, r, bit_len):
        pad = self.prf.F(key, bin(r)[2:])
        pad_bin = bin(pad)[2:].zfill(bit_len)
        return int(pad_bin[-bit_len:], 2)

    def encrypt(self, key, m):
        r = random.randint(1, 1000)

        m_bin = bin(m)[2:]
        bit_len = len(m_bin)

        pad_int = self._get_pad(key, r, bit_len)
        c = m ^ pad_int

        
        return (r, c, bit_len)

    def decrypt(self, key, r, c, bit_len):
        
        pad_int = self._get_pad(key, r, bit_len)
        return c ^ pad_int