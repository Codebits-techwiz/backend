import cron from 'node-cron';
import { processDueRecurringRules } from '../services/recurringService.js';

/**
 * Initialize Node-Cron Scheduler
 * Business Rule: A node-cron job runs daily at midnight (00:00), creates due transactions, and advances nextRunDate.
 */
export const initRecurringCronJob = () => {
  // Schedule task to run every day at 00:00 (Midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron Job] Running daily automated recurring rules processing...');
    try {
      const processedCount = await processDueRecurringRules();
      console.log(`[Cron Job] Processed ${processedCount} recurring transaction(s).`);
    } catch (error) {
      console.error('[Cron Job Error]', error);
    }
  });

  console.log('[Scheduler] Node-cron daily recurring rules job registered.');
};
