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
import { CreditForm, TradingForm } from './components/EncryptForm';
import { EncryptAnimation } from './components/EncryptAnimation';
import { CreditScoreResult, TradingSignalResult } from './components/SealedResult';
import {
  IconShield, IconShieldCheck, IconLock, IconUnlock, IconLink, IconCpu,
  IconBarChart, IconTrendingUp, IconWallet, IconSearch, IconSend,
  IconAlertCircle, IconRefresh, IconEye, IconZap,
} from './components/Icons';

type Page = 'home' | 'vault' | 'payroll' | 'lending' | 'credit' | 'trading' | 'research';

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

  return (
    <>
      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="navbar" id="navbar">
        <div className="navbar-inner">
          <a className="navbar-logo" onClick={() => setPage('home')} style={{ cursor: 'pointer' }}>
            <div className="navbar-logo-icon">C</div>
            <span className="navbar-logo-text">CipherMind</span>
          </a>

          <ul className="navbar-nav">
            {[
              { id: 'home', label: 'Home' },
              { id: 'vault', label: 'Payments' },
              { id: 'payroll', label: 'Payroll' },
              { id: 'lending', label: 'Lending' },
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
