'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Cpu,
  Zap,
  Globe,
  Users,
  Sliders,
  Bell,
  Terminal,
  Database,
  Lock,
  Search,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Settings,
  Eye,
  LogOut,
  TrendingUp,
  RefreshCw,
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code,
  Download,
  Check,
  UserCheck,
  UserX,
  Copy,
  LayoutGrid,
  MapPin,
  Laptop
} from 'lucide-react';
import Link from 'next/link';

function generateRandHex() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'configs' | 'announcements' | 'ads' | 'logs' | 'settings'>('stats');

  // Backend Data State
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbConfigs, setDbConfigs] = useState<any[]>([]);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [dbAnnouncements, setDbAnnouncements] = useState<any[]>([]);
  const [dbAds, setDbAds] = useState<any[]>([]);
  const [dbSettings, setDbSettings] = useState<any>({});
  const [dbCounters, setDbCounters] = useState<any>({ downloads: 0, copies: 0, qrScans: 0 });
  const [dbAssignments, setDbAssignments] = useState<any[]>([]);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Editors state
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showAnnModal, setShowAnnModal] = useState<boolean>(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState<boolean>(false);

  // Selected records for editing
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedAnn, setSelectedAnn] = useState<any | null>(null);
  const [selectedAssignmentUser, setSelectedAssignmentUser] = useState<string | null>(null);

  // Forms state
  const [configForm, setConfigForm] = useState({
    name: '',
    protocol: 'VLESS' as any,
    content: '',
    isSubscription: false,
    subscriptionUrl: '',
    isEveryone: true,
    country: 'DE',
    category: 'Reality High-Speed',
    tagsString: '',
    status: 'enabled' as any,
    weight: 10
  });

  const [bulkConfigsText, setBulkConfigsText] = useState('');

  const [annForm, setAnnForm] = useState({
    title: '',
    content: '',
    type: 'popup' as any,
    status: 'enabled' as any,
    pinned: false,
    scheduledAt: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    title: '',
    logo: '',
    footerText: '',
    maintenanceMode: false,
    adsEnabled: true,
    analyticsEnabled: true,
    seoTitle: '',
    seoDescription: '',
    adminCode: ''
  });

  const populateState = (data: any) => {
    setDbUsers(data.users || []);
    setDbConfigs(data.configs || []);
    setDbLogs(data.logs || []);
    setDbAnnouncements(data.announcements || []);
    setDbAds(data.ads || []);
    setDbSettings(data.settings || {});
    setDbCounters(data.counters || { downloads: 0, copies: 0, qrScans: 0 });
    setDbAssignments(data.assignments || []);

    // Set settings form values
    if (data.settings) {
      setSettingsForm({
        title: data.settings.title || '',
        logo: data.settings.logo || '',
        footerText: data.settings.footerText || '',
        maintenanceMode: !!data.settings.maintenanceMode,
        adsEnabled: !!data.settings.adsEnabled,
        analyticsEnabled: !!data.settings.analyticsEnabled,
        seoTitle: data.settings.seoTitle || '',
        seoDescription: data.settings.seoDescription || '',
        adminCode: data.settings.adminCode || ''
      });
    }
  };

  const verifyPasscode = async (codeToVerify: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/app/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': codeToVerify
        },
        body: JSON.stringify({ action: 'getDashboardData' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      // Successfully verified
      sessionStorage.setItem('admin_passcode', codeToVerify);
      setPasscode(codeToVerify);
      populateState(data);
      setAuthorized(true);
    } catch (err: any) {
      setError(err.message || 'Incorrect administrative access code.');
      sessionStorage.removeItem('admin_passcode');
    } finally {
      setLoading(false);
    }
  };

  // Attempt login with stored code if exists
  useEffect(() => {
    const savedCode = sessionStorage.getItem('admin_passcode');
    if (savedCode) {
      setTimeout(() => verifyPasscode(savedCode), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please provide the passcode.');
      return;
    }
    verifyPasscode(passcode.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_passcode');
    setAuthorized(false);
    setPasscode('');
  };

  // Refreshes data from backend
  const refreshDashboardData = async () => {
    if (!passcode) return;
    try {
      const response = await fetch('/app/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcode
        },
        body: JSON.stringify({ action: 'getDashboardData' })
      });
      const data = await response.json();
      if (response.ok) {
        populateState(data);
      }
    } catch (e) {
      console.error('Refresh stats failed:', e);
    }
  };

  // Generic admin executor helper
  const execAdminAction = async (action: string, actionData: any = {}) => {
    try {
      const response = await fetch('/app/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcode
        },
        body: JSON.stringify({ action, data: actionData })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Operation failed');
      }

      // Refresh state to match backend
      await refreshDashboardData();
      return { success: true, ...resJson };
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  // --- CONFIG CRUD ---
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const configData = {
      ...configForm,
      tags: configForm.tagsString.split(',').map(t => t.trim()).filter(t => t !== '')
    };

    if (selectedConfig) {
      // Update config
      await execAdminAction('updateConfig', {
        id: selectedConfig.id,
        updates: configData
      });
    } else {
      // Create config
      await execAdminAction('createConfig', configData);
    }

    setShowConfigModal(false);
    setSelectedConfig(null);
  };

  const handleBulkConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkConfigsText.trim()) return;

    const lines = bulkConfigsText.split('\n').map(l => l.trim()).filter(l => l !== '');
    let successCount = 0;

    for (const line of lines) {
      let protocol: any = 'VLESS';
      if (line.startsWith('vmess://')) protocol = 'VMess';
      else if (line.startsWith('trojan://')) protocol = 'Trojan';
      else if (line.startsWith('ss://')) protocol = 'Shadowsocks';
      else if (line.startsWith('hysteria2://')) protocol = 'Hysteria2';
      else if (line.startsWith('tuic://')) protocol = 'TUIC';
      else if (line.startsWith('[Interface]') || line.includes('wg-quick')) protocol = 'WireGuard';
      else if (line.startsWith('https://')) protocol = 'Clash'; // likely sub link

      // Generate random descriptive name
      const randHex = generateRandHex();
      const name = `Bulk-Imported-${protocol}-${randHex}`;

      const configData = {
        name,
        protocol,
        content: line,
        isSubscription: line.startsWith('http'),
        subscriptionUrl: line.startsWith('http') ? line : '',
        isEveryone: true,
        country: 'ALL',
        category: 'Bulk Import Node',
        tags: ['Bulk', 'Imported'],
        status: 'enabled',
        weight: 10
      };

      const res = await execAdminAction('createConfig', configData);
      if (res.success) successCount++;
    }

    alert(`Successfully bulk-imported ${successCount} configurations!`);
    setShowBulkUploadModal(false);
    setBulkConfigsText('');
  };

  const handleDeleteConfig = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this VPN configuration?')) {
      await execAdminAction('deleteConfig', { id });
    }
  };

  const handleToggleConfigStatus = async (cfg: any) => {
    const nextStatus = cfg.status === 'enabled' ? 'disabled' : 'enabled';
    await execAdminAction('updateConfig', {
      id: cfg.id,
      updates: { status: nextStatus }
    });
  };

  // --- USER CRUD ---
  const handleToggleUserStatus = async (user: any, nextStatus: any) => {
    await execAdminAction('updateUser', {
      id: user.id,
      updates: { status: nextStatus }
    });
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user record? This will also remove all their unique configurations assignments.')) {
      await execAdminAction('deleteUser', { id });
    }
  };

  // --- CONFIG ASSIGNMENTS ---
  const handleAssignConfig = async (configId: string) => {
    if (!selectedAssignmentUser) return;
    await execAdminAction('assignConfig', {
      username: selectedAssignmentUser,
      configId
    });
  };

  const handleRemoveAssignment = async (configId: string) => {
    if (!selectedAssignmentUser) return;
    await execAdminAction('removeAssignment', {
      username: selectedAssignmentUser,
      configId
    });
  };

  // --- ANNOUNCEMENT CRUD ---
  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnn) {
      await execAdminAction('updateAnnouncement', {
        id: selectedAnn.id,
        updates: annForm
      });
    } else {
      await execAdminAction('createAnnouncement', annForm);
    }
    setShowAnnModal(false);
    setSelectedAnn(null);
  };

  const handleDeleteAnn = async (id: string) => {
    if (confirm('Delete this announcement?')) {
      await execAdminAction('deleteAnnouncement', { id });
    }
  };

  const handleToggleAnnStatus = async (ann: any) => {
    const nextStatus = ann.status === 'enabled' ? 'disabled' : 'enabled';
    await execAdminAction('updateAnnouncement', {
      id: ann.id,
      updates: { status: nextStatus }
    });
  };

  // --- ADS CRUD ---
  const handleUpdateAdCode = async (id: string, code: string, enabled: boolean) => {
    await execAdminAction('updateAd', {
      id,
      updates: { code, enabled }
    });
  };

  // --- SETTINGS CRUD ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await execAdminAction('updateSettings', settingsForm);
    if (res.success) {
      alert('Global configuration settings updated successfully!');
      // If passcode was changed, session is updated
      if (settingsForm.adminCode !== passcode) {
        sessionStorage.setItem('admin_passcode', settingsForm.adminCode);
        setPasscode(settingsForm.adminCode);
      }
    }
  };

  // --- EXPORTERS ---
  const exportUsersToCSV = () => {
    const headers = ['ID', 'Username', 'IP', 'Country', 'Browser', 'OS', 'Device', 'Request Count', 'First Seen', 'Last Seen', 'Status'];
    const rows = dbUsers.map(u => [
      u.id,
      u.username,
      u.ip,
      u.country,
      u.browser,
      u.os,
      u.device,
      u.requestCount,
      u.firstSeen,
      u.lastSeen,
      u.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vpn_users_registry.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open modal config preparation helpers
  const openCreateConfigModal = () => {
    setSelectedConfig(null);
    setConfigForm({
      name: '',
      protocol: 'VLESS',
      content: '',
      isSubscription: false,
      subscriptionUrl: '',
      isEveryone: true,
      country: 'DE',
      category: 'Reality High-Speed',
      tagsString: 'Reality, BBR',
      status: 'enabled',
      weight: 10
    });
    setShowConfigModal(true);
  };

  const openEditConfigModal = (cfg: any) => {
    setSelectedConfig(cfg);
    setConfigForm({
      name: cfg.name,
      protocol: cfg.protocol,
      content: cfg.content,
      isSubscription: !!cfg.isSubscription,
      subscriptionUrl: cfg.subscriptionUrl || '',
      isEveryone: !!cfg.isEveryone,
      country: cfg.country || 'DE',
      category: cfg.category || 'Reality High-Speed',
      tagsString: cfg.tags ? cfg.tags.join(', ') : '',
      status: cfg.status,
      weight: cfg.weight || 10
    });
    setShowConfigModal(true);
  };

  const openCreateAnnModal = () => {
    setSelectedAnn(null);
    setAnnForm({
      title: '',
      content: '',
      type: 'popup',
      status: 'enabled',
      pinned: true,
      scheduledAt: new Date().toISOString()
    });
    setShowAnnModal(true);
  };

  const openEditAnnModal = (ann: any) => {
    setSelectedAnn(ann);
    setAnnForm({
      title: ann.title,
      content: ann.content,
      type: ann.type,
      status: ann.status,
      pinned: !!ann.pinned,
      scheduledAt: ann.scheduledAt || ''
    });
    setShowAnnModal(true);
  };

  // Search logic
  const filteredUsers = dbUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.ip.includes(searchQuery) ||
    u.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConfigs = dbConfigs.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = dbLogs.filter(l => 
    l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.ip.includes(searchQuery) ||
    l.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.os.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!authorized) {
    // Unlocking panel auth layout gate
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent pointer-events-none blur-3xl" />
        
        <div className="max-w-md w-full p-8 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-xl relative shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
              <Shield className="h-6 w-6 text-slate-950 font-bold" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Administrative Lock</h2>
            <p className="text-xs text-slate-500 mt-2">VPN Config Gateway Admin Terminal. Please enter the master access passcode to authorize.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-widest">Master Passcode</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-600">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Defaults to admin"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 rounded-xl text-sm font-medium focus:outline-none text-white placeholder-slate-700 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Authorize Dashboard
                  <Play className="h-3.5 w-3.5 fill-current" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">← Back to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* Admin Nav header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shadow-md">
              <Terminal className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight text-sm flex items-center gap-1.5">
                Admin Console
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono">X-UI Engine</span>
              </h2>
              <span className="text-[10px] block text-slate-500">Live Gateway Management Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshDashboardData}
              className="p-1.5 rounded-lg hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-white transition-all"
              title="Sync Statistics"
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Nav */}
        <nav className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto pb-4 lg:pb-0 scrollbar-none">
          {[
            { id: 'stats', label: 'Dashboard Stats', icon: <TrendingUp className="h-4 w-4" /> },
            { id: 'users', label: `Users (${dbUsers.length})`, icon: <Users className="h-4 w-4" /> },
            { id: 'configs', label: `VPN Configs (${dbConfigs.length})`, icon: <Sliders className="h-4 w-4" /> },
            { id: 'announcements', label: 'Announcements', icon: <Bell className="h-4 w-4" /> },
            { id: 'ads', label: 'A-ADS Integrations', icon: <Code className="h-4 w-4" /> },
            { id: 'logs', label: 'Access Logs', icon: <FileText className="h-4 w-4" /> },
            { id: 'settings', label: 'Portal Settings', icon: <Settings className="h-4 w-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSearchQuery('');
              }}
              className={`px-4 py-3 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2.5 shrink-0 w-full ${
                activeTab === item.id
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="mt-auto hidden lg:block p-4 border border-slate-900 bg-slate-950/40 rounded-2xl text-[11px] leading-relaxed text-slate-500 font-mono">
            🛡️ <span className="text-slate-400">Memory Fallback active.</span> No SQLite connection failures will crash configuration lookups.
          </div>
        </nav>

        {/* Content Section */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* Global search overlay (except on stats and settings) */}
          {activeTab !== 'stats' && activeTab !== 'settings' && activeTab !== 'ads' && (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder={`Global Search logs, records, or categories in ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-slate-900/40 border border-slate-900 rounded-xl text-xs font-semibold focus:border-amber-500 focus:outline-none transition-all placeholder-slate-600"
              />
            </div>
          )}

          {/* TAB 1: SYSTEM OVERVIEW STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              
              {/* Highlight metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Usernames', value: dbUsers.length, color: 'text-amber-400' },
                  { label: 'Downloads Triggered', value: dbCounters.downloads, color: 'text-emerald-400' },
                  { label: 'Config Copies', value: dbCounters.copies, color: 'text-sky-400' },
                  { label: 'QR Scans Logged', value: dbCounters.qrScans, color: 'text-fuchsia-400' }
                ].map((card, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-slate-900 bg-slate-900/20">
                    <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                    <span className={`block text-2xl font-black mt-2 font-mono ${card.color}`}>{card.value}</span>
                  </div>
                ))}
              </div>

              {/* Graphical simulation metrics */}
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Traffic timeline activity (Requests count)
                </h3>
                
                {/* Simulated dynamic graph bars */}
                <div className="h-44 flex items-end justify-between gap-2.5 pt-6 border-b border-slate-900 px-4">
                  {[
                    { label: 'Mon', count: 124 },
                    { label: 'Tue', count: 195 },
                    { label: 'Wed', count: 155 },
                    { label: 'Thu', count: 240 },
                    { label: 'Fri', count: 180 },
                    { label: 'Sat', count: 95 },
                    { label: 'Sun', count: 142 },
                    { label: 'Today', count: dbLogs.length * 15 + 40 }
                  ].map((bar, i) => {
                    const pct = Math.min(100, Math.max(15, (bar.count / 300) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[9px] font-mono font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {bar.count}
                        </span>
                        <div 
                          style={{ height: `${pct}%` }} 
                          className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 group-hover:to-yellow-300 transition-all shadow-lg shadow-amber-500/10 min-h-[15px]" 
                        />
                        <span className="text-[10px] font-semibold text-slate-500 font-mono shrink-0 mt-1">{bar.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Split demographics lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Countries List */}
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Globe className="h-4 w-4 text-sky-400" />
                    Country Demographics
                  </h4>
                  <div className="space-y-3">
                    {Array.from(new Set(dbUsers.map(u => u.country))).slice(0, 5).map((country, idx) => {
                      const count = dbUsers.filter(u => u.country === country).length;
                      const pct = Math.round((count / dbUsers.length) * 100) || 0;
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span>{country || 'Germany'}</span>
                            <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div style={{ width: `${pct}%` }} className="h-full bg-sky-500 rounded-full" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Laptop className="h-4 w-4 text-fuchsia-400" />
                    Device Breakdown
                  </h4>
                  <div className="space-y-3">
                    {['Desktop', 'Mobile', 'Tablet'].map((device, idx) => {
                      const count = dbUsers.filter(u => u.device === device).length || (idx === 0 ? 2 : idx === 1 ? 1 : 0);
                      const total = dbUsers.length || 3;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span>{device}</span>
                            <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div style={{ width: `${pct}%` }} className="h-full bg-fuchsia-500 rounded-full" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: USER MANAGER */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">User Registries ({filteredUsers.length})</h3>
                <button
                  onClick={exportUsersToCSV}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all text-amber-400"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>

              {/* Users table */}
              <div className="border border-slate-900 bg-slate-900/15 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-950/80 border-b border-slate-900 text-slate-400 font-mono">
                    <tr>
                      <th className="p-4 font-semibold">Username</th>
                      <th className="p-4 font-semibold">IP & Location</th>
                      <th className="p-4 font-semibold">Client Engine</th>
                      <th className="p-4 font-semibold">Request Count</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">No matching user registries found.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-900/10">
                          {/* Username info */}
                          <td className="p-4 font-semibold text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400">@{user.username}</span>
                            </div>
                            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">ID: {user.id}</span>
                          </td>

                          {/* IP Location */}
                          <td className="p-4">
                            <span className="font-mono block">{user.ip || '127.0.0.1'}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5 text-sky-400" />
                              {user.country || 'Unknown'}, {user.city || 'Frankfurt'}
                            </span>
                          </td>

                          {/* Client engine */}
                          <td className="p-4">
                            <span className="block">{user.os || 'Windows'}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{user.browser || 'Chrome'} • {user.device || 'Desktop'}</span>
                          </td>

                          {/* Requests count */}
                          <td className="p-4 font-mono font-bold text-center">
                            {user.requestCount} pings
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              user.status === 'active' || user.status === 'whitelisted'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {user.status}
                            </span>
                          </td>

                          {/* Action triggers */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Assignment interface trigger */}
                              <button
                                onClick={() => {
                                  setSelectedAssignmentUser(user.username);
                                  setShowAssignmentModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-amber-500 hover:bg-slate-900 transition-all"
                                title="Assign VPN Nodes"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                              </button>

                              {/* Toggle active / block */}
                              {user.status === 'blacklisted' ? (
                                <button
                                  onClick={() => handleToggleUserStatus(user, 'active')}
                                  className="p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/30 transition-all"
                                  title="Unblacklist User"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleUserStatus(user, 'blacklisted')}
                                  className="p-1.5 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 transition-all"
                                  title="Blacklist User"
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 rounded-lg hover:bg-red-950/30 text-slate-500 hover:text-red-400 transition-all"
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: CONFIGURATION MANAGER */}
          {activeTab === 'configs' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">VPN Nodes & Subscriptions ({filteredConfigs.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all text-slate-300"
                  >
                    <Code className="h-3.5 w-3.5" />
                    Bulk Paste
                  </button>
                  <button
                    onClick={openCreateConfigModal}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="h-4 w-4 font-bold" />
                    Add Config
                  </button>
                </div>
              </div>

              {/* Config table list */}
              <div className="border border-slate-900 bg-slate-900/15 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-950/80 border-b border-slate-900 text-slate-400 font-mono">
                    <tr>
                      <th className="p-4 font-semibold">Node Name</th>
                      <th className="p-4 font-semibold">Type</th>
                      <th className="p-4 font-semibold">Distribution Target</th>
                      <th className="p-4 font-semibold">Scope & Country</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {filteredConfigs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">No VPN configurations created. Add one above!</td>
                      </tr>
                    ) : (
                      filteredConfigs.map((cfg) => (
                        <tr key={cfg.id} className="hover:bg-slate-900/10">
                          
                          {/* Node name */}
                          <td className="p-4">
                            <span className="font-bold text-sm block tracking-tight">{cfg.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">ID: {cfg.id}</span>
                          </td>

                          {/* Protocol */}
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                              {cfg.protocol}
                            </span>
                          </td>

                          {/* Category / distribution */}
                          <td className="p-4">
                            <span className="block font-medium">{cfg.category || 'Standard Node'}</span>
                            {cfg.tags && cfg.tags.length > 0 && (
                              <span className="text-[9px] text-slate-500 block mt-0.5">
                                Tags: {cfg.tags.join(', ')}
                              </span>
                            )}
                          </td>

                          {/* Scope / Everyone / Country */}
                          <td className="p-4">
                            <span className="block">{cfg.isEveryone ? 'Everyone' : 'Manual Assign'}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">Geotarget: {cfg.country || 'ALL'}</span>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleConfigStatus(cfg)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                cfg.status === 'enabled'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                            >
                              {cfg.status}
                            </button>
                          </td>

                          {/* Action options */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditConfigModal(cfg)}
                                className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition-all"
                                title="Edit Config"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteConfig(cfg.id)}
                                className="p-1.5 rounded-lg hover:bg-red-950/30 text-slate-500 hover:text-red-400 transition-all"
                                title="Delete Config"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">System Announcements</h3>
                <button
                  onClick={openCreateAnnModal}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Plus className="h-4 w-4 font-bold" />
                  Add Announcement
                </button>
              </div>

              {/* Grid announcements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dbAnnouncements.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500 border border-slate-900 bg-slate-900/10 rounded-2xl">
                    No active announcements. Keep users up-to-date!
                  </div>
                ) : (
                  dbAnnouncements.map((ann) => (
                    <div key={ann.id} className="p-5 border border-slate-900 bg-slate-900/20 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ann.type === 'popup' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {ann.type}
                          </span>
                          <span className="text-[10px] text-slate-500">{ann.createdAt.split('T')[0]}</span>
                        </div>

                        <h4 className="font-bold text-sm mb-1.5 truncate">{ann.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">{ann.content}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                        <button
                          onClick={() => handleToggleAnnStatus(ann)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            ann.status === 'enabled' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {ann.status}
                        </button>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditAnnModal(ann)}
                            className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnn(ann.id)}
                            className="p-1.5 rounded-lg hover:bg-red-950/30 text-slate-500 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 5: A-ADS INTEGRATION */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              
              <div>
                <h3 className="text-base font-bold">A-ADS Placements Manager</h3>
                <p className="text-xs text-slate-500 mt-1">Paste your raw HTML/JS ad responsive scripts. These render seamlessly on the client application when ads are globally toggled.</p>
              </div>

              <div className="space-y-5">
                {dbAds.map((adObj) => (
                  <div key={adObj.id} className="p-5 border border-slate-900 bg-slate-900/15 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold capitalize text-amber-400">{adObj.placement.replace('_', ' ')} Placement</span>
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">ID: {adObj.id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-400">Enabled</label>
                        <input
                          type="checkbox"
                          defaultChecked={adObj.enabled}
                          onChange={(e) => handleUpdateAdCode(adObj.id, adObj.code, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950"
                        />
                      </div>
                    </div>

                    <textarea
                      defaultValue={adObj.code}
                      onBlur={(e) => handleUpdateAdCode(adObj.id, e.target.value, adObj.enabled)}
                      placeholder="Paste your ad scripts here..."
                      className="w-full h-24 p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs font-mono focus:border-amber-500 focus:outline-none placeholder-slate-700 leading-relaxed text-slate-300"
                    />
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 6: ACCESS LOGS AUDITING */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Operational Logs ({filteredLogs.length})</h3>
                <button
                  onClick={() => execAdminAction('clearLogs')}
                  className="px-3.5 py-2 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Logs
                </button>
              </div>

              {/* Logs table list */}
              <div className="border border-slate-900 bg-slate-900/15 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-950/80 border-b border-slate-900 text-slate-400 font-mono">
                    <tr>
                      <th className="p-4 font-semibold">Timestamp</th>
                      <th className="p-4 font-semibold">User</th>
                      <th className="p-4 font-semibold">IP Address</th>
                      <th className="p-4 font-semibold">Browser/OS/Device</th>
                      <th className="p-4 font-semibold">Nodes Requested</th>
                      <th className="p-4 font-semibold">Status & Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-mono">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">No telemetry logs logged. Config looks blank.</td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/10">
                          
                          {/* Timestamp */}
                          <td className="p-4 text-slate-400 text-[11px]">
                            {log.timestamp.split('T')[1].substring(0, 8)}
                            <span className="block text-[9px] text-slate-500 mt-0.5">{log.timestamp.split('T')[0]}</span>
                          </td>

                          {/* Username */}
                          <td className="p-4 font-semibold font-sans text-sm">
                            <span className="text-amber-400">@{log.username}</span>
                          </td>

                          {/* IP info */}
                          <td className="p-4 text-[11px]">
                            <span className="block font-bold">{log.ip}</span>
                            <span className="text-[9px] text-slate-500 font-sans mt-0.5 block flex items-center gap-1">
                              <Globe className="h-2.5 w-2.5 text-sky-400" />
                              {log.country || 'Unknown'}
                            </span>
                          </td>

                          {/* Client details */}
                          <td className="p-4 font-sans text-[11px] text-slate-400">
                            {log.os || 'Windows'} • {log.browser || 'Chrome'}
                            <span className="block text-[9px] text-slate-500 mt-0.5">{log.device || 'Desktop'}</span>
                          </td>

                          {/* Nodes requested list */}
                          <td className="p-4 text-[10px] max-w-[200px] truncate">
                            {log.requestedConfigs && log.requestedConfigs.length > 0 ? (
                              <span className="font-semibold text-slate-300" title={log.requestedConfigs.join(', ')}>
                                {log.requestedConfigs.length} config nodes
                              </span>
                            ) : (
                              <span className="text-slate-600">None / Blocked</span>
                            )}
                          </td>

                          {/* Latency & state status */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {log.status}
                              </span>
                              <span className="text-slate-500 text-[10px]">{log.latency || 0}ms</span>
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 7: GLOBAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="p-6 border border-slate-900 bg-slate-900/15 rounded-2xl">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-500" />
                Global Portal Configurations
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-widest">Portal Title</label>
                    <input
                      type="text"
                      value={settingsForm.title}
                      onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-amber-500 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-widest">Portal Logo Brand</label>
                    <input
                      type="text"
                      value={settingsForm.logo}
                      onChange={(e) => setSettingsForm({ ...settingsForm, logo: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-amber-500 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-widest">SEO Meta Title</label>
                    <input
                      type="text"
                      value={settingsForm.seoTitle}
                      onChange={(e) => setSettingsForm({ ...settingsForm, seoTitle: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-amber-500 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-widest">Administrative Passcode</label>
                    <input
                      type="text"
                      value={settingsForm.adminCode}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adminCode: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-amber-500 rounded-xl text-xs font-semibold focus:outline-none font-mono text-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2 text-slate-400 uppercase tracking-widest">Footer Credit Lines Text</label>
                  <input
                    type="text"
                    value={settingsForm.footerText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-amber-500 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                {/* Checklist options */}
                <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-4">
                  {[
                    {
                      label: 'Maintenance Mode',
                      desc: 'Enable this option to display a system maintenance lock and block config retrieval.',
                      checked: settingsForm.maintenanceMode,
                      onChange: (val: boolean) => setSettingsForm({ ...settingsForm, maintenanceMode: val })
                    },
                    {
                      label: 'Enable Advertisements System',
                      desc: 'Global trigger. Disabling this shuts off all A-ADS placements rendering on homepage.',
                      checked: settingsForm.adsEnabled,
                      onChange: (val: boolean) => setSettingsForm({ ...settingsForm, adsEnabled: val })
                    }
                  ].map((settingItem, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-4">
                      <div>
                        <span className="block text-xs font-bold text-slate-200">{settingItem.label}</span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">{settingItem.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settingItem.checked}
                        onChange={(e) => settingItem.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950 mt-1 shrink-0"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => execAdminAction('resetState')}
                    className="px-4 py-3 border border-slate-900 hover:bg-slate-900 text-xs font-bold rounded-xl transition-all text-slate-400"
                  >
                    Reset Seed Data
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
                  >
                    Save Portal Settings
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: ADD / EDIT SINGLE CONFIGURATION */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-xl w-full p-6 border border-slate-900 bg-slate-900 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-sm text-amber-500 flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5" />
                  {selectedConfig ? 'Modify VPN Node Configuration' : 'Create High-Speed Node Configuration'}
                </h3>
                <button 
                  onClick={() => setShowConfigModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleConfigSubmit} className="space-y-4 text-xs font-semibold">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Config/Node Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="DE-Frankfurt-VLESS-Reality"
                      value={configForm.name}
                      onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">VPN Protocol Tunnel</label>
                    <select
                      value={configForm.protocol}
                      onChange={(e) => setConfigForm({ ...configForm, protocol: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 focus:outline-none"
                    >
                      {['VLESS', 'VMess', 'Trojan', 'Shadowsocks', 'Hysteria2', 'TUIC', 'WireGuard', 'OpenVPN', 'Clash', 'Sing-box', 'Xray'].map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Node Category Group</label>
                    <input
                      type="text"
                      placeholder="Reality High-Speed or Gaming Server"
                      value={configForm.category}
                      onChange={(e) => setConfigForm({ ...configForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Geo Target Location (Country Code)</label>
                    <input
                      type="text"
                      placeholder="DE, JP, US or ALL"
                      value={configForm.country}
                      onChange={(e) => setConfigForm({ ...configForm, country: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Checkbox trigger subscription link */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-slate-200">Is Subscription URL instead of raw config?</span>
                    <span className="block text-[9px] text-slate-500 mt-0.5">Toggle this if distributing Clash/Sing-box online link instead of config code.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={configForm.isSubscription}
                    onChange={(e) => setConfigForm({ ...configForm, isSubscription: e.target.checked })}
                    className="h-4 w-4 text-amber-500 rounded bg-slate-900 border-slate-800 focus:ring-amber-500"
                  />
                </div>

                {configForm.isSubscription ? (
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Subscription Link URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/api/sub?user=abc"
                      value={configForm.subscriptionUrl}
                      onChange={(e) => setConfigForm({ ...configForm, subscriptionUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 font-mono text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Raw Config String Content</label>
                    <textarea
                      required
                      placeholder="vless://7e1b528b... or WireGuard client configs content here..."
                      value={configForm.content}
                      onChange={(e) => setConfigForm({ ...configForm, content: e.target.value })}
                      className="w-full h-24 p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 font-mono text-xs leading-relaxed"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Search Tag Identifiers (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="BBR, Reality, TLS, NoLogs"
                      value={configForm.tagsString}
                      onChange={(e) => setConfigForm({ ...configForm, tagsString: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500"
                    />
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-200">Everyone gets this config?</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">If yes, all active usernames receive this profile.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={configForm.isEveryone}
                      onChange={(e) => setConfigForm({ ...configForm, isEveryone: e.target.checked })}
                      className="h-4 w-4 text-amber-500 rounded bg-slate-900 border-slate-800 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
                  >
                    Save Configuration
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: BULK UPLOAD CONFIGS */}
      <AnimatePresence>
        {showBulkUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-xl w-full p-6 border border-slate-900 bg-slate-900 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-amber-500 flex items-center gap-2">
                  <Code className="h-4.5 w-4.5" />
                  Bulk Configs Import Gateway
                </h3>
                <button 
                  onClick={() => setShowBulkUploadModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Paste raw configurations (VLESS, VMess, Trojan, Hysteria2 links or subscription links) separated by newlines. The parser will automatically generate names, map protocols, and assign them as globally visible nodes.
              </p>

              <form onSubmit={handleBulkConfigSubmit} className="space-y-4 text-xs font-semibold">
                <textarea
                  required
                  placeholder="vmess://...\nvless://...\nhysteria2://..."
                  value={bulkConfigsText}
                  onChange={(e) => setBulkConfigsText(e.target.value)}
                  className="w-full h-48 p-4 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 font-mono text-xs leading-relaxed"
                />

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setShowBulkUploadModal(false)}
                    className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
                  >
                    Launch Parser Import
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ANNOUNCEMENT POPUP MODAL */}
      <AnimatePresence>
        {showAnnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full p-6 border border-slate-900 bg-slate-900 rounded-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-amber-500 flex items-center gap-2">
                  <Bell className="h-4.5 w-4.5" />
                  {selectedAnn ? 'Modify Announcement' : 'Draft Live Announcement'}
                </h3>
                <button 
                  onClick={() => setShowAnnModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAnnSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frankfurt nodes fully optimized"
                    value={annForm.title}
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Detailed Announcement Content</label>
                  <textarea
                    required
                    placeholder="Provide description..."
                    value={annForm.content}
                    onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                    className="w-full h-24 p-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 leading-relaxed text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1.5">Notice Category Type</label>
                    <select
                      value={annForm.type}
                      onChange={(e) => setAnnForm({ ...annForm, type: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-amber-500 focus:outline-none"
                    >
                      <option value="popup">Modal Popup</option>
                      <option value="banner">Alert Banner</option>
                      <option value="news">News Post</option>
                      <option value="maintenance">Maintenance alert</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-200">Force Pin to Top?</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={annForm.pinned}
                      onChange={(e) => setAnnForm({ ...annForm, pinned: e.target.checked })}
                      className="h-4 w-4 text-amber-500 rounded bg-slate-900 border-slate-800 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setShowAnnModal(false)}
                    className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
                  >
                    Deploy Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: USER ASSIGNMENT MANAGER */}
      <AnimatePresence>
        {showAssignmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl w-full p-6 border border-slate-900 bg-slate-900 rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-amber-500 flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5" />
                  VPN Node Assignments for: <span className="text-white">@{selectedAssignmentUser}</span>
                </h3>
                <button 
                  onClick={() => setShowAssignmentModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                By default, this user receives all active configurations designated as <strong>&quot;Everyone&quot;</strong>. You can manually whitelist additional configs or toggle specific nodes specifically for their login view here.
              </p>

              {/* Assignments toggles list */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {dbConfigs.map((cfg) => {
                  const isAssigned = dbAssignments.some(
                    (a) => a.username.toLowerCase() === selectedAssignmentUser?.toLowerCase() && a.configId === cfg.id
                  );
                  return (
                    <div 
                      key={cfg.id} 
                      className={`p-3 border rounded-xl flex items-center justify-between transition-all ${
                        isAssigned 
                          ? 'bg-amber-500/5 border-amber-500/25 text-white' 
                          : 'bg-slate-950 border-slate-900 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] uppercase font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-500 shrink-0">
                          {cfg.protocol}
                        </span>
                        <div>
                          <span className="font-bold text-xs block">{cfg.name}</span>
                          <span className="text-[9px] text-slate-500 font-sans block mt-0.5">Category: {cfg.category || 'Direct Node'}</span>
                        </div>
                      </div>

                      {cfg.isEveryone ? (
                        <span className="text-[10px] font-bold text-slate-500 px-2 py-1 bg-slate-900 rounded border border-slate-800">
                          Everyone
                        </span>
                      ) : isAssigned ? (
                        <button
                          onClick={() => handleRemoveAssignment(cfg.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 text-xs font-semibold transition-all"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssignConfig(cfg.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all"
                        >
                          Assign Config
                        </button>
                      )}

                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-5 border-t border-slate-800/60 mt-5">
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Confirm Configuration Sync
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
