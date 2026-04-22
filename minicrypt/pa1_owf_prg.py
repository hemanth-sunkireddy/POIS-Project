import random

class OWF:
    
    # giving full group order (p-1) instead of the cycle-of-30 bug.
    def __init__(self, p=104729, g=2):
        self.p = p
        self.g = g

    def f(self, x):
        
        return pow(self.g, x + 1, self.p)


class PRG:
    def __init__(self, owf):
        self.owf = owf

    def hardcore(self, x):
        return x & 1

    def generate(self, seed, length):
        x = seed
        out = ""
        for _ in range(length):
            x = self.owf.f(x)
            out += str(self.hardcore(x))
        return out