/**
 * EncryptForm — Data collection UI for CipherMind AI
 * Professional design with SVG icons instead of emojis.
 */

import React, { useState } from 'react';
import { IconLock, IconBarChart, IconShieldCheck } from './Icons';

// ── Credit Form ────────────────────────────────────────────────────────

interface CreditFormData {
  income: string;
  debtRatio: string;
  historyMonths: string;
  openAccounts: string;
}

interface CreditFormProps {
  onSubmit: (data: { income: number; debtRatio: number; historyMonths: number; openAccounts: number }) => void;
  disabled?: boolean;
}

export function CreditForm({ onSubmit, disabled }: CreditFormProps) {
  const [form, setForm] = useState<CreditFormData>({
    income: '',
    debtRatio: '',
    historyMonths: '',
    openAccounts: '',
  });

  const handleChange = (field: keyof CreditFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      income: parseInt(form.income) || 0,
      debtRatio: parseInt(form.debtRatio) || 0,
      historyMonths: parseInt(form.historyMonths) || 0,
      openAccounts: parseInt(form.openAccounts) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="credit-form">
      <div className="form-group">
        <label className="form-label" htmlFor="income">Annual Income ($)</label>
        <input id="income" type="number" className="form-input" placeholder="e.g. 75000"
          value={form.income} onChange={handleChange('income')} disabled={disabled} required min={0} />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="debtRatio">Debt-to-Income Ratio (%)</label>
        <input id="debtRatio" type="number" className="form-input" placeholder="e.g. 30"
          value={form.debtRatio} onChange={handleChange('debtRatio')} disabled={disabled} required min={0} max={100} />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="historyMonths">Credit History (months)</label>
          <input id="historyMonths" type="number" className="form-input" placeholder="e.g. 60"
            value={form.historyMonths} onChange={handleChange('historyMonths')} disabled={disabled} required min={0} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="openAccounts">Open Accounts</label>
          <input id="openAccounts" type="number" className="form-input" placeholder="e.g. 5"
            value={form.openAccounts} onChange={handleChange('openAccounts')} disabled={disabled} required min={0} />
        </div>
      </div>

      <div style={{ marginTop: '8px', padding: '12px 16px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)', border: '1px solid var(--cm-border)' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
          <IconLock size={14} color="var(--cm-accent-1)" />
          <span className="text-sm" style={{ fontWeight: 600, color: 'var(--cm-accent-1)' }}>End-to-End Encrypted</span>
        </div>
        <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
          Your data is encrypted on this device before leaving. The AI only sees anonymized feature bands — never your raw numbers.
        </p>
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={disabled} id="submit-credit" style={{ marginTop: '8px' }}>
        <IconShieldCheck size={18} /> Encrypt & Analyze
      </button>
    </form>
  );
}

// ── Trading Form ───────────────────────────────────────────────────────

interface TradingFormData {
  asset: string;
  positionSize: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  riskTolerance: string;
}

interface TradingFormProps {
  onSubmit: (data: { asset: string; positionSize: number; entryPrice: number; stopLoss: number; takeProfit: number; riskTolerance: number }) => void;
  disabled?: boolean;
}

export function TradingForm({ onSubmit, disabled }: TradingFormProps) {
  const [form, setForm] = useState<TradingFormData>({
    asset: 'ETH',
    positionSize: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    riskTolerance: '5',
  });

  const handleChange = (field: keyof TradingFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      asset: form.asset,
      positionSize: parseFloat(form.positionSize) || 0,
      entryPrice: parseFloat(form.entryPrice) || 0,
      stopLoss: parseFloat(form.stopLoss) || 0,
      takeProfit: parseFloat(form.takeProfit) || 0,
      riskTolerance: parseInt(form.riskTolerance) || 5,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" id="trading-form">
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="asset">Asset</label>
          <select id="asset" className="form-input form-select" value={form.asset} onChange={handleChange('asset')} disabled={disabled}>
            <option value="ETH">ETH — Ethereum</option>
            <option value="BTC">BTC — Bitcoin</option>
            <option value="SOL">SOL — Solana</option>
            <option value="ARB">ARB — Arbitrum</option>
            <option value="LINK">LINK — Chainlink</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="positionSize">Position Size ($)</label>
          <input id="positionSize" type="number" className="form-input" placeholder="e.g. 5000"
            value={form.positionSize} onChange={handleChange('positionSize')} disabled={disabled} required min={0} />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="entryPrice">Entry Price ($)</label>
          <input id="entryPrice" type="number" step="0.01" className="form-input" placeholder="e.g. 3500"
            value={form.entryPrice} onChange={handleChange('entryPrice')} disabled={disabled} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="stopLoss">Stop Loss ($)</label>
          <input id="stopLoss" type="number" step="0.01" className="form-input" placeholder="e.g. 3400"
            value={form.stopLoss} onChange={handleChange('stopLoss')} disabled={disabled} required />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="takeProfit">Take Profit ($)</label>
          <input id="takeProfit" type="number" step="0.01" className="form-input" placeholder="e.g. 3800"
            value={form.takeProfit} onChange={handleChange('takeProfit')} disabled={disabled} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="riskTolerance">Risk Tolerance (1-10)</label>
          <input id="riskTolerance" type="range" className="form-input" min="1" max="10"
            value={form.riskTolerance} onChange={handleChange('riskTolerance')} disabled={disabled} style={{ padding: '14px 8px' }} />
          <span className="text-xs text-center font-mono" style={{ color: 'var(--cm-accent-1)' }}>
            {form.riskTolerance}/10 — {parseInt(form.riskTolerance) <= 3 ? 'Conservative' : parseInt(form.riskTolerance) <= 7 ? 'Moderate' : 'Aggressive'}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '8px', padding: '12px 16px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)', border: '1px solid var(--cm-border)' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
          <IconLock size={14} color="var(--cm-accent-1)" />
          <span className="text-sm" style={{ fontWeight: 600, color: 'var(--cm-accent-1)' }}>Privacy-First Analysis</span>
        </div>
        <p className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
          Position data is encrypted locally. The AI sees only relative risk/reward bands — your exact entry, SL, and TP remain private.
        </p>
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={disabled} id="submit-trading" style={{ marginTop: '8px' }}>
        <IconBarChart size={18} /> Encrypt & Generate Signal
      </button>
    </form>
  );
}
