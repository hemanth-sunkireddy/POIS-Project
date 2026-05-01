import React, { useState } from 'react';

const PA20Millionaire = () => {
  const [x, setX] = useState(7);   // Alice
  const [y, setY] = useState(12);  // Bob
  const [result, setResult] = useState(null);
  const [trace, setTrace] = useState([]);
  const [progress, setProgress] = useState(0);
  const [totalGates, setTotalGates] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  const runComparison = async () => {
    setLoading(true);
    setResult(null);
    setTrace([]);
    setProgress(0);

    try {
      const response = await fetch('/api/pa20/millionaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, n: 4 }),
      });

      const data = await response.json();

      setResult(data.result);
      setTotalGates(data.total_gates);

      // Animate gate-by-gate progress
      let i = 0;
      const interval = setInterval(() => {
        if (i >= data.trace.length) {
          clearInterval(interval);
          return;
        }

        setTrace(prev => [...prev, data.trace[i]]);
        setProgress(Math.round(((i + 1) / data.total_gates) * 100));
        i++;
      }, 80); // animation speed

    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #20 — Millionaire’s Problem</h2>
        <p className="panel-subtitle">
          Secure 2-Party Comparison (Circuit-based MPC)
        </p>
      </div>

      {/* Alice Panel */}
      <div className="form-group">
        <label>Alice’s Wealth (Hidden from Bob)</label>
        <input
          type="range"
          min="1"
          max="100"
          value={x}
          onChange={(e) => setX(parseInt(e.target.value))}
        />
        <p>Value: {x}</p>
      </div>

      {/* Bob Panel */}
      <div className="form-group">
        <label>Bob’s Wealth (Hidden from Alice)</label>
        <input
          type="range"
          min="1"
          max="100"
          value={y}
          onChange={(e) => setY(parseInt(e.target.value))}
        />
        <p>Value: {y}</p>
      </div>

      {/* Run Button */}
      <button
        className="btn-primary"
        style={{ width: '100%', marginBottom: '1rem' }}
        onClick={runComparison}
        disabled={loading}
      >
        {loading ? 'Computing...' : 'Who is richer?'}
      </button>

      {/* Progress Bar */}
      {totalGates > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              height: '8px',
              background: 'var(--border)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 0.1s linear',
              }}
            />
          </div>
          <p style={{ fontSize: '0.8rem' }}>
            Progress: {progress}% ({trace.length}/{totalGates} gates)
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="result-box">
          <p><strong>Result:</strong> {result}</p>
        </div>
      )}

      <div className="form-group">
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          The protocol reveals only the result (who is richer) without revealing
          the actual values of Alice or Bob. Circuit evaluation is shown gate-by-gate.
        </p>
      </div>
    </div>
  );
};

export default PA20Millionaire;