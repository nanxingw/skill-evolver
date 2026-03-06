// Lightweight 5-field cron parser (min hour dom month dow)

export interface CronField {
  values: number[];
}

export interface CronExpression {
  minute: CronField;
  hour: CronField;
  dom: CronField;     // day of month
  month: CronField;
  dow: CronField;     // day of week (0=Sun)
}

const FIELD_RANGES: [number, number][] = [
  [0, 59],   // minute
  [0, 23],   // hour
  [1, 31],   // dom
  [1, 12],   // month
  [0, 6],    // dow
];

function parseField(token: string, min: number, max: number): CronField {
  const values = new Set<number>();

  for (const part of token.split(",")) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;
    const base = stepMatch ? stepMatch[1] : part;

    let rangeStart = min;
    let rangeEnd = max;

    if (base === "*") {
      // full range
    } else if (base.includes("-")) {
      const [lo, hi] = base.split("-").map(Number);
      rangeStart = lo;
      rangeEnd = hi;
    } else {
      // exact value — no step iteration
      values.add(parseInt(base, 10));
      continue;
    }

    for (let v = rangeStart; v <= rangeEnd; v += step) {
      values.add(v);
    }
  }

  return { values: Array.from(values).sort((a, b) => a - b) };
}

export function parseCron(expr: string): CronExpression {
  const tokens = expr.trim().split(/\s+/);
  if (tokens.length !== 5) {
    throw new Error(`Invalid cron expression: expected 5 fields, got ${tokens.length}`);
  }

  const fields = tokens.map((tok, i) => parseField(tok, FIELD_RANGES[i][0], FIELD_RANGES[i][1]));

  return {
    minute: fields[0],
    hour: fields[1],
    dom: fields[2],
    month: fields[3],
    dow: fields[4],
  };
}

function fieldMatches(field: CronField, value: number): boolean {
  return field.values.includes(value);
}

export function nextCronRun(expr: CronExpression, after?: Date): Date {
  const start = after ? new Date(after.getTime()) : new Date();
  // Advance by 1 minute (floor to minute boundary)
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1);

  const limit = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
  const cursor = new Date(start.getTime());

  while (cursor.getTime() < limit.getTime()) {
    const month = cursor.getMonth() + 1; // 1-based
    if (!fieldMatches(expr.month, month)) {
      // Jump to next month
      cursor.setMonth(cursor.getMonth() + 1, 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    const dom = cursor.getDate();
    const dow = cursor.getDay();
    if (!fieldMatches(expr.dom, dom) || !fieldMatches(expr.dow, dow)) {
      // Jump to next day
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }

    const hour = cursor.getHours();
    if (!fieldMatches(expr.hour, hour)) {
      // Jump to next hour
      cursor.setHours(cursor.getHours() + 1, 0, 0, 0);
      continue;
    }

    const minute = cursor.getMinutes();
    if (!fieldMatches(expr.minute, minute)) {
      // Jump to next minute
      cursor.setMinutes(cursor.getMinutes() + 1, 0, 0);
      continue;
    }

    return new Date(cursor.getTime());
  }

  throw new Error("No matching cron time found within 1 year");
}

export function describeCron(expr: string): string {
  const tokens = expr.trim().split(/\s+/);
  if (tokens.length !== 5) return expr;

  const [minTok, hourTok, domTok, monthTok, dowTok] = tokens;

  // Every N minutes: */N * * * *
  const stepMatch = minTok.match(/^\*\/(\d+)$/);
  if (stepMatch && hourTok === "*" && domTok === "*" && monthTok === "*" && dowTok === "*") {
    const n = parseInt(stepMatch[1], 10);
    return n === 1 ? "Every minute" : `Every ${n} minutes`;
  }

  // Every hour at :MM
  if (/^\d+$/.test(minTok) && hourTok === "*" && domTok === "*" && monthTok === "*" && dowTok === "*") {
    return `Every hour at :${minTok.padStart(2, "0")}`;
  }

  // Specific time(s) every day
  if (/^\d+$/.test(minTok) && domTok === "*" && monthTok === "*" && dowTok === "*") {
    const mm = minTok.padStart(2, "0");
    const hours = hourTok.split(",");
    if (hours.length === 1 && /^\d+$/.test(hours[0])) {
      return `Every day at ${hours[0].padStart(2, "0")}:${mm}`;
    }
    if (hours.every((h) => /^\d+$/.test(h))) {
      const times = hours.map((h) => `${h.padStart(2, "0")}:${mm}`).join(", ");
      return `Every day at ${times}`;
    }
  }

  // Specific weekday(s)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (/^\d+$/.test(minTok) && /^\d+$/.test(hourTok) && domTok === "*" && monthTok === "*" && /^[\d,]+$/.test(dowTok)) {
    const mm = minTok.padStart(2, "0");
    const hh = hourTok.padStart(2, "0");
    const days = dowTok.split(",").map((d) => dayNames[parseInt(d, 10)] ?? d).join(", ");
    return `${days} at ${hh}:${mm}`;
  }

  // Fallback: parse and describe generically
  return expr;
}
