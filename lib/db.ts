import * as fs from 'fs';
import * as path from 'path';

// Interfaces
export interface UserRecord {
  id: string;
  username: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  isp: string;
  browser: string;
  os: string;
  device: string;
  requestCount: number;
  firstSeen: string;
  lastSeen: string;
  status: 'active' | 'disabled' | 'blacklisted' | 'whitelisted';
  notes: string;
}

export interface ConfigRecord {
  id: string;
  name: string;
  protocol: 'VLESS' | 'VMess' | 'Trojan' | 'Shadowsocks' | 'Hysteria2' | 'TUIC' | 'WireGuard' | 'OpenVPN' | 'Clash' | 'Sing-box' | 'Xray';
  content: string;
  isSubscription: boolean;
  subscriptionUrl: string;
  isEveryone: boolean;
  country: string; // e.g., "US", "DE", "JP", "ALL"
  category: string;
  tags: string[];
  status: 'enabled' | 'disabled';
  weight: number;
  createdAt: string;
}

export interface AssignmentRecord {
  id: string;
  username: string;
  configId: string;
  assignedAt: string;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  type: 'popup' | 'banner' | 'news' | 'maintenance';
  status: 'enabled' | 'disabled';
  pinned: boolean;
  scheduledAt: string;
  createdAt: string;
}

export interface LogRecord {
  id: string;
  timestamp: string;
  username: string;
  ip: string;
  requestedConfigs: string[];
  browser: string;
  os: string;
  device: string;
  country: string;
  status: 'success' | 'blocked' | 'error';
  latency: number;
}

export interface AdSetting {
  id: string;
  placement: string; // 'homepage' | 'header' | 'footer' | 'sidebar' | 'below_configs' | 'above_configs' | 'popup'
  code: string;
  enabled: boolean;
}

export interface SiteSettings {
  title: string;
  logo: string;
  favicon: string;
  themeColor: string;
  darkTheme: boolean;
  maintenanceMode: boolean;
  adsEnabled: boolean;
  analyticsEnabled: boolean;
  seoTitle: string;
  seoDescription: string;
  footerText: string;
  adminCode: string; // Access passcode for dashboard, defaults to "admin"
}

// Full State representation
export interface DbState {
  users: UserRecord[];
  configs: ConfigRecord[];
  assignments: AssignmentRecord[];
  announcements: AnnouncementRecord[];
  logs: LogRecord[];
  ads: AdSetting[];
  settings: SiteSettings;
  statsCounters: {
    downloads: number;
    copies: number;
    qrScans: number;
  };
}

const DB_FILE_PATH = path.join(process.cwd(), 'vpn_db.json');

// Memory cache of DB state
let dbState: DbState | null = null;

// Lock to avoid simultaneous writes
let isWriting = false;

// Initial Seed Data to make the panel look premium out of the box
const initialSeedState: DbState = {
  users: [
    {
      id: 'u-1',
      username: 'alice_vpn',
      ip: '192.168.1.55',
      country: 'Germany',
      region: 'Bavaria',
      city: 'Munich',
      isp: 'Deutsche Telekom',
      browser: 'Chrome',
      os: 'Windows 11',
      device: 'Desktop',
      requestCount: 42,
      firstSeen: '2026-06-15T08:30:00Z',
      lastSeen: '2026-07-02T09:12:00Z',
      status: 'active',
      notes: 'Frequent downloader, whitelisted.'
    },
    {
      id: 'u-2',
      username: 'speedy_user',
      ip: '8.8.8.8',
      country: 'United States',
      region: 'California',
      city: 'Mountain View',
      isp: 'Google LLC',
      browser: 'Safari',
      os: 'iOS',
      device: 'Mobile',
      requestCount: 15,
      firstSeen: '2026-06-20T14:22:00Z',
      lastSeen: '2026-07-01T23:45:00Z',
      status: 'active',
      notes: 'Mobile user'
    },
    {
      id: 'u-3',
      username: 'blocked_spammer',
      ip: '185.220.101.5',
      country: 'Netherlands',
      region: 'North Holland',
      city: 'Amsterdam',
      isp: 'Tor Exit Node',
      browser: 'Firefox',
      os: 'Linux',
      device: 'Desktop',
      requestCount: 125,
      firstSeen: '2026-06-28T03:10:00Z',
      lastSeen: '2026-07-02T10:05:00Z',
      status: 'blacklisted',
      notes: 'Suspected automated scraping from Tor IP.'
    }
  ],
  configs: [
    {
      id: 'c-1',
      name: 'DE-Frankfurt-VLESS-TCP',
      protocol: 'VLESS',
      content: 'vless://7e1b528b-b673-45bb-b4c4-721dbd4177eb@de-frankfurt.quantum-tunnel.com:443?encryption=none&security=reality&sni=yahoo.com&fp=chrome&pbk=E6C2D6A5D5F0E4D3E2F1F0E4D5C6B7A87E1B528B&sid=8e9d10c2&type=tcp#DE-Frankfurt-VLESS-TCP',
      isSubscription: false,
      subscriptionUrl: '',
      isEveryone: true,
      country: 'DE',
      category: 'Reality High-Speed',
      tags: ['Reality', 'BBR', 'No-Log'],
      status: 'enabled',
      weight: 10,
      createdAt: '2026-06-10T12:00:00Z'
    },
    {
      id: 'c-2',
      name: 'US-Ashburn-VMess-WS',
      protocol: 'VMess',
      content: 'vmess://eyJhZGRyIjoidXMtYXNoYnVybi5xdWFudHVtLXR1bm5lbC5jb20iLCJhaWQiOiIwIiwiYWxwbiI6IiIsImZwIjoiIiwiY2hva2UiOiIiLCJpZCI6ImI4YWNjZjc4LTBlYmYtNGU0Zi04ZmY0LTI5MTNkMmE3N2I0MCIsImppdHRlciI6IiIsIm5ldCI6IndzIiwicGF0aCI6Ii92bWVzcy13cyIsInBvcnQiOiI0NDMiLCJwc28iOiIiLCJyZWFkaW5nIjoiIiwic2VjdXJpdHkiOiJ0bHMiLCJzbmkiOiJ1cy1hc2hidXJuLnF1YW50dW0tdHVubmVsLmNvbSIsInNwaW4iOiIiLCJzdHJlYW0iOiIiLCJ0eXBlIjoiIiwidiI6IjIifQ==',
      isSubscription: false,
      subscriptionUrl: '',
      isEveryone: true,
      country: 'US',
      category: 'CDN Cloudflare',
      tags: ['WebSocket', 'CDN', 'Anti-Filter'],
      status: 'enabled',
      weight: 10,
      createdAt: '2026-06-11T12:00:00Z'
    },
    {
      id: 'c-3',
      name: 'JP-Tokyo-Hysteria2-UDP',
      protocol: 'Hysteria2',
      content: 'hysteria2://e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855@jp-tokyo.quantum-tunnel.com:8443?insecure=1&sni=bing.com#JP-Tokyo-Hysteria2-UDP',
      isSubscription: false,
      subscriptionUrl: '',
      isEveryone: true,
      country: 'JP',
      category: 'Ultra-Low Latency Gaming',
      tags: ['Hysteria2', 'UDP', 'Gaming'],
      status: 'enabled',
      weight: 20,
      createdAt: '2026-06-12T12:00:00Z'
    },
    {
      id: 'c-4',
      name: 'Premium WireGuard Node',
      protocol: 'WireGuard',
      content: '[Interface]\nPrivateKey = eK9...= \nAddress = 10.0.0.2/32, fd00::2/128\nDNS = 1.1.1.1\n\n[Peer]\nPublicKey = y6Z...=\nEndpoint = 198.51.100.1:51820\nAllowedIPs = 0.0.0.0/0, ::/0',
      isSubscription: false,
      subscriptionUrl: '',
      isEveryone: false,
      country: 'US',
      category: 'Secure Native Tunnel',
      tags: ['WireGuard', 'Native', 'Fastest'],
      status: 'enabled',
      weight: 15,
      createdAt: '2026-06-14T10:00:00Z'
    },
    {
      id: 'c-5',
      name: 'Universal Sing-box Subscription Link',
      protocol: 'Sing-box',
      content: '',
      isSubscription: true,
      subscriptionUrl: 'https://ais-pre-lyb67svkgog236azxh4rgt-341765796237.europe-west2.run.app/api/subscription/universal',
      isEveryone: true,
      country: 'ALL',
      category: 'Subscription Profiles',
      tags: ['Subscription', 'Sing-box', 'Clash'],
      status: 'enabled',
      weight: 5,
      createdAt: '2026-06-15T09:00:00Z'
    }
  ],
  assignments: [
    {
      id: 'a-1',
      username: 'alice_vpn',
      configId: 'c-4', // Assigning WireGuard to Alice
      assignedAt: '2026-06-15T08:35:00Z'
    }
  ],
  announcements: [
    {
      id: 'ann-1',
      title: 'Welcome to VPN Config Distribution Panel',
      content: 'We offer free, hand-vetted, elite-level VPN Configurations. Simply enter your desired username on the landing page, hit "Get Configs", and copy them to your client (v2rayNG, Nekobox, Shadowrocket, Sing-box). Totally free, zero subscription limits, and high bandwidth!',
      type: 'popup',
      status: 'enabled',
      pinned: true,
      scheduledAt: '2026-06-01T00:00:00Z',
      createdAt: '2026-06-01T00:00:00Z'
    },
    {
      id: 'ann-2',
      title: 'Scheduled Maintenance Completed',
      content: 'Frankfurt reality tunnels upgraded to premium tier backbone (10Gbps). Enjoy even lower pings!',
      type: 'banner',
      status: 'enabled',
      pinned: false,
      scheduledAt: '2026-06-25T00:00:00Z',
      createdAt: '2026-06-25T00:00:00Z'
    }
  ],
  logs: [
    {
      id: 'l-1',
      timestamp: '2026-07-02T10:15:00Z',
      username: 'alice_vpn',
      ip: '192.168.1.55',
      requestedConfigs: ['DE-Frankfurt-VLESS-TCP', 'JP-Tokyo-Hysteria2-UDP', 'Premium WireGuard Node'],
      browser: 'Chrome',
      os: 'Windows 11',
      device: 'Desktop',
      country: 'Germany',
      status: 'success',
      latency: 24
    },
    {
      id: 'l-2',
      timestamp: '2026-07-02T10:20:00Z',
      username: 'new_arrival_7',
      ip: '103.111.12.18',
      requestedConfigs: ['DE-Frankfurt-VLESS-TCP', 'US-Ashburn-VMess-WS', 'JP-Tokyo-Hysteria2-UDP'],
      browser: 'Chrome',
      os: 'Android',
      device: 'Mobile',
      country: 'Japan',
      status: 'success',
      latency: 48
    },
    {
      id: 'l-3',
      timestamp: '2026-07-02T10:30:00Z',
      username: 'blocked_spammer',
      ip: '185.220.101.5',
      requestedConfigs: [],
      browser: 'Firefox',
      os: 'Linux',
      device: 'Desktop',
      country: 'Netherlands',
      status: 'blocked',
      latency: 3
    }
  ],
  ads: [
    {
      id: 'ad-1',
      placement: 'homepage',
      code: '<!-- A-ADS Banner Ad -->\n<div class="w-full flex justify-center py-4 my-2 bg-neutral-900/40 border border-neutral-800 rounded-lg p-4 text-center text-xs text-neutral-400">\n  <div class="flex flex-col items-center gap-1">\n    <span class="text-[10px] font-mono tracking-widest uppercase text-amber-500/80">Sponsor / Ad</span>\n    <p class="font-medium text-neutral-200">High Speed Secure VPS - Deploy in 5 Seconds</p>\n    <p class="text-neutral-500">Get 100$ Free Credits on Vultr or DigitalOcean</p>\n  </div>\n</div>',
      enabled: true
    },
    {
      id: 'ad-2',
      placement: 'below_configs',
      code: '<!-- Below Config Ad -->\n<div class="w-full flex justify-center py-3 bg-neutral-900/30 border border-neutral-800/80 rounded p-3 text-center text-xs text-neutral-400">\n  <div class="flex items-center gap-2">\n    <span class="px-1.5 py-0.5 rounded bg-neutral-800 text-[9px] text-neutral-500">AD</span>\n    <a href="#" class="text-amber-400 hover:underline">Secure your crypto wallet using Hardware Ledger keys. 15% OFF today.</a>\n  </div>\n</div>',
      enabled: true
    },
    {
      id: 'ad-3',
      placement: 'dashboard',
      code: '<!-- Dashboard Ad -->\n<div class="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded text-center text-xs text-indigo-300">\n  💡 <strong>Pro Tip:</strong> Enable custom rate-limiting rules to shield your endpoints from rapid DDoS scans.\n</div>',
      enabled: true
    }
  ],
  settings: {
    title: 'Free Elite VPN Config Gateway',
    logo: 'VeloX VPN',
    favicon: '',
    themeColor: 'amber',
    darkTheme: true,
    maintenanceMode: false,
    adsEnabled: true,
    analyticsEnabled: true,
    seoTitle: 'Free VPN Configuration Distribution Panel | X-UI Inspired',
    seoDescription: 'Instant free high-performance configurations for WireGuard, VLESS, VMess, Trojan, Shadowsocks, Hysteria2. No registration, no payment.',
    footerText: '© 2026 VPN Config Distribution Panel. Inspired by X-UI. Completely Free & Open Source.',
    adminCode: 'admin'
  },
  statsCounters: {
    downloads: 142,
    copies: 389,
    qrScans: 85
  }
};

