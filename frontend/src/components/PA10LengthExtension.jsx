import React, { useState } from 'react';

const PA10LengthExtension = () => {
  const [suffix, setSuffix] =
    useState('admin=true');

  const [hashMode, setHashMode] =
    useState('dlp');

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  // -----------------------------------------
  // RUN DEMO
  // -----------------------------------------

  const runDemo = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        '/api/pa10/demo',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            suffix,
            hash_mode: hashMode,
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
          PA #10 — Length Extension
          vs HMAC
        </h2>

        <p className="panel-subtitle">
          Compare broken H(k||m)
          against secure HMAC.
        </p>
      </div>

      {/* CONTROLS */}

      <div className="form-group">
        <label>
          Underlying Hash
        </label>

        <select
          value={hashMode}
          onChange={(e) =>
            setHashMode(e.target.value)
          }
          style={{
            width: '100%',
            marginBottom: '1rem',
          }}
        >
          <option value="dlp">
            PA#8 DLP Hash
          </option>

          <option value="sha256">
            SHA-256
          </option>
        </select>

        <label>
          Extension Suffix
        </label>

        <input
          type="text"
          value={suffix}
          onChange={(e) =>
            setSuffix(e.target.value)
          }
          placeholder="Enter suffix"
          style={{
            width: '100%',
            marginBottom: '1rem',
          }}
        />

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={runDemo}
          disabled={loading}
        >
          {loading
            ? 'Running...'
            : 'Run Length Extension'}
        </button>
      </div>

      {/* ORIGINAL */}

      {result && (
        <div className="result-box">
          <p>
            <strong>
              Original Message:
            </strong>
          </p>

          <div
            style={{
              fontFamily: 'monospace',
              marginBottom: '1rem',
            }}
          >
            {result.original_message}
          </div>

          <p>
            <strong>
              Forged Message:
            </strong>
          </p>

          <div
            style={{
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            {result.forged_message}
          </div>
        </div>
      )}

      {/* SIDE BY SIDE */}

      {result && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {/* BROKEN */}

          <div
            style={{
              border:
                '1px solid var(--danger)',
              borderRadius: '12px',
              padding: '1rem',
              background:
                'rgba(255,0,0,0.05)',
            }}
          >
            <h3
              style={{
                marginBottom: '1rem',
                color: 'var(--danger)',
              }}
            >
              Broken H(k||m)
            </h3>

            <p>
              <strong>
                Original Tag
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
              {result.naive.tag}
            </div>

            <p>
              <strong>
                Forged Tag
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
              {
                result.naive
                  .forged_tag
              }
            </div>

            <div
              style={{
                color:
                  'var(--danger)',
                fontWeight:
                  'bold',
                fontSize:
                  '1.1rem',
              }}
            >
              Forgery Succeeded
            </div>
          </div>

          {/* HMAC */}

          <div
            style={{
              border:
                '1px solid var(--accent)',
              borderRadius: '12px',
              padding: '1rem',
              background:
                'rgba(0,255,120,0.05)',
            }}
          >
            <h3
              style={{
                marginBottom: '1rem',
                color:
                  'var(--accent)',
              }}
            >
              HMAC
            </h3>

            <p>
              <strong>
                Original Tag
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
              {result.hmac.tag}
            </div>

            <p>
              <strong>
                Attempted Forgery
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
              {
                result.hmac
                  .attempted_tag
              }
            </div>

            <p>
              <strong>
                Real HMAC
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
              {
                result.hmac
                  .real_tag
              }
            </div>

            <div
              style={{
                color:
                  'var(--accent)',
                fontWeight:
                  'bold',
                fontSize:
                  '1.1rem',
              }}
            >
              Forgery Failed
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
            marginTop: '1rem',
          }}
        >
          Naive MAC constructions
          using H(k||m) are vulnerable
          to length-extension attacks.
          HMAC prevents this because
          the attacker cannot compute
          the outer keyed hash without
          knowing the secret key.
        </div>
      </div>
    </div>
  );
};

export default PA10LengthExtension;