import React, { useState, useEffect } from 'react';

const PA15DigitalSignatures = () => {
  const [message, setMessage] = useState('Minicrypt Clique');
  const [useHash, setUseHash] = useState(true);
  const [bits, setBits] = useState(64);
  const [keys, setKeys] = useState(null);
  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [forgeData, setForgeData] = useState({ s1: '', s2: '', m1: '2', m2: '3' });
  const [forgedSig, setForgedSig] = useState(null);
  const [error, setError] = useState(null);

  // Modular exponentiation: (base^exp) % mod
  const modPow = (base, exp, mod) => {
    let res = 1n;
    base = base % mod;
    while (exp > 0n) {
      if (exp % 2n === 1n) res = (res * base) % mod;
      base = (base * base) % mod;
      exp = exp / 2n;
    }
    return res;
  };

  const generateKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pa15/keygen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bits }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Keygen failed");
      setKeys(data);
      setSignature(null);
      setVerificationResult(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signMessage = async () => {
    if (!keys || !message) return;
    setLoading(true);
    setError(null);
    try {
      const encoder = new TextEncoder();
      const mBytes = encoder.encode(message);
      const mHex = Array.from(mBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await fetch('/api/pa15/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sk: keys.sk, m_bytes_hex: mHex }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Signing failed");
      }

      setSignature(data.sigma);
      setVerificationResult(null);
    } catch (err) {
      setError("Signing Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifySignature = async () => {
    if (!keys || !message || !signature) return;
    setLoading(true);
    setError(null);
    try {
      const encoder = new TextEncoder();
      const mBytes = encoder.encode(message);
      const mHex = Array.from(mBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await fetch('/api/pa15/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vk: keys.pk, m_bytes_hex: mHex, sigma: signature }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Verification failed");
      }

      setVerificationResult(data.valid);
    } catch (err) {
      setError("Verification Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const tamperMessage = () => {
    if (!message) return;
    // Flip the last bit of the last character
    const lastChar = message.charCodeAt(message.length - 1);
    const tampered = message.substring(0, message.length - 1) + String.fromCharCode(lastChar ^ 1);
    setMessage(tampered);
    setVerificationResult(null);
  };

  const runForgeryDemo = async () => {
    if (!keys) return;
    setLoading(true);
    setError(null);
    try {
      const n = BigInt(keys.sk.n);
      const d = BigInt(keys.sk.d);

      // Use modPow instead of ** to avoid hanging
      const s1 = modPow(BigInt(forgeData.m1), d, n);
      const s2 = modPow(BigInt(forgeData.m2), d, n);

      const response = await fetch('/api/pa15/forge_raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s1: s1.toString(), s2: s2.toString(), n: keys.pk.n }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Forgery failed');
      }

      const data = await response.json();
      setForgedSig(data.s3);
    } catch (err) {
      setError("Forgery Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateKeys();
  }, [bits]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #15 — Digital Signatures (RSA)</h2>
        <p className="panel-subtitle">Ensuring integrity and non-repudiation via Hash-then-Sign.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="form-group">
          <label>Modulus Size (bits): {bits * 2}</label>
          <input
            type="range"
            min="32"
            max="128"
            step="8"
            value={bits}
            onChange={(e) => setBits(parseInt(e.target.value))}
          />
          <button className="foundation-btn" onClick={generateKeys} disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Generating...' : 'Refresh Keys'}
          </button>
        </div>

        {keys && (
          <div className="witness-item" style={{ borderLeftColor: 'var(--primary)' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current RSA Keys</h4>
            <div style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>N:</strong> {keys.pk.n.substring(0, 20)}...
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>
              <strong>e:</strong> {keys.pk.e} | <strong>d:</strong> {keys.sk.d.substring(0, 10)}...
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Message to Sign</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={message}
            onChange={(e) => { setMessage(e.target.value); setVerificationResult(null); }}
            placeholder="Type a message..."
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={signMessage} disabled={loading || !keys}>
            Sign
          </button>
        </div>
      </div>

      {signature && (
        <div className="result-box">
          <div style={{ marginBottom: '1rem' }}>
            <label>Signature (σ = H(m)ᵈ mod N)</label>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              wordBreak: 'break-all',
              background: 'rgba(0,0,0,0.5)',
              padding: '0.75rem',
              borderRadius: '8px',
              marginTop: '0.25rem',
              color: 'var(--primary)'
            }}>
              {signature}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" onClick={verifySignature} style={{ background: 'var(--accent)' }}>
              Verify Signature
            </button>
            <button className="btn-primary" onClick={tamperMessage} style={{ background: 'var(--danger)' }}>
              Tamper Message
            </button>
          </div>

          {verificationResult !== null && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              background: verificationResult ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: verificationResult ? 'var(--accent)' : 'var(--danger)',
              border: `1px solid ${verificationResult ? 'var(--accent)' : 'var(--danger)'}`
            }}>
              {verificationResult ? '✓ SIGNATURE VALID' : '✗ SIGNATURE INVALID (Integrity Breach!)'}
            </div>
          )}
        </div>
      )}

      <div className="carmichael-info" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#f59e0b' }}>
          Existential Forgery (Raw RSA)
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Without hashing, RSA is multiplicatively homomorphic. Given signatures for $m_1$ and $m_2$, anyone can compute a valid signature for $m_1 \cdot m_2$.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem' }}>σ({forgeData.m1}) × σ({forgeData.m2}) = σ({parseInt(forgeData.m1) * parseInt(forgeData.m2)})</span>
          <button className="foundation-btn" onClick={runForgeryDemo} style={{ marginLeft: 'auto', background: '#f59e0b', color: 'black' }}>
            Forge Signature
          </button>
        </div>
        {forgedSig && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all', color: '#f59e0b' }}>
            <strong>Forged σ({parseInt(forgeData.m1) * parseInt(forgeData.m2)}):</strong> {forgedSig}
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '1rem',
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

export default PA15DigitalSignatures;
