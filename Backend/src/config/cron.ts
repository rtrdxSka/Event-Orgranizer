import cron from 'node-cron';
import EventModel from '../models/event.model';


/**
 * Closes events that have reached their closing date
 */
async function closeExpiredEvents() {
  try {
    const now = new Date();
    
    // Find all open events with closesBy date in the past
    const result = await EventModel.updateMany(
      { 
        status: 'open', 
        closesBy: { $ne: null, $lt: now }
      },
      { 
        $set: { status: 'closed' } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`[Cron] Closed ${result.modifiedCount} expired events at ${now.toISOString()}`);
    }
  } catch (error) {
    console.error('[Cron] Error in closeExpiredEvents:', error);
  }
}

// Schedule to run every hour (at minute 0)
export const eventClosingTask = cron.schedule('* * * * *', closeExpiredEvents);

// Function to initialize all cron jobs
export function initCronJobs() {
  console.log('[Cron] Initializing cron jobs...');
  eventClosingTask.start();
  console.log('[Cron] Event closing task scheduled to run every hour.');
}