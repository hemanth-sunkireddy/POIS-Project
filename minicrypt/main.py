from pa0_backend import MinicryptExplorer
from pa3_cpa import CPA_Encrypt
from pa4_modes import CBC, OFB, CTR

if __name__ == "__main__":
    explorer = MinicryptExplorer()

    print("=== PA #0 Demo ===")
    print("OWF(5):", explorer.build("OWF", 5))
    print("PRG(123):", explorer.build("PRG", 123))
    print("PRF(10, '1011'):", explorer.build("PRF", 10))

    print("\n=== PA #0 Reductions ===")
    print("OWF->PRG:", explorer.reduce("OWF", "PRG", 123))
    print("OWF->PRF:", explorer.reduce("OWF", "PRF", 10))
    print("PRG->PRF:", explorer.reduce("PRG", "PRF", 10))

    print("\n=== PA #3 Demo ===")
    cpa = CPA_Encrypt(explorer.prf)
    
    r, c, bit_len = cpa.encrypt(10, 42)
    print("Cipher:", r, c, bit_len)
    decrypted = cpa.decrypt(10, r, c, bit_len)
    print("Decrypted:", decrypted)
    print("Round-trip ok:", decrypted == 42)

    print("\n=== PA #4 Demo ===")
    blocks = [10, 20, 30]
    key, iv = 5, 1

    cbc = CBC(explorer.prf)
    enc_cbc = cbc.encrypt(key, blocks, iv)
    dec_cbc = cbc.decrypt(key, enc_cbc, iv)
    print("CBC enc:", enc_cbc)
    print("CBC dec:", dec_cbc)
    print("CBC round-trip ok:", dec_cbc == blocks)

    ofb = OFB(explorer.prf)
    enc_ofb = ofb.encrypt(key, blocks, iv)
    dec_ofb = ofb.decrypt(key, enc_ofb, iv)
    print("OFB enc:", enc_ofb)
    print("OFB dec:", dec_ofb)
    print("OFB round-trip ok:", dec_ofb == blocks)

    ctr = CTR(explorer.prf)
    enc_ctr = ctr.encrypt(key, blocks, iv)
    dec_ctr = ctr.decrypt(key, enc_ctr, iv)
    print("CTR enc:", enc_ctr)
    print("CTR dec:", dec_ctr)
    print("CTR round-trip ok:", dec_ctr == blocks)