// Thread-safe read and write functions
function loadDb(): DbState {
  if (dbState) {
    return dbState;
  }

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      dbState = JSON.parse(data);
      // Double check state properties are fully populated
      if (!dbState?.users || !dbState?.configs) {
        throw new Error('Incomplete DB file structure');
      }
      return dbState!;
    }
  } catch (err) {
    console.warn('Error reading db file, falling back to seed state:', err);
  }

  // Create initial copy, write it to disk, and return
  dbState = JSON.parse(JSON.stringify(initialSeedState));
  saveDb(dbState!);
  return dbState!;
}

function saveDb(state: DbState) {
  if (isWriting) {
    // If already writing, wait a tiny bit to queue next write, or handle gracefully
    setTimeout(() => saveDb(state), 50);
    return;
  }

  isWriting = true;
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  } finally {
    isWriting = false;
  }
}

// Database helper functions (API)
export const db = {
  // Get all state
  getState(): DbState {
    return loadDb();
  },

  // Reset to seed data
  resetState(): DbState {
    dbState = JSON.parse(JSON.stringify(initialSeedState));
    saveDb(dbState!);
    return dbState!;
  },

  // --- USERS ---
  getUsers(): UserRecord[] {
    return loadDb().users;
  },

  getUserByUsername(username: string): UserRecord | undefined {
    const cleanUsername = username.trim().toLowerCase();
    return loadDb().users.find((u) => u.username.toLowerCase() === cleanUsername);
  },

  createUser(user: Omit<UserRecord, 'id' | 'requestCount' | 'firstSeen' | 'lastSeen' | 'status' | 'notes'>): UserRecord {
    const state = loadDb();
    const existing = state.users.find(u => u.username.toLowerCase() === user.username.trim().toLowerCase());
    if (existing) {
      return existing;
    }

    const newUser: UserRecord = {
      ...user,
      id: 'u-' + Math.random().toString(36).substr(2, 9),
      requestCount: 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      status: 'active',
      notes: ''
    };

    state.users.push(newUser);
    saveDb(state);
    return newUser;
  },

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const state = loadDb();
    const userIndex = state.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;

    const updatedUser = {
      ...state.users[userIndex],
      ...updates
    };

    state.users[userIndex] = updatedUser;
    saveDb(state);
    return updatedUser;
  },

  deleteUser(id: string): boolean {
    const state = loadDb();
    const initialLen = state.users.length;
    state.users = state.users.filter(u => u.id !== id);
    
    // Also clean up user assignments
    const user = state.users.find(u => u.id === id);
    if (user) {
      state.assignments = state.assignments.filter(a => a.username !== user.username);
    }

    const deleted = state.users.length < initialLen;
    if (deleted) {
      saveDb(state);
    }
    return deleted;
  },

  incrementUserRequest(username: string): void {
    const state = loadDb();
    const user = state.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (user) {
      user.requestCount += 1;
      user.lastSeen = new Date().toISOString();
      saveDb(state);
    }
  },

  // --- CONFIGS ---
  getConfigs(): ConfigRecord[] {
    return loadDb().configs;
  },

  getConfigById(id: string): ConfigRecord | undefined {
    return loadDb().configs.find(c => c.id === id);
  },

  createConfig(config: Omit<ConfigRecord, 'id' | 'createdAt'>): ConfigRecord {
    const state = loadDb();
    const newConfig: ConfigRecord = {
      ...config,
      id: 'c-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    state.configs.push(newConfig);
    saveDb(state);
    return newConfig;
  },

  updateConfig(id: string, updates: Partial<ConfigRecord>): ConfigRecord | undefined {
    const state = loadDb();
    const configIndex = state.configs.findIndex(c => c.id === id);
    if (configIndex === -1) return undefined;

    const updatedConfig = {
      ...state.configs[configIndex],
      ...updates
    };

    state.configs[configIndex] = updatedConfig;
    saveDb(state);
    return updatedConfig;
  },

  deleteConfig(id: string): boolean {
    const state = loadDb();
    const initialLen = state.configs.length;
    state.configs = state.configs.filter(c => c.id !== id);
    
    // Also clean up config assignments
    state.assignments = state.assignments.filter(a => a.configId !== id);

    const deleted = state.configs.length < initialLen;
    if (deleted) {
      saveDb(state);
    }
    return deleted;
  },

  // --- ASSIGNMENTS ---
  getAssignments(): AssignmentRecord[] {
    return loadDb().assignments;
  },

  assignConfigToUser(username: string, configId: string): AssignmentRecord {
    const state = loadDb();
    // Remove if already exists
    state.assignments = state.assignments.filter(
      a => !(a.username.toLowerCase() === username.toLowerCase() && a.configId === configId)
    );

    const newAssignment: AssignmentRecord = {
      id: 'a-' + Math.random().toString(36).substr(2, 9),
      username: username.trim(),
      configId,
      assignedAt: new Date().toISOString()
    };

    state.assignments.push(newAssignment);
    saveDb(state);
    return newAssignment;
  },

  removeConfigAssignment(username: string, configId: string): boolean {
    const state = loadDb();
    const initialLen = state.assignments.length;
    state.assignments = state.assignments.filter(
      a => !(a.username.toLowerCase() === username.toLowerCase() && a.configId === configId)
    );

    const deleted = state.assignments.length < initialLen;
    if (deleted) {
      saveDb(state);
    }
    return deleted;
  },

  getUserConfigs(username: string): ConfigRecord[] {
    const state = loadDb();
    const cleanUsername = username.trim().toLowerCase();
    
    // Check if the user is blacklisted
    const user = state.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (user && user.status === 'blacklisted') {
      return []; // Blacklisted users get nothing
    }

    // 1. Get configs specifically assigned to this username
    const assignedIds = state.assignments
      .filter((a) => a.username.toLowerCase() === cleanUsername)
      .map((a) => a.configId);

    // 2. Get active configurations
    const activeConfigs = state.configs.filter((c) => c.status === 'enabled');

    // 3. User gets: (specifically assigned configs) + (configs assigned to everyone "isEveryone === true")
    return activeConfigs.filter(
      (c) => assignedIds.includes(c.id) || c.isEveryone
    );
  },

  // --- ANNOUNCEMENTS ---
  getAnnouncements(): AnnouncementRecord[] {
    return loadDb().announcements;
  },

  createAnnouncement(ann: Omit<AnnouncementRecord, 'id' | 'createdAt'>): AnnouncementRecord {
    const state = loadDb();
    const newAnn: AnnouncementRecord = {
      ...ann,
      id: 'ann-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    state.announcements.push(newAnn);
    saveDb(state);
    return newAnn;
  },

  updateAnnouncement(id: string, updates: Partial<AnnouncementRecord>): AnnouncementRecord | undefined {
    const state = loadDb();
    const index = state.announcements.findIndex(a => a.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...state.announcements[index],
      ...updates
    };

    state.announcements[index] = updated;
    saveDb(state);
    return updated;
  },

  deleteAnnouncement(id: string): boolean {
    const state = loadDb();
    const initialLen = state.announcements.length;
    state.announcements = state.announcements.filter(a => a.id !== id);
    const deleted = state.announcements.length < initialLen;
    if (deleted) {
      saveDb(state);
    }
    return deleted;
  },

  // --- LOGS ---
  getLogs(): LogRecord[] {
    return loadDb().logs;
  },

  addLog(log: Omit<LogRecord, 'id' | 'timestamp'>): LogRecord {
    const state = loadDb();
    const newLog: LogRecord = {
      ...log,
      id: 'l-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };

    state.logs.push(newLog);
    // Keep logs capped at last 500 records to prevent infinite JSON file growth
    if (state.logs.length > 500) {
      state.logs.shift();
    }
    saveDb(state);
    return newLog;
  },

  clearLogs(): void {
    const state = loadDb();
    state.logs = [];
    saveDb(state);
  },

  // --- ADS ---
  getAds(): AdSetting[] {
    return loadDb().ads;
  },

  updateAd(id: string, updates: Partial<AdSetting>): AdSetting | undefined {
    const state = loadDb();
    const index = state.ads.findIndex(a => a.id === id);
    if (index === -1) return undefined;

    const updated = {
      ...state.ads[index],
      ...updates
    };

    state.ads[index] = updated;
    saveDb(state);
    return updated;
  },

  // --- SITE SETTINGS ---
  getSettings(): SiteSettings {
    return loadDb().settings;
  },

  updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    const state = loadDb();
    state.settings = {
      ...state.settings,
      ...updates
    };
    saveDb(state);
    return state.settings;
  },

  // --- INTERACTION STATS ---
  incrementCounter(type: 'downloads' | 'copies' | 'qrScans'): number {
    const state = loadDb();
    if (!state.statsCounters) {
      state.statsCounters = { downloads: 0, copies: 0, qrScans: 0 };
    }
    state.statsCounters[type] += 1;
    saveDb(state);
    return state.statsCounters[type];
  },

  getCounters() {
    const state = loadDb();
    if (!state.statsCounters) {
      return { downloads: 142, copies: 389, qrScans: 85 };
    }
    return state.statsCounters;
  }
};
