import React, { useState } from 'react';

const PA12RSADeterminism = () => {
  const [message, setMessage] =
    useState('yes');

  const [mode, setMode] =
    useState('textbook');

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  // -----------------------------------------
  // ENCRYPT TWICE
  // -----------------------------------------

  const encryptTwice = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        '/api/pa12/encrypt_twice',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            message,
            mode,
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
          PA #12 — RSA Determinism
        </h2>

        <p className="panel-subtitle">
          Compare textbook RSA with
          randomized PKCS#1 v1.5
          padding.
        </p>
      </div>

      {/* CONTROLS */}

      <div className="form-group">
        <label>
          Plaintext Message
        </label>

        <input
          type="text"
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="yes / no"
          style={{
            width: '100%',
            marginBottom: '1rem',
          }}
        />

        <label>
          Encryption Mode
        </label>

        <select
          value={mode}
          onChange={(e) =>
            setMode(e.target.value)
          }
          style={{
            width: '100%',
            marginBottom: '1rem',
          }}
        >
          <option value="textbook">
            Textbook RSA
          </option>

          <option value="pkcs15">
            PKCS#1 v1.5
          </option>
        </select>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={encryptTwice}
          disabled={loading}
        >
          {loading
            ? 'Encrypting...'
            : 'Encrypt Twice'}
        </button>
      </div>

      {/* RESULT */}

      {result && (
        <>
          {/* BANNER */}

          <div
            style={{
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              fontWeight: 'bold',
              background:
                result.identical
                  ? 'rgba(255,0,0,0.1)'
                  : 'rgba(0,255,100,0.1)',

              border: result.identical
                ? '1px solid red'
                : '1px solid lime',

              color: result.identical
                ? 'red'
                : 'lime',
            }}
          >
            {result.identical
              ? 'Identical ciphertexts: plaintext leaked'
              : 'Ciphertexts differ: randomized encryption secure'}
          </div>

          {/* CIPHERS */}

          <div className="result-box">
            <p>
              <strong>
                Ciphertext #1
              </strong>
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
              {result.cipher1}
            </div>

            <p>
              <strong>
                Ciphertext #2
              </strong>
            </p>

            <div
              style={{
                fontFamily:
                  'monospace',
                wordBreak:
                  'break-all',
              }}
            >
              {result.cipher2}
            </div>
          </div>

          {/* PADDING PANEL */}

          {result.mode ===
            'pkcs15' && (
            <div
              className="result-box"
              style={{
                marginTop: '1rem',
              }}
            >
              <h3
                style={{
                  marginBottom:
                    '1rem',
                }}
              >
                Padding Bytes (PS)
              </h3>

              <p>
                <strong>
                  Encryption #1
                </strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  wordBreak:
                    'break-all',
                  marginBottom:
                    '1rem',
                  color:
                    'var(--accent)',
                }}
              >
                {result.padding1}
              </div>

              <p>
                <strong>
                  Encryption #2
                </strong>
              </p>

              <div
                style={{
                  fontFamily:
                    'monospace',
                  wordBreak:
                    'break-all',
                  color:
                    'var(--accent)',
                }}
              >
                {result.padding2}
              </div>
            </div>
          )}

          {/* INFO */}

          <div
            className="form-group"
            style={{
              marginTop: '1rem',
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                color:
                  'var(--text-muted)',
                lineHeight: 1.7,
              }}
            >
              Textbook RSA is
              deterministic: encrypting
              the same plaintext twice
              produces identical
              ciphertexts, leaking
              information. PKCS#1 v1.5
              adds random padding bytes
              to ensure different
              ciphertexts every time.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PA12RSADeterminism;