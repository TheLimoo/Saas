'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Cpu, 
  Zap, 
  Globe, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  HelpCircle, 
  ChevronDown, 
  MessageSquare, 
  Sun, 
  Moon, 
  Terminal, 
  ArrowRight, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink,
  Lock,
  RefreshCw,
  Sliders,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface ConfigItem {
  id: string;
  name: string;
  protocol: string;
  content: string;
  isSubscription: boolean;
  subscriptionUrl: string;
  country: string;
  category: string;
  tags: string[];
}

export default function HomePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // App views
  const [isFetched, setIsFetched] = useState(false);
  
  // Data from backend
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({
    title: 'Free Elite VPN Config Gateway',
    logo: 'VeloX VPN',
    footerText: '© 2026 VPN Config Distribution Panel. Inspired by X-UI. Completely Free & Open Source.'
  });
  
  // Interaction states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [qrConfig, setQrConfig] = useState<ConfigItem | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPopupAnnouncement, setShowPopupAnnouncement] = useState<any | null>(null);

  // Client app instructions tabs
  const [activeClientTab, setActiveClientTab] = useState<string>('v2rayng');

  // Load theme and default info
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTimeout(() => setTheme(savedTheme), 0);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle Search Configs
  const handleGetConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a valid username to retrieve configs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/app/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to retrieve configurations.');
      }

      setConfigs(resData.configs || []);
      setAnnouncements(resData.announcements || []);
      setAds(resData.ads || []);
      if (resData.settings) {
        setSiteSettings(resData.settings);
      }

      setIsFetched(true);

      // Check if there is a popup announcement to show
      const popupAnn = resData.announcements?.find((a: any) => a.type === 'popup');
      if (popupAnn) {
        setShowPopupAnnouncement(popupAnn);
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Log interaction counters
  const logInteraction = async (type: 'downloads' | 'copies' | 'qrScans') => {
    try {
      await fetch('/app/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
    } catch (e) {
      // Fail silently
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    logInteraction('copies');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadConfig = (config: ConfigItem) => {
    const blob = new Blob([config.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.name}.conf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    logInteraction('downloads');
  };

  // Unique categories of protocols
  const protocols = ['ALL', ...Array.from(new Set(configs.map(c => c.protocol)))];
  const filteredConfigs = activeTab === 'ALL' 
    ? configs 
    : configs.filter(c => c.protocol === activeTab);

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none blur-[120px]" />
      
      {/* Header / Navbar */}
      <nav className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${theme === 'dark' ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="h-5 w-5 text-slate-950 font-black" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
                {siteSettings.logo}
              </span>
              <span className={`text-[10px] block font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                FREE CONFIG DISTRIBUTION GATEWAY
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isFetched && (
              <button 
                onClick={() => {
                  setIsFetched(false);
                  setUsername('');
                }}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  theme === 'dark' 
                    ? 'border-slate-800 hover:bg-slate-950 text-slate-300 hover:text-white' 
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Switch Username
              </button>
            )}

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl transition-all border ${theme === 'dark' ? 'border-slate-800 hover:bg-slate-900 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-amber-600'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Banner Announcements */}
        {announcements.filter(a => a.type === 'banner').map((banner) => (
          <div key={banner.id} className="mb-6 p-4 rounded-xl border flex items-start gap-3 bg-amber-500/10 border-amber-500/20 text-amber-200">
            <Wifi className="h-5 w-5 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
            <div>
              <h4 className="font-semibold text-sm text-amber-300">{banner.title}</h4>
              <p className="text-xs text-amber-100/90 mt-1">{banner.content}</p>
            </div>
          </div>
        ))}

        {/* View Switcher Container */}
        <AnimatePresence mode="wait">
          {!isFetched ? (
            // Home / Entrance View
            <motion.div
              key="entrance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6"
            >
              
              {/* Hero Presentation */}
              <div className="lg:col-span-7 flex flex-col justify-center text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 font-mono text-xs mb-6 max-w-max">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  No Subscription Limits • Free Distribution
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
                  Instantly Retrieve <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
                    Premium VPN Profiles
                  </span>
                </h1>

                <p className={`mt-4 text-base leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Skip the configuration head-scratchers. Our service manages manual high-performance, vetted configuration nodes (VLESS, VMess, Hysteria2, Shadowsocks, WireGuard) assigned directly to your username. Completely free, secure, and private.
                </p>

                {/* Bullet advantages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  {[
                    { label: 'Privacy Perfected', desc: 'No accounts, passwords, or emails stored.' },
                    { label: 'Auto-Assignments', desc: 'Custom optimized profiles mapped to your username.' },
                    { label: 'Full Client Support', desc: 'Nekobox, v2rayNG, Shadowrocket, Sing-box.' },
                    { label: 'High Performance Nodes', desc: 'BBR backbone congestion control nodes.' }
                  ].map((adv, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="mt-1 h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{adv.label}</h4>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{adv.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Login/Get Config Card */}
              <div className="lg:col-span-5">
                <div className={`p-6 sm:p-8 rounded-2xl border relative overflow-hidden transition-all shadow-xl ${
                  theme === 'dark' 
                    ? 'bg-slate-900/50 border-slate-800 shadow-slate-950/40' 
                    : 'bg-white border-slate-200 shadow-slate-200/50'
                }`}>
                  <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/5 blur-2xl rounded-full" />
                  
                  <div className="flex items-center gap-2 mb-6">
                    <Terminal className="h-5 w-5 text-amber-400" />
                    <span className="font-mono text-xs uppercase tracking-wider text-amber-500/90 font-semibold">DISTRIBUTION ACCESS</span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight mb-2">Connect to Gateway</h3>
                  <p className={`text-xs mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Enter an arbitrary username. If it already exists, we will fetch your personalized configs. If it is new, it will be automatically provisioned for free.
                  </p>

                  <form onSubmit={handleGetConfigs} className="space-y-4">
                    <div>
                      <label className={`block text-xs font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Enter Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. shadow_runner"
                        required
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all ${
                          theme === 'dark'
                            ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-600'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Verifying Account...
                        </>
                      ) : (
                        <>
                          Get Configs
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Mini Global Stats widget */}
                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Active nodes', value: '18+' },
                    { label: 'Global servers', value: '8 Countries' },
                    { label: 'Limit', value: 'Free / Uncapped' }
                  ].map((mstat, index) => (
                    <div key={index} className={`p-3 rounded-xl border text-center transition-all ${
                      theme === 'dark' ? 'bg-slate-900/30 border-slate-900' : 'bg-white border-slate-100'
                    }`}>
                      <span className="block text-xs font-mono font-bold text-amber-400">{mstat.value}</span>
                      <span className={`text-[9px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{mstat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            // Configs Panel View
            <motion.div
              key="configs-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 py-4"
            >
              
              {/* Back & Profile Details bar */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <CheckCircle2 className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">Configs for: <span className="text-amber-400">@{username}</span></h3>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold">Active Profile</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Assigned configurations have been cached & processed dynamically.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-semibold flex items-center gap-1.5"
                  >
                    <BookOpen className="h-4 w-4" />
                    Subscription Gateway
                  </button>
                  <button
                    onClick={() => {
                      setIsFetched(false);
                      setUsername('');
                      setConfigs([]);
                    }}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      theme === 'dark' 
                        ? 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white' 
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Protocol Filters */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-4">
                {protocols.map((proto) => (
                  <button
                    key={proto}
                    onClick={() => setActiveTab(proto)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === proto
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                        : theme === 'dark'
                          ? 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-900'
                          : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200'
                    }`}
                  >
                    {proto}
                  </button>
                ))}
              </div>

              {/* Configs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredConfigs.length === 0 ? (
                  <div className={`col-span-full py-12 rounded-2xl border text-center ${
                    theme === 'dark' ? 'bg-slate-900/10 border-slate-900' : 'bg-white border-slate-200'
                  }`}>
                    <Sliders className="h-10 w-10 text-slate-600 mx-auto mb-3 animate-bounce" />
                    <h4 className="font-bold text-sm">No configurations found</h4>
                    <p className="text-xs text-slate-500 mt-1">There are no enabled nodes for this protocol assigned to your username.</p>
                  </div>
                ) : (
                  filteredConfigs.map((cfg) => (
                    <div
                      key={cfg.id}
                      className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                        theme === 'dark' 
                          ? 'bg-slate-900/30 border-slate-900/80 hover:border-amber-500/30 hover:bg-slate-900/50' 
                          : 'bg-white border-slate-200 hover:border-amber-500/40 shadow-sm'
                      }`}
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-500 to-yellow-500" />
                      
                      {/* Config Header */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3 pl-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                            {cfg.protocol}
                          </span>
                          <span className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                            🌐 {cfg.category || 'Standard Access'}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm mb-2 pl-2 tracking-tight truncate">{cfg.name}</h4>
                        
                        {/* Tags */}
                        {cfg.tags && cfg.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4 pl-2">
                            {cfg.tags.map((tag, i) => (
                              <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Preview string box */}
                        {cfg.content && (
                          <div className={`p-2.5 rounded-lg text-xs font-mono mb-4 pl-2.5 truncate flex items-center justify-between group ${
                            theme === 'dark' ? 'bg-slate-950/80 text-slate-400' : 'bg-slate-50 text-slate-600 border border-slate-100'
                          }`}>
                            <span className="truncate pr-4">{cfg.content}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 pt-3 border-t border-slate-800/20 pl-2">
                        {cfg.content ? (
                          <>
                            <button
                              onClick={() => handleCopyText(cfg.content, cfg.id)}
                              className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1"
                            >
                              {copiedId === cfg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedId === cfg.id ? 'Copied' : 'Copy Config'}
                            </button>
                            
                            <button
                              onClick={() => {
                                setQrConfig(cfg);
                                logInteraction('qrScans');
                              }}
                              className={`p-2 rounded-xl border transition-all ${
                                theme === 'dark' 
                                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                                  : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                              }`}
                              title="Show QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDownloadConfig(cfg)}
                              className={`p-2 rounded-xl border transition-all ${
                                theme === 'dark' 
                                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                                  : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                              }`}
                              title="Download File"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </>
                        ) : cfg.isSubscription ? (
                          <div className="w-full flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCopyText(cfg.subscriptionUrl, cfg.id)}
                                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1"
                              >
                                {copiedId === cfg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                Copy Link
                              </button>
                              <a
                                href={cfg.subscriptionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                                  theme === 'dark' 
                                    ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                                    : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                                }`}
                                title="Open Sub"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono text-center truncate">{cfg.subscriptionUrl}</p>
                          </div>
                        ) : null}
                      </div>

                    </div>
                  ))
                )}
              </div>

              {/* Client integration guide */}
              <div className={`p-5 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-slate-900/20 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                  <BookOpen className="h-4 w-4 text-amber-400" />
                  Client Import Guide
                </h3>

                <div className="flex gap-2 border-b border-slate-800 pb-2 mb-4">
                  {[
                    { id: 'v2rayng', name: 'v2rayNG (Android)' },
                    { id: 'nekobox', name: 'Nekobox (PC/Android)' },
                    { id: 'shadowrocket', name: 'Shadowrocket (iOS)' },
                    { id: 'singbox', name: 'Sing-box (Universal)' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveClientTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeClientTab === tab.id
                          ? 'bg-slate-800 text-amber-400 font-bold border border-slate-700/50'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 text-xs leading-relaxed text-slate-400">
                  {activeClientTab === 'v2rayng' && (
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      <li>Copy any config string above using the <strong>Copy Config</strong> button.</li>
                      <li>Open the <strong>v2rayNG</strong> application on your Android device.</li>
                      <li>Tap the <strong>+</strong> icon in the top right menu.</li>
                      <li>Select <strong>Import config from clipboard</strong>.</li>
                      <li>Tap the imported configuration node, and hit the floating connect button.</li>
                    </ul>
                  )}
                  {activeClientTab === 'nekobox' && (
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      <li>Copy the VLESS or VMess link above.</li>
                      <li>Open <strong>Nekobox</strong> and tap the <strong>Server</strong> menu.</li>
                      <li>Choose <strong>Add from Clipboard</strong>.</li>
                      <li>Press <strong>Ctrl + Enter</strong> to test ping, and choose connect.</li>
                    </ul>
                  )}
                  {activeClientTab === 'shadowrocket' && (
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      <li>Click the <strong>Show QR Code</strong> icon on your selected node above.</li>
                      <li>Open <strong>Shadowrocket</strong> on your iPhone or iPad.</li>
                      <li>Tap the <strong>Scan</strong> icon in the top left corner of the dashboard.</li>
                      <li>Aim your camera at the QR code shown on screen. It will add instantly!</li>
                    </ul>
                  )}
                  {activeClientTab === 'singbox' && (
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      <li>Open the <strong>Subscription Gateway</strong> overlay.</li>
                      <li>Copy the custom <strong>Sing-box JSON</strong> client URL.</li>
                      <li>In Sing-box app, add a new Profile, set type as <strong>Remote</strong>, and paste the URL.</li>
                      <li>Press update, save, and toggle the master VPN switch.</li>
                    </ul>
                  )}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Ad Placement: Homepage Below Entry / Configs */}
        {siteSettings.adsEnabled && ads.find(a => a.placement === 'homepage') && (
          <div className="my-8" dangerouslySetInnerHTML={{ __html: ads.find(a => a.placement === 'homepage').code }} />
        )}

        {/* Feature Highlights Bento Grid (Always visible except when viewing configs to keep layout tidy) */}
        {!isFetched && (
          <section className="py-12 border-t border-slate-800/40">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-8">
              Why Choose Our Config Distribution Panel?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Shield className="h-6 w-6 text-amber-400" />,
                  title: 'Zero Storage, Zero Registration',
                  desc: 'We store zero passwords, usernames are transient handles purely to separate configuration assignments. Maximum privacy.'
                },
                {
                  icon: <Zap className="h-6 w-6 text-amber-400" />,
                  title: 'Ultra-Fast Direct Routing',
                  desc: 'Hand-configured premium node structures featuring BBR networking to throttle congestion and lower global latency.'
                },
                {
                  icon: <Globe className="h-6 w-6 text-amber-400" />,
                  title: 'Multi-Protocol Ready',
                  desc: 'Easily import WireGuard, Trojan, VMess, and next-gen reality-based VLESS configurations in one single interface.'
                }
              ].map((feat, i) => (
                <div key={i} className={`p-6 rounded-2xl border transition-all ${
                  theme === 'dark' ? 'bg-slate-900/20 border-slate-900 hover:border-slate-800' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="mb-4 h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <h4 className="font-bold text-base mb-2">{feat.title}</h4>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Supported Protocols Matrix */}
        <section className="py-8 border-t border-slate-800/40 text-center">
          <span className={`text-[10px] uppercase font-mono tracking-widest font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>SUPPORTED VPN TUNNEL PROTOCOLS</span>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {['VLESS Reality', 'VMess WS/gRPC', 'Trojan gRPC', 'WireGuard', 'Hysteria2 UDP', 'TUIC v5', 'OpenVPN TCP/UDP', 'Shadowsocks'].map((proto, index) => (
              <span key={index} className={`px-3 py-1.5 rounded-full text-xs font-medium border font-mono ${
                theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                {proto}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="py-12 border-t border-slate-800/40 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold tracking-tight text-center mb-6">Frequently Asked Questions</h3>
          
          <div className="space-y-3">
            {[
              {
                q: 'How does the free username assignment work?',
                a: 'This gateway doesn\'t ask for signups, passwords or credit cards. When you enter a username, the gateway allocates active configurations (including shared default servers) and binds them to that identifier. You receive exactly what the administrator designates for you.'
              },
              {
                q: 'Is this a VPN service itself?',
                a: 'No. This panel is a Configuration Distribution Portal. It behaves like a gateway directory where administrators can upload configuration configs or server profiles, and clients grab them instantly to load in standard clients (like Nekobox, v2rayNG or Clash).'
              },
              {
                q: 'Are these VPN configs free to use?',
                a: 'Yes, completely! The administrator distributes these nodes as free public nodes or premium giveaways. There are absolutely no hidden charges, billing systems, or account timeouts.'
              },
              {
                q: 'How do I download subscription files?',
                a: 'Click the "Subscription Gateway" button on your active configs page. It provides individual, structured subscription links for Clash, Sing-box, or general v2ray/Nekobox. You can copy these straight into your respective app!'
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className={`rounded-xl border transition-all overflow-hidden ${
                  theme === 'dark' ? 'border-slate-950 bg-slate-900/10 hover:bg-slate-900/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left font-semibold text-sm transition-all"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${activeFaq === index ? 'rotate-180 text-amber-400' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFaq === index && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className={`p-4 pt-0 text-xs leading-relaxed border-t ${theme === 'dark' ? 'border-slate-900/60 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-sm w-full p-6 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-950'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm truncate pr-4">QR Configuration Code</h3>
                <button 
                  onClick={() => setQrConfig(null)}
                  className="p-1 rounded-lg hover:bg-slate-800/20 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Scan this QR code inside your VPN Client (Shadowrocket, v2rayNG, Nekobox) to import <strong>{qrConfig.name}</strong> instantly.
              </p>

              {/* QR Code image block */}
              <div className="p-4 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-inner mb-4">
                {/* Relying on public QR API for ultra reliable client side rendering without heavy node-gyp canvas bindings */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrConfig.content)}`}
                  alt="VPN Node QR Code"
                  className="h-48 w-48 object-contain"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyText(qrConfig.content, 'qr-copy')}
                  className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </button>
                <button
                  onClick={() => setQrConfig(null)}
                  className={`py-2 px-4 rounded-lg border text-xs font-semibold ${
                    theme === 'dark' ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Links Gateway Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-950'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">Subscription Gateway Links</h3>
                <button 
                  onClick={() => setShowSubscriptionModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800/20 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Paste these URLs directly into your VPN clients to auto-sync your assigned node configurations.
              </p>

              {/* URL mapping list */}
              <div className="space-y-3.5 mb-6 max-h-[250px] overflow-y-auto pr-1">
                {[
                  {
                    name: 'Universal Base64 (v2rayNG / Nekobox)',
                    url: `${window.location.origin}/api/subscription?username=${username}`
                  },
                  {
                    name: 'Clash Profile (YAML)',
                    url: `${window.location.origin}/api/subscription?username=${username}&client=clash`
                  },
                  {
                    name: 'Sing-box Config (JSON)',
                    url: `${window.location.origin}/api/subscription?username=${username}&client=singbox`
                  }
                ].map((sub, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-500">{sub.name}</span>
                    <div className={`p-2 rounded-lg text-xs font-mono flex items-center justify-between gap-2 truncate ${
                      theme === 'dark' ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700 border'
                    }`}>
                      <span className="truncate flex-1">{sub.url}</span>
                      <button
                        onClick={() => handleCopyText(sub.url, `sub-${idx}`)}
                        className={`p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all shrink-0`}
                        title="Copy subscription URL"
                      >
                        {copiedId === `sub-${idx}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all"
              >
                Close Subscription Gateway
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Announcement Popup Modal (Displays on login when pinned/type popup) */}
      <AnimatePresence>
        {showPopupAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full p-6 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-amber-400" />
                <span className="font-mono text-xs uppercase text-amber-500/80 font-bold">Important Notice</span>
              </div>

              <h3 className="text-lg font-bold tracking-tight mb-2">{showPopupAnnouncement.title}</h3>
              <p className={`text-xs leading-relaxed mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {showPopupAnnouncement.content}
              </p>

              <button
                onClick={() => setShowPopupAnnouncement(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs transition-all"
              >
                {"Got It, Let's Go"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Area */}
      <footer className={`mt-24 py-8 border-t transition-colors ${theme === 'dark' ? 'border-slate-900 bg-slate-950/40 text-slate-500' : 'border-slate-200 bg-white text-slate-500'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-center md:text-left">{siteSettings.footerText}</p>
          
          <div className="flex items-center gap-4 font-semibold">
            <a 
              href="/admin" 
              className="inline-flex items-center gap-1.5 text-amber-500 hover:text-amber-400 hover:underline transition-all"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin Portal
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
