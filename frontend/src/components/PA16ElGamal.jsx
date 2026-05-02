import React, { useState, useEffect } from 'react';

const PA16ElGamal = () => {
  const [m, setM] = useState('42');
  const [bits, setBits] = useState(32);
  const [keys, setKeys] = useState(null);
  const [ciphertext, setCiphertext] = useState(null);
  const [decryptedM, setDecryptedM] = useState(null);
  const [loading, setLoading] = useState(false);
  const [malleableCiphertext, setMalleableCiphertext] = useState(null);
  const [malleableDecrypted, setMalleableDecrypted] = useState(null);
  const [error, setError] = useState(null);

  const generateKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pa16/keygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bits }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Keygen failed");
      setKeys(data);
      setCiphertext(null);
      setDecryptedM(null);
      setMalleableCiphertext(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const encryptMessage = async () => {
    if (!keys || !m) return;
    setLoading(true);
    setError(null);
    try {
      // Validate that m is a number
      if (isNaN(m) || m.trim() === "") {
        throw new Error("Message must be a valid integer");
      }

      const response = await fetch('/api/pa16/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pk: keys.pk, m }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Encryption failed");
      }

      setCiphertext(data);
      setDecryptedM(null);
      setMalleableCiphertext(null);
    } catch (err) {
      setError("Encryption Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const decryptMessage = async (c1, c2, isMalleable = false) => {
    if (!keys || !c1 || !c2) return;
    setLoading(true);
    try {
      const response = await fetch('/api/pa16/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sk: keys.sk, c1, c2 }),
      });
      const data = await response.json();
      if (isMalleable) {
        setMalleableDecrypted(data.m);
      } else {
        setDecryptedM(data.m);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runMalleabilityAttack = async () => {
    if (!keys || !ciphertext) return;
    setLoading(true);
    try {
      const response = await fetch('/api/pa16/malleability_attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          c1: ciphertext.c1,
          c2: ciphertext.c2,
          p: keys.pk.p,
          multiplier: "2"
        }),
      });
      const data = await response.json();
      setMalleableCiphertext(data);
      // Automatically decrypt to show the result
      await decryptMessage(data.c1, data.c2, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateKeys();
  }, [bits]);

  return (
    <div className="panel" style={{ gridColumn: 'span 2' }}>
      <div className="panel-header">
        <h2 className="panel-title">PA #16 — ElGamal Public-Key Cryptosystem</h2>
        <p className="panel-subtitle">DLP-based encryption with inherent multiplicative malleability.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="form-group">
          <label>Prime Modulus Size (bits): {bits}</label>
          <input
            type="range"
            min="64"
            max="512"
            step="64"
            value={bits}
            onChange={(e) => setBits(parseInt(e.target.value))}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="foundation-btn" onClick={generateKeys} disabled={loading}>
              Regenerate Group & Keys
            </button>
          </div>
        </div>

        {keys && (
          <div className="witness-item" style={{ borderLeftColor: 'var(--primary)' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>ElGamal Public Key (p, g, h)</h4>
            <div style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
              <strong>p:</strong> {keys.pk.p.substring(0, 30)}...
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.25rem' }}>
              <strong>g:</strong> {keys.pk.g} | <strong>h:</strong> {keys.pk.h.substring(0, 20)}...
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        <div className="form-group">
          <label>Plaintext Message (m ∈ ℤₚ)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={m}
              onChange={(e) => setM(e.target.value)}
              placeholder="Enter integer..."
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={encryptMessage} disabled={loading || !keys}>
              Encrypt
            </button>
          </div>
        </div>

        {ciphertext && (
          <div className="result-box" style={{ marginTop: 0 }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ciphertext (c₁, c₂)</h4>
            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px' }}>
              <strong>c₁:</strong> {ciphertext.c1.substring(0, 40)}...<br />
              <strong>c₂:</strong> {ciphertext.c2.substring(0, 40)}...
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={() => decryptMessage(ciphertext.c1, ciphertext.c2)} style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                Decrypt
              </button>
              {decryptedM && (
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                  Result: {decryptedM}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {ciphertext && (
        <div className="result-box" style={{ border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>Malleability Attack (CCA Vulnerability)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Given $(c_1, c_2) = (g^r, m \cdot h^r)$, an attacker can compute $(c_1, 2c_2) = (g^r, (2m) \cdot h^r)$ which decrypts to $2m$.
              </p>
              <button className="btn-primary" onClick={runMalleabilityAttack} style={{ background: 'var(--danger)' }}>
                Multiply $c_2$ by 2 (Forge Ciphertext)
              </button>
            </div>

            {malleableCiphertext && (
              <div style={{ flex: 1, marginLeft: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Modified Ciphertext Decryption:</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)', marginTop: '0.5rem' }}>
                  {malleableDecrypted || '...'}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <strong>Analysis:</strong> The attacker successfully modified the ciphertext to encrypt a related message ($2m$) without knowing $m$ or the private key. This proves ElGamal is <strong>not CCA-secure</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          borderRadius: '8px',
          color: 'var(--danger)',
          fontSize: '0.875rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default PA16ElGamal;
