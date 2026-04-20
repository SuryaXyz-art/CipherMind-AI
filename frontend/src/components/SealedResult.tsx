/**
 * SealedResult — Decrypted result display component
 * Professional design with SVG icons instead of emojis.
 */

import React from 'react';
import { IconCheck, IconShieldCheck, IconTrendingUp, IconTrendingDown, IconMinus, IconLock } from './Icons';

// ── Credit Score Result ────────────────────────────────────────────────

interface CreditResultProps {
  score: number;
  confidence: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

const statusConfig = {
  excellent: { color: '#22c55e', label: 'Excellent' },
  good: { color: '#3b82f6', label: 'Good' },
  fair: { color: '#f59e0b', label: 'Fair' },
  poor: { color: '#ef4444', label: 'Needs Work' },
};

export function CreditScoreResult({ score, confidence, status }: CreditResultProps) {
  const info = statusConfig[status];
  const scorePercent = ((score - 300) / 550) * 100;

  return (
    <div className="card animate-slide-up" id="credit-result" style={{ textAlign: 'center' }}>
      <div className="badge badge-success" style={{ marginBottom: '24px' }}>
        <IconCheck size={12} /> Encrypted Analysis Complete
      </div>

      {/* Score Circle */}
      <div className="score-circle animate-pulse-glow">
        <div className="score-value">{score}</div>
        <div className="score-label">Credit Score</div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-2" style={{ margin: '20px 0' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: info.color, display: 'inline-block', boxShadow: `0 0 8px ${info.color}` }} />
        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: info.color }}>{info.label}</span>
      </div>

      {/* Score Bar */}
      <div style={{ margin: '0 auto', maxWidth: '360px' }}>
        <div className="flex justify-between mb-2 text-xs text-secondary">
          <span>300</span><span>580</span><span>670</span><span>750</span><span>850</span>
        </div>
        <div style={{ height: '10px', borderRadius: '5px', background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 33%, #3b82f6 60%, #22c55e 85%, #10b981 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', left: `${scorePercent}%`, top: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', border: '3px solid var(--cm-bg-primary)', transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }} />
        </div>
      </div>

      {/* Confidence */}
      <div style={{ marginTop: '24px' }}>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-secondary">AI Confidence</span>
          <span className="font-mono" style={{ color: 'var(--cm-accent-1)' }}>{confidence}%</span>
        </div>
        <div className="meter"><div className="meter-fill" style={{ width: `${confidence}%` }} /></div>
      </div>

      {/* Privacy Note */}
      <div style={{ marginTop: '24px', padding: '12px', borderRadius: 'var(--cm-radius-sm)', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="flex items-center gap-2 text-xs text-secondary" style={{ lineHeight: 1.5 }}>
          <IconLock size={13} color="var(--cm-accent-1)" />
          <span>This score was computed using Fully Homomorphic Encryption. Your raw financial data never left your device unencrypted.</span>
        </div>
      </div>
    </div>
  );
}

// ── Trading Signal Result ──────────────────────────────────────────────

interface TradingResultProps {
  direction: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  riskLevel: number;
  suggestedEntry: number;
  asset?: string;
}

const directionIcons = {
  BUY: { Component: IconTrendingUp, class: 'signal-buy', label: 'BUY SIGNAL' },
  SELL: { Component: IconTrendingDown, class: 'signal-sell', label: 'SELL SIGNAL' },
  HOLD: { Component: IconMinus, class: 'signal-hold', label: 'HOLD POSITION' },
};

export function TradingSignalResult({ direction, strength, riskLevel, suggestedEntry, asset }: TradingResultProps) {
  const cfg = directionIcons[direction];
  const DirIcon = cfg.Component;

  return (
    <div className="card animate-slide-up" id="trading-result">
      <div className="badge badge-success" style={{ marginBottom: '20px' }}>
        <IconCheck size={12} /> Encrypted Signal Generated
      </div>

      {/* Main Signal */}
      <div className={`signal-indicator ${cfg.class}`} style={{ marginBottom: '24px' }}>
        <div className="signal-dot" />
        <DirIcon size={22} />
        <span>{cfg.label}</span>
        {asset && <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>{asset}</span>}
      </div>

      {/* Metrics Grid */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Signal Strength', value: `${strength}%`, color: strength >= 70 ? 'var(--cm-success)' : strength >= 40 ? 'var(--cm-warning)' : 'var(--cm-danger)' },
          { label: 'Risk Level', value: `${riskLevel}%`, color: riskLevel <= 30 ? 'var(--cm-success)' : riskLevel <= 60 ? 'var(--cm-warning)' : 'var(--cm-danger)' },
          { label: 'Suggested Entry', value: `$${suggestedEntry.toLocaleString()}`, color: 'var(--cm-accent-1)' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '16px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)', textAlign: 'center', border: '1px solid var(--cm-border)' }}>
            <div className="text-xs text-secondary mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Strength Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-secondary">Signal Strength</span>
          <span className="font-mono" style={{ color: 'var(--cm-accent-1)' }}>{strength}/100</span>
        </div>
        <div className="meter"><div className="meter-fill" style={{ width: `${strength}%` }} /></div>
      </div>

      {/* Risk Bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-secondary">Risk Assessment</span>
          <span className="font-mono" style={{ color: riskLevel <= 30 ? 'var(--cm-success)' : riskLevel <= 60 ? 'var(--cm-warning)' : 'var(--cm-danger)' }}>
            {riskLevel <= 30 ? 'Low' : riskLevel <= 60 ? 'Moderate' : 'High'} ({riskLevel}%)
          </span>
        </div>
        <div className="meter" style={{ height: '6px' }}>
          <div style={{ height: '100%', width: `${riskLevel}%`, borderRadius: '3px', background: riskLevel <= 30 ? 'var(--cm-success)' : riskLevel <= 60 ? 'linear-gradient(to right, var(--cm-success), var(--cm-warning))' : 'linear-gradient(to right, var(--cm-warning), var(--cm-danger))', transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
      </div>

      {/* Privacy Note */}
      <div style={{ marginTop: '24px', padding: '12px', borderRadius: 'var(--cm-radius-sm)', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="flex items-center gap-2 text-xs text-secondary" style={{ lineHeight: 1.5 }}>
          <IconLock size={13} color="var(--cm-accent-1)" />
          <span>This signal was computed using FHE. Your position data remained encrypted throughout the entire analysis.</span>
        </div>
      </div>
    </div>
  );
}
