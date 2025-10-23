import logger from "./logger.js";

export default function createScheduler() {
  const scheduledTasks = new Map();
  let isRunning = false;

  // Schedule a task
  function scheduleTask(name, taskFunction, intervalMs, immediate = false) {
    if (scheduledTasks.has(name)) {
      logger.warn(`Task ${name} already scheduled, replacing`);
      clearInterval(scheduledTasks.get(name).intervalId);
    }

    const task = {
      name,
      taskFunction,
      intervalMs,
      intervalId: null,
      lastRun: null,
      nextRun: null,
      runCount: 0,
      isRunning: false,
    };

    // Calculate next run time
    task.nextRun = new Date(Date.now() + intervalMs);

    // Start the task
    const intervalId = setInterval(async () => {
      if (task.isRunning) {
        logger.warn(`Task ${name} is already running, skipping this execution`);
        return;
      }

      task.isRunning = true;
      task.lastRun = new Date();
      task.runCount++;

      try {
        logger.info(`Starting scheduled task: ${name}`);
        await taskFunction();
        logger.info(`Completed scheduled task: ${name}`);
      } catch (error) {
        logger.error({ err: error }, `Scheduled task ${name} failed`);
      } finally {
        task.isRunning = false;
        task.nextRun = new Date(Date.now() + intervalMs);
      }
    }, intervalMs);

    task.intervalId = intervalId;
    scheduledTasks.set(name, task);

    logger.info(`Scheduled task ${name} to run every ${intervalMs}ms`);

    // Run immediately if requested
    if (immediate) {
      setTimeout(async () => {
        try {
          logger.info(`Running immediate execution of task: ${name}`);
          await taskFunction();
        } catch (error) {
          logger.error(
            { err: error },
            `Immediate execution of task ${name} failed`
          );
        }
      }, 1000); // Wait 1 second before first run
    }

    return task;
  }

  // Cancel a scheduled task
  function cancelTask(name) {
    const task = scheduledTasks.get(name);
    if (task) {
      clearInterval(task.intervalId);
      scheduledTasks.delete(name);
      logger.info(`Cancelled scheduled task: ${name}`);
      return true;
    }
    return false;
  }

  // Get task status
  function getTaskStatus(name) {
    const task = scheduledTasks.get(name);
    if (!task) {
      return null;
    }

    return {
      name: task.name,
      isRunning: task.isRunning,
      lastRun: task.lastRun,
      nextRun: task.nextRun,
      runCount: task.runCount,
      intervalMs: task.intervalMs,
    };
  }

  // Get all scheduled tasks
  function getAllTasks() {
    const tasks = [];
    for (const [name, task] of scheduledTasks) {
      tasks.push({
        name: task.name,
        isRunning: task.isRunning,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        runCount: task.runCount,
        intervalMs: task.intervalMs,
      });
    }
    return tasks;
  }

  // Start scheduler
  function start() {
    if (isRunning) {
      logger.warn("Scheduler is already running");
      return;
    }

    isRunning = true;
    logger.info("Scheduler started");
  }

  // Stop scheduler
  function stop() {
    if (!isRunning) {
      logger.warn("Scheduler is not running");
      return;
    }

    // Cancel all tasks
    for (const [name, task] of scheduledTasks) {
      clearInterval(task.intervalId);
    }
    scheduledTasks.clear();

    isRunning = false;
    logger.info("Scheduler stopped");
  }

  // Utility functions for common intervals
  const intervals = {
    everyMinute: 60 * 1000,
    every5Minutes: 5 * 60 * 1000,
    every15Minutes: 15 * 60 * 1000,
    every30Minutes: 30 * 60 * 1000,
    everyHour: 60 * 60 * 1000,
    every6Hours: 6 * 60 * 60 * 1000,
    every12Hours: 12 * 60 * 60 * 1000,
    everyDay: 24 * 60 * 60 * 1000,
    everyWeek: 7 * 24 * 60 * 60 * 1000,
  };

  return {
    // Core functions
    scheduleTask,
    cancelTask,
    getTaskStatus,
    getAllTasks,

    // Scheduler control
    start,
    stop,

    // Utility intervals
    intervals,

    // Status
    isRunning: () => isRunning,
    getConfig: () => ({
      isRunning,
      totalTasks: scheduledTasks.size,
      tasks: getAllTasks(),
    }),
  };
}

