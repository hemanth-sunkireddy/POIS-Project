import React, { useState, useEffect } from 'react';

const PA14CRT = () => {
  const [message, setMessage] = useState('Hello');
  const [usePadding, setUsePadding] = useState(false);
  const [bits, setBits] = useState(64);
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [attackerData, setAttackerData] = useState(null);
  const [recoveredText, setRecoveredText] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [error, setError] = useState(null);

  const setupDemo = async () => {
    setLoading(true);
    setAttackerData(null);
    setRecoveredText(null);
    setError(null);
    try {
      const response = await fetch('/api/pa14/demo_setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ m: message, e: 3, bits, use_padding: usePadding }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Setup failed");
      setRecipients(data.recipients || []);
    } catch (error) {
      console.error('Error setting up demo:', error);
      setError(error.message);
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const runAttack = async () => {
    if (recipients.length < 3) return;
    setLoading(true);
    try {
      const residues = recipients.map(r => r.c);
      const moduli = recipients.map(r => r.n);

      // Step 1: CRT
      const crtRes = await fetch('/api/pa14/crt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residues, moduli }),
      });
      const crtData = await crtRes.json();

      // Step 2: Hastad (which includes cube root)
      const hastadRes = await fetch('/api/pa14/hastad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciphertexts: residues, moduli, e: 3 }),
      });
      const hastadData = await hastadRes.json();

      setAttackerData({
        me: crtData.x,
        m: hastadData.m
      });
    } catch (error) {
      console.error('Error running attack:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const decodeRecovered = () => {
    if (!attackerData) return;
    try {
      const m = BigInt(attackerData.m);
      // Convert BigInt to hex, then to bytes, then to string
      let hex = m.toString(16);
      if (hex.length % 2 !== 0) hex = '0' + hex;

      const matches = hex.match(/.{1,2}/g);
      if (!matches) {
        setRecoveredText("Empty or Malformed Result");
        return;
      }

      const bytes = new Uint8Array(matches.map(byte => parseInt(byte, 16)));

      if (usePadding) {
        // Check if bits are too small for padding logic
        if (bits < 128) {
          setRecoveredText("Key size too small for PKCS#1.5");
          return;
        }

        // Still decode the raw garbage for visual demonstration
        const rawGarbage = new TextDecoder().decode(bytes);

        // Very simple PKCS1.5 strip for demo (00 02 ... 00 DATA)
        let start = 0;
        if (bytes[0] === 2) start = 1;
        else if (bytes[0] === 0 && bytes[1] === 2) start = 2;

        const zeroIdx = bytes.indexOf(0, start);
        if (zeroIdx !== -1) {
          const dataBytes = bytes.slice(zeroIdx + 1);
          setRecoveredText(new TextDecoder().decode(dataBytes));
        } else {
          // If it's garbage (attack failed), show the raw noise
          setRecoveredText(`[Garbage Data]: ${rawGarbage}`);
        }
      } else {
        setRecoveredText(new TextDecoder().decode(bytes));
      }
    } catch (e) {
      setRecoveredText("Garbage / Decoding Failed");
    }
  };

  const runBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await fetch('/api/pa14/benchmark?bits=1024');
      const data = await res.json();
      setBenchmark(data);
    } catch (e) {
      console.error("Benchmark failed", e);
    } finally {
      setBenchmarking(false);
    }
  };

  // useEffect(() => {
  //   setupDemo();
  // }, [usePadding, bits]);

  return (
    <div className="panel" style={{ gridColumn: 'span 2' }}>
      <div className="panel-header">
        <h2 className="panel-title">PA #14 — Håstad Broadcast Attack Visualizer</h2>
        <p className="panel-subtitle">Exploiting CRT when small exponent e=3 is used for multiple recipients.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="form-group">
          <label>Message to Broadcast (m)</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter short message"
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-primary" onClick={setupDemo} disabled={loading}>
              Broadcast
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={usePadding}
                onChange={(e) => setUsePadding(e.target.checked)}
              />
              Use PKCS#1 v1.5 Padding
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Key Size (bits): {bits}</label>
          <input
            type="range"
            min="32"
            max="128"
            step="8"
            value={bits}
            onChange={(e) => setBits(parseInt(e.target.value))}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Smaller bits = instant demo. Larger bits (1024) tested in benchmark.
          </p>
          {usePadding && bits < 128 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
              ⚠️ PKCS#1 v1.5 requires at least 128-bit keys for short messages.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="carmichael-info" style={{ border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Error: {error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        {recipients && recipients.length > 0 ? recipients.map((r, i) => (
          <div key={i} className="witness-item" style={{ borderLeftColor: 'var(--accent)' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Recipient {i + 1}</h4>
            <div style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong>N:</strong> <span style={{ color: 'var(--text-muted)' }}>{r.n}</span>
            </div>
            <div style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.25rem' }}>
              <strong>c:</strong> <span style={{ color: 'var(--primary)' }}>{r.c}</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              🔒 Locked
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            {loading ? "Generating Broadcast Keys..." : "No recipients generated. Click 'Broadcast' to start."}
          </div>
        )}
      </div>

      <div className="result-box" style={{ border: '2px dashed var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--danger)' }}>
          Attacker Panel
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <button className="btn-primary" onClick={runAttack} disabled={loading || recipients.length < 3} style={{ background: 'var(--danger)' }}>
              Apply CRT Attack
            </button>
            {attackerData && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="witness-a" style={{ color: 'var(--text)' }}>
                  <strong>Recovered m³ mod (N₁N₂N₃):</strong>
                  <p style={{ wordBreak: 'break-all', fontSize: '0.75rem', color: 'var(--accent)' }}>{attackerData.me}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button className="foundation-btn" style={{ background: 'var(--accent)', color: 'white' }} onClick={decodeRecovered}>
                    Compute Cube Root & Extract m
                  </button>
                </div>
              </div>
            )}
          </div>
          {recoveredText !== null && (
            <div style={{ flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--accent)' }}>
              <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Intercepted Plaintext:</h4>
              <p style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: recoveredText.length > 20 ? 'var(--text)' : 'var(--accent)',
                marginTop: '0.5rem'
              }}>
                {recoveredText}
              </p>
              {usePadding && (
                <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                  <strong>Why is it garbage?</strong> Randomized padding ensures each ciphertext encrypts a different value ($m_1, m_2, m_3$). Håstad's attack requires the <i>exact same</i> $m$ for all recipients. Padding successfully defeats this attack!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="carmichael-info" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
          Garner's Algorithm Speedup (1024-bit RSA)
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            CRT-based decryption (Garner's) avoids large exponentiation by working modulo p and q separately.
          </p>
          <button className="btn-primary" onClick={runBenchmark} disabled={benchmarking}>
            {benchmarking ? 'Running...' : 'Run Benchmark'}
          </button>
        </div>
        {benchmark && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
            <div className="witness-item">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Decryption</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{benchmark.avg_std_ms.toFixed(2)} ms</div>
            </div>
            <div className="witness-item">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Garner's Decryption</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>{benchmark.avg_crt_ms.toFixed(2)} ms</div>
            </div>
            <div className="witness-item">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speedup</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{benchmark.speedup.toFixed(2)}x</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PA14CRT;
