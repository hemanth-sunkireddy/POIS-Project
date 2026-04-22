BLOCK_BITS = 17  # fixed input width for PRF (ceil(log2(p)) for p=104729)

class PRF:
    def __init__(self, prg):
        self.prg = prg

    def split(self, bits):
        mid = len(bits) // 2
        return bits[:mid], bits[mid:]

    def F(self, key, x_bits):
        
        x_bits = x_bits.zfill(BLOCK_BITS)

        s = key
        for bit in x_bits:
            g = self.prg.generate(s, 16)
            left, right = self.split(g)
            s = int(left, 2) if bit == '0' else int(right, 2)
        return s