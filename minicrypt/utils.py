class OFB:
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