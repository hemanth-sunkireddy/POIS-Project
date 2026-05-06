import React, { useState } from 'react';

const PA11DiffieHellman = () => {
  const [a, setA] = useState('');

  const [b, setB] = useState('');

  const [eveEnabled,
    setEveEnabled] = useState(false);

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  // -----------------------------------------
  // RANDOMISE
  // -----------------------------------------

  const randomHex = () => {
    return Math.floor(
      Math.random() * 0xffffffff
    ).toString(16);
  };

  // -----------------------------------------
  // EXCHANGE
  // -----------------------------------------

  const runExchange = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        '/api/pa11/exchange',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            a: a ? parseInt(a, 16) : null,
            b: b ? parseInt(b, 16) : null,
            eve_enabled:
              eveEnabled,
          }),
        }
      );

      const data = await response.json();

      setResult(data);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <div className="panel">
      {/* HEADER */}

      <div className="panel-header">
        <h2 className="panel-title">
          PA #11 — Live Diffie-Hellman
        </h2>

        <p className="panel-subtitle">
          Interactive DH exchange with
          optional MITM attack.
        </p>
      </div>

      {/* CONTROLS */}

      <div className="form-group">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          {/* ALICE */}

          <div>
            <label>
              Alice Private Exponent (a)
            </label>

            <input
              type="text"
              value={a}
              onChange={(e) =>
                setA(e.target.value)
              }
              placeholder="hex"
              style={{
                width: '100%',
                marginBottom: '0.5rem',
              }}
            />

            <button
              className="foundation-btn"
              style={{ width: '100%' }}
              onClick={() =>
                setA(randomHex())
              }
            >
              Randomise Alice
            </button>
          </div>

          {/* BOB */}

          <div>
            <label>
              Bob Private Exponent (b)
            </label>

            <input
              type="text"
              value={b}
              onChange={(e) =>
                setB(e.target.value)
              }
              placeholder="hex"
              style={{
                width: '100%',
                marginBottom: '0.5rem',
              }}
            />

            <button
              className="foundation-btn"
              style={{ width: '100%' }}
              onClick={() =>
                setB(randomHex())
              }
            >
              Randomise Bob
            </button>
          </div>
        </div>

        {/* EVE */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <input
            type="checkbox"
            checked={eveEnabled}
            onChange={(e) =>
              setEveEnabled(
                e.target.checked
              )
            }
          />

          <span>
            Enable Eve (MITM)
          </span>
        </div>

        {/* EXCHANGE */}

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={runExchange}
          disabled={loading}
        >
          {loading
            ? 'Exchanging...'
            : 'Exchange'}
        </button>
      </div>

      {/* RESULT */}

      {result && (
        <>
          {/* GROUP */}

          <div className="result-box">
            <p>
              <strong>P:</strong>{' '}
              0x{result.group.p}
            </p>

            <p>
              <strong>G:</strong>{' '}
              0x{result.group.g}
            </p>

            <p>
              <strong>Q:</strong>{' '}
              0x{result.group.q}
            </p>
          </div>

          {/* PANELS */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                result.eve_enabled
                  ? '1fr 1fr 1fr'
                  : '1fr 1fr',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            {/* ALICE */}

            <div
              style={{
                border:
                  '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <h3
                style={{
                  marginBottom: '1rem',
                }}
              >
                Alice
              </h3>

              <p>
                <strong>a:</strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  marginBottom:
                    '1rem',
                }}
              >
                0x{result.alice.a}
              </div>

              <p>
                <strong>g^a:</strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  marginBottom:
                    '1rem',
                }}
              >
                0x{result.alice.A}
              </div>

              <p>
                <strong>
                  Shared Secret
                </strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  color:
                    result.shared_match
                      ? 'lime'
                      : 'orange',
                  fontWeight:
                    'bold',
                }}
              >
                0x
                {
                  result.alice
                    .shared_key
                }
              </div>
            </div>

            {/* BOB */}

            <div
              style={{
                border:
                  '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1rem',
              }}
            >
              <h3
                style={{
                  marginBottom: '1rem',
                }}
              >
                Bob
              </h3>

              <p>
                <strong>b:</strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  marginBottom:
                    '1rem',
                }}
              >
                0x{result.bob.b}
              </div>

              <p>
                <strong>g^b:</strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  marginBottom:
                    '1rem',
                }}
              >
                0x{result.bob.B}
              </div>

              <p>
                <strong>
                  Shared Secret
                </strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  color:
                    result.shared_match
                      ? 'lime'
                      : 'orange',
                  fontWeight:
                    'bold',
                }}
              >
                0x
                {
                  result.bob
                    .shared_key
                }
              </div>
            </div>

            {/* EVE */}

            {result.eve_enabled && (
              <div
                style={{
                  border:
                    '1px solid red',
                  borderRadius: '12px',
                  padding: '1rem',
                  background:
                    'rgba(255,0,0,0.05)',
                }}
              >
                <h3
                  style={{
                    marginBottom: '1rem',
                    color: 'red',
                  }}
                >
                  Eve (MITM)
                </h3>

                <p>
                  <strong>
                    Fake Value E
                  </strong>
                </p>

                <div
                  style={{
                    fontFamily:
                      'monospace',
                    marginBottom:
                      '1rem',
                  }}
                >
                  0x{result.eve.E}
                </div>

                <p>
                  <strong>
                    Alice Secret
                  </strong>
                </p>

                <div
                  style={{
                    fontFamily:
                      'monospace',
                    marginBottom:
                      '1rem',
                    color: 'red',
                  }}
                >
                  0x
                  {
                    result.eve
                      .alice_secret
                  }
                </div>

                <p>
                  <strong>
                    Bob Secret
                  </strong>
                </p>

                <div
                  style={{
                    fontFamily:
                      'monospace',
                    color: 'red',
                  }}
                >
                  0x
                  {
                    result.eve
                      .bob_secret
                  }
                </div>
              </div>
            )}
          </div>

          {/* STATUS */}

          <div
            style={{
              marginTop: '1rem',
            }}
          >
            {result.shared_match ? (
              <div
                style={{
                  color: 'lime',
                  fontWeight: 'bold',
                }}
              >
                Shared secrets match.
                Secure channel established.
              </div>
            ) : (
              <div
                style={{
                  color: 'red',
                  fontWeight: 'bold',
                }}
              >
                MITM attack succeeded.
                Alice and Bob no longer
                share the same secret.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PA11DiffieHellman;