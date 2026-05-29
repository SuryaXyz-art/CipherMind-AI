/**
 * CipherMind AI — Main Application
 *
 * Privacy-first AI analytics platform powered by Fhenix CoFHE
 * and Nous Hermes AI. All icons are professional SVGs.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useFHE } from './hooks/useFHE';
import { useCredit } from './hooks/useCredit';
import { useTrading } from './hooks/useTrading';
import { useResearch } from './hooks/useResearch';
import { useVault } from './hooks/useVault';
import { usePayroll } from './hooks/usePayroll';
import { useLending } from './hooks/useLending';
import { useRequests } from './hooks/useRequests';
import { useCrowdfund } from './hooks/useCrowdfund';
import { useEscrow } from './hooks/useEscrow';
import { useAgents } from './hooks/useAgents';
import { AGENTS } from './lib/agents';
import { useRealtime } from './hooks/useRealtime';
import { useWalletIntel } from './hooks/useWalletIntel';
import { useAutomation } from './hooks/useAutomation';
import { useMemory } from './hooks/useMemory';
import { useGovernance } from './hooks/useGovernance';
import { CreditForm, TradingForm } from './components/EncryptForm';
import { EncryptAnimation } from './components/EncryptAnimation';
import { CreditScoreResult, TradingSignalResult } from './components/SealedResult';
import {
  IconShield, IconShieldCheck, IconLock, IconUnlock, IconLink, IconCpu,
  IconBarChart, IconTrendingUp, IconWallet, IconSearch, IconSend,
  IconAlertCircle, IconRefresh, IconEye, IconZap,
} from './components/Icons';

type Page = 'home' | 'vault' | 'payroll' | 'lending' | 'requests' | 'crowdfund' | 'escrow' | 'agents' | 'live' | 'wallet' | 'automation' | 'memory' | 'governance' | 'credit' | 'trading' | 'research';

function useTheme(): ['dark' | 'light', () => void] {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('cm-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('cm-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [theme, toggleTheme] = useTheme();
  const fhe = useFHE();
  const credit = useCredit();
  const trading = useTrading();
  const research = useResearch();
  const vault = useVault();
  const payroll = usePayroll();
  const lending = useLending();
  const requests = useRequests();
  const crowdfund = useCrowdfund();
  const escrow = useEscrow();
  const agents = useAgents();
  const realtime = useRealtime(page === 'live');
  const walletIntel = useWalletIntel();
  const automation = useAutomation();
  const memory = useMemory();
  const governance = useGovernance();

  return (
    <>
      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="navbar" id="navbar">
        <div className="navbar-inner">
          <a className="navbar-logo" onClick={() => setPage('home')} style={{ cursor: 'pointer' }}>
            <img
              src="/ciphermind-logo.png"
              alt="CipherMind AI"
              className="navbar-logo-icon"
              style={{ objectFit: 'cover' }}
            />
            <span className="navbar-logo-text">CipherMind</span>
          </a>

          <ul className="navbar-nav">
            {[
              { id: 'home', label: 'Home' },
              { id: 'vault', label: 'Payments' },
              { id: 'payroll', label: 'Payroll' },
              { id: 'lending', label: 'Lending' },
              { id: 'requests', label: 'Requests' },
              { id: 'crowdfund', label: 'Crowdfund' },
              { id: 'escrow', label: 'Escrow' },
              { id: 'agents', label: 'Agents' },
              { id: 'live', label: 'Live' },
              { id: 'wallet', label: 'Wallet' },
              { id: 'automation', label: 'Automation' },
              { id: 'memory', label: 'Memory' },
              { id: 'governance', label: 'Governance' },
              { id: 'credit', label: 'Credit Score' },
              { id: 'trading', label: 'Trading Signals' },
              { id: 'research', label: 'Research' },
            ].map(item => (
              <li key={item.id}>
                <button
                  className={`navbar-link ${page === item.id ? 'active' : ''}`}
                  onClick={() => setPage(item.id as Page)}
                  id={`nav-${item.id}`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-sm"
              onClick={toggleTheme}
              id="theme-toggle"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
              style={{ fontSize: '1rem', lineHeight: 1, padding: '6px 10px' }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {fhe.isInitialized ? (
              <div className="flex items-center gap-3">
                <span className="badge badge-success">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cm-success)', display: 'inline-block' }} />
                  Connected
                </span>
                <span className="text-xs font-mono text-secondary">
                  {fhe.address?.slice(0, 6)}...{fhe.address?.slice(-4)}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={fhe.disconnect} id="disconnect-btn">
                  Disconnect
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={fhe.connect} disabled={fhe.isConnecting} id="connect-btn">
                <IconWallet size={15} />
                {fhe.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Pages ─────────────────────────────────────────────────── */}
      {page === 'home' && <HomePage onNavigate={setPage} />}
      {page === 'vault' && <VaultPage isConnected={fhe.isInitialized} onConnect={fhe.connect} vault={vault} />}
      {page === 'payroll' && <PayrollPage isConnected={fhe.isInitialized} onConnect={fhe.connect} payroll={payroll} />}
      {page === 'lending' && <LendingPage isConnected={fhe.isInitialized} onConnect={fhe.connect} lending={lending} />}
      {page === 'requests' && <RequestsPage isConnected={fhe.isInitialized} onConnect={fhe.connect} requests={requests} />}
      {page === 'crowdfund' && <CrowdfundPage isConnected={fhe.isInitialized} onConnect={fhe.connect} crowdfund={crowdfund} />}
      {page === 'escrow' && <EscrowPage isConnected={fhe.isInitialized} onConnect={fhe.connect} escrow={escrow} />}
      {page === 'agents' && <AgentsPage agents={agents} />}
      {page === 'live' && <LiveIntelPage realtime={realtime} />}
      {page === 'wallet' && <WalletPage isConnected={fhe.isInitialized} onConnect={fhe.connect} wallet={walletIntel} />}
      {page === 'automation' && <AutomationPage isConnected={fhe.isInitialized} onConnect={fhe.connect} automation={automation} />}
      {page === 'memory' && <MemoryPage isConnected={fhe.isInitialized} onConnect={fhe.connect} memory={memory} />}
      {page === 'governance' && <GovernancePage isConnected={fhe.isInitialized} onConnect={fhe.connect} governance={governance} />}
      {page === 'credit' && <CreditPage isConnected={fhe.isInitialized} onConnect={fhe.connect} credit={credit} />}
      {page === 'trading' && <TradingPage isConnected={fhe.isInitialized} onConnect={fhe.connect} trading={trading} />}
      {page === 'research' && <ResearchPage isConnected={fhe.isInitialized} onConnect={fhe.connect} research={research} />}
    </>
  );
}

// ── Home Page ────────────────────────────────────────────────────────

