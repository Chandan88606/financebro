import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, Sparkles } from 'lucide-react';

export default function TerminalLogs({ logs = [] }) {
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Terminal size={14} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Simulation Engine Stream
          </span>
        </div>
        <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          {logs.length} events recorded
        </span>
      </div>

      <div
        ref={logContainerRef}
        className="mono"
        style={{
          background: '#040711',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '0.65rem',
          height: 110,
          overflowY: 'auto',
          fontSize: '0.74rem',
          lineHeight: '1.45',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem'
        }}
      >
        {logs.length === 0 ? (
          <span style={{ color: 'var(--text-dim)' }}>Waiting for engine pulse...</span>
        ) : (
          logs.map((logStr, i) => {
            let color = 'var(--text-muted)';
            if (logStr.includes('BUY ORDER')) color = 'var(--accent-emerald)';
            else if (logStr.includes('SELL ORDER')) color = 'var(--accent-cyan)';
            else if (logStr.includes('AUTO-EXIT')) color = 'var(--accent-rose)';
            else if (logStr.includes('rules')) color = 'var(--accent-indigo)';

            return (
              <div key={i} style={{ color }}>
                {logStr}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
