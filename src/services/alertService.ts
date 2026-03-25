export type LogEntryField = {
  id: string;
  label: string;
  value: string | boolean;
  unit: string;
  hasBreach: boolean;
  correctiveAction?: string;
};

export type StationLog = {
  id: string;
  station_name: string;
  staff_name: string;
  performed_at: string;
  is_breach: boolean;
  fields: LogEntryField[];
};

export const MOCK_LOGS: StationLog[] = [
  {
    id: "log_001",
    station_name: "Cold Storage",
    staff_name: "Sarah Jenkins",
    performed_at: new Date(Date.now() - 40 * 60000).toISOString(), // 40 mins ago
    is_breach: true,
    fields: [
      { id: "wic", label: "Walk-in cooler temperature", value: "5.2", unit: "°C", hasBreach: true, correctiveAction: "" }, 
      { id: "pct", label: "Prep cooler temperature", value: "3.1", unit: "°C", hasBreach: false, correctiveAction: "" },
    ],
  },
  {
    id: "log_002",
    station_name: "Hot Holding",
    staff_name: "Mike Chen",
    performed_at: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hrs ago
    is_breach: true,
    fields: [
      { id: "stt", label: "Steam table temperature", value: "52.0", unit: "°C", hasBreach: true, correctiveAction: "Adjusted steam table thermostat to max. Monitored for 15 mins to verify rise." },
    ],
  },
  {
    id: "log_003",
    station_name: "Sanitation & Chemicals",
    staff_name: "Alex Rivera",
    performed_at: new Date(Date.now() - 150 * 60000).toISOString(), // 2.5 hrs ago
    is_breach: false,
    fields: [
      { id: "snc", label: "Sanitizer concentration", value: "200", unit: "ppm", hasBreach: false, correctiveAction: "" },
      { id: "stp", label: "Surface test passed", value: "Pass", unit: "", hasBreach: false, correctiveAction: "" },
    ],
  },
];

export const MOCK_STATION_CONFIG = {
  "hot": { frequencyHours: 4, lastLoggedAt: new Date(Date.now() - 5.5 * 3600000).toISOString() }, // 5.5 hours ago -> Overdue! >1 hr overdue -> Email
  "cold": { frequencyHours: 4, lastLoggedAt: new Date(Date.now() - 4.2 * 3600000).toISOString() }, // 4.2 hours -> Banner overdue
  "san": { frequencyHours: 2, lastLoggedAt: new Date(Date.now() - 1 * 3600000).toISOString() }, // 1 hr ago -> Okay
};

export const NotificationHandler = {
  checkAlerts: () => {
    const alerts = {
      level1: [] as string[],
      level2: [] as string[],
      level3: [] as string[],
    };

    const now = Date.now();

    // Check Missed Logs (Level 1 & 2)
    Object.entries(MOCK_STATION_CONFIG).forEach(([station, config]) => {
      const elapsedHours = (now - new Date(config.lastLoggedAt).getTime()) / 3600000;
      if (elapsedHours > config.frequencyHours) {
        alerts.level1.push(`Task Overdue: ${station} log was due ${Math.round((elapsedHours - config.frequencyHours) * 60)} mins ago.`);
      }
      if (elapsedHours > config.frequencyHours + 1) {
        alerts.level2.push(`[EMAIL MOCK] Management Alert: ${station} log is >1 hour overdue!`);
      }
    });

    // Check Unresolved Breaches (Level 3)
    MOCK_LOGS.forEach((log) => {
      if (log.is_breach) {
        log.fields.forEach((f) => {
          if (f.hasBreach && !f.correctiveAction) {
            const elapsedMins = (now - new Date(log.performed_at).getTime()) / 60000;
            if (elapsedMins > 30) {
              alerts.level3.push(`[SMS TWILIO STUB] Critical Alert to Owner: Unresolved breach on ${log.station_name} for >30 mins!`);
            }
          }
        });
      }
    });

    return alerts;
  }
};
