import React, { useState } from 'react';

const PA8DLPHash = () => {
  const [message, setMessage] = useState('hello');

  const [isHex, setIsHex] = useState(false);

  const [hashResult, setHashResult] =
    useState(null);

  const [collisionResult,
    setCollisionResult] = useState(null);

  const [attempts, setAttempts] =
    useState(0);

  const [progress, setProgress] =
    useState(0);

  const [running, setRunning] =
    useState(false);

  // -----------------------------------------
  // HASH MESSAGE
  // -----------------------------------------

  const computeHash = async () => {
    try {
      const response = await fetch(
        '/api/pa8/hash',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            message,
            is_hex: isHex,
          }),
        }
      );

      const data = await response.json();

      setHashResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  // -----------------------------------------
  // COLLISION HUNT
  // -----------------------------------------

  const runCollisionHunt = async () => {
    setRunning(true);

    setCollisionResult(null);

    setAttempts(0);

    setProgress(0);

    const interval = setInterval(() => {
      setAttempts((prev) => prev + 8);

      setProgress((prev) =>
        Math.min(prev + 3, 95)
      );
    }, 100);

    try {
      const response = await fetch(
        '/api/pa8/collision_hunt'
      );

      const data = await response.json();

      clearInterval(interval);

      setAttempts(data.attempts);

      setProgress(data.progress);

      setCollisionResult(data);
    } catch (e) {
      console.error(e);
    }

    setRunning(false);
  };

  return (
    <div className="panel">
      {/* HEADER */}

      <div className="panel-header">
        <h2 className="panel-title">
          PA #8 — DLP Hash Live
        </h2>

        <p className="panel-subtitle">
          DLP-based collision resistant
          hash with birthday attack demo.
        </p>
      </div>

      {/* HASH INPUT */}

      <div className="form-group">
        <label>Message Input</label>

        <textarea
          rows={3}
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Enter message"
          style={{
            width: '100%',
            marginBottom: '0.75rem',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <input
            type="checkbox"
            checked={isHex}
            onChange={(e) =>
              setIsHex(e.target.checked)
            }
          />

          <span>
            Interpret input as hex
          </span>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={computeHash}
        >
          Compute DLP Hash
        </button>
      </div>

      {/* HASH RESULT */}

      {hashResult && (
        <div className="result-box">
          <p>
            <strong>Full Hash:</strong>
          </p>

          <div
            style={{
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              marginBottom: '1rem',
              color: 'var(--accent)',
            }}
          >
            {hashResult.full_hash_hex}
          </div>

          <p>
            <strong>
              Toy 16-bit Output:
            </strong>
          </p>

          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '1.25rem',
              color: 'var(--accent)',
              fontWeight: 'bold',
            }}
          >
            0x{hashResult.toy_hash_hex}
          </div>
        </div>
      )}

      {/* COLLISION HUNT */}

      <div className="form-group">
        <button
          className="foundation-btn"
          style={{
            width: '100%',
            marginBottom: '1rem',
          }}
          onClick={runCollisionHunt}
          disabled={running}
        >
          {running
            ? 'Running Birthday Attack...'
            : 'Collision Hunt'}
        </button>

        {/* PROGRESS */}

        <div
          style={{
            width: '100%',
            height: '14px',
            borderRadius: '999px',
            background:
              'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            marginBottom: '0.75rem',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background:
                'var(--accent)',
              transition:
                'width 0.2s ease',
            }}
          />
        </div>

        <div
          style={{
            fontSize: '0.9rem',
            marginBottom: '1rem',
          }}
        >
          Hashes Evaluated: {attempts}
          {' / '}
          256
        </div>

        {/* COLLISION RESULT */}

        {collisionResult &&
          collisionResult.collision_found && (
            <div className="result-box">
              <p
                style={{
                  color: 'var(--danger)',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                }}
              >
                Collision Found!
              </p>

              <p>
                <strong>
                  Colliding Hash:
                </strong>{' '}
                0x
                {
                  collisionResult.hash_hex
                }
              </p>

              <div
                style={{
                  marginTop: '1rem',
                }}
              >
                <p>
                  <strong>m1:</strong>
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
                  {
                    collisionResult.m1
                  }
                </div>

                <p>
                  <strong>m2:</strong>
                </p>

                <div
                  style={{
                    fontFamily:
                      'monospace',
                    wordBreak:
                      'break-all',
                  }}
                >
                  {
                    collisionResult.m2
                  }
                </div>
              </div>
            </div>
          )}
      </div>

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
          Birthday attacks find collisions
          in approximately 2^(n/2)
          operations. For the toy 16-bit
          hash output, collisions appear
          near 256 attempts.
        </div>
      </div>
    </div>
  );
};

export default PA8DLPHash;