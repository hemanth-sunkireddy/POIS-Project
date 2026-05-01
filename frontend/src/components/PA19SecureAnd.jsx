import React, { useState } from 'react';

const PA19SecureAND = () => {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [result, setResult] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [privacy, setPrivacy] = useState(null);
  const [truthTable, setTruthTable] = useState([]);
  const [loading, setLoading] = useState(false);

  const runAND = async () => {
    console.log("Clicked AND");
    setLoading(true);
    setResult(null);
    setTranscript([]);

    try {
      const res = await fetch('/api/pa19/and_demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a, b }),
      });

      const data = await res.json();
      console.log("Data from server: ", data);
      setResult(data.result);
      setTranscript(data.transcript);
      setPrivacy(data.privacy);

    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const runAll = async () => {
    try {
        console.log("Clicked Run all buttonn");
      const res = await fetch('/api/pa19/run_all');
      console.log(res);
      const data = await res.json();
      setTruthTable(data.table);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #19 — Secure AND (via OT)</h2>
        <p className="panel-subtitle">Step-by-step Oblivious Transfer</p>
      </div>

      {/* Inputs */}
      <div className="form-group">
        <label>Alice’s bit (a)</label>
        <select value={a} onChange={(e) => setA(parseInt(e.target.value))}>
          <option value={0}>0</option>
          <option value={1}>1</option>
        </select>

        <label>Bob’s bit (b)</label>
        <select value={b} onChange={(e) => setB(parseInt(e.target.value))}>
          <option value={0}>0</option>
          <option value={1}>1</option>
        </select>

        <button className="btn-primary" onClick={runAND} style={{ marginTop: '0.5rem' }}>
          Compute AND
        </button>
      </div>

      {/* Result */}
      {result !== null && (
        <div className="result-box">
          <p><strong>Result (a AND b):</strong> {result}</p>
        </div>
      )}

      {/* Transcript */}
      {transcript && transcript.length > 0 && (
        <div className="form-group">
          <h4>Step-by-step Transcript</h4>
          <div style={{ fontSize: '0.8rem' }}>
            {transcript.map((t, i) => (
              <div key={i} style={{ marginBottom: '0.5rem' }}>
                <strong>{t.step}</strong>: {t.action}
                <div style={{ color: 'var(--text-muted)' }}>{t.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy */}
      {privacy && (
        <div className="form-group">
          <h4>Privacy Guarantee</h4>
          <p><strong>Alice learns:</strong> {privacy.alice_learns}</p>
          <p><strong>Bob learns:</strong> {privacy.bob_learns}</p>
        </div>
      )}

      {/* Run All */}
      <div className="form-group">
        <button className="foundation-btn" onClick={runAll}>
          Run All (Truth Table)
        </button>

        {truthTable.length > 0 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            {truthTable.map((row, i) => (
              <div key={i}>
                {row.a} AND {row.b} = <strong>{row.result}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PA19SecureAND;