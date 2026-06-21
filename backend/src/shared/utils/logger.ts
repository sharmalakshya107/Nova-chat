type LogMeta = Record<string, string | number | boolean | undefined>;

const format = (level: string, message: string, meta?: LogMeta): string => {
  if (!meta) return `[${level}] ${message}`;
  const pairs = Object.entries(meta)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`);
  return pairs.length > 0
    ? `[${level}] ${message} | ${pairs.join(" ")}`
    : `[${level}] ${message}`;
};

export const logger = {
  info(message: string, meta?: LogMeta): void {
    console.log(format("INFO", message, meta));
  },
  warn(message: string, meta?: LogMeta): void {
    console.warn(format("WARN", message, meta));
  },
  error(message: string, meta?: LogMeta): void {
    console.error(format("ERROR", message, meta));
  },
};

export const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
};