function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <main>
      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <div className="hero-badge animate-fade-in">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cm-accent-1)', display: 'inline-block' }} />
            Powered by Fhenix CoFHE &times; Nous Hermes AI
          </div>

          <h1 className="hero-title animate-fade-in stagger-1">
            AI Intelligence,{' '}
            <span className="gradient-text">Zero Exposure</span>
          </h1>

          <p className="hero-subtitle animate-fade-in stagger-2">
            Get institutional-grade credit scoring, trading signals, and encrypted research powered by AI —
            with your data encrypted end-to-end using Fully Homomorphic Encryption.
            Your numbers stay encrypted. Always.
          </p>

          <div className="hero-actions animate-fade-in stagger-3">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('credit')} id="cta-credit">
              <IconShieldCheck size={18} /> Get Your Credit Score
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('research')} id="cta-research">
              <IconSearch size={18} /> Encrypted Research
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" id="features">
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="gradient-text" style={{ display: 'inline-block' }}>How It Works</h2>
            <p className="text-secondary mt-2" style={{ maxWidth: '500px', margin: '12px auto 0' }}>
              Privacy-preserving AI analytics in four trustless steps
            </p>
          </div>

          <div className="grid-4" style={{ marginTop: '48px' }}>
            {[
              { Icon: IconLock, title: 'Encrypt Locally', desc: 'Your data is encrypted on your device using FHE before it ever leaves your browser.', color: 'var(--cm-accent-1)' },
              { Icon: IconLink, title: 'Submit On-Chain', desc: 'Encrypted data is submitted to Fhenix CoFHE smart contracts on Arbitrum Sepolia.', color: 'var(--cm-accent-2)' },
              { Icon: IconCpu, title: 'AI Inference', desc: 'Nous Hermes AI analyzes anonymized feature bands — never your raw numbers.', color: 'var(--cm-accent-3)' },
              { Icon: IconUnlock, title: 'Unseal Results', desc: 'Only you can decrypt the encrypted results using your private key.', color: 'var(--cm-success)' },
            ].map((feature, i) => (
              <div key={i} className={`card feature-card animate-fade-in stagger-${i + 1}`}>
                <div className="feature-icon"><feature.Icon size={24} color={feature.color} /></div>
                <h4 className="feature-title">{feature.title}</h4>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="section" id="products" style={{ background: 'var(--cm-bg-secondary)' }}>
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="gradient-text" style={{ display: 'inline-block' }}>Products</h2>
            <p className="text-secondary mt-2" style={{ maxWidth: '500px', margin: '12px auto 0' }}>
              Institutional-grade analytics with zero-knowledge privacy
            </p>
          </div>

          <div className="grid-3" style={{ marginTop: '48px', maxWidth: '1100px', margin: '48px auto 0' }}>
            {/* Encrypted Payments */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('vault')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,97,255,0.15))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconLock size={28} color="#00d4ff" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Encrypted Payments</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Deposit USDC, then send it as ciphertext. Prove a balance threshold
                without revealing the amount. Your numbers stay sealed on-chain.
              </p>
              <div className="flex gap-2">
                <span className="badge badge-accent">FHE</span>
                <span className="badge badge-info">Vault</span>
                <span className="badge badge-success">Live</span>
              </div>
            </div>

            {/* Confidential Payroll */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('payroll')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(123,97,255,0.15), rgba(192,132,252,0.15))', border: '1px solid rgba(123,97,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconLock size={28} color="#7b61ff" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Confidential Payroll</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Pay a whole team in encrypted salaries. Each person claims their own
                figure — nobody sees what anyone else earns.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">FHE</span><span className="badge badge-info">Teams</span><span className="badge badge-success">Live</span></div>
            </div>

            {/* Confidential Lending */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('lending')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconBarChart size={28} color="#f59e0b" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Confidential Lending</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Borrow against collateral with your balances, debt, and health factor
                encrypted. LTV enforced on ciphertext.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">FHE</span><span className="badge badge-info">DeFi</span><span className="badge badge-success">Live</span></div>
            </div>

            {/* Payment Requests */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('requests')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(34,197,94,0.15))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconSend size={28} color="#00d4ff" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Payment Requests</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Ask for money with a public memo and a sealed amount. Share it; let
                anyone fulfill it without publishing the number.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">FHE</span><span className="badge badge-info">Invoices</span><span className="badge badge-success">Live</span></div>
            </div>

            {/* Crowdfund */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('crowdfund')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(0,212,255,0.15))', border: '1px solid rgba(192,132,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconTrendingUp size={28} color="#c084fc" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Confidential Crowdfund</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Raise toward a sealed goal. Participation is public; every backer's
                contribution amount stays private.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">FHE</span><span className="badge badge-info">Funding</span><span className="badge badge-success">Live</span></div>
            </div>

            {/* Confidential Escrow */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('escrow')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(0,212,255,0.15))', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconShield size={28} color="#22c55e" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Confidential Escrow</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Two-of-two approval with an arbiter, over a sealed amount. Funds
                release on agreement; disputes go to the arbiter — no platform rake.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">FHE</span><span className="badge badge-info">Trustless</span><span className="badge badge-success">Live</span></div>
            </div>

            {/* Hermes Agent Council */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('agents')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,97,255,0.15))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconCpu size={28} color="#00d4ff" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Hermes Agent Council</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                A council of specialized AI agents that plan, delegate, and reason
                together over a sealed channel — with confidence scores and a full
                reasoning trace.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">Multi-agent</span><span className="badge badge-info">Hermes</span><span className="badge badge-warning">New</span></div>
            </div>

            {/* Live Intelligence */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('live')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(0,212,255,0.15))', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconZap size={28} color="#f59e0b" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Live Intelligence</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Real-time chain stats, market tickers, volatility and trending
                tokens — with a Hermes read of the live snapshot.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">Realtime</span><span className="badge badge-info">Market</span><span className="badge badge-warning">New</span></div>
            </div>

            {/* Wallet Intelligence */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('wallet')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconShield size={28} color="#ef4444" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Wallet Intelligence</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Scan your exposure and token approvals, score risk, and revoke
                dangerous allowances in one click — all from on-chain reads.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">Security</span><span className="badge badge-info">On-chain</span><span className="badge badge-warning">New</span></div>
            </div>

            {/* Autonomous Actions */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('automation')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(123,97,255,0.15), rgba(34,197,94,0.15))', border: '1px solid rgba(123,97,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconCpu size={28} color="#7b61ff" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Autonomous Actions</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                The AI proposes and simulates portfolio actions; a safety harness
                (approval mode, spending limits, emergency stop) gates execution.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">Agentic</span><span className="badge badge-info">Safe-exec</span><span className="badge badge-warning">New</span></div>
            </div>

            {/* Encrypted Memory */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('memory')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,97,255,0.15))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconLock size={28} color="#00d4ff" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Encrypted Memory</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Persistent AI memory encrypted at rest with a wallet-derived key.
                The AI remembers your preferences and risk profile — only you can
                decrypt it.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">AES-GCM</span><span className="badge badge-info">Personal AI</span><span className="badge badge-warning">New</span></div>
            </div>

            {/* Encrypted Governance */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('governance')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(123,97,255,0.15), rgba(0,212,255,0.15))', border: '1px solid rgba(123,97,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconShieldCheck size={28} color="#7b61ff" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Encrypted Governance</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Confidential DAO voting — ballots are encrypted, individual votes
                are never stored, and only the aggregate tally is revealed on
                finalize.
              </p>
              <div className="flex gap-2"><span className="badge badge-accent">FHE</span><span className="badge badge-info">DAO</span><span className="badge badge-success">Live</span></div>
            </div>

            {/* Credit Scoring */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('credit')}>
              <div className="product-icon-wrap" style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.15))', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconShieldCheck size={28} color="#22c55e" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Credit Scoring</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                AI-powered credit score from 300-850 with confidence levels.
                Your income, debt, and history are encrypted end-to-end.
              </p>
              <div className="flex gap-2">
                <span className="badge badge-accent">FHE</span>
                <span className="badge badge-info">Hermes AI</span>
                <span className="badge badge-success">Live</span>
              </div>
            </div>

            {/* Trading Signals */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('trading')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconBarChart size={28} color="#f59e0b" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Trading Signals</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                BUY/SELL/HOLD signals with strength and risk assessment.
                Your positions and stop losses stay fully private.
              </p>
              <div className="flex gap-2">
                <span className="badge badge-accent">FHE</span>
                <span className="badge badge-info">Hermes AI</span>
                <span className="badge badge-success">Live</span>
              </div>
            </div>

            {/* Encrypted Research */}
            <div className="card" style={{ padding: '36px', cursor: 'pointer' }} onClick={() => onNavigate('research')}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--cm-radius-md)', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(192,132,252,0.15))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <IconSearch size={28} color="#00d4ff" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Encrypted Research</h3>
              <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: '20px' }}>
                Ask anything — BTC price, market analysis, protocol research.
                Your queries are encrypted via FHE before reaching the AI.
              </p>
              <div className="flex gap-2">
                <span className="badge badge-accent">FHE</span>
                <span className="badge badge-info">Hermes AI</span>
                <span className="badge badge-warning">New</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="section">
        <div className="container text-center">
          <p className="text-secondary text-sm mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Built with</p>
          <div className="flex items-center justify-center gap-8" style={{ flexWrap: 'wrap', opacity: 0.6 }}>
            {['Fhenix CoFHE', 'Nous Hermes AI', 'Arbitrum', 'Solidity', 'React', 'Hardhat'].map(tech => (
              <span key={tech} className="font-mono text-sm" style={{ color: 'var(--cm-text-tertiary)' }}>{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 0', borderTop: '1px solid var(--cm-border)', textAlign: 'center' }}>
        <div className="container">
          <p className="text-xs text-muted">
            &copy; 2026 CipherMind AI — Privacy-first intelligence powered by FHE
          </p>
        </div>
      </footer>
    </main>
  );
}

// ── Credit Score Page ────────────────────────────────────────────────

interface CreditPageProps {
  isConnected: boolean;
  onConnect: () => void;
  credit: ReturnType<typeof useCredit>;
}

function CreditPage({ isConnected, onConnect, credit }: CreditPageProps) {
  const isProcessing = credit.state !== 'idle' && credit.state !== 'complete' && credit.state !== 'error';

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="flex items-center gap-3">
            <div className="feature-icon" style={{ marginBottom: 0 }}><IconShieldCheck size={22} color="var(--cm-accent-1)" /></div>
            <div>
              <h1 style={{ fontSize: '1.5rem' }}>Credit Score Analysis</h1>
              <p className="text-secondary text-sm">FHE-encrypted credit scoring powered by Nous Hermes AI</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {!isConnected ? (
            <div className="card text-center" style={{ padding: '60px 24px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ margin: '0 auto 16px', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--cm-gradient-brand-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconLock size={28} color="var(--cm-accent-1)" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Connect Your Wallet</h3>
              <p className="text-secondary" style={{ marginBottom: '24px', lineHeight: 1.6 }}>
                Connect your wallet to start the FHE-encrypted credit scoring process.
                Your data never leaves your device unencrypted.
              </p>
              <button className="btn btn-primary btn-lg" onClick={onConnect} id="connect-credit">
                <IconWallet size={18} /> Connect Wallet
              </button>
            </div>
          ) : (
            <div className="grid-2" style={{ maxWidth: '1000px', margin: '0 auto', alignItems: 'start' }}>
              <div>
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '20px' }}>
                    {credit.state === 'idle' ? 'Enter Financial Data' : 'Processing...'}
                  </h3>
                  <CreditForm onSubmit={(data) => credit.submitProfile(data)} disabled={isProcessing} />
                </div>
                {credit.error && (
                  <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--cm-danger-bg)' }}>
                    <div className="flex items-center gap-2">
                      <IconAlertCircle size={16} color="var(--cm-danger)" />
                      <p className="text-sm" style={{ color: 'var(--cm-danger)' }}>{credit.error}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm mt-2" onClick={credit.reset}>Try Again</button>
                  </div>
                )}
              </div>
              <div>
                {isProcessing && <EncryptAnimation isActive={isProcessing} progress={credit.progress} currentStep={credit.currentStep} />}
                {credit.state === 'complete' && credit.result && (
                  <div>
                    <CreditScoreResult score={credit.result.score} confidence={credit.result.confidence} status={credit.result.status} />
                    <CreditFeatures credit={credit} />
                    <button className="btn btn-secondary w-full mt-4" onClick={credit.reset} id="reset-credit">
                      <IconRefresh size={16} /> Run Another Analysis
                    </button>
                  </div>
                )}
                {credit.state === 'idle' && (
                  <div className="card text-center" style={{ padding: '48px 24px' }}>
                    <div style={{ margin: '0 auto 16px', opacity: 0.3 }}><IconShield size={48} /></div>
                    <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                      Fill in your financial data on the left and click <strong>"Encrypt & Analyze"</strong> to
                      receive your AI-powered, privacy-preserving credit score.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Trading Signals Page ─────────────────────────────────────────────

interface TradingPageProps {
  isConnected: boolean;
  onConnect: () => void;
  trading: ReturnType<typeof useTrading>;
}

function TradingPage({ isConnected, onConnect, trading }: TradingPageProps) {
  const isProcessing = trading.state !== 'idle' && trading.state !== 'complete' && trading.state !== 'error';

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="flex items-center gap-3">
            <div className="feature-icon" style={{ marginBottom: 0 }}><IconBarChart size={22} color="var(--cm-accent-2)" /></div>
            <div>
              <h1 style={{ fontSize: '1.5rem' }}>Trading Signal Generator</h1>
              <p className="text-secondary text-sm">FHE-encrypted trading signals powered by Nous Hermes AI</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {!isConnected ? (
            <div className="card text-center" style={{ padding: '60px 24px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ margin: '0 auto 16px', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--cm-gradient-brand-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBarChart size={28} color="var(--cm-accent-2)" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Connect Your Wallet</h3>
              <p className="text-secondary" style={{ marginBottom: '24px', lineHeight: 1.6 }}>
                Connect your wallet to generate privacy-preserving trading signals.
                Your position data is encrypted using Fully Homomorphic Encryption.
              </p>
              <button className="btn btn-primary btn-lg" onClick={onConnect} id="connect-trading">
                <IconWallet size={18} /> Connect Wallet
              </button>
            </div>
          ) : (
            <div className="grid-2" style={{ maxWidth: '1000px', margin: '0 auto', alignItems: 'start' }}>
              <div>
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '20px' }}>
                    {trading.state === 'idle' ? 'Enter Position Data' : 'Processing...'}
                  </h3>
                  <TradingForm onSubmit={(data) => trading.submitPosition(data)} disabled={isProcessing} />
                </div>
                {trading.error && (
                  <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--cm-danger-bg)' }}>
                    <div className="flex items-center gap-2">
                      <IconAlertCircle size={16} color="var(--cm-danger)" />
                      <p className="text-sm" style={{ color: 'var(--cm-danger)' }}>{trading.error}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm mt-2" onClick={trading.reset}>Try Again</button>
                  </div>
                )}
              </div>
              <div>
                {isProcessing && <EncryptAnimation isActive={isProcessing} progress={trading.progress} currentStep={trading.currentStep} />}
                {trading.state === 'complete' && trading.result && (
                  <div>
                    <TradingSignalResult direction={trading.result.direction} strength={trading.result.strength} riskLevel={trading.result.riskLevel} suggestedEntry={trading.result.suggestedEntry} />
                    <TradingFeatures trading={trading} />
                    <button className="btn btn-secondary w-full mt-4" onClick={trading.reset} id="reset-trading">
                      <IconRefresh size={16} /> Generate Another Signal
                    </button>
                  </div>
                )}
                {trading.state === 'idle' && (
                  <div className="card text-center" style={{ padding: '48px 24px' }}>
                    <div style={{ margin: '0 auto 16px', opacity: 0.3 }}><IconTrendingUp size={48} /></div>
                    <p className="text-secondary" style={{ lineHeight: 1.6 }}>
                      Enter your trading position on the left and click <strong>"Encrypt & Generate Signal"</strong> to
                      receive AI-powered BUY/SELL/HOLD signals with risk analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Research Page ────────────────────────────────────────────────────

interface ResearchPageProps {
  isConnected: boolean;
  onConnect: () => void;
  research: ReturnType<typeof useResearch>;
}

function ResearchPage({ isConnected, onConnect, research }: ResearchPageProps) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isProcessing = research.state !== 'idle' && research.state !== 'complete' && research.state !== 'error';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isProcessing) {
      research.submitQuery(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = [
    "What's the current price of BTC?",
    "Explain Fully Homomorphic Encryption",
    "Compare ETH vs SOL for DeFi",
    "What are the risks of yield farming?",
  ];

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="flex items-center gap-3">
            <div className="feature-icon" style={{ marginBottom: 0, background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(192,132,252,0.15))', borderColor: 'rgba(0,212,255,0.2)' }}>
              <IconSearch size={22} color="var(--cm-accent-1)" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem' }}>Encrypted Research</h1>
              <p className="text-secondary text-sm">Privacy-preserving AI research powered by Nous Hermes AI via FHE</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {!isConnected ? (
            <div className="card text-center" style={{ padding: '60px 24px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ margin: '0 auto 16px', width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(192,132,252,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconSearch size={28} color="var(--cm-accent-1)" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Connect Your Wallet</h3>
              <p className="text-secondary" style={{ marginBottom: '24px', lineHeight: 1.6 }}>
                Connect your wallet to access encrypted AI research.
                Your queries are encrypted using FHE before reaching the AI.
              </p>
              <button className="btn btn-primary btn-lg" onClick={onConnect} id="connect-research">
                <IconWallet size={18} /> Connect Wallet
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              {/* Query Input */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 mb-4">
                    <IconZap size={16} color="var(--cm-accent-1)" />
                    <span className="text-sm" style={{ fontWeight: 600 }}>Ask anything — your query is encrypted via FHE</span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <textarea
                      ref={textareaRef}
                      id="research-prompt"
                      className="form-input"
                      style={{ width: '100%', minHeight: '80px', resize: 'vertical', paddingRight: '56px', fontFamily: 'var(--cm-font-sans)' }}
                      placeholder="e.g. What's the current price of BTC? / Explain yield farming risks / Compare L2 solutions..."
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isProcessing}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-icon"
                      disabled={isProcessing || !prompt.trim()}
                      id="submit-research"
                      style={{ position: 'absolute', right: '8px', bottom: '8px' }}
                    >
                      <IconSend size={18} />
                    </button>
                  </div>

                  {/* Suggestion chips */}
                  {research.state === 'idle' && !research.result && (
                    <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '6px 12px', border: '1px solid var(--cm-border)', borderRadius: '20px' }}
                          onClick={() => { setPrompt(s); textareaRef.current?.focus(); }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <IconLock size={13} color="var(--cm-accent-1)" />
                    <span className="text-xs text-secondary">
                      End-to-end encrypted. Your query is encrypted on-device before transmission to Nous Hermes AI.
                    </span>
                  </div>
                </form>
              </div>

              {/* Processing Animation */}
              {isProcessing && (
                <EncryptAnimation isActive={isProcessing} progress={research.progress} currentStep={research.currentStep} />
              )}

              {/* Research Result */}
              {research.state === 'complete' && research.result && (
                <div className="card animate-slide-up" id="research-result">
                  <div className="flex items-center justify-between mb-4">
                    <div className="badge badge-success">
                      <IconShieldCheck size={12} /> Encrypted Response Unsealed
                    </div>
                    <span className="text-xs font-mono text-muted">
                      {research.result.model}
                    </span>
                  </div>

                  {/* Query Echo */}
                  <div style={{ padding: '12px 16px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)', border: '1px solid var(--cm-border)', marginBottom: '20px' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <IconEye size={13} color="var(--cm-text-tertiary)" />
                      <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Query</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--cm-text-secondary)' }}>{research.query}</p>
                  </div>

                  {/* AI Response */}
                  <div className="research-response" style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.9375rem' }}>
                    {research.result.answer.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <h4 key={i} style={{ marginTop: i > 0 ? '16px' : 0, marginBottom: '8px', color: 'var(--cm-accent-1)' }}>{line.replace(/\*\*/g, '')}</h4>;
                      }
                      if (line.startsWith('- ')) {
                        return <div key={i} className="flex gap-2" style={{ marginLeft: '8px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--cm-accent-2)', flexShrink: 0 }}>&bull;</span>
                          <span className="text-secondary">{line.slice(2)}</span>
                        </div>;
                      }
                      if (line.trim() === '') return <br key={i} />;
                      return <p key={i} className="text-secondary" style={{ marginBottom: '4px' }}>{line}</p>;
                    })}
                  </div>

                  {/* Encryption attestation */}
                  <div style={{ marginTop: '24px', padding: '12px', borderRadius: 'var(--cm-radius-sm)', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                    <div className="flex items-center gap-2 text-xs text-secondary" style={{ lineHeight: 1.5 }}>
                      <IconLock size={13} color="var(--cm-accent-1)" />
                      <span>This response was transmitted through an FHE-encrypted channel. Your query remained private throughout.</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button className="btn btn-secondary" onClick={() => { research.reset(); setPrompt(''); }} id="reset-research" style={{ flex: 1 }}>
                      <IconRefresh size={16} /> New Query
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {research.state === 'error' && (
                <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--cm-danger-bg)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <IconAlertCircle size={16} color="var(--cm-danger)" />
                    <p className="text-sm" style={{ color: 'var(--cm-danger)', fontWeight: 600 }}>Research Query Failed</p>
                  </div>
                  <p className="text-xs text-secondary">{research.error}</p>
                  <button className="btn btn-ghost btn-sm mt-4" onClick={research.reset}>Try Again</button>
                </div>
              )}

              {/* History */}
              {research.history.length > 0 && research.state !== 'complete' && (
                <div style={{ marginTop: '32px' }}>
                  <h4 className="text-sm text-muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Recent Queries
                  </h4>
                  <div className="flex flex-col gap-3">
                    {research.history.slice(0, 5).map((item, i) => (
                      <div key={i} className="card" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => { setPrompt(item.prompt); }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                            <IconSearch size={14} color="var(--cm-text-tertiary)" />
                            <span className="text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.prompt}</span>
                          </div>
                          <span className="text-xs font-mono text-muted" style={{ flexShrink: 0, marginLeft: '12px' }}>
                            {new Date(item.result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Payments / Vault Page ────────────────────────────────────────────────────

interface VaultPageProps {
  isConnected: boolean;
  onConnect: () => void;
  vault: ReturnType<typeof useVault>;
}

function VaultPage({ isConnected, onConnect, vault }: VaultPageProps) {
  const [depositAmt, setDepositAmt] = useState('100');
  const [sendTo, setSendTo] = useState('');
  const [sendAmt, setSendAmt] = useState('25');
  const [proofAmt, setProofAmt] = useState('50');

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="flex items-center gap-3">
            <div className="feature-icon" style={{ marginBottom: 0 }}><IconLock size={22} color="var(--cm-accent-1)" /></div>
            <div>
              <h1 style={{ fontSize: '1.5rem' }}>Encrypted Payments</h1>
              <p className="text-secondary text-sm">Deposit once, then move money as ciphertext. Balances stay sealed on-chain.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {!isConnected ? (
            <div className="card text-center" style={{ padding: '60px 24px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ margin: '0 auto 16px', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--cm-gradient-brand-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconWallet size={28} color="var(--cm-accent-1)" />
              </div>
              <h3 style={{ marginBottom: '12px' }}>Connect Your Wallet</h3>
              <p className="text-secondary" style={{ marginBottom: '24px', lineHeight: 1.6 }}>
                Connect to deposit test USDC and start moving encrypted balances.
              </p>
              <button className="btn btn-primary btn-lg" onClick={onConnect} id="connect-vault">
                <IconWallet size={18} /> Connect Wallet
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {/* Sealed balance */}
              <div className="card" style={{ marginBottom: '16px', textAlign: 'center', padding: '32px' }}>
                <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Your encrypted balance</p>
                <div style={{ fontFamily: 'var(--cm-font-mono)', fontSize: '2.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {vault.balance === null ? '████' : `${vault.balance} USDC`}
                </div>
                <button className="btn btn-ghost btn-sm mt-4" onClick={() => vault.refreshBalance()} disabled={vault.balanceLoading} id="reveal-balance">
                  <IconEye size={14} /> {vault.balanceLoading ? 'Unsealing…' : vault.balance === null ? 'Unseal balance' : 'Refresh'}
                </button>
              </div>

              <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Deposit */}
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Deposit</h3>
                  <p className="text-secondary text-sm" style={{ marginBottom: '16px' }}>Mint test USDC and seal it into your encrypted balance.</p>
                  <div className="flex items-center gap-2">
                    <input className="form-input" type="number" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} style={{ maxWidth: '140px' }} id="deposit-amount" />
                    <button className="btn btn-primary btn-sm" onClick={() => vault.depositFunds(Number(depositAmt))} disabled={vault.deposit.loading} id="deposit-btn">
                      {vault.deposit.loading ? 'Working…' : 'Deposit'}
                    </button>
                  </div>
                  {vault.deposit.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{vault.deposit.message}</p>}
                  {vault.deposit.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{vault.deposit.error}</p>}
                </div>

                {/* Send */}
                <div className="card" style={{ marginBottom: '16px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Private Send</h3>
                  <p className="text-secondary text-sm" style={{ marginBottom: '16px' }}>The amount becomes ciphertext the moment you send. Only the recipient can read it.</p>
                  <input className="form-input" type="text" placeholder="0x recipient address" value={sendTo} onChange={e => setSendTo(e.target.value)} style={{ width: '100%', fontFamily: 'var(--cm-font-mono)', fontSize: '0.8rem', marginBottom: '8px' }} id="send-to" />
                  <div className="flex items-center gap-2">
                    <input className="form-input" type="number" value={sendAmt} onChange={e => setSendAmt(e.target.value)} style={{ maxWidth: '140px' }} id="send-amount" />
                    <button className="btn btn-primary btn-sm" onClick={() => vault.sendFunds(sendTo.trim(), Number(sendAmt))} disabled={vault.transfer.loading || !sendTo.trim()} id="send-btn">
                      {vault.transfer.loading ? 'Sending…' : 'Send (encrypted)'}
                    </button>
                  </div>
                  {vault.transfer.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{vault.transfer.message}</p>}
                  {vault.transfer.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{vault.transfer.error}</p>}
                </div>
              </div>

              {/* Balance proof */}
              <div className="card">
                <h3 style={{ marginBottom: '8px' }}>Balance Proof</h3>
                <p className="text-secondary text-sm" style={{ marginBottom: '16px' }}>Prove your balance meets a threshold without revealing the actual number.</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary">Balance ≥</span>
                  <input className="form-input" type="number" value={proofAmt} onChange={e => setProofAmt(e.target.value)} style={{ maxWidth: '120px' }} id="proof-amount" />
                  <button className="btn btn-secondary btn-sm" onClick={() => vault.proveBalance(Number(proofAmt))} disabled={vault.proof.loading} id="prove-btn">
                    {vault.proof.loading ? 'Proving…' : 'Prove (encrypted)'}
                  </button>
                </div>
                {vault.proof.meets !== null && (
                  <p className="text-sm mt-2" style={{ color: vault.proof.meets ? 'var(--cm-success)' : 'var(--cm-text-secondary)' }}>
                    {vault.proof.meets ? `✅ Verified: your balance is ≥ ${vault.proof.value} USDC` : `❌ Your balance is below ${vault.proof.value} USDC`} — the exact amount stayed sealed.
                  </p>
                )}
                {vault.proof.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{vault.proof.error}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Confidential Credit Features ─────────────────────────────────────────────

function CreditFeatures({ credit }: { credit: ReturnType<typeof useCredit> }) {
  const [thresholdInput, setThresholdInput] = useState('700');
  const [viewerInput, setViewerInput] = useState('');

  return (
    <div className="card mt-4" style={{ padding: '20px' }}>
      <div className="flex items-center gap-2 mb-4">
        <IconLock size={15} color="var(--cm-accent-1)" />
        <span className="text-sm" style={{ fontWeight: 600 }}>Confidential actions on your encrypted score</span>
      </div>

      {/* Benchmark */}
      <div style={{ marginBottom: '16px' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-secondary">Am I above the network average?</span>
          <button className="btn btn-ghost btn-sm" onClick={() => credit.runBenchmark()} disabled={credit.benchmark.loading} id="run-benchmark">
            {credit.benchmark.loading ? 'Computing...' : 'Compare (encrypted)'}
          </button>
        </div>
        {credit.benchmark.aboveAverage !== null && (
          <p className="text-sm mt-2" style={{ color: credit.benchmark.aboveAverage ? 'var(--cm-success)' : 'var(--cm-text-secondary)' }}>
            {credit.benchmark.aboveAverage ? '✅ Above the encrypted average — no scores were revealed.' : 'ℹ️ At or below the encrypted average — no scores were revealed.'}
          </p>
        )}
        {credit.benchmark.error && <p className="text-xs mt-1" style={{ color: 'var(--cm-danger)' }}>{credit.benchmark.error}</p>}
      </div>

      {/* Threshold */}
      <div style={{ marginBottom: '16px' }}>
        <span className="text-sm text-secondary">Is my score ≥ a private threshold?</span>
        <div className="flex items-center gap-2 mt-2">
          <input className="form-input" type="number" value={thresholdInput} onChange={e => setThresholdInput(e.target.value)} style={{ maxWidth: '120px' }} id="threshold-input" />
          <button className="btn btn-ghost btn-sm" onClick={() => credit.checkThreshold(Number(thresholdInput))} disabled={credit.threshold.loading} id="check-threshold">
            {credit.threshold.loading ? 'Checking...' : 'Check (encrypted)'}
          </button>
        </div>
        {credit.threshold.meets !== null && (
          <p className="text-sm mt-2" style={{ color: credit.threshold.meets ? 'var(--cm-success)' : 'var(--cm-text-secondary)' }}>
            {credit.threshold.meets ? `✅ Your score is ≥ ${credit.threshold.value}` : `❌ Your score is below ${credit.threshold.value}`} (threshold stayed encrypted)
          </p>
        )}
        {credit.threshold.error && <p className="text-xs mt-1" style={{ color: 'var(--cm-danger)' }}>{credit.threshold.error}</p>}
      </div>

      {/* Passport / selective disclosure */}
      <div>
        <span className="text-sm text-secondary">Grant a lender access to your score</span>
        <div className="flex items-center gap-2 mt-2">
          <input className="form-input" type="text" placeholder="0x lender address" value={viewerInput} onChange={e => setViewerInput(e.target.value)} style={{ flex: 1, fontFamily: 'var(--cm-font-mono)', fontSize: '0.8rem' }} id="viewer-input" />
          <button className="btn btn-ghost btn-sm" onClick={() => credit.grantAccess(viewerInput.trim())} disabled={credit.grant.loading || !viewerInput.trim()} id="grant-access">
            {credit.grant.loading ? 'Granting...' : 'Grant'}
          </button>
        </div>
        {credit.grant.grantedTo && <p className="text-sm mt-2" style={{ color: 'var(--cm-success)' }}>✅ Access granted to {credit.grant.grantedTo.slice(0, 8)}… — only they can now unseal it.</p>}
        {credit.grant.error && <p className="text-xs mt-1" style={{ color: 'var(--cm-danger)' }}>{credit.grant.error}</p>}
      </div>
    </div>
  );
}

// ── Confidential Trading Features ────────────────────────────────────────────

function TradingFeatures({ trading }: { trading: ReturnType<typeof useTrading> }) {
  const [riskInput, setRiskInput] = useState('50');
  const [viewerInput, setViewerInput] = useState('');

  return (
    <div className="card mt-4" style={{ padding: '20px' }}>
      <div className="flex items-center gap-2 mb-4">
        <IconLock size={15} color="var(--cm-accent-2)" />
        <span className="text-sm" style={{ fontWeight: 600 }}>Confidential actions on your encrypted signal</span>
      </div>

      {/* Strength benchmark */}
      <div style={{ marginBottom: '16px' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-secondary">Is my signal confidence above average?</span>
          <button className="btn btn-ghost btn-sm" onClick={() => trading.runBenchmark()} disabled={trading.benchmark.loading} id="run-trade-benchmark">
            {trading.benchmark.loading ? 'Computing...' : 'Compare (encrypted)'}
          </button>
        </div>
        {trading.benchmark.aboveAverage !== null && (
          <p className="text-sm mt-2" style={{ color: trading.benchmark.aboveAverage ? 'var(--cm-success)' : 'var(--cm-text-secondary)' }}>
            {trading.benchmark.aboveAverage ? '✅ Above the encrypted average confidence — no values revealed.' : 'ℹ️ At or below the encrypted average — no values revealed.'}
          </p>
        )}
        {trading.benchmark.error && <p className="text-xs mt-1" style={{ color: 'var(--cm-danger)' }}>{trading.benchmark.error}</p>}
      </div>

      {/* Risk threshold */}
      <div style={{ marginBottom: '16px' }}>
        <span className="text-sm text-secondary">Is my risk ≥ a private threshold?</span>
        <div className="flex items-center gap-2 mt-2">
          <input className="form-input" type="number" value={riskInput} onChange={e => setRiskInput(e.target.value)} style={{ maxWidth: '120px' }} id="risk-threshold-input" />
          <button className="btn btn-ghost btn-sm" onClick={() => trading.checkRiskThreshold(Number(riskInput))} disabled={trading.riskThreshold.loading} id="check-risk-threshold">
            {trading.riskThreshold.loading ? 'Checking...' : 'Check (encrypted)'}
          </button>
        </div>
        {trading.riskThreshold.breached !== null && (
          <p className="text-sm mt-2" style={{ color: trading.riskThreshold.breached ? 'var(--cm-danger)' : 'var(--cm-success)' }}>
            {trading.riskThreshold.breached ? `⚠️ Risk is ≥ ${trading.riskThreshold.value}` : `✅ Risk is below ${trading.riskThreshold.value}`} (threshold stayed encrypted)
          </p>
        )}
        {trading.riskThreshold.error && <p className="text-xs mt-1" style={{ color: 'var(--cm-danger)' }}>{trading.riskThreshold.error}</p>}
      </div>

      {/* Selective disclosure */}
      <div>
        <span className="text-sm text-secondary">Share this signal with a copy-trader / fund</span>
        <div className="flex items-center gap-2 mt-2">
          <input className="form-input" type="text" placeholder="0x viewer address" value={viewerInput} onChange={e => setViewerInput(e.target.value)} style={{ flex: 1, fontFamily: 'var(--cm-font-mono)', fontSize: '0.8rem' }} id="trade-viewer-input" />
          <button className="btn btn-ghost btn-sm" onClick={() => trading.grantAccess(viewerInput.trim())} disabled={trading.grant.loading || !viewerInput.trim()} id="grant-signal-access">
            {trading.grant.loading ? 'Granting...' : 'Grant'}
          </button>
        </div>
        {trading.grant.grantedTo && <p className="text-sm mt-2" style={{ color: 'var(--cm-success)' }}>✅ Signal shared with {trading.grant.grantedTo.slice(0, 8)}… — only they can unseal it.</p>}
        {trading.grant.error && <p className="text-xs mt-1" style={{ color: 'var(--cm-danger)' }}>{trading.grant.error}</p>}
      </div>
    </div>
  );
}

// ── Payroll Page ─────────────────────────────────────────────────────────────

function PayrollPage({ isConnected, onConnect, payroll }: { isConnected: boolean; onConnect: () => void; payroll: ReturnType<typeof usePayroll> }) {
  const [label, setLabel] = useState('April 2026');
  const [emp, setEmp] = useState('');
  const [amt, setAmt] = useState('5000');
  const [allocRun, setAllocRun] = useState('0');
  const [claimRun, setClaimRun] = useState('0');

  if (!isConnected) return <ConnectGate title="Confidential Payroll" onConnect={onConnect} icon={<IconWallet size={28} color="var(--cm-accent-1)" />} />;

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconLock size={22} color="var(--cm-accent-2)" />} title="Confidential Payroll" subtitle="Pay a team where every salary stays encrypted — nobody sees anyone else's number." />
      <div className="dashboard-content"><div className="grid-2" style={{ maxWidth: '1000px', margin: '0 auto', alignItems: 'start' }}>
        {/* Employer */}
        <div className="card">
          <h3 style={{ marginBottom: '12px' }}>Employer</h3>
          <p className="text-secondary text-sm" style={{ marginBottom: '12px' }}>Create a run, then assign each employee an encrypted salary.</p>
          <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
            <input className="form-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Run label" style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={() => payroll.createRun(label)} disabled={payroll.create.loading}>{payroll.create.loading ? '…' : 'Create run'}</button>
          </div>
          {payroll.create.message && <p className="text-xs" style={{ color: 'var(--cm-success)', marginBottom: '8px' }}>{payroll.create.message}</p>}
          <input className="form-input" value={allocRun} onChange={e => setAllocRun(e.target.value)} placeholder="Run ID" style={{ width: '100%', marginBottom: '8px' }} />
          <input className="form-input" value={emp} onChange={e => setEmp(e.target.value)} placeholder="0x employee" style={{ width: '100%', fontFamily: 'var(--cm-font-mono)', fontSize: '0.8rem', marginBottom: '8px' }} />
          <div className="flex items-center gap-2">
            <input className="form-input" type="number" value={amt} onChange={e => setAmt(e.target.value)} style={{ maxWidth: '120px' }} />
            <button className="btn btn-primary btn-sm" onClick={() => payroll.setAllocation(Number(allocRun), emp.trim(), Number(amt))} disabled={payroll.allocate.loading || !emp.trim()}>{payroll.allocate.loading ? '…' : 'Set encrypted salary'}</button>
          </div>
          {payroll.allocate.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{payroll.allocate.message}</p>}
          {payroll.allocate.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{payroll.allocate.error}</p>}
        </div>
        {/* Employee */}
        <div className="card">
          <h3 style={{ marginBottom: '12px' }}>Employee</h3>
          <p className="text-secondary text-sm" style={{ marginBottom: '12px' }}>Claim your salary for a run, then unseal it. Only you can read it.</p>
          <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
            <input className="form-input" value={claimRun} onChange={e => setClaimRun(e.target.value)} placeholder="Run ID" style={{ maxWidth: '120px' }} />
            <button className="btn btn-primary btn-sm" onClick={() => payroll.claimSalary(Number(claimRun))} disabled={payroll.claim.loading}>{payroll.claim.loading ? '…' : 'Claim'}</button>
          </div>
          {payroll.claim.message && <p className="text-xs" style={{ color: 'var(--cm-success)', marginBottom: '8px' }}>{payroll.claim.message}</p>}
          {payroll.claim.error && <p className="text-xs" style={{ color: 'var(--cm-danger)', marginBottom: '8px' }}>{payroll.claim.error}</p>}
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)' }}>
            <p className="text-xs text-muted" style={{ marginBottom: '6px' }}>YOUR ENCRYPTED SALARY</p>
            <div style={{ fontFamily: 'var(--cm-font-mono)', fontSize: '1.5rem', fontWeight: 700 }}>{payroll.salary === null ? '████' : `${payroll.salary} USDC`}</div>
            <button className="btn btn-ghost btn-sm mt-2" onClick={() => payroll.revealSalary()} disabled={payroll.salaryLoading}><IconEye size={14} /> {payroll.salaryLoading ? 'Unsealing…' : 'Unseal'}</button>
          </div>
        </div>
      </div></div>
    </div></div>
  );
}

// ── Lending Page ─────────────────────────────────────────────────────────────

function LendingPage({ isConnected, onConnect, lending }: { isConnected: boolean; onConnect: () => void; lending: ReturnType<typeof useLending> }) {
  const [dep, setDep] = useState('1000');
  const [bor, setBor] = useState('700');
  const [rep, setRep] = useState('200');
  const p = lending.position;

  if (!isConnected) return <ConnectGate title="Confidential Lending" onConnect={onConnect} icon={<IconBarChart size={28} color="var(--cm-accent-2)" />} />;

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconBarChart size={22} color="var(--cm-accent-2)" />} title="Confidential Lending" subtitle="Borrow against collateral with your balances, debt, and health factor all encrypted." />
      <div className="dashboard-content"><div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Position */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <h3>Your position</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => lending.refresh()} disabled={lending.posLoading}><IconEye size={14} /> {lending.posLoading ? 'Unsealing…' : 'Reveal'}</button>
          </div>
          <div className="grid-3" style={{ gap: '12px' }}>
            <Stat label="Collateral" value={p ? `${p.collateral}` : '████'} />
            <Stat label="Debt" value={p ? `${p.debt}` : '████'} />
            <Stat label="Drawn" value={p ? `${p.borrowable}` : '████'} />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button className="btn btn-ghost btn-sm" onClick={() => lending.checkHealth()}>Check health (encrypted)</button>
            {lending.health !== null && <span className="text-sm" style={{ color: lending.health ? 'var(--cm-success)' : 'var(--cm-danger)' }}>{lending.health ? '✅ Healthy (debt ≤ 75% LTV)' : '⚠️ Unhealthy'}</span>}
          </div>
        </div>
        <div className="grid-3" style={{ gap: '16px', alignItems: 'start' }}>
          <ActionCard title="Deposit collateral" desc="Mint test USDC and lock it as encrypted collateral." amount={dep} setAmount={setDep} btn="Deposit" onClick={() => lending.depositCollateral(Number(dep))} state={lending.deposit} />
          <ActionCard title="Borrow" desc="Draw up to 75% LTV. Over-limit silently draws 0." amount={bor} setAmount={setBor} btn="Borrow" onClick={() => lending.borrow(Number(bor))} state={lending.loan} />
          <ActionCard title="Repay" desc="Reduce your encrypted debt." amount={rep} setAmount={setRep} btn="Repay" onClick={() => lending.repay(Number(rep))} state={lending.loan} />
        </div>
      </div></div>
    </div></div>
  );
}

// ── Payment Requests Page ────────────────────────────────────────────────────

function RequestsPage({ isConnected, onConnect, requests }: { isConnected: boolean; onConnect: () => void; requests: ReturnType<typeof useRequests> }) {
  const [amt, setAmt] = useState('250');
  const [memo, setMemo] = useState('April rent share');
  const [payId, setPayId] = useState('0');

  if (!isConnected) return <ConnectGate title="Payment Requests" onConnect={onConnect} icon={<IconWallet size={28} color="var(--cm-accent-1)" />} />;

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconLock size={22} color="var(--cm-accent-1)" />} title="Payment Requests" subtitle="Ask for a payment with a public memo and a sealed amount. Anyone can fulfill it." />
      <div className="dashboard-content"><div className="grid-2" style={{ maxWidth: '1000px', margin: '0 auto', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: '8px' }}>Create a request</h3>
          <p className="text-secondary text-sm" style={{ marginBottom: '12px' }}>The memo is public; the amount is encrypted.</p>
          <input className="form-input" value={memo} onChange={e => setMemo(e.target.value)} placeholder="Memo" style={{ width: '100%', marginBottom: '8px' }} />
          <div className="flex items-center gap-2">
            <input className="form-input" type="number" value={amt} onChange={e => setAmt(e.target.value)} style={{ maxWidth: '120px' }} />
            <button className="btn btn-primary btn-sm" onClick={() => requests.createRequest(Number(amt), memo)} disabled={requests.create.loading}>{requests.create.loading ? '…' : 'Create'}</button>
          </div>
          {requests.create.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{requests.create.message}</p>}
          {requests.create.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{requests.create.error}</p>}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '8px' }}>Pay / your receipts</h3>
          <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
            <input className="form-input" value={payId} onChange={e => setPayId(e.target.value)} placeholder="Request ID" style={{ maxWidth: '120px' }} />
            <button className="btn btn-primary btn-sm" onClick={() => requests.pay(Number(payId))} disabled={requests.payState.loading}>{requests.payState.loading ? '…' : 'Pay'}</button>
          </div>
          {requests.payState.message && <p className="text-xs" style={{ color: 'var(--cm-success)', marginBottom: '8px' }}>{requests.payState.message}</p>}
          {requests.payState.error && <p className="text-xs" style={{ color: 'var(--cm-danger)', marginBottom: '8px' }}>{requests.payState.error}</p>}
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)' }}>
            <p className="text-xs text-muted" style={{ marginBottom: '6px' }}>TOTAL RECEIVED (ENCRYPTED)</p>
            <div style={{ fontFamily: 'var(--cm-font-mono)', fontSize: '1.5rem', fontWeight: 700 }}>{requests.received === null ? '████' : `${requests.received} USDC`}</div>
            <button className="btn btn-ghost btn-sm mt-2" onClick={() => requests.revealReceived()} disabled={requests.receivedLoading}><IconEye size={14} /> {requests.receivedLoading ? 'Unsealing…' : 'Unseal'}</button>
          </div>
        </div>
      </div></div>
    </div></div>
  );
}

// ── Crowdfund Page ───────────────────────────────────────────────────────────

function CrowdfundPage({ isConnected, onConnect, crowdfund }: { isConnected: boolean; onConnect: () => void; crowdfund: ReturnType<typeof useCrowdfund> }) {
  const [goal, setGoal] = useState('1000');
  const [title, setTitle] = useState('Community project');
  const [cid, setCid] = useState('0');
  const [contribAmt, setContribAmt] = useState('100');
  const [viewId, setViewId] = useState('0');

  if (!isConnected) return <ConnectGate title="Crowdfund" onConnect={onConnect} icon={<IconWallet size={28} color="var(--cm-accent-2)" />} />;

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconBarChart size={22} color="var(--cm-accent-2)" />} title="Confidential Crowdfund" subtitle="Raise toward a sealed goal. Participation is public; every contribution amount stays private." />
      <div className="dashboard-content"><div className="grid-3" style={{ maxWidth: '1100px', margin: '0 auto', alignItems: 'start', gap: '16px' }}>
        <div className="card">
          <h4 style={{ marginBottom: '8px' }}>Create campaign</h4>
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ width: '100%', marginBottom: '8px' }} />
          <div className="flex items-center gap-2">
            <input className="form-input" type="number" value={goal} onChange={e => setGoal(e.target.value)} style={{ maxWidth: '110px' }} placeholder="Goal" />
            <button className="btn btn-primary btn-sm" onClick={() => crowdfund.createCampaign(Number(goal), title)} disabled={crowdfund.create.loading}>{crowdfund.create.loading ? '…' : 'Create'}</button>
          </div>
          {crowdfund.create.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{crowdfund.create.message}</p>}
          {crowdfund.create.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{crowdfund.create.error}</p>}
        </div>
        <div className="card">
          <h4 style={{ marginBottom: '8px' }}>Contribute</h4>
          <input className="form-input" value={cid} onChange={e => setCid(e.target.value)} placeholder="Campaign ID" style={{ width: '100%', marginBottom: '8px' }} />
          <div className="flex items-center gap-2">
            <input className="form-input" type="number" value={contribAmt} onChange={e => setContribAmt(e.target.value)} style={{ maxWidth: '110px' }} />
            <button className="btn btn-primary btn-sm" onClick={() => crowdfund.contribute(Number(cid), Number(contribAmt))} disabled={crowdfund.contributeState.loading}>{crowdfund.contributeState.loading ? '…' : 'Give'}</button>
          </div>
          {crowdfund.contributeState.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{crowdfund.contributeState.message}</p>}
          {crowdfund.contributeState.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{crowdfund.contributeState.error}</p>}
        </div>
        <div className="card">
          <h4 style={{ marginBottom: '8px' }}>Owner progress</h4>
          <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
            <input className="form-input" value={viewId} onChange={e => setViewId(e.target.value)} placeholder="Campaign ID" style={{ maxWidth: '110px' }} />
            <button className="btn btn-ghost btn-sm" onClick={() => crowdfund.revealProgress(Number(viewId))} disabled={crowdfund.viewLoading}><IconEye size={14} /> {crowdfund.viewLoading ? '…' : 'Reveal'}</button>
          </div>
          <Stat label="Raised (encrypted)" value={crowdfund.raised === null ? '████' : `${crowdfund.raised}`} />
          {crowdfund.reached !== null && <p className="text-sm mt-2" style={{ color: crowdfund.reached ? 'var(--cm-success)' : 'var(--cm-text-secondary)' }}>{crowdfund.reached ? '✅ Goal reached' : 'ℹ️ Goal not yet reached'} (total stayed sealed)</p>}
        </div>
      </div></div>
    </div></div>
  );
}

// ── Escrow Page ──────────────────────────────────────────────────────────────

function EscrowPage({ isConnected, onConnect, escrow }: { isConnected: boolean; onConnect: () => void; escrow: ReturnType<typeof useEscrow> }) {
  const [seller, setSeller] = useState('');
  const [arbiter, setArbiter] = useState('');
  const [amt, setAmt] = useState('500');
  const [memo, setMemo] = useState('Design work');
  const [dealId, setDealId] = useState('0');

  if (!isConnected) return <ConnectGate title="Confidential Escrow" onConnect={onConnect} icon={<IconShield size={28} color="var(--cm-accent-1)" />} />;

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconShield size={22} color="var(--cm-accent-1)" />} title="Confidential Escrow" subtitle="Buyer funds, both parties approve, funds release — all over a sealed amount. An arbiter resolves disputes." />
      <div className="dashboard-content"><div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '8px' }}>Open a deal (as buyer)</h3>
          <p className="text-secondary text-sm" style={{ marginBottom: '12px' }}>The memo is public; the amount is encrypted and visible only to the three parties.</p>
          <input className="form-input" value={seller} onChange={e => setSeller(e.target.value)} placeholder="0x seller" style={{ width: '100%', fontFamily: 'var(--cm-font-mono)', fontSize: '0.8rem', marginBottom: '8px' }} />
          <input className="form-input" value={arbiter} onChange={e => setArbiter(e.target.value)} placeholder="0x arbiter" style={{ width: '100%', fontFamily: 'var(--cm-font-mono)', fontSize: '0.8rem', marginBottom: '8px' }} />
          <input className="form-input" value={memo} onChange={e => setMemo(e.target.value)} placeholder="Memo" style={{ width: '100%', marginBottom: '8px' }} />
          <div className="flex items-center gap-2">
            <input className="form-input" type="number" value={amt} onChange={e => setAmt(e.target.value)} style={{ maxWidth: '120px' }} />
            <button className="btn btn-primary btn-sm" onClick={() => escrow.openDeal(seller.trim(), arbiter.trim(), Number(amt), memo)} disabled={escrow.open.loading || !seller.trim() || !arbiter.trim()}>{escrow.open.loading ? '…' : 'Open deal'}</button>
          </div>
          {escrow.open.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{escrow.open.message}</p>}
          {escrow.open.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{escrow.open.error}</p>}
        </div>
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h4 style={{ marginBottom: '8px' }}>Act on a deal</h4>
            <input className="form-input" value={dealId} onChange={e => setDealId(e.target.value)} placeholder="Deal ID" style={{ width: '100%', marginBottom: '8px' }} />
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => escrow.approve(Number(dealId))} disabled={escrow.action.loading}>Approve</button>
              <button className="btn btn-ghost btn-sm" onClick={() => escrow.resolve(Number(dealId), true)} disabled={escrow.action.loading}>Arbiter: release</button>
              <button className="btn btn-ghost btn-sm" onClick={() => escrow.resolve(Number(dealId), false)} disabled={escrow.action.loading}>Arbiter: refund</button>
            </div>
            {escrow.action.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{escrow.action.message}</p>}
            {escrow.action.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{escrow.action.error}</p>}
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="text-xs text-muted" style={{ marginBottom: '6px' }}>YOUR SETTLED BALANCE (ENCRYPTED)</p>
            <div style={{ fontFamily: 'var(--cm-font-mono)', fontSize: '1.5rem', fontWeight: 700 }}>{escrow.balance === null ? '████' : `${escrow.balance} USDC`}</div>
            <button className="btn btn-ghost btn-sm mt-2" onClick={() => escrow.revealBalance()} disabled={escrow.balanceLoading}><IconEye size={14} /> {escrow.balanceLoading ? 'Unsealing…' : 'Unseal'}</button>
          </div>
        </div>
      </div></div>
    </div></div>
  );
}

// ── Agents Page (multi-agent Hermes council) ────────────────────────────────

function AgentsPage({ agents }: { agents: ReturnType<typeof useAgents> }) {
  const [task, setTask] = useState('');
  const activeIds = new Set(agents.plan.map((p) => p.agentId));
  const doneIds = new Set(agents.steps.map((s) => s.agentId));
  const suggestions = [
    'Should I rotate treasury from ETH into stablecoins right now?',
    'Assess the risk of providing liquidity to a new ARB pair',
    'Is sentiment around BTC bullish enough to add exposure?',
  ];

  const phaseLabel: Record<string, string> = {
    idle: 'Idle', planning: 'Planning & delegating…', delegating: 'Agents reasoning…', synthesizing: 'Synthesizing…', done: 'Council complete',
  };

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconCpu size={22} color="var(--cm-accent-1)" />} title="Hermes Agent Council" subtitle="A council of specialized agents plans, delegates, and reasons together — with confidence scores and a full reasoning trace." />
      <div className="dashboard-content"><div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Task input */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="flex items-center gap-2 mb-4"><IconZap size={16} color="var(--cm-accent-1)" /><span className="text-sm" style={{ fontWeight: 600 }}>Give the council a task</span></div>
          <div style={{ position: 'relative' }}>
            <textarea className="form-input" style={{ width: '100%', minHeight: '70px', resize: 'vertical', paddingRight: '56px' }}
              placeholder="e.g. Should I rebalance my portfolio given current market risk?"
              value={task} onChange={(e) => setTask(e.target.value)} disabled={agents.busy}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (task.trim() && !agents.busy) agents.run(task.trim()); } }} />
            <button className="btn btn-primary btn-icon" style={{ position: 'absolute', right: '8px', bottom: '8px' }}
              disabled={agents.busy || !task.trim()} onClick={() => agents.run(task.trim())}><IconSend size={18} /></button>
          </div>
          {agents.phase === 'idle' && !agents.result && (
            <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
              {suggestions.map((s, i) => (
                <button key={i} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', border: '1px solid var(--cm-border)', borderRadius: '20px' }} onClick={() => setTask(s)}>{s}</button>
              ))}
            </div>
          )}
          {agents.busy && (
            <div className="flex items-center gap-2 mt-4 text-sm" style={{ color: 'var(--cm-accent-1)' }}>
              <span className="thinking-dot" /> {phaseLabel[agents.phase]}
            </div>
          )}
          {agents.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{agents.error}</p>}
        </div>

        {/* Council roster */}
        <div className="grid-4" style={{ gap: '10px', marginBottom: '20px' }}>
          {AGENTS.map((a) => {
            const isActive = activeIds.has(a.id);
            const isDone = doneIds.has(a.id);
            const step = agents.steps.find((s) => s.agentId === a.id);
            return (
              <div key={a.id} className="card" style={{ padding: '14px', opacity: agents.plan.length && !isActive ? 0.4 : 1, borderColor: isActive ? a.accent : 'var(--cm-border)' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.accent, boxShadow: isActive && !isDone ? `0 0 8px ${a.accent}` : 'none', display: 'inline-block' }} className={isActive && !isDone ? 'animate-pulse-glow' : ''} />
                  <span className="text-sm" style={{ fontWeight: 600 }}>{a.name}</span>
                </div>
                <p className="text-xs text-muted" style={{ lineHeight: 1.4 }}>{a.role}</p>
                {step && <p className="text-xs mt-2" style={{ color: a.accent, fontFamily: 'var(--cm-font-mono)' }}>conf {step.confidence}%</p>}
              </div>
            );
          })}
        </div>

        {/* Synthesized answer */}
        {agents.result && (
          <div className="card animate-slide-up" style={{ marginBottom: '16px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="badge badge-success"><IconShieldCheck size={12} /> Council Synthesis</div>
              <span className="text-xs font-mono" style={{ color: 'var(--cm-accent-1)' }}>overall confidence {agents.result.confidence}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--cm-bg-secondary)', borderRadius: 3, overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ height: '100%', width: `${agents.result.confidence}%`, background: 'var(--cm-gradient-brand)' }} />
            </div>
            <div className="research-response" style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.9375rem' }}>{agents.result.answer}</div>
            <button className="btn btn-secondary mt-4" onClick={() => { agents.reset(); setTask(''); }}><IconRefresh size={16} /> New task</button>
          </div>
        )}

        {/* Reasoning trace / audit log */}
        {agents.steps.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><IconEye size={14} color="var(--cm-text-tertiary)" /><span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reasoning trace (audit log)</span></div>
            {agents.rationale && <p className="text-xs text-secondary" style={{ marginBottom: '12px', fontStyle: 'italic' }}>Plan: {agents.rationale}</p>}
            <div className="flex flex-col gap-3">
              {agents.steps.map((s, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--cm-border-accent)', paddingLeft: '12px' }}>
                  <div className="flex items-center gap-2"><span className="text-sm" style={{ fontWeight: 600 }}>{s.agentName}</span><span className="text-xs font-mono text-muted">conf {s.confidence}%</span></div>
                  <p className="text-xs text-tertiary" style={{ marginBottom: '2px' }}>↳ {s.subtask}</p>
                  <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>{s.output}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div></div>
    </div></div>
  );
}

// ── Live Intelligence Page ───────────────────────────────────────────────────

function LiveIntelPage({ realtime }: { realtime: ReturnType<typeof useRealtime> }) {
  const { chain, tickers, trending, signals, error, insight, insightLoading, refreshInsight } = realtime;
  const changeColor = (v: number) => (v > 0 ? 'var(--cm-success)' : v < 0 ? 'var(--cm-danger)' : 'var(--cm-text-secondary)');

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader
        icon={<IconZap size={22} color="var(--cm-accent-1)" />}
        title="Live Intelligence"
        subtitle="Real-time on-chain + market signals from public sources, with an AI read of the snapshot."
      />
      <div className="dashboard-content"><div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Chain status */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="thinking-dot" />
            <span className="text-sm" style={{ fontWeight: 600 }}>Arbitrum Sepolia · live (5s)</span>
            {error && <span className="text-xs" style={{ color: 'var(--cm-danger)', marginLeft: 'auto' }}>{error}</span>}
          </div>
          <div className="grid-3" style={{ gap: '12px' }}>
            <Stat label="Block" value={chain ? `#${chain.blockNumber}` : '…'} />
            <Stat label="Gas (gwei)" value={chain ? `${chain.gasGwei}` : '…'} />
            <Stat label="Last block" value={chain && chain.blockTime ? `${new Date(chain.blockTime * 1000).toLocaleTimeString()}` : '…'} />
          </div>
        </div>

        {/* Market tickers */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ fontWeight: 600 }}>Market · live (20s)</span>
            {signals.volatile.length > 0 && <span className="badge badge-warning">High volatility: {signals.volatile.join(', ')}</span>}
          </div>
          <div className="grid-4" style={{ gap: '10px' }}>
            {tickers.length === 0 && <p className="text-sm text-muted">Loading market…</p>}
            {tickers.map((t) => (
              <div key={t.id} style={{ padding: '12px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ fontWeight: 700 }}>{t.symbol}</span>
                  <span className="text-xs font-mono" style={{ color: changeColor(t.change24h) }}>{t.change24h > 0 ? '+' : ''}{t.change24h}%</span>
                </div>
                <div className="text-sm font-mono" style={{ marginTop: '4px' }}>${t.price.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Trending */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><IconTrendingUp size={16} color="var(--cm-accent-2)" /><span className="text-sm" style={{ fontWeight: 600 }}>Trending tokens</span></div>
            <div className="flex flex-col gap-2">
              {trending.length === 0 && <p className="text-sm text-muted">Loading…</p>}
              {trending.map((t, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{i + 1}. {t.name} <span className="text-muted font-mono">{t.symbol}</span></span>
                  {t.rank > 0 && <span className="text-xs text-muted">#{t.rank}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* AI insight */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><IconCpu size={16} color="var(--cm-accent-1)" /><span className="text-sm" style={{ fontWeight: 600 }}>AI market insight</span></div>
              <button className="btn btn-ghost btn-sm" onClick={() => refreshInsight()} disabled={insightLoading || !chain || !tickers.length}>{insightLoading ? 'Reading…' : 'Generate'}</button>
            </div>
            {insight ? (
              <p className="text-sm text-secondary" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{insight}</p>
            ) : (
              <p className="text-sm text-muted">Click <strong>Generate</strong> for Hermes' read of the live snapshot.</p>
            )}
          </div>
        </div>

        <p className="text-xs text-muted" style={{ marginTop: '16px', textAlign: 'center' }}>
          Powered by public RPC + CoinGecko free API. Add a streaming provider key for push WebSockets and whale/smart-money tracking.
        </p>

      </div></div>
    </div></div>
  );
}

// ── Wallet Intelligence Page ─────────────────────────────────────────────────

function WalletPage({ isConnected, onConnect, wallet }: { isConnected: boolean; onConnect: () => void; wallet: ReturnType<typeof useWalletIntel> }) {
  if (!isConnected) return <ConnectGate title="Wallet Intelligence" onConnect={onConnect} icon={<IconShield size={28} color="var(--cm-accent-1)" />} />;

  const riskColor = wallet.risk
    ? (wallet.risk.level === 'Low' ? 'var(--cm-success)' : wallet.risk.level === 'Moderate' ? 'var(--cm-warning)' : 'var(--cm-danger)')
    : 'var(--cm-text-secondary)';

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconShield size={22} color="var(--cm-accent-1)" />} title="Wallet Intelligence" subtitle="Scan your exposure and token approvals, score risk, and revoke dangerous allowances — all from on-chain reads." />
      <div className="dashboard-content"><div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <p className="text-secondary text-sm">Reads your connected wallet via the public RPC. Nothing leaves your device.</p>
          <button className="btn btn-primary btn-sm" onClick={() => wallet.scan()} disabled={wallet.scanning}>{wallet.scanning ? 'Scanning…' : 'Scan wallet'}</button>
        </div>
        {wallet.error && <p className="text-xs" style={{ color: 'var(--cm-danger)', marginBottom: '12px' }}>{wallet.error}</p>}

        {wallet.portfolio && (
          <>
            {/* Exposure + risk */}
            <div className="grid-3" style={{ gap: '12px', marginBottom: '16px' }}>
              <Stat label="ETH" value={`${wallet.portfolio.eth.toFixed(4)}`} />
              <Stat label="mUSDC" value={`${wallet.portfolio.usdc}`} />
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)' }}>
                <p className="text-xs text-muted" style={{ marginBottom: '4px' }}>Risk score</p>
                <div style={{ fontFamily: 'var(--cm-font-mono)', fontSize: '1.25rem', fontWeight: 700, color: riskColor }}>
                  {wallet.risk ? `${wallet.risk.score} · ${wallet.risk.level}` : '—'}
                </div>
              </div>
            </div>

            {/* Approval scanner */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '12px' }}>Approval scanner</h3>
              {wallet.approvals.length === 0 ? (
                <p className="text-sm text-secondary">No active approvals on the tracked token — clean. ✅</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {wallet.approvals.map((a, i) => (
                    <div key={i} className="flex items-center justify-between" style={{ padding: '10px 12px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)' }}>
                      <div>
                        <div className="text-sm" style={{ fontWeight: 600 }}>{a.tokenSymbol} → {a.spenderName} {a.unlimited && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Unlimited</span>}{!a.isContract && <span className="badge badge-warning" style={{ marginLeft: 6 }}>Non-contract</span>}</div>
                        <div className="text-xs font-mono text-muted">allowance: {a.allowance} · {a.spender.slice(0, 10)}…</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => wallet.revoke(a.spender)} disabled={wallet.revoking === a.spender}>{wallet.revoking === a.spender ? 'Revoking…' : 'Revoke'}</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Risk notes + AI */}
            <div className="grid-2" style={{ alignItems: 'start' }}>
              <div className="card">
                <h4 style={{ marginBottom: '8px' }}>Findings</h4>
                {wallet.risk?.notes.map((n, i) => <p key={i} className="text-sm text-secondary" style={{ marginBottom: '6px' }}>• {n}</p>)}
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h4>AI security read</h4>
                  <button className="btn btn-ghost btn-sm" onClick={() => wallet.generateSummary()} disabled={wallet.summaryLoading}>{wallet.summaryLoading ? 'Reading…' : 'Generate'}</button>
                </div>
                <p className="text-sm text-secondary" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{wallet.summary || 'Run an AI read of your wallet posture.'}</p>
              </div>
            </div>
            <p className="text-xs text-muted" style={{ marginTop: '16px', textAlign: 'center' }}>
              Tracks the CipherMind token + known spenders. Full multi-token portfolio, whale exposure, and rug-pull detection need an indexer/data provider.
            </p>
          </>
        )}

        {!wallet.portfolio && !wallet.scanning && (
          <div className="card text-center" style={{ padding: '48px 24px' }}>
            <div style={{ margin: '0 auto 16px', opacity: 0.3 }}><IconShield size={48} /></div>
            <p className="text-secondary">Click <strong>Scan wallet</strong> to analyze your exposure and approvals.</p>
          </div>
        )}

      </div></div>
    </div></div>
  );
}

// ── Autonomous Actions Page ──────────────────────────────────────────────────

function AutomationPage({ isConnected, onConnect, automation }: { isConnected: boolean; onConnect: () => void; automation: ReturnType<typeof useAutomation> }) {
  const [goal, setGoal] = useState('Reduce risk: move some exposure toward stablecoins');
  const [recipient, setRecipient] = useState('');
  const a = automation;

  if (!isConnected) return <ConnectGate title="Autonomous Actions" onConnect={onConnect} icon={<IconCpu size={28} color="var(--cm-accent-1)" />} />;

  const auditColor = (s: string) => (s === 'executed' ? 'var(--cm-success)' : s === 'failed' ? 'var(--cm-danger)' : 'var(--cm-warning)');

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconCpu size={22} color="var(--cm-accent-1)" />} title="Autonomous Actions" subtitle="The AI proposes actions toward your goal; every one is simulated and must clear the safety harness before it can execute." />
      <div className="dashboard-content"><div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Safety harness */}
        <div className="card" style={{ marginBottom: '16px', borderColor: a.safety.emergencyStop ? 'var(--cm-danger)' : 'var(--cm-border)' }}>
          <div className="flex items-center gap-2 mb-4"><IconShield size={16} color="var(--cm-accent-1)" /><span className="text-sm" style={{ fontWeight: 600 }}>Safety harness</span></div>
          <div className="grid-4" style={{ gap: '12px' }}>
            <label className="text-sm text-secondary">Approval mode
              <div><button className={`btn btn-sm ${a.safety.approvalMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => a.setSafetyField('approvalMode', !a.safety.approvalMode)} style={{ marginTop: 6 }}>{a.safety.approvalMode ? 'Required' : 'Off'}</button></div>
            </label>
            <label className="text-sm text-secondary">Spending limit (USDC)
              <input className="form-input" type="number" value={a.safety.spendingLimit} onChange={(e) => a.setSafetyField('spendingLimit', Number(e.target.value))} style={{ marginTop: 6, width: '100%' }} />
            </label>
            <label className="text-sm text-secondary">Risk threshold
              <input className="form-input" type="number" value={a.safety.riskThreshold} onChange={(e) => a.setSafetyField('riskThreshold', Number(e.target.value))} style={{ marginTop: 6, width: '100%' }} />
            </label>
            <label className="text-sm text-secondary">Emergency stop
              <div><button className={`btn btn-sm ${a.safety.emergencyStop ? 'btn-primary' : 'btn-ghost'}`} onClick={() => a.setSafetyField('emergencyStop', !a.safety.emergencyStop)} style={{ marginTop: 6, ...(a.safety.emergencyStop ? { background: 'var(--cm-danger)' } : { border: '1px solid var(--cm-danger)', color: 'var(--cm-danger)' }) }}>{a.safety.emergencyStop ? 'STOPPED' : 'Armed'}</button></div>
            </label>
          </div>
        </div>

        {/* Goal */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="flex items-center gap-2 mb-2"><IconZap size={16} color="var(--cm-accent-1)" /><span className="text-sm" style={{ fontWeight: 600 }}>Strategy goal</span></div>
          <div className="flex items-center gap-2">
            <input className="form-input" value={goal} onChange={(e) => setGoal(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={() => a.plan(goal, '')} disabled={a.planning}>{a.planning ? 'Planning…' : 'Plan actions'}</button>
          </div>
          {a.summary && <p className="text-sm text-secondary mt-2">{a.summary}</p>}
          {a.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{a.error}</p>}
        </div>

        {/* Proposed actions */}
        {a.actions.length > 0 && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3>Proposed actions (simulation)</h3>
              <input className="form-input" placeholder="0x recipient for execution" value={recipient} onChange={(e) => setRecipient(e.target.value)} style={{ maxWidth: '260px', fontFamily: 'var(--cm-font-mono)', fontSize: '0.75rem' }} />
            </div>
            <div className="flex flex-col gap-3">
              {a.actions.map((act) => {
                const chk = a.check(act);
                return (
                  <div key={act.id} style={{ padding: '12px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="badge badge-accent" style={{ textTransform: 'uppercase' }}>{act.type}</span>
                        <span className="text-sm" style={{ fontWeight: 600, marginLeft: 8 }}>{act.amount > 0 ? `${act.amount} USDC` : '—'}</span>
                        <span className="text-xs font-mono text-muted" style={{ marginLeft: 8 }}>risk {act.risk}</span>
                      </div>
                      <button className="btn btn-primary btn-sm" disabled={!chk.allowed || a.executingId === act.id} onClick={() => a.execute(act, recipient)}>
                        {a.executingId === act.id ? 'Executing…' : a.safety.approvalMode ? 'Approve & Execute' : 'Execute'}
                      </button>
                    </div>
                    <p className="text-sm text-secondary" style={{ marginTop: '6px' }}>{act.rationale}</p>
                    {!chk.allowed && <p className="text-xs mt-1" style={{ color: 'var(--cm-warning)' }}>🔒 {chk.reasons.join(' ')}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Audit log */}
        {a.audit.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><IconEye size={14} color="var(--cm-text-tertiary)" /><span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Execution audit log</span></div>
            <div className="flex flex-col gap-2">
              {a.audit.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span style={{ color: auditColor(e.status), fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', minWidth: 70 }}>{e.status}</span>
                  <span className="text-secondary">{e.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div></div>
    </div></div>
  );
}

// ── Encrypted Memory Page ────────────────────────────────────────────────────

function MemoryPage({ isConnected, onConnect, memory }: { isConnected: boolean; onConnect: () => void; memory: ReturnType<typeof useMemory> }) {
  const [kind, setKind] = useState<'note' | 'preference' | 'risk' | 'conversation'>('preference');
  const [text, setText] = useState('');
  const [q, setQ] = useState('');

  if (!isConnected) return <ConnectGate title="Encrypted Memory" onConnect={onConnect} icon={<IconLock size={28} color="var(--cm-accent-1)" />} />;

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconLock size={22} color="var(--cm-accent-1)" />} title="Encrypted AI Memory" subtitle="Persistent memory encrypted at rest with a key derived from your wallet signature — only you can decrypt it." />
      <div className="dashboard-content"><div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {!memory.unlocked ? (
          <div className="card text-center" style={{ padding: '48px 24px' }}>
            <div style={{ fontFamily: 'var(--cm-font-mono)', fontSize: '2rem', letterSpacing: '0.1em', marginBottom: '12px' }}>████████</div>
            <p className="text-secondary" style={{ marginBottom: '20px', lineHeight: 1.6 }}>
              Your memory is sealed. Sign a free off-chain message to derive your private key and unlock it on this device.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => memory.unlock()} disabled={memory.busy}><IconUnlock size={18} /> {memory.busy ? 'Unlocking…' : 'Unlock memory'}</button>
            {memory.error && <p className="text-xs mt-4" style={{ color: 'var(--cm-danger)' }}>{memory.error}</p>}
          </div>
        ) : (
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Manage */}
            <div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>Add to memory</h3>
                <select className="form-select" value={kind} onChange={(e) => setKind(e.target.value as any)} style={{ width: '100%', marginBottom: '8px' }}>
                  <option value="preference">Preference</option>
                  <option value="risk">Risk profile</option>
                  <option value="note">Note</option>
                  <option value="conversation">Conversation</option>
                </select>
                <textarea className="form-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I prefer low-risk stablecoin strategies and dislike leverage." style={{ width: '100%', minHeight: '60px', marginBottom: '8px' }} />
                <button className="btn btn-primary btn-sm" onClick={() => { memory.add(kind, text); setText(''); }} disabled={!text.trim()}>Encrypt & save</button>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h4>Stored memories ({memory.entries.length})</h4>
                  {memory.entries.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => memory.clearAll()}>Clear all</button>}
                </div>
                {memory.entries.length === 0 && <p className="text-sm text-muted">No memories yet — add a preference or risk note.</p>}
                <div className="flex flex-col gap-2">
                  {memory.entries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between" style={{ padding: '8px 10px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-sm)' }}>
                      <div><span className="badge badge-info" style={{ marginRight: 6 }}>{e.kind}</span><span className="text-sm">{e.text}</span></div>
                      <button className="btn btn-ghost btn-sm" onClick={() => memory.remove(e.id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Ask with memory */}
            <div className="card">
              <h3 style={{ marginBottom: '12px' }}>Ask — with memory</h3>
              <p className="text-secondary text-sm" style={{ marginBottom: '12px' }}>The AI retrieves your relevant private memories and tailors its answer.</p>
              <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
                <input className="form-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What strategy suits me?" style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={() => memory.ask(q)} disabled={memory.asking || !q.trim()}>{memory.asking ? '…' : 'Ask'}</button>
              </div>
              {memory.used.length > 0 && (
                <p className="text-xs text-muted" style={{ marginBottom: '8px' }}>Recalled {memory.used.length} memory item(s): {memory.used.map((u) => u.kind).join(', ')}</p>
              )}
              {memory.answer && <div className="text-sm text-secondary" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', padding: '12px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)' }}>{memory.answer}</div>}
              <p className="text-xs text-muted" style={{ marginTop: '12px' }}>Encrypted at rest (AES-GCM, wallet-derived key). Hosted vector search would need a backend.</p>
            </div>
          </div>
        )}

      </div></div>
    </div></div>
  );
}

// ── Encrypted Governance Page ────────────────────────────────────────────────

function GovernancePage({ isConnected, onConnect, governance }: { isConnected: boolean; onConnect: () => void; governance: ReturnType<typeof useGovernance> }) {
  const [title, setTitle] = useState('Increase treasury yield allocation to 20%');
  const [pid, setPid] = useState('0');
  const g = governance;

  if (!isConnected) return <ConnectGate title="Encrypted Governance" onConnect={onConnect} icon={<IconShieldCheck size={28} color="var(--cm-accent-2)" />} />;

  return (
    <div className="dashboard"><div className="container">
      <SurfaceHeader icon={<IconShieldCheck size={22} color="var(--cm-accent-2)" />} title="Encrypted DAO Governance" subtitle="Vote with encrypted ballots. Individual votes are never stored — only the aggregate tally, revealed when the proposal is finalized." />
      <div className="dashboard-content"><div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <div className="card" style={{ marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '8px' }}>Create proposal</h3>
          <div className="flex items-center gap-2">
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={() => g.createProposal(title)} disabled={g.create.loading}>{g.create.loading ? '…' : 'Create'}</button>
          </div>
          {g.create.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{g.create.message}</p>}
          {g.create.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{g.create.error}</p>}
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Vote */}
          <div className="card">
            <h4 style={{ marginBottom: '12px' }}>Cast an encrypted vote</h4>
            <input className="form-input" value={pid} onChange={(e) => setPid(e.target.value)} placeholder="Proposal ID" style={{ width: '100%', marginBottom: '10px' }} />
            <div className="flex items-center gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => g.vote(Number(pid), true)} disabled={g.voteState.loading}>Vote YES</button>
              <button className="btn btn-secondary btn-sm" onClick={() => g.vote(Number(pid), false)} disabled={g.voteState.loading}>Vote NO</button>
            </div>
            {g.voteState.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{g.voteState.message}</p>}
            {g.voteState.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{g.voteState.error}</p>}
            <p className="text-xs text-muted" style={{ marginTop: '10px' }}>Your ballot is encrypted; the chain only ever holds the running tally.</p>
          </div>

          {/* Finalize + reveal */}
          <div className="card">
            <h4 style={{ marginBottom: '12px' }}>Finalize & reveal</h4>
            <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => g.finalize(Number(pid))} disabled={g.finalizeState.loading}>Finalize #{pid}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => g.revealTally(Number(pid))} disabled={g.tallyLoading}><IconEye size={14} /> {g.tallyLoading ? '…' : 'Reveal tally'}</button>
            </div>
            {g.finalizeState.message && <p className="text-xs" style={{ color: 'var(--cm-success)', marginBottom: '8px' }}>{g.finalizeState.message}</p>}
            {g.finalizeState.error && <p className="text-xs" style={{ color: 'var(--cm-danger)', marginBottom: '8px' }}>{g.finalizeState.error}</p>}
            {g.tally && (
              <div style={{ padding: '14px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)', textAlign: 'center' }}>
                <div className="flex items-center justify-center gap-6" style={{ fontFamily: 'var(--cm-font-mono)' }}>
                  <span style={{ color: 'var(--cm-success)', fontWeight: 700 }}>YES {g.tally.yes}</span>
                  <span style={{ color: 'var(--cm-danger)', fontWeight: 700 }}>NO {g.tally.no}</span>
                </div>
                <p className="text-sm mt-2" style={{ fontWeight: 600, color: g.tally.yes > g.tally.no ? 'var(--cm-success)' : 'var(--cm-text-secondary)' }}>
                  {g.tally.yes > g.tally.no ? '✅ Proposal passes' : g.tally.yes < g.tally.no ? '❌ Proposal fails' : '⚖️ Tie'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div></div>
    </div></div>
  );
}

// ── Small shared UI helpers ──────────────────────────────────────────────────

function ConnectGate({ title, onConnect, icon }: { title: string; onConnect: () => void; icon: React.ReactNode }) {
  return (
    <div className="dashboard"><div className="container"><div className="dashboard-content">
      <div className="card text-center" style={{ padding: '60px 24px', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ margin: '0 auto 16px', width: '64px', height: '64px', borderRadius: '50%', background: 'var(--cm-gradient-brand-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <h3 style={{ marginBottom: '12px' }}>{title}</h3>
        <p className="text-secondary" style={{ marginBottom: '24px', lineHeight: 1.6 }}>Connect your wallet to continue. Everything you submit is encrypted on your device.</p>
        <button className="btn btn-primary btn-lg" onClick={onConnect}><IconWallet size={18} /> Connect Wallet</button>
      </div>
    </div></div></div>
  );
}

function SurfaceHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="dashboard-header"><div className="flex items-center gap-3">
      <div className="feature-icon" style={{ marginBottom: 0 }}>{icon}</div>
      <div><h1 style={{ fontSize: '1.5rem' }}>{title}</h1><p className="text-secondary text-sm">{subtitle}</p></div>
    </div></div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px', background: 'var(--cm-bg-secondary)', borderRadius: 'var(--cm-radius-md)' }}>
      <p className="text-xs text-muted" style={{ marginBottom: '4px' }}>{label}</p>
      <div style={{ fontFamily: 'var(--cm-font-mono)', fontSize: '1.25rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function ActionCard({ title, desc, amount, setAmount, btn, onClick, state }: { title: string; desc: string; amount: string; setAmount: (v: string) => void; btn: string; onClick: () => void; state: { loading: boolean; message: string | null; error: string | null } }) {
  return (
    <div className="card">
      <h4 style={{ marginBottom: '6px' }}>{title}</h4>
      <p className="text-secondary text-xs" style={{ marginBottom: '12px', lineHeight: 1.5 }}>{desc}</p>
      <div className="flex items-center gap-2">
        <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ maxWidth: '110px' }} />
        <button className="btn btn-primary btn-sm" onClick={onClick} disabled={state.loading}>{state.loading ? '…' : btn}</button>
      </div>
      {state.message && <p className="text-xs mt-2" style={{ color: 'var(--cm-success)' }}>{state.message}</p>}
      {state.error && <p className="text-xs mt-2" style={{ color: 'var(--cm-danger)' }}>{state.error}</p>}
    </div>
  );
}

export default App;
