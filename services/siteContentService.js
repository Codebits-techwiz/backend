import { z } from 'zod';
import { SiteContent } from '../models/SiteContent.js';

export const DEFAULT_SITE_CONTENT = {
  branding: {
    logoText: 'CampusCoin',
    logoImageUrlLight: '',
    logoImageUrlDark: '',
    logoImageUrl: '',
    faviconEmoji: '🪙',
  },
  hero: {
    badge: '100% Free for College Students',
    headline1: 'Master your budget,',
    headline2: 'ditch money stress.',
    subtext: 'Track allowances, canteen runs, and hostel expenses without linking a bank account. Powered by smart AI insights.',
    ctaPrimary: 'Get Started Free',
    ctaSecondary: 'See How It Works',
  },
  stats: {
    disclaimer: 'Illustrative Demo Overview',
    items: [
      { value: '100%', label: 'Free & Open Access' },
      { value: '24/7', label: 'AI Expense Insights' },
      { value: '0', label: 'Bank Credentials Needed' },
      { value: '10+', label: 'Student Budget Categories' },
    ],
    partners: ['Student Allowance Tracking', 'Hostel Expense Management', 'AI Spending Advisory', 'Personal Campus Finance'],
  },
  madeForStudents: {
    eyebrow: 'Made for students',
    title: 'Your allowance deserves a better plan than a notes app',
    description: 'Campus Coin turns messy receipts, cafe runs, and part-time pay into a clear picture of where your money goes, so midterms do not wreck your budget.',
    bullets: [
      'Categories that match real campus life',
      'Budgets that warn you before you overspend',
      'Tips written like a friend, not a bank',
    ],
  },
  features: {
    eyebrow: 'Features',
    title: 'Everything You Need to Manage Your Money',
    subtitle: 'From quick logging to AI insights, one place for the full student money loop.',
    items: [
      { id: '1', title: 'Track Income & Expenses', desc: 'Log allowance, gig pay, food, transport, and more in seconds. No bank account required.', icon: 'Wallet' },
      { id: '2', title: 'Smart Categories', desc: 'Student-focused categories for hostel, academics, subscriptions, and entertainment.', icon: 'Tags' },
      { id: '3', title: 'AI Assistant', desc: 'Get automatic category suggestions as you type, and override anytime.', icon: 'Bot' },
      { id: '4', title: 'Visual Reports', desc: 'See monthly trends, category breakdowns, and income vs expense at a glance.', icon: 'BarChart3' },
      { id: '5', title: 'Personalized Saving Tips', desc: 'Tips ranked by impact, based on your own history and budget goals.', icon: 'Sparkles' },
      { id: '6', title: 'Access Anywhere', desc: 'Responsive web app that works smoothly on phone, tablet, and desktop.', icon: 'Smartphone' },
    ],
  },
  howItWorks: {
    eyebrow: 'How It Works',
    title: 'Get Started in 3 Simple Steps',
    steps: [
      { step: '1', title: 'Create Your Account', desc: 'Sign up with your campus email and set your monthly allowance baseline in PKR.' },
      { step: '2', title: 'Add Your Transactions', desc: 'Quick-add income and expenses. AI suggests categories as you type.' },
      { step: '3', title: 'See Your Insights', desc: 'Review charts, budgets, and plain saving tips every month.' },
    ],
  },
  hustleCards: {
    eyebrow: 'Made for you',
    title: 'Whatever your campus hustle looks like',
    items: [
      { id: '1', title: 'Undergrads', desc: 'Track allowance, books, and weekend plans without the stress.', tag: 'Undergrad', icon: 'GraduationCap' },
      { id: '2', title: 'Hostel life', desc: 'Rent, laundry, shared groceries. Keep fixed costs in check.', tag: 'Hostel', icon: 'Coffee' },
      { id: '3', title: 'Commuters', desc: 'Bus passes vs ride-shares: see what actually saves money.', tag: 'Commute', icon: 'Bus' },
      { id: '4', title: 'Part-timers', desc: 'Log gig pay and scholarships next to everyday spending.', tag: 'Gig Work', icon: 'BookOpen' },
    ],
  },
  trustBadges: {
    items: [
      { id: '1', title: 'No bank linking', desc: 'Manual entry and optional CSV import. Your banking stays yours.', icon: 'Lock' },
      { id: '2', title: 'Private by design', desc: 'You control what is logged. Insights stay in your account.', icon: 'ShieldCheck' },
      { id: '3', title: 'Built with students', desc: 'Categories, tips, and flows shaped by real campus money habits.', icon: 'Users' },
    ],
  },
  ctaBanner: {
    title: 'This semester, know where every rupee goes',
    subtext: 'Join thousands of students building calmer money habits, one tap at a time.',
    buttonText: 'Join Campus Coin',
  },
  testimonials: {
    items: [
      {
        id: '1',
        name: 'Zara Ahmed',
        role: 'Computer Science Student',
        quote: 'Campus Coin helped me manage my monthly allowance without stressing over canteen expenses.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: '2',
        name: 'Hamza Malik',
        role: 'Business Student',
        quote: 'The AI monthly insights showed me exactly how much I was spending on food delivery each week.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: '3',
        name: 'Sania Mirza',
        role: 'Engineering Student',
        quote: 'Setting category caps for transport and books kept my savings goal on track all semester.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      },
    ],
  },
  faqs: {
    items: [
      {
        id: '1',
        question: 'Is Campus Coin completely free?',
        answer: 'Yes! Campus Coin is 100% free for all students. There are no subscription fees or premium tiers.',
      },
      {
        id: '2',
        question: 'Do I need to link my bank account?',
        answer: 'No bank linking required. You can manually log transactions or upload CSV exports safely and privately.',
      },
      {
        id: '3',
        question: 'How do AI monthly insights work?',
        answer: 'Our system analyzes your expense patterns and generates personalized tips and budget advisories to help you save.',
      },
      {
        id: '4',
        question: 'Can I export my financial data?',
        answer: 'Yes, you can export your monthly reports as PDF or PNG images anytime.',
      },
    ],
  },
};

const brandingSchema = z.object({
  logoText: z.string().default('CampusCoin'),
  logoImageUrlLight: z.string().optional().default(''),
  logoImageUrlDark: z.string().optional().default(''),
  logoImageUrl: z.string().optional().default(''),
  faviconEmoji: z.string().optional().default('🪙'),
});

const heroSchema = z.object({
  badge: z.string().default('100% Free for College Students'),
  headline1: z.string().min(1, 'Headline 1 is required'),
  headline2: z.string().min(1, 'Headline 2 is required'),
  subtext: z.string().min(1, 'Subtext is required'),
  ctaPrimary: z.string().default('Get Started Free'),
  ctaSecondary: z.string().default('See How It Works'),
});

const statsSchema = z.object({
  disclaimer: z.string().optional().default('Campus Coin Community Overview'),
  items: z.array(
    z.object({
      value: z.string().min(1, 'Value is required'),
      label: z.string().min(1, 'Label is required'),
    })
  ).min(1, 'At least one stat item is required'),
  partners: z.array(z.string()).optional(),
});

const madeForStudentsSchema = z.object({
  eyebrow: z.string().default('Made for students'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  bullets: z.array(z.string()).min(1, 'At least one bullet is required'),
});

const featuresSchema = z.object({
  eyebrow: z.string().default('Features'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().default(''),
  items: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1, 'Title is required'),
      desc: z.string().min(1, 'Description is required'),
      icon: z.string().optional().default('Wallet'),
    })
  ),
});

const howItWorksSchema = z.object({
  eyebrow: z.string().default('How It Works'),
  title: z.string().min(1, 'Title is required'),
  steps: z.array(
    z.object({
      step: z.string().min(1),
      title: z.string().min(1),
      desc: z.string().min(1),
    })
  ),
});

const hustleCardsSchema = z.object({
  eyebrow: z.string().default('Made for you'),
  title: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      desc: z.string().min(1),
      tag: z.string().optional().default(''),
      icon: z.string().optional().default('BookOpen'),
    })
  ),
});

const trustBadgesSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      desc: z.string().min(1),
      icon: z.string().optional().default('ShieldCheck'),
    })
  ),
});

const ctaBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtext: z.string().min(1, 'Subtext is required'),
  buttonText: z.string().default('Join Campus Coin'),
});

const testimonialsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, 'Name is required'),
      role: z.string().min(1, 'Role is required'),
      quote: z.string().min(1, 'Quote is required'),
      rating: z.number().min(1).max(5).default(5),
      avatar: z.string().min(1, 'Avatar URL is required'),
    })
  ),
});

const faqsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      question: z.string().min(1, 'Question is required'),
      answer: z.string().min(1, 'Answer is required'),
    })
  ),
});

export const validateSectionData = (section, data) => {
  if (section === 'branding') return brandingSchema.parse(data);
  if (section === 'hero') return heroSchema.parse(data);
  if (section === 'stats') return statsSchema.parse(data);
  if (section === 'madeForStudents') return madeForStudentsSchema.parse(data);
  if (section === 'features') return featuresSchema.parse(data);
  if (section === 'howItWorks') return howItWorksSchema.parse(data);
  if (section === 'hustleCards') return hustleCardsSchema.parse(data);
  if (section === 'trustBadges') return trustBadgesSchema.parse(data);
  if (section === 'ctaBanner') return ctaBannerSchema.parse(data);
  if (section === 'testimonials') return testimonialsSchema.parse(data);
  if (section === 'faqs') return faqsSchema.parse(data);
  return z.object({}).passthrough().parse(data);
};

export const getAllPublicSiteContent = async () => {
  const docs = await SiteContent.find({}).lean();
  const resultMap = { ...DEFAULT_SITE_CONTENT };

  docs.forEach((doc) => {
    resultMap[doc.section] = doc.data;
  });

  return resultMap;
};

export const updateSectionContent = async (section, rawData) => {
  const validatedData = validateSectionData(section, rawData);
  const updatedDoc = await SiteContent.findOneAndUpdate(
    { section },
    { data: validatedData },
    { upsert: true, new: true, runValidators: true }
  );
  return updatedDoc;
};
