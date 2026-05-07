import React, { useEffect, useMemo, useState } from "react";

const NODE_SIZE = 78;

const PA2PRF = () => {
  const [k, setK] = useState("deadbeef");
  const [x, setX] = useState("0101");
  const [depth, setDepth] = useState(4);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // ------------------------------------
  // HEX VALIDATION
  // ------------------------------------
  const handleKeyChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^0-9a-f]/g, "");

    setK(value);
  };

  // ------------------------------------
  // BIT STRING VALIDATION
  // ------------------------------------
  const handleXChange = (e) => {
    let value = e.target.value.replace(/[^01]/g, "");

    if (value.length > depth) {
      value = value.slice(0, depth);
    }

    setX(value);
  };

  // ------------------------------------
  // AUTO-TRIM QUERY WHEN DEPTH CHANGES
  // ------------------------------------
  useEffect(() => {
    if (x.length > depth) {
      setX(x.slice(0, depth));
    }
  }, [depth]);

  // ------------------------------------
  // ACTIVE PATH
  // ------------------------------------
  const activeNodes = useMemo(() => {
    const set = new Set();

    let current = "";

    set.add("");

    for (let i = 0; i < x.length; i++) {
      current += x[i];
      set.add(current);
    }

    return set;
  }, [x]);

  // ------------------------------------
  // DETERMINISTIC "PRG-LIKE" NODE VALUE
  // ------------------------------------
  const deriveNodeValue = (bits, level) => {
    try {
      const keyBig = BigInt("0x" + (k || "0"));

      const bitsBig = BigInt(bits === "" ? 0 : parseInt(bits, 2));

      const mixed =
        (keyBig * 1103515245n + bitsBig * 12345n + BigInt(level * 7919)) %
        0xffffffffffffffffn;

      return mixed.toString(16).padStart(16, "0").slice(0, 8);
    } catch {
      return "00000000";
    }
  };

  // ------------------------------------
  // BUILD TREE
  // ------------------------------------
  const treeLevels = useMemo(() => {
    const levels = [];

    for (let level = 0; level <= depth; level++) {
      const nodes = [];

      const count = 2 ** level;

      for (let i = 0; i < count; i++) {
        const bits = i.toString(2).padStart(level, "0");

        nodes.push({
          bits,
          active: activeNodes.has(bits),
          value: deriveNodeValue(bits, level),
        });
      }

      levels.push(nodes);
    }

    return levels;
  }, [depth, k, x]);

  // ------------------------------------
  // API CALL
  // ------------------------------------
  const evaluatePRF = async () => {
    if (!k || !x || x.length !== depth) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/pa2/prf/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          k: parseInt(k, 16),
          x: parseInt(x, 2),
          depth,
        }),
      });

      const data = await response.json();

      setResult(data.y);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // ------------------------------------
  // LIVE UPDATE
  // ------------------------------------
  useEffect(() => {
    if (x.length === depth && k.length > 0) {
      evaluatePRF();
    }
  }, [x, k, depth]);

  return (
    <div className="panel">
      {/* -------------------------------- HEADER -------------------------------- */}
      <div className="panel-header">
        <h2 className="panel-title">PA #2 — GGM Tree Visualizer</h2>

        <p className="panel-subtitle">
          Interactive visualization of the Goldreich–Goldwasser–Micali PRF tree.
        </p>
      </div>

      {/* -------------------------------- INPUTS -------------------------------- */}
      <div className="form-group">
        <label>Key k (hex)</label>

        <input
          type="text"
          value={k}
          onChange={handleKeyChange}
          placeholder="deadbeef"
        />
      </div>

      <div className="form-group">
        <label>Query x (bit string length = {depth})</label>

        <input
          type="text"
          value={x}
          onChange={handleXChange}
          placeholder="0101"
        />
      </div>

      <div className="form-group">
        <label>Tree Depth</label>

        <select
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
        >
          <option value={4}>4</option>
          <option value={5}>5</option>
          <option value={6}>6</option>
          <option value={7}>7</option>
          <option value={8}>8</option>
        </select>
      </div>

      {/* -------------------------------- OUTPUT -------------------------------- */}
      <div
        className="result-box"
        style={{
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.9rem",
            marginBottom: "0.5rem",
            opacity: 0.7,
          }}
        >
          Final PRF Output
        </div>

        <div
          style={{
            fontSize: "1.4rem",
            fontWeight: "bold",
            fontFamily: "monospace",
            color: "#60a5fa",
          }}
        >
          Fₖ({x || "ε"}) = {loading ? "Computing..." : result || "—"}
        </div>
      </div>

      {/* -------------------------------- TREE -------------------------------- */}
      <div
        style={{
          overflowX: "auto",
          paddingBottom: "1rem",
        }}
      >
        <div
          style={{
            minWidth: `${Math.pow(2, depth) * 90}px`,
          }}
        >
          {treeLevels.map((level, levelIndex) => {
            const count = level.length;

            return (
              <div
                key={levelIndex}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${count}, 1fr)`,
                  gap: "1rem",
                  marginBottom: "1.5rem",
                  alignItems: "center",
                  justifyItems: "center",
                }}
              >
                {level.map((node) => (
                  <div
                    key={node.bits}
                    style={{
                      width: `${NODE_SIZE}px`,
                      minHeight: `${NODE_SIZE}px`,

                      borderRadius: "16px",

                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",

                      transition: "0.2s ease",

                      background: node.active
                        ? "linear-gradient(135deg,#3b82f6,#60a5fa)"
                        : "#1f2937",

                      opacity: node.active ? 1 : 0.35,

                      border: node.active
                        ? "2px solid #93c5fd"
                        : "1px solid #374151",

                      boxShadow: node.active
                        ? "0 0 20px rgba(96,165,250,0.4)"
                        : "none",

                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        marginBottom: "0.35rem",
                        opacity: 0.8,
                      }}
                    >
                      {node.bits === "" ? "root" : node.bits}
                    </div>

                    <div
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                      }}
                    >
                      {node.value}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------- INFO -------------------------------- */}
      <div
        className="result-box"
        style={{
          marginTop: "1rem",
          fontSize: "0.85rem",
          lineHeight: "1.6",
        }}
      >
        <p>
          🔵 Blue nodes indicate the active GGM traversal path defined by x.
        </p>

        <p>⚫ Grey nodes are inactive branches.</p>

        <p>
          Changing even one bit in x produces a completely different traversal
          path and PRF output.
        </p>
      </div>
    </div>
  );
};

export default PA2PRF;
