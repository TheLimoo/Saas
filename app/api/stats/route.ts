import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { type } = await req.json();

    if (type === 'downloads' || type === 'copies' || type === 'qrScans') {
      const newVal = db.incrementCounter(type);
      return NextResponse.json({ success: true, count: newVal });
    }

    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Server error incrementing stat' }, { status: 500 });
  }
}
