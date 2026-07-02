import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || searchParams.get('user') || 'universal';
    const client = searchParams.get('client') || searchParams.get('flag') || 'v2ray';

    // Fetch configurations assigned to this user
    const configs = db.getUserConfigs(username);
    const enabledConfigs = configs.filter(c => c.status === 'enabled');

    if (enabledConfigs.length === 0) {
      return new NextResponse('# No configurations assigned or found for this user', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Prepare plaintext content
    const plainTextConfigs = enabledConfigs
      .map(c => c.content)
      .filter(content => content && content.trim() !== '')
      .join('\n');

    // 1. Clash Config Format (YAML)
    if (client === 'clash' || client === 'stash') {
      const clashYaml = generateClashYaml(username, enabledConfigs);
      return new NextResponse(clashYaml, {
        headers: {
          'Content-Type': 'text/yaml; charset=utf-8',
          'Content-Disposition': `attachment; filename="clash-${username}.yaml"`,
        },
      });
    }

    // 2. Sing-box Config Format (JSON)
    if (client === 'singbox' || client === 'sing-box' || client === 'hiddify') {
      const singboxJson = generateSingboxJson(username, enabledConfigs);
      return new NextResponse(JSON.stringify(singboxJson, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="singbox-${username}.json"`,
        },
      });
    }

    // 3. Default base64-encoded URL (v2ray, shadowrocket, nekobox, streisand)
    const base64Content = Buffer.from(plainTextConfigs).toString('base64');
    
    return new NextResponse(base64Content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Subscription-Userinfo': 'upload=0; download=0; total=1099511627776; expire=0', // 1TB fake limit for clients to show unlimited clean stats
        'Profile-Update-Interval': '12',
      },
    });

  } catch (err: any) {
    console.error('Subscription error:', err);
    return new NextResponse('Error generating subscription', { status: 500 });
  }
}

// Clash YAML generator helper
function generateClashYaml(username: string, configs: any[]) {
  const proxies: any[] = [];
  
  configs.forEach(c => {
    // Basic parser for links (vless://, vmess://, hysteria2://, trojan://)
    try {
      const urlStr = c.content.trim();
      if (urlStr.startsWith('vmess://')) {
        const rawJson = Buffer.from(urlStr.replace('vmess://', ''), 'base64').toString('utf-8');
        const vmessObj = JSON.parse(rawJson);
        proxies.push({
          name: c.name,
          type: 'vmess',
          server: vmessObj.add,
          port: parseInt(vmessObj.port),
          uuid: vmessObj.id,
          alterId: 0,
          cipher: 'auto',
          udp: true,
          network: vmessObj.net || 'tcp',
          'ws-opts': vmessObj.net === 'ws' ? { path: vmessObj.path || '/' } : undefined,
          tls: vmessObj.security === 'tls',
          servername: vmessObj.sni || ''
        });
      } else if (urlStr.startsWith('vless://')) {
        const url = new URL(urlStr);
        const params = url.searchParams;
        proxies.push({
          name: c.name,
          type: 'vless',
          server: url.hostname,
          port: parseInt(url.port),
          uuid: url.username,
          cipher: 'none',
          udp: true,
          tls: params.get('security') === 'reality' || params.get('security') === 'tls',
          'reality-opts': params.get('security') === 'reality' ? {
            public_key: params.get('pbk') || '',
            short_id: params.get('sid') || ''
          } : undefined,
          servername: params.get('sni') || ''
        });
      } else if (urlStr.startsWith('hysteria2://')) {
        const url = new URL(urlStr);
        proxies.push({
          name: c.name,
          type: 'hysteria2',
          server: url.hostname,
          port: parseInt(url.port),
          auth: url.username,
          sni: url.searchParams.get('sni') || '',
          'skip-cert-verify': url.searchParams.get('insecure') === '1'
        });
      }
    } catch (e) {
      // If parsing fails, skip or represent as custom string
    }
  });

  return `
# Clash Subscription for user: ${username}
port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info
external-controller: '127.0.0.1:9090'

proxies:
${proxies.length > 0 ? proxies.map(p => `  - ${JSON.stringify(p)}`).join('\n') : '  # No compatible nodes found'}

proxy-groups:
  - name: ⚡ PROXY
    type: select
    proxies:
      - AUTO
${proxies.map(p => `      - ${p.name}`).join('\n')}
  - name: AUTO
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:
${proxies.map(p => `      - ${p.name}`).join('\n')}

rules:
  - DOMAIN-SUFFIX,google.com,⚡ PROXY
  - DOMAIN-KEYWORD,vpn,⚡ PROXY
  - MATCH,⚡ PROXY
`;
}

// Sing-box JSON generator helper
function generateSingboxJson(username: string, configs: any[]) {
  const outbounds: any[] = [
    {
      type: 'direct',
      tag: 'direct'
    },
    {
      type: 'dns',
      tag: 'dns-out'
    }
  ];

  configs.forEach(c => {
    try {
      const urlStr = c.content.trim();
      if (urlStr.startsWith('vless://')) {
        const url = new URL(urlStr);
        outbounds.push({
          type: 'vless',
          tag: c.name,
          server: url.hostname,
          server_port: parseInt(url.port),
          uuid: url.username,
          flow: 'xtls-rprx-vision',
          tls: {
            enabled: true,
            server_name: url.searchParams.get('sni') || '',
            utls: { enabled: true, fingerprint: 'chrome' },
            reality: {
              enabled: url.searchParams.get('security') === 'reality',
              public_key: url.searchParams.get('pbk') || '',
              short_id: url.searchParams.get('sid') || ''
            }
          }
        });
      }
    } catch (e) {}
  });

  return {
    dns: {
      servers: [
        { tag: 'google', address: '8.8.8.8', address_resolver: 'local' },
        { tag: 'local', address: 'local', detours: ['direct'] }
      ],
      rules: [{ outbound: 'any', server: 'local' }]
    },
    outbounds: outbounds,
    route: {
      rules: [{ geoip: 'private', outbound: 'direct' }]
    }
  };
}
