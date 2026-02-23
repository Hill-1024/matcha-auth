import { addCollection } from '@iconify/react';

const CACHE_PREFIX = 'matcha_icon_cache_';
const FAILED_CACHE = new Set<string>();

// Common issuer mapping
const ISSUER_MAP: Record<string, string> = {
  'google': 'mdi:google',
  'github': 'mdi:github',
  'microsoft': 'mdi:microsoft',
  'amazon': 'simple-icons:amazon',
  'aws': 'simple-icons:amazonaws',
  'facebook': 'mdi:facebook',
  'twitter': 'mdi:twitter',
  'x': 'simple-icons:x',
  'instagram': 'mdi:instagram',
  'discord': 'simple-icons:discord',
  'steam': 'mdi:steam',
  'apple': 'mdi:apple',
  'dropbox': 'mdi:dropbox',
  'evernote': 'simple-icons:evernote',
  'teamviewer': 'simple-icons:teamviewer',
  'wordpress': 'mdi:wordpress',
  'paypal': 'mdi:paypal',
  'stripe': 'mdi:stripe',
  'salesforce': 'mdi:salesforce',
  'linkedin': 'mdi:linkedin',
  'adobe': 'simple-icons:adobe',
  'gitlab': 'mdi:gitlab',
  'bitbucket': 'mdi:bitbucket',
  'reddit': 'mdi:reddit',
  'twitch': 'mdi:twitch',
  'spotify': 'mdi:spotify',
  'slack': 'mdi:slack',
  'notion': 'simple-icons:notion',
  'binance': 'simple-icons:binance',
  'coinbase': 'simple-icons:coinbase',
  'cloudflare': 'simple-icons:cloudflare',
  'digitalocean': 'simple-icons:digitalocean',
  'heroku': 'simple-icons:heroku',
  'linode': 'simple-icons:linode',
  'vultr': 'simple-icons:vultr',
  'ovh': 'simple-icons:ovh',
  'protonmail': 'simple-icons:protonmail',
  'tutanota': 'simple-icons:tutanota',
  'fastmail': 'simple-icons:fastmail',
  'namecheap': 'simple-icons:namecheap',
  'godaddy': 'simple-icons:godaddy',
  'porkbun': 'simple-icons:porkbun',
  'aliyun': 'simple-icons:alibaba-cloud',
  'tencent': 'simple-icons:tencent-qq',
  'baidu': 'simple-icons:baidu',
  'huawei': 'simple-icons:huawei',
  'xiaomi': 'simple-icons:xiaomi',
  'synology': 'simple-icons:synology',
  'qnap': 'simple-icons:qnap',
  'ubiquiti': 'simple-icons:ubiquiti',
  'pfsense': 'simple-icons:pfsense',
  'opnsense': 'simple-icons:opnsense',
  'truenas': 'simple-icons:truenas',
  'proxmox': 'simple-icons:proxmox',
  'vmware': 'simple-icons:vmware',
  'citrix': 'simple-icons:citrix',
  'fortinet': 'simple-icons:fortinet',
  'cisco': 'simple-icons:cisco',
  'juniper': 'simple-icons:junipernetworks',
  'mikrotik': 'simple-icons:mikrotik',
  'paloalto': 'simple-icons:paloaltonetworks',
  'sophos': 'simple-icons:sophos',
  'watchguard': 'simple-icons:watchguard',
  'sonicwall': 'simple-icons:sonicwall',
  'check point': 'simple-icons:checkpoint',
  'barracuda': 'simple-icons:barracudanetworks',
  'f5': 'simple-icons:f5',
  'akamai': 'simple-icons:akamai',
  'fastly': 'simple-icons:fastly',
  'imperva': 'simple-icons:imperva',
  'sucuri': 'simple-icons:sucuri',
  'wordfence': 'simple-icons:wordfence',
  'bitwarden': 'simple-icons:bitwarden',
  'lastpass': 'simple-icons:lastpass',
  '1password': 'simple-icons:1password',
  'dashlane': 'simple-icons:dashlane',
  'keeper': 'simple-icons:keeper',
  'enpass': 'simple-icons:enpass',
  'roboform': 'simple-icons:roboform',
  'sticky password': 'simple-icons:stickypassword',
  'nordpass': 'simple-icons:nordpass',
  'remembear': 'simple-icons:remembear',
  'zoho': 'simple-icons:zoho',
  'zendesk': 'simple-icons:zendesk',
  'freshdesk': 'simple-icons:freshworks',
  'intercom': 'simple-icons:intercom',
  'drift': 'simple-icons:drift',
  'livechat': 'simple-icons:livechat',
  'tawk.to': 'simple-icons:tawk',
  'crisp': 'simple-icons:crisp',
  'olark': 'simple-icons:olark',
  'snapchat': 'mdi:snapchat',
  'pinterest': 'mdi:pinterest',
  'tumblr': 'mdi:tumblr',
  'flickr': 'simple-icons:flickr',
  'vimeo': 'simple-icons:vimeo',
  'dailymotion': 'simple-icons:dailymotion',
  'netflix': 'mdi:netflix',
  'hulu': 'simple-icons:hulu',
  'disney+': 'simple-icons:disneyplus',
  'prime video': 'simple-icons:primevideo',
  'hbo max': 'simple-icons:hbomax',
  'apple tv+': 'simple-icons:appletv',
  'youtube': 'mdi:youtube',
  'tiktok': 'simple-icons:tiktok',
  'wechat': 'mdi:wechat',
  'whatsapp': 'mdi:whatsapp',
  'telegram': 'mdi:telegram',
  'signal': 'simple-icons:signal',
  'threema': 'simple-icons:threema',
  'wire': 'simple-icons:wire',
  'viber': 'simple-icons:viber',
  'line': 'simple-icons:line',
  'kakaotalk': 'simple-icons:kakaotalk',
  'skype': 'mdi:skype',
  'zoom': 'simple-icons:zoom',
  'teams': 'simple-icons:microsoftteams',
  'meet': 'simple-icons:googlemeet',
  'webex': 'simple-icons:cisco',
  'gotomeeting': 'simple-icons:gotomeeting',
  'bluejeans': 'simple-icons:bluejeans',
  'jitsi': 'simple-icons:jitsi',
  'bigbluebutton': 'simple-icons:bigbluebutton',
};

export const initIconService = () => {
  try {
    // Load cached icons from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const iconData = JSON.parse(data);
            addCollection(iconData);
          } catch (e) {
            console.error('Failed to parse cached icon data', e);
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to init icon service', e);
  }
};

const fetchAndCacheIcon = async (iconName: string): Promise<boolean> => {
  const [prefix, name] = iconName.split(':');
  if (!prefix || !name) return false;

  const cacheKey = `${CACHE_PREFIX}${iconName}`;
  if (localStorage.getItem(cacheKey)) {
    return true; // Already cached
  }

  try {
    const response = await fetch(`https://api.iconify.design/${prefix}.json?icons=${name}`);
    if (!response.ok) return false;

    const data = await response.json();
    if (data && data.icons && data.icons[name]) {
      // Cache it
      localStorage.setItem(cacheKey, JSON.stringify(data));
      // Register it
      addCollection(data);
      return true;
    }
  } catch (e) {
    console.error(`Failed to fetch icon: ${iconName}`, e);
  }
  return false;
};

export const getIconForIssuer = async (issuer: string): Promise<string | null> => {
  const normalizedIssuer = issuer.toLowerCase().trim();
  if (FAILED_CACHE.has(normalizedIssuer)) return null;
  
  // 1. Check mapping
  let iconName = ISSUER_MAP[normalizedIssuer];
  
  // 2. If mapped, try to fetch/cache
  if (iconName) {
    const success = await fetchAndCacheIcon(iconName);
    if (success) return iconName;
  }

  // 3. If not mapped or fetch failed, try heuristic (mdi:issuer)
  // Only try if we haven't tried this specific name yet (avoid double fetch if map was mdi:issuer)
  const heuristicName = `mdi:${normalizedIssuer.replace(/\s+/g, '-')}`;
  if (heuristicName !== iconName) {
      const success = await fetchAndCacheIcon(heuristicName);
      if (success) return heuristicName;
  }
  
  // 4. Try simple-icons heuristic
  const simpleIconName = `simple-icons:${normalizedIssuer.replace(/\s+/g, '')}`;
  if (simpleIconName !== iconName) {
      const success = await fetchAndCacheIcon(simpleIconName);
      if (success) return simpleIconName;
  }

  FAILED_CACHE.add(normalizedIssuer);
  return null;
};
