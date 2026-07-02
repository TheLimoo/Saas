import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseUserAgent, getGeoFromIp } from '@/lib/ua';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim();

    // 1. Gather headers for logging & analytics
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent');
    const countryHeader = req.headers.get('x-vercel-ip-country');

    const parsedUa = parseUserAgent(userAgent);
    const geo = getGeoFromIp(ip, countryHeader);

    // 2. Load or Auto-Create User
    let user = db.getUserByUsername(cleanUsername);

    if (user) {
      if (user.status === 'blacklisted') {
        db.addLog({
          username: cleanUsername,
          ip,
          requestedConfigs: [],
          browser: parsedUa.browser,
          os: parsedUa.os,
          device: parsedUa.device,
          country: geo.country,
          status: 'blocked',
          latency: Date.now() - startTime
        });
        return NextResponse.json({
          error: 'Your username has been blacklisted due to abuse or suspicious activity.',
          status: 'blacklisted'
        }, { status: 403 });
      }

      if (user.status === 'disabled') {
        db.addLog({
          username: cleanUsername,
          ip,
          requestedConfigs: [],
          browser: parsedUa.browser,
          os: parsedUa.os,
          device: parsedUa.device,
          country: geo.country,
          status: 'blocked',
          latency: Date.now() - startTime
        });
        return NextResponse.json({
          error: 'This username is currently disabled by the administrator.',
          status: 'disabled'
        }, { status: 403 });
      }

      // Update existing user with latest info
      db.updateUser(user.id, {
        ip,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        isp: geo.isp,
        browser: parsedUa.browser,
        os: parsedUa.os,
        device: parsedUa.device,
        requestCount: user.requestCount + 1,
        lastSeen: new Date().toISOString()
      });
    } else {
      // Auto-create user
      user = db.createUser({
        username: cleanUsername,
        ip,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        isp: geo.isp,
        browser: parsedUa.browser,
        os: parsedUa.os,
        device: parsedUa.device
      });
    }

    // 3. Retrieve Assigned Configs
    const configs = db.getUserConfigs(cleanUsername);
    const configNames = configs.map(c => c.name);

    // 4. Record access log
    db.addLog({
      username: cleanUsername,
      ip,
      requestedConfigs: configNames,
      browser: parsedUa.browser,
      os: parsedUa.os,
      device: parsedUa.device,
      country: geo.country,
      status: 'success',
      latency: Date.now() - startTime
    });

    // 5. Fetch ads, announcements and site settings to make client load seamless
    const announcements = db.getAnnouncements().filter(a => a.status === 'enabled');
    const ads = db.getAds().filter(a => a.enabled);
    const settings = db.getSettings();

    // Check for maintenance mode
    if (settings.maintenanceMode) {
      return NextResponse.json({
        error: 'System is currently undergoing scheduled maintenance. Please try again later.',
        status: 'maintenance'
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      user,
      configs,
      announcements,
      ads,
      settings: {
        title: settings.title,
        logo: settings.logo,
        footerText: settings.footerText,
        adsEnabled: settings.adsEnabled,
        analyticsEnabled: settings.analyticsEnabled
      }
    });

  } catch (err: any) {
    console.error('Error in config delivery api:', err);
    return NextResponse.json({ error: 'Server error processing request' }, { status: 500 });
  }
}
