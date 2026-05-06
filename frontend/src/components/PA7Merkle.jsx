import React, { useState } from 'react';

const PA7MerkleDamgard = () => {
  const [message, setMessage] = useState('hello');
  const [isHex, setIsHex] = useState(false);

  const [result, setResult] = useState(null);

  const [editableBlocks, setEditableBlocks] = useState([]);

  const [editingIndex, setEditingIndex] = useState(null);

  // --------------------------------------------------
  // Compute initial chain from backend
  // --------------------------------------------------

  const computeChain = async () => {
    try {
      const response = await fetch('/api/pa7/view_chain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          is_hex: isHex,
        }),
      });

      const data = await response.json();

      setResult(data);

      setEditableBlocks(data.blocks.map((b) => b.hex));
    } catch (e) {
      console.error(e);
    }
  };

  // --------------------------------------------------
  // Local recomputation ONLY
  // No backend refetching
  // --------------------------------------------------

  const recomputeChainLocally = (blocks) => {
    let z = 0;

    const chain = [
      {
        label: 'z0',
        value: '00000000',
      },
    ];

    for (let i = 0; i < blocks.length; i++) {
      const blockHex = blocks[i];

      // XOR toy compression
      // only lower 32 bits retained

      const lower32 =
        parseInt(blockHex.slice(-8), 16) >>> 0;

      z = (z ^ lower32) >>> 0;

      chain.push({
        label: `h(z${i}, M${i + 1})`,
        input_cv:
          chain[i].output_cv || chain[i].value,
        block: blockHex,
        output_cv: z
          .toString(16)
          .padStart(8, '0'),
      });
    }

    setResult((prev) => ({
      ...prev,
      chain,
      digest:
        chain[chain.length - 1].output_cv,
    }));
  };

  // --------------------------------------------------
  // Edit handlers
  // --------------------------------------------------

  const handleBlockEdit = (index, value) => {
    const updated = [...editableBlocks];

    updated[index] = value;

    setEditableBlocks(updated);
  };

  const applyEdit = () => {
    recomputeChainLocally(editableBlocks);

    setEditingIndex(null);
  };

  return (
    <div className="panel">
      {/* HEADER */}

      <div className="panel-header">
        <h2 className="panel-title">
          PA #7 — Merkle-Damgård Chain Viewer
        </h2>

        <p className="panel-subtitle">
          MD-strengthening padding, chaining,
          and avalanche visualization using
          XOR toy compression.
        </p>
      </div>

      {/* INPUT */}

      <div className="form-group">
        <label>Message Input</label>

        <textarea
          rows={3}
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          placeholder="Enter text or hex"
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

          <span style={{ fontSize: '0.9rem' }}>
            Interpret input as hex
          </span>
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={computeChain}
        >
          Generate MD Chain
        </button>
      </div>

      {/* RESULT */}

      {result && (
        <>
          {/* SUMMARY */}

          <div className="result-box">
            <p>
              <strong>Block Size:</strong>{' '}
              {result.block_size} bytes
            </p>

            <p>
              <strong>IV:</strong> 0x
              {result.iv}
            </p>

            <p>
              <strong>Digest:</strong>{' '}
              <span
                style={{
                  color: 'var(--accent)',
                  fontWeight: 'bold',
                }}
              >
                0x{result.digest}
              </span>
            </p>
          </div>

          {/* PADDED MESSAGE */}

          <div className="form-group">
            <label>
              MD-Strengthened Padded Message
            </label>

            <div
              className="result-box"
              style={{
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {result.padded_message}
            </div>
          </div>

          {/* BLOCKS */}

          <div className="form-group">
            <label>8-Byte Blocks</label>

            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
              }}
            >
              {editableBlocks.map(
                (block, index) => (
                  <div
                    key={index}
                    style={{
                      border:
                        '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      background:
                        'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <strong>
                        Block M{index + 1}
                      </strong>

                      <button
                        className="foundation-btn"
                        onClick={() =>
                          setEditingIndex(index)
                        }
                      >
                        Edit
                      </button>
                    </div>

                    {editingIndex ===
                    index ? (
                      <>
                        <input
                          type="text"
                          value={block}
                          onChange={(e) =>
                            handleBlockEdit(
                              index,
                              e.target.value
                            )
                          }
                          style={{
                            width: '100%',
                            marginBottom:
                              '0.5rem',
                            fontFamily:
                              'monospace',
                          }}
                        />

                        <button
                          className="btn-primary"
                          style={{
                            width: '100%',
                          }}
                          onClick={applyEdit}
                        >
                          Recompute Chain
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            fontFamily:
                              'monospace',
                            wordBreak:
                              'break-all',
                            marginBottom:
                              '0.5rem',
                          }}
                        >
                          {block}
                        </div>

                        <div
                          style={{
                            fontSize: '0.8rem',
                            color:
                              'var(--text-muted)',
                          }}
                        >
                          {
                            result.blocks[
                              index
                            ]?.ascii
                          }
                        </div>
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* CHAIN */}

          <div className="form-group">
            <label>
              Merkle–Damgård Chaining
            </label>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {result.chain.map(
                (step, index) => (
                  <div
                    key={index}
                    style={{
                      border:
                        '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '1rem',
                      background:
                        'rgba(255,255,255,0.02)',
                    }}
                  >
                    {index === 0 ? (
                      <>
                        <div
                          style={{
                            fontWeight: 'bold',
                            marginBottom:
                              '0.5rem',
                          }}
                        >
                          z0
                        </div>

                        <div
                          style={{
                            fontFamily:
                              'monospace',
                            color:
                              'var(--accent)',
                            fontWeight:
                              'bold',
                          }}
                        >
                          0x{step.value}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem',
                        }}
                      >
                        {/* INPUT */}

                        <div>
                          <div
                            style={{
                              fontWeight:
                                'bold',
                              marginBottom:
                                '0.25rem',
                            }}
                          >
                            {
                              step.label
                            }
                          </div>

                          <div
                            style={{
                              fontFamily:
                                'monospace',
                              fontSize:
                                '0.85rem',
                            }}
                          >
                            z = 0x
                            {
                              step.input_cv
                            }
                          </div>
                        </div>

                        {/* DOWN */}

                        <div
                          style={{
                            fontSize:
                              '1.5rem',
                            color:
                              'var(--accent)',
                          }}
                        >
                          ↓
                        </div>

                        {/* BLOCK */}

                        <div>
                          <div
                            style={{
                              fontSize:
                                '0.8rem',
                              marginBottom:
                                '0.25rem',
                            }}
                          >
                            Block
                          </div>

                          <div
                            style={{
                              fontFamily:
                                'monospace',
                              maxWidth:
                                '280px',
                              wordBreak:
                                'break-all',
                            }}
                          >
                            {
                              step.block
                            }
                          </div>
                        </div>

                        {/* ARROW */}

                        <div
                          style={{
                            fontSize:
                              '1.5rem',
                            color:
                              'var(--accent)',
                          }}
                        >
                          →
                        </div>

                        {/* OUTPUT */}

                        <div>
                          <div
                            style={{
                              fontSize:
                                '0.8rem',
                              marginBottom:
                                '0.25rem',
                            }}
                          >
                            Output CV
                          </div>

                          <div
                            style={{
                              fontFamily:
                                'monospace',
                              color:
                                'var(--accent)',
                              fontWeight:
                                'bold',
                            }}
                          >
                            0x
                            {
                              step.output_cv
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* INFO */}

          <div className="form-group">
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1.7,
              }}
            >
              Editing any block changes all
              subsequent chaining values,
              demonstrating the avalanche
              effect in the Merkle–Damgård
              construction.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PA7MerkleDamgard;