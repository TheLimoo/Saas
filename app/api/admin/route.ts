import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    // Retrieve the admin passcode from headers
    const adminCodeHeader = req.headers.get('x-admin-passcode');
    const settings = db.getSettings();

    // Verification
    if (adminCodeHeader !== settings.adminCode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid administrative passcode.' }, { status: 401 });
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    switch (action) {
      case 'getDashboardData': {
        const users = db.getUsers();
        const configs = db.getConfigs();
        const logs = db.getLogs();
        const announcements = db.getAnnouncements();
        const ads = db.getAds();
        const currentSettings = db.getSettings();
        const counters = db.getCounters();
        const assignments = db.getAssignments();

        return NextResponse.json({
          success: true,
          users,
          configs,
          logs,
          announcements,
          ads,
          settings: currentSettings,
          counters,
          assignments
        });
      }

      case 'updateSettings': {
        const updated = db.updateSettings(data);
        return NextResponse.json({ success: true, settings: updated });
      }

      // --- CONFIGS ---
      case 'createConfig': {
        const config = db.createConfig(data);
        return NextResponse.json({ success: true, config });
      }

      case 'updateConfig': {
        const updated = db.updateConfig(data.id, data.updates);
        return NextResponse.json({ success: true, config: updated });
      }

      case 'deleteConfig': {
        const success = db.deleteConfig(data.id);
        return NextResponse.json({ success });
      }

      // --- USERS ---
      case 'createUser': {
        const user = db.createUser(data);
        return NextResponse.json({ success: true, user });
      }

      case 'updateUser': {
        const updated = db.updateUser(data.id, data.updates);
        return NextResponse.json({ success: true, user: updated });
      }

      case 'deleteUser': {
        const success = db.deleteUser(data.id);
        return NextResponse.json({ success });
      }

      // --- ASSIGNMENTS ---
      case 'assignConfig': {
        const assignment = db.assignConfigToUser(data.username, data.configId);
        return NextResponse.json({ success: true, assignment });
      }

      case 'removeAssignment': {
        const success = db.removeConfigAssignment(data.username, data.configId);
        return NextResponse.json({ success });
      }

      // --- ANNOUNCEMENTS ---
      case 'createAnnouncement': {
        const ann = db.createAnnouncement(data);
        return NextResponse.json({ success: true, announcement: ann });
      }

      case 'updateAnnouncement': {
        const updated = db.updateAnnouncement(data.id, data.updates);
        return NextResponse.json({ success: true, announcement: updated });
      }

      case 'deleteAnnouncement': {
        const success = db.deleteAnnouncement(data.id);
        return NextResponse.json({ success });
      }

      // --- ADS ---
      case 'updateAd': {
        const updated = db.updateAd(data.id, data.updates);
        return NextResponse.json({ success: true, ad: updated });
      }

      // --- MAINTENANCE / RESET ---
      case 'clearLogs': {
        db.clearLogs();
        return NextResponse.json({ success: true });
      }

      case 'resetState': {
        const restored = db.resetState();
        return NextResponse.json({ success: true, state: restored });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

  } catch (err: any) {
    console.error('Error in Admin API:', err);
    return NextResponse.json({ error: 'Server error processing admin action' }, { status: 500 });
  }
}
