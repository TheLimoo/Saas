export interface ParsedUserAgent {
  os: string;
  browser: string;
  device: string;
}

export function parseUserAgent(uaString: string | null): ParsedUserAgent {
  if (!uaString) {
    return { os: 'Unknown', browser: 'Unknown', device: 'Desktop' };
  }

  const ua = uaString.toLowerCase();
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let device = 'Desktop';

  // Determine Device
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }

  // Determine OS
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'iOS';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Determine Browser
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome') || ua.includes('crios')) browser = 'Chrome';
  else if (ua.includes('firefox') || ua.includes('fxios')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android')) browser = 'Safari';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';

  return { os, browser, device };
}

// Map IP to a realistic country/city for dashboard data simulation when real headers aren't available
export function getGeoFromIp(ip: string | null, vercelCountryHeader: string | null): { country: string; city: string; region: string; isp: string } {
  // If Vercel GeoIP header exists, use it
  if (vercelCountryHeader) {
    const countryNames: Record<string, string> = {
      'DE': 'Germany',
      'US': 'United States',
      'GB': 'United Kingdom',
      'FR': 'France',
      'JP': 'Japan',
      'CA': 'Canada',
      'IR': 'Iran',
      'RU': 'Russia',
      'CN': 'China',
      'TR': 'Turkey',
      'UA': 'Ukraine',
      'BR': 'Brazil',
    };
    const country = countryNames[vercelCountryHeader.toUpperCase()] || vercelCountryHeader;
    return {
      country,
      city: 'Local Gateway',
      region: 'Cloud Network',
      isp: 'Cloud Network ISP'
    };
  }

  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    return {
      country: 'Germany',
      city: 'Frankfurt',
      region: 'Hesse',
      isp: 'Deutsche Telekom'
    };
  }

  // Consistent hashing for mock geo based on IP
  const charSum = ip.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const countryList = [
    { country: 'United States', city: 'Ashburn', region: 'Virginia', isp: 'Amazon Technologies' },
    { country: 'Germany', city: 'Frankfurt', region: 'Hesse', isp: 'Deutsche Telekom AG' },
    { country: 'Iran', city: 'Tehran', region: 'Tehran', isp: 'MCI Mobile' },
    { country: 'Russia', city: 'Moscow', region: 'Moscow', isp: 'Rostelecom' },
    { country: 'Turkey', city: 'Istanbul', region: 'Istanbul', isp: 'Turk Telekom' },
    { country: 'United Kingdom', city: 'London', region: 'England', isp: 'British Telecommunications' },
    { country: 'Japan', city: 'Tokyo', region: 'Tokyo', isp: 'NTT Communications' },
    { country: 'China', city: 'Beijing', region: 'Beijing', isp: 'China Telecom' }
  ];

  return countryList[charSum % countryList.length];
}
