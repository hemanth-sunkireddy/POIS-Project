import React, { useState } from 'react';

const PA9BirthdayAttack = () => {
  const [n, setN] = useState(12);

  const [running, setRunning] =
    useState(false);

  const [evaluations, setEvaluations] =
    useState(0);

  const [result, setResult] =
    useState(null);

  const [chart, setChart] =
    useState([]);

  // -----------------------------------------
  // RUN ATTACK
  // -----------------------------------------

  const runAttack = async () => {
    setRunning(true);

    setResult(null);

    setEvaluations(0);

    setChart([]);

    const interval = setInterval(() => {
      setEvaluations((prev) => prev + 2);
    }, 40);

    try {
      const response = await fetch(
        '/api/pa9/run_attack',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({ n }),
        }
      );

      const data = await response.json();

      clearInterval(interval);

      setEvaluations(data.evaluations);

      setResult(data);

      setChart(data.chart);
    } catch (e) {
      console.error(e);
    }

    setRunning(false);
  };

  // -----------------------------------------
  // GRAPH
  // -----------------------------------------

  const graphWidth = 600;

  const graphHeight = 240;

  const maxK =
    chart.length > 0
      ? chart[chart.length - 1].k
      : 1;

  const expected =
    Math.pow(2, n / 2);

  return (
    <div className="panel">
      {/* HEADER */}

      <div className="panel-header">
        <h2 className="panel-title">
          PA #9 — Live Birthday Attack
        </h2>

        <p className="panel-subtitle">
          Empirical birthday collision
          experiment with theoretical
          probability curve.
        </p>
      </div>

      {/* CONTROLS */}

      <div className="form-group">
        <label>
          Output Bit Length (n)
        </label>

        <input
          type="range"
          min="8"
          max="16"
          step="2"
          value={n}
          onChange={(e) =>
            setN(parseInt(e.target.value))
          }
          style={{
            width: '100%',
            marginBottom: '0.5rem',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {[8, 10, 12, 14, 16].map(
            (v) => (
              <span
                key={v}
                style={{
                  fontWeight:
                    v === n
                      ? 'bold'
                      : 'normal',
                  color:
                    v === n
                      ? 'var(--accent)'
                      : 'inherit',
                }}
              >
                {v}
              </span>
            )
          )}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={runAttack}
          disabled={running}
        >
          {running
            ? 'Running Attack...'
            : 'Run Attack'}
        </button>
      </div>

      {/* LIVE COUNTER */}

      <div className="result-box">
        <p>
          <strong>
            Hashes Computed:
          </strong>{' '}
          {evaluations}
        </p>

        <p>
          <strong>
            Expected Collision Point:
          </strong>{' '}
          2^(n/2) = {expected}
        </p>
      </div>

      {/* GRAPH */}

      <div className="form-group">
        <label>
          Collision Probability Curve
        </label>

        <div
          style={{
            overflowX: 'auto',
            border:
              '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <svg
            width={graphWidth}
            height={graphHeight}
          >
            {/* axes */}

            <line
              x1="40"
              y1="200"
              x2="560"
              y2="200"
              stroke="white"
            />

            <line
              x1="40"
              y1="20"
              x2="40"
              y2="200"
              stroke="white"
            />

            {/* expected marker */}

            <line
              x1={
                40 +
                (expected / maxK) * 500
              }
              y1="20"
              x2={
                40 +
                (expected / maxK) * 500
              }
              y2="200"
              stroke="red"
              strokeDasharray="4"
            />

            {/* curve */}

            {chart.map((p, i) => {
              if (i === 0) return null;

              const prev =
                chart[i - 1];

              const x1 =
                40 +
                (prev.k / maxK) * 500;

              const y1 =
                200 -
                prev.probability * 160;

              const x2 =
                40 +
                (p.k / maxK) * 500;

              const y2 =
                200 -
                p.probability * 160;

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--accent)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        <div
          style={{
            marginTop: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          Red dashed line = expected
          collision point 2^(n/2)
        </div>
      </div>

      {/* COLLISION */}

      {result &&
        result.collision_found && (
          <div className="result-box">
            <p
              style={{
                color: 'var(--danger)',
                fontWeight: 'bold',
                marginBottom: '1rem',
              }}
            >
              Collision Found
            </p>

            <p>
              <strong>
                Shared Hash:
              </strong>{' '}
              0x{result.shared_hash}
            </p>

            <p>
              <strong>
                Evaluations:
              </strong>{' '}
              {result.evaluations}
            </p>

            <div
              style={{
                marginTop: '1rem',
              }}
            >
              <p>
                <strong>Input 1</strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  wordBreak:
                    'break-all',
                  marginBottom:
                    '1rem',
                }}
              >
                {result.m1}
              </div>

              <p>
                <strong>Input 2</strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  wordBreak:
                    'break-all',
                }}
              >
                {result.m2}
              </div>
            </div>
          </div>
        )}

      {/* INFO */}

      <div className="form-group">
        <div
          style={{
            fontSize: '0.85rem',
            color:
              'var(--text-muted)',
            lineHeight: 1.7,
          }}
        >
          Birthday attacks require
          approximately 2^(n/2)
          evaluations to find collisions.
          For n = 12, collisions appear
          near 64 evaluations on average.
        </div>
      </div>
    </div>
  );
};

export default PA9BirthdayAttack;