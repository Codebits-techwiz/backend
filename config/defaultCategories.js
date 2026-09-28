/**
 * Built-in system categories (SRS) — owner=null, isDefault=true.
 * Shared by seed script and startup ensure.
 */
export const DEFAULT_CATEGORIES = [
  { name: 'Allowance', type: 'income', isDefault: true, icon: 'piggy-bank', color: '#4caf50' },
  { name: 'Part-time Job', type: 'income', isDefault: true, icon: 'briefcase', color: '#8bc34a' },
  { name: 'Scholarship', type: 'income', isDefault: true, icon: 'graduation-cap', color: '#cddc39' },
  { name: 'Gift', type: 'income', isDefault: true, icon: 'gift', color: '#ffeb3b' },
  { name: 'Other Income', type: 'income', isDefault: true, icon: 'wallet', color: '#ffc107' },
  { name: 'Food', type: 'expense', isDefault: true, icon: 'utensils', color: '#ff9800' },
  { name: 'Transport', type: 'expense', isDefault: true, icon: 'car', color: '#2196f3' },
  { name: 'Hostel/Rent', type: 'expense', isDefault: true, icon: 'home', color: '#9c27b0' },
  { name: 'Academics', type: 'expense', isDefault: true, icon: 'book-open', color: '#3f51b5' },
  { name: 'Subscriptions', type: 'expense', isDefault: true, icon: 'smartphone', color: '#00bcd4' },
  { name: 'Entertainment', type: 'expense', isDefault: true, icon: 'gamepad-2', color: '#e91e63' },
  { name: 'Miscellaneous', type: 'expense', isDefault: true, icon: 'tag', color: '#607d8b' }
];
