from pa1_owf_prg import OWF, PRG
from pa2_prf import PRF

class MinicryptExplorer:
    def __init__(self):
        self.owf = OWF()
        self.prg = PRG(self.owf)
        self.prf = PRF(self.prg)

    def build(self, primitive, seed):
        if primitive == "OWF":
            return self.owf.f(seed)

        if primitive == "PRG":
            return self.prg.generate(seed, 16)

        if primitive == "PRF":
            return self.prf.F(seed, "1011")

        return "Not implemented"

    def reduce(self, A, B, seed):
        
        #   OWF -> PRG -> PRF
        # Each reduction shows how the stronger primitive is built from
        # the weaker one using the same underlying objects.

        if A == "OWF" and B == "PRG":
            # PRG is built directly from OWF via the hardcore bit
            return self.prg.generate(seed, 16)

        if A == "OWF" and B == "PRF":
            # PRF is built from PRG which is built from OWF
            return self.prf.F(seed, "1011")

        if A == "PRG" and B == "PRF":
            # PRF is built from PRG via the GGM tree construction
            return self.prf.F(seed, "1011")

        return "Route not implemented"