import { User } from '../models/User.js';

const ACADEMIC_YEAR_ALIASES = {
  '1st Year': 'Year 1',
  '2nd Year': 'Year 2',
  '3rd Year': 'Year 3',
  '4th Year': 'Year 4',
  Freshman: 'Year 1',
  Sophomore: 'Year 2',
  Junior: 'Year 3',
  Senior: 'Year 4',
};

/**
 * Safe one-time cleanup:
 * - Normalize academic year labels to UI values (Year 1…)
 * - Do NOT auto-multiply money fields (unsafe for already-correct cents)
 */
export const migrateLegacyUserMoney = async () => {
  const users = await User.find({
    academicYear: { $in: Object.keys(ACADEMIC_YEAR_ALIASES) }
  }).select('_id academicYear');

  if (users.length === 0) return 0;

  let fixed = 0;
  for (const user of users) {
    const mappedYear = ACADEMIC_YEAR_ALIASES[user.academicYear];
    if (!mappedYear) continue;
    user.academicYear = mappedYear;
    await user.save();
    fixed += 1;
  }

  return fixed;
};
