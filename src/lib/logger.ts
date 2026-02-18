import pino from "pino";

/**
 * Mask PII in log output.
 * - Email: "a****@example.com"
 * - Phone: "+1***4133"
 */
function maskPII(value: unknown): unknown {
  if (typeof value === "string") {
    // Email masking
    if (value.includes("@") && value.includes(".")) {
      const [local, domain] = value.split("@");
      if (local && domain) {
        return `${local[0]}****@${domain}`;
      }
    }
    // Phone masking (E.164 format)
    if (/^\+?\d{10,15}$/.test(value.replace(/[\s()-]/g, ""))) {
      const clean = value.replace(/[\s()-]/g, "");
      if (clean.length >= 6) {
        return `${clean.slice(0, 3)}***${clean.slice(-4)}`;
      }
    }
  }
  return value;
}

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  serializers: {
    email: maskPII,
    phone: maskPII,
    phoneSecondary: maskPII,
    to: maskPII,
    from: maskPII,
    leadPhone: maskPII,
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }),
});

/**
 * Create a child logger with a specific module name.
 */
export function createLogger(module: string) {
  return logger.child({ module });
}
