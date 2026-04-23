import { sendCustomEmail } from './email';

type ScheduledTask = {
  id: string;
  to: string;
  subject: string;
  message: string;
  scheduledTime: Date;
  executed: boolean;
};

// In-memory storage for tasks. Note: This will be cleared on server restart.
let tasks: ScheduledTask[] = [];

// Avoid multiple interval initializations
let intervalId: NodeJS.Timeout | null = null;

export function scheduleEmail(to: string, subject: string, message: string, scheduledTime: Date) {
  const newTask: ScheduledTask = {
    id: Math.random().toString(36).substring(7),
    to,
    subject,
    message,
    scheduledTime,
    executed: false,
  };

  tasks.push(newTask);
  console.log(`E-posta planlandı: ${to} için ${scheduledTime.toLocaleString()}`);

  if (!intervalId) {
    startScheduler();
  }

  return newTask.id;
}

function startScheduler() {
  console.log('E-posta planlayıcı başlatıldı.');
  intervalId = setInterval(async () => {
    const now = new Date();

    for (const task of tasks) {
      if (!task.executed && now >= task.scheduledTime) {
        task.executed = true;
        console.log(`Planlanan e-posta gönderiliyor: ${task.to}`);
        await sendCustomEmail(task.to, task.subject, task.message);
      }
    }

    // Clean up executed tasks
    tasks = tasks.filter(t => !t.executed);

    if (tasks.length === 0 && intervalId) {
      // We could stop the interval to save resources, but keeping it simple for now
    }
  }, 30000); // Check every 30 seconds
}

export function getScheduledTasks() {
  return tasks;
}
