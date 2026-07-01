// ─── CoMUN 2026 Static Data ───────────────────────────────────────────────

export const CONFERENCE = {
  name: 'CoMUN 2026',
  fullName: 'Cottons Model United Nations',
  theme: 'Peace Over Power',
  dates: '30 July – 1 August 2026',
  /** Conference start — drives the live countdown timer. */
  startsAt: '2026-07-30T09:00:00',
  romanYear: 'MMXXVI',
  location: 'Cottons Campus',
  edition: '1st Edition',
} as const;

// ─── Navigation Links ─────────────────────────────────────────────────────
export const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'About',      href: '#about' },
  { label: 'Committees', href: '#committees' },
  { label: 'Resources',  href: '#resources' },
  { label: 'Contact',    href: '#contact' },
] as const;

// ─── Statistics ───────────────────────────────────────────────────────────
export const STATS = [
  { value: '7',    label: 'Committees' },
  { value: '700+', label: 'Delegates' },
  { value: '3',    label: 'Days of Debate' },
  { value: '12th', label: 'Edition' },
] as const;

// ─── Committees ───────────────────────────────────────────────────────────
export interface Committee {
  code:      string;
  name:      string;
  fullName:  string;
  category:  'General' | 'Security' | 'Crisis' | 'Special';
  color:     string;
}

export const COMMITTEES: Committee[] = [
  {
    code:     'DISEC',
    name:     'DISEC',
    fullName: 'Disarmament & International Security Committee',
    category: 'General',
    color:    'from-blue-900/40 to-blue-800/20',
  },
  {
    code:     'UNODC',
    name:     'UNODC',
    fullName: 'United Nations Office on Drugs and Crime',
    category: 'Special',
    color:    'from-purple-900/40 to-purple-800/20',
  },
  {
    code:     'SPECPOL',
    name:     'SPECPOL',
    fullName: 'Special Political & Decolonization Committee',
    category: 'General',
    color:    'from-emerald-900/40 to-emerald-800/20',
  },
  {
    code:     'UNSC',
    name:     'UNSC',
    fullName: 'United Nations Security Council',
    category: 'Security',
    color:    'from-red-900/40 to-red-800/20',
  },
  {
    code:     'CCC',
    name:     'CCC',
    fullName: 'Cabinet Crisis Committee',
    category: 'Crisis',
    color:    'from-orange-900/40 to-orange-800/20',
  },
  {
    code:     'IPC-J',
    name:     'IPC – J',
    fullName: 'International Press Corps – Journalism',
    category: 'Special',
    color:    'from-cyan-900/40 to-cyan-800/20',
  },
  {
    code:     'IPC-P',
    name:     'IPC – P',
    fullName: 'International Press Corps – Photography',
    category: 'Special',
    color:    'from-amber-900/40 to-amber-800/20',
  },
] as const;

// ─── Why Participate ──────────────────────────────────────────────────────
export const FEATURES = [
  {
    icon: '⚖️',
    title: 'Sharpen Diplomacy',
    description:
      'Engage in high-stakes debate, negotiate resolutions, and master the art of multilateral diplomacy in a real UN-format conference.',
  },
  {
    icon: '🌐',
    title: 'Global Perspectives',
    description:
      'Represent nations from across the globe, broadening your understanding of international affairs and geopolitical nuance.',
  },
  {
    icon: '🏛️',
    title: 'Leadership & Poise',
    description:
      'Lead committees, chair sessions, and develop commanding presence that translates directly to real-world leadership.',
  },
  {
    icon: '✍️',
    title: 'Research & Writing',
    description:
      'Craft position papers, draft resolutions, and build analytical writing skills under conference pressure.',
  },
  {
    icon: '🤝',
    title: 'Build Networks',
    description:
      'Connect with exceptional students, faculty advisors, and future leaders from institutions across the region.',
  },
  {
    icon: '🏅',
    title: 'Merit & Recognition',
    description:
      'Earn awards, certificates, and recognition that distinguish your academic and leadership profile.',
  },
] as const;

// ─── Registration Types ─────────────────────────────────────────────────────
export const REGISTRATION_TYPES = [
  {
    type: 'Individual',
    icon: '👤',
    title: 'Individual Registration',
    description:
      'For students registering independently to represent a nation or role in their chosen committee.',
    highlights: ['All committees available', 'Flexible committee selection', 'Certificate of participation', 'Networking opportunities'],
    cta: 'Register as Delegate',
    accent: 'from-comun-gold/20 to-comun-gold-dark/10',
  },
  {
    type: 'Institutional',
    icon: '🏫',
    title: 'Institutional Registration',
    description:
      'For schools and universities registering a delegation of multiple delegates under a faculty advisor.',
    highlights: ['Bulk delegate slots', 'Faculty advisor access', 'Dedicated support', 'Group accommodation priority'],
    cta: 'Register Institution',
    accent: 'from-comun-gold/20 to-comun-gold-dark/10',
  },
] as const;

// ─── FAQ Data ─────────────────────────────────────────────────────────────
export const FAQS = [
  {
    question: 'What is CoMUN 2026?',
    answer:
      'CoMUN 2026 (Cottons Model United Nations) is a three-day diplomatic simulation conference held at Cottons Campus from 30 July to 1 August 2026. Delegates represent countries in various UN committees, debating and drafting resolutions on global issues.',
  },
  {
    question: 'Who can participate?',
    answer:
      'CoMUN 2026 is open to high school and undergraduate students from all institutions. Both individual and institutional registrations are available. No prior MUN experience is required for most committees.',
  },
  {
    question: 'How do I register?',
    answer:
      'Registration will open soon. You can register as an individual delegate, as part of a school delegation (institutional registration), or specifically for Special Committees such as IPC and CCC. Keep an eye on this page for updates.',
  },
  {
    question: 'What committees are available?',
    answer:
      'CoMUN 2026 features seven committees: DISEC, UNODC, SPECPOL, UNSC, CCC, IPC – Journalism, and IPC – Photography. Each committee handles distinct global issues and formats.',
  },
  {
    question: 'What is the conference theme?',
    answer:
      '"Peace Over Power" — this theme challenges delegates to prioritize dialogue, cooperation, and humanitarian values over geopolitical dominance and conflict, reflecting the founding mission of the United Nations.',
  },
  {
    question: 'Are there awards?',
    answer:
      'Yes. Outstanding delegates and best position papers will be recognized with awards across all committees. Certificates of participation will be provided to all registered delegates.',
  },
  {
    question: 'Will there be training resources?',
    answer:
      'Yes. Background guides, position paper templates, and study resources will be made available through the Resources section of this website ahead of the conference.',
  },
] as const;
