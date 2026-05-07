import React, { useState } from "react";

const PA6CCA = () => {
  const [ke, setKe] = useState("123");
  const [km, setKm] = useState("456");
  const [m, setM] = useState("Top Secret");

  const [encResult, setEncResult] = useState(null);

  const [ccaResult, setCcaResult] = useState(null);
  const [cpaResult, setCpaResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const encrypt = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/pa6/encrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ke: parseInt(ke),
          km: parseInt(km),
          m,
        }),
      });

      const data = await response.json();

      setEncResult(data);

      setCcaResult(null);
      setCpaResult(null);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  // ------------------------------------
  // RIGHT SIDE (CCA)
  // Encrypt-then-MAC
  // ------------------------------------
  const decryptCCA = async (tamper = false) => {
    if (!encResult) return;

    setLoading(true);

    let { r, ct_hex, tag } = encResult;

    // flip first bit
    if (tamper) {
      const firstByte = parseInt(ct_hex.substring(0, 2), 16);

      const tamperedByte = (firstByte ^ 0x01).toString(16).padStart(2, "0");

      ct_hex = tamperedByte + ct_hex.substring(2);
    }

    try {
      const response = await fetch("/api/pa6/decrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ke: parseInt(ke),
          km: parseInt(km),
          r,
          ct_hex,
          tag,
        }),
      });

      const data = await response.json();

      setCcaResult({
        tampered: tamper,
        ...data,
      });
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  // ------------------------------------
  // LEFT SIDE (CPA)
  // No MAC verification
  // ------------------------------------
  const decryptCPA = async () => {
    if (!encResult) return;

    setLoading(true);

    let { r, ct_hex } = encResult;

    // always tamper
    const firstByte = parseInt(ct_hex.substring(0, 2), 16);

    const tamperedByte = (firstByte ^ 0x01).toString(16).padStart(2, "0");

    ct_hex = tamperedByte + ct_hex.substring(2);

    try {
      const response = await fetch("/api/pa3/decrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          k: ke.toString(),
          r: parseInt(r),
          c_hex: ct_hex,
        }),
      });

      const data = await response.json();

      setCpaResult({
        tampered_ct: ct_hex,
        ...data,
      });
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">PA #6 — CCA-Secure Encryption</h2>

        <p className="panel-subtitle">
          Malleability attack demo: CPA vs Encrypt-then-MAC.
        </p>
      </div>

      {/* ---------------- INPUTS ---------------- */}
      <div className="form-group">
        <label>Keys & Message</label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          <input
            type="number"
            value={ke}
            onChange={(e) => setKe(e.target.value)}
            placeholder="Enc Key (kE)"
          />

          <input
            type="number"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder="MAC Key (kM)"
          />
        </div>

        <input
          type="text"
          value={m}
          onChange={(e) => setM(e.target.value)}
          placeholder="Message"
          style={{
            width: "100%",
            marginBottom: "0.5rem",
          }}
        />

        <button
          className="btn-primary"
          style={{ width: "100%" }}
          onClick={encrypt}
        >
          Encrypt
        </button>
      </div>

      {/* ---------------- RESULTS ---------------- */}
      {encResult && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {/* ================================================= */}
          {/* LEFT SIDE — CPA */}
          {/* ================================================= */}
          <div className="result-box">
            <h3
              style={{
                marginBottom: "0.75rem",
              }}
            >
              CPA-only (Malleable)
            </h3>

            <p>
              <strong>C:</strong> ⟨r, ct⟩
            </p>

            <p>
              <strong>r:</strong> {encResult.r}
            </p>

            <p
              style={{
                wordBreak: "break-all",
              }}
            >
              <strong>ct:</strong> {encResult.ct_hex.substring(0, 32)}...
            </p>

            <button
              className="foundation-btn"
              style={{
                width: "100%",
                marginTop: "1rem",
                color: "var(--danger)",
              }}
              onClick={decryptCPA}
            >
              Flip Bit & Decrypt
            </button>

            {cpaResult && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "rgba(255,0,0,0.05)",
                }}
              >
                <p>
                  <strong>Tampered ct:</strong>
                </p>

                <p
                  style={{
                    wordBreak: "break-all",
                    fontSize: "0.75rem",
                  }}
                >
                  {cpaResult.tampered_ct.substring(0, 32)}...
                </p>

                <p
                  style={{
                    marginTop: "0.75rem",
                    color: "var(--danger)",
                  }}
                >
                  <strong>Modified Plaintext:</strong> {cpaResult.m}
                </p>
              </div>
            )}
          </div>

          {/* ================================================= */}
          {/* RIGHT SIDE — CCA */}
          {/* ================================================= */}
          <div className="result-box">
            <h3
              style={{
                marginBottom: "0.75rem",
              }}
            >
              CCA (Encrypt-then-MAC)
            </h3>

            <p>
              <strong>r:</strong> {encResult.r}
            </p>

            <p
              style={{
                wordBreak: "break-all",
              }}
            >
              <strong>ct:</strong> {encResult.ct_hex.substring(0, 32)}...
            </p>

            <p>
              <strong>tag:</strong> 0x{encResult.tag.toString(16).toUpperCase()}
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              <button
                className="foundation-btn"
                style={{ flex: 1 }}
                onClick={() => decryptCCA(false)}
              >
                Normal
              </button>

              <button
                className="foundation-btn"
                style={{
                  flex: 1,
                  color: "var(--danger)",
                }}
                onClick={() => decryptCCA(true)}
              >
                Flip Bit
              </button>
            </div>

            {ccaResult && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.1)",
                }}
              >
                {ccaResult.valid ? (
                  <p
                    style={{
                      color: "var(--accent)",
                    }}
                  >
                    <strong>Plaintext:</strong> {ccaResult.m}
                  </p>
                ) : (
                  <p
                    style={{
                      color: "var(--danger)",
                    }}
                  >
                    <strong>⊥ MAC Verification Failed</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- INFO ---------------- */}
      <div className="form-group">
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          Left: ciphertext tampering changes the decrypted plaintext
          (malleability).
          <br />
          <br />
          Right: Encrypt-then-MAC detects tampering before decryption and
          returns ⊥.
        </p>
      </div>
    </div>
  );
};

export default PA6CCA;
