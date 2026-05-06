import React, { useState } from 'react';
import PA1PRG from './components/PA1PRG';
import PA2PRF from './components/PA2PRF';
import PA3CPA from './components/PA3CPA';
import PA4Modes from './components/PA4Modes';
import PA5MAC from './components/PA5MAC';
import PA6CCA from './components/PA6CCA';
import PrimalityTester from './components/PA13PrimalityTester';
import PA14CRT from './components/PA14CRT';
import PA15DigitalSignatures from './components/PA15DigitalSignatures';
import PA16ElGamal from './components/PA16ElGamal';
import PA17CCA from './components/PA17CCA';
import PA18OT from './components/PA18OT';
import PA20Millionaire from './components/PA20Millionaire';
import PA19SecureAND from './components/PA19SecureAnd';
import PA7MerkleDamgard from './components/PA7Merkle';
import PA8DLPHash from './components/PA8DLPHash';
import PA9BirthdayAttack from './components/PA9BirthdayAttack';
import PA10LengthExtension from './components/PA10LengthExtension';
import PA11DiffieHellman from './components/PA11DiffleHellman';
import PA12RSADeterminism from './components/PA12RSA';

const App = () => {
  const [foundation, setFoundation] = useState('DLP');
  const [proofOpen, setProofOpen] = useState(false);

  return (
    <>
      <header className="top-bar">
        <div className="logo">Minicrypt Clique Explorer</div>
        <div className="foundation-selector">
          <button
            className={`foundation-btn ${foundation === 'AES' ? 'active' : ''}`}
            onClick={() => setFoundation('AES')}
          >
            AES-128 (PRP)
          </button>
          <button
            className={`foundation-btn ${foundation === 'DLP' ? 'active' : ''}`}
            onClick={() => setFoundation('DLP')}
          >
            DLP (gˣ mod p)
          </button>
        </div>
      </header>

      <main className="main-content">
        <PA1PRG />
        <PA2PRF />
        <PA3CPA />
        <PA4Modes />
        <PA5MAC />
        <PA6CCA />
        <PA7MerkleDamgard />
        <PA8DLPHash />
        <PA9BirthdayAttack />
        <PA10LengthExtension />
        <PA11DiffieHellman />
        <PA12RSADeterminism />
        
        <PrimalityTester />
        <PA14CRT />
        <PA15DigitalSignatures />
        <PA16ElGamal />
        <PA17CCA />
        <PA18OT />
        <PA19SecureAND />
        <PA20Millionaire />
      </main>

      <footer className="bottom-panel" style={{ maxHeight: proofOpen ? '600px' : '60px' }}>
        <div className="collapsible-header" onClick={() => setProofOpen(!proofOpen)}>
          <h3 style={{ fontSize: '1rem' }}>Reduction Proof Summary</h3>
          <span style={{ transform: proofOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            ▼
          </span>
        </div>
        {proofOpen && (
          <div style={{ padding: '1rem 0', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p><strong>OWF & PRG (PA #1):</strong> Foundations of Minicrypt.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Modular exponentiation is a candidate One-Way Function. 
                Using the hard-core bit (LSB), we construct a PRG (Blum-Micali style).
              </p>
            </div>

            <div>
              <p><strong>PRF (PA #2):</strong> GGM Construction.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Theorem: Goldreich, Goldwasser, Micali (1986). A length-doubling PRG 
                can be used to build a PRF by traversing a binary tree of seeds.
              </p>
            </div>

            <div>
              <p><strong>CPA-Secure Encryption (PA #3):</strong> Counter Mode.</p>
              <p style={{ fontSize: '0.875rem' }}>
                PRF-based encryption in Counter mode is IND-CPA secure. 
                Vulnerability: Reusing the same nonce (r) breaks secrecy.
              </p>
            </div>

            <div>
              <p><strong>MAC (PA #5):</strong> Integrity Foundations.</p>
              <p style={{ fontSize: '0.875rem' }}>
                CBC-MAC is secure for fixed-length messages. 
                Vulnerability: Naive H(k||m) is vulnerable to length-extension attacks.
              </p>
            </div>

            <div>
              <p><strong>CCA-Secure Encryption (PA #6):</strong> Encrypt-then-MAC.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Composition: IND-CPA Enc + SUF-CMA MAC = IND-CCA2 security. 
                Ensures both secrecy and integrity (ciphertext non-malleability).
              </p>
            </div>

            <div>
              <p><strong>Primality Testing (PA #13):</strong> A standalone component for RSA and ElGamal.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Security: Miller-Rabin is a probabilistic algorithm. For k rounds, the probability
                that a composite number is declared prime is &le; 4⁻ᵏ.
              </p>
            </div>

            <div>
              <p><strong>Håstad's Broadcast Attack (PA #14):</strong> Breaking Textbook RSA.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Theorem: Håstad (1985). Small exponent $e$ allows recovering $m$ via CRT if $m^e$ is less than the product of all $N_i$.
                Padding (PKCS#1 v1.5) breaks the attack by ensuring different messages are encrypted.
              </p>
            </div>

            <div>
              <p><strong>Digital Signatures (PA #15):</strong> Integrity and Non-repudiation.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Security: EUF-CMA security is achieved via Hash-then-Sign.
                Raw RSA signatures are vulnerable to multiplicative forgery due to the homomorphic property: σ(m₁) · σ(m₂) = σ(m₁ · m₂).
              </p>
            </div>

            <div>
              <p><strong>ElGamal PKC (PA #16):</strong> DLP-based Encryption.</p>
              <p style={{ fontSize: '0.875rem' }}>
                Assumption: Decisional Diffie-Hellman (DDH).
                Vulnerability: ElGamal is malleable. $(g^r, m \cdot h^r) \to (g^r, 2m \cdot h^r)$ allows an attacker to double the message.
                This demonstrates why CPA-security does not imply CCA-security.
              </p>
            </div>
          </div>
        )}
      </footer>
    </>
  );
};

export default App;
