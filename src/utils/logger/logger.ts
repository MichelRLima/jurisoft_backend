import { createLogger, transports, format, Logger } from "winston";

// 1. Definimos uma interface para dizer ao TS que o objeto terá um timestamp
interface LogInfo {
  timestamp?: string;
  level: string;
  message: string;
}

const logger: Logger = createLogger({
  level: "debug",
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "DD/MM/YYYY HH:mm:ss.SSS" }),
    // 2. Aplicamos a interface aqui no printf
    format.printf((info) => {
      const { timestamp, level, message } = info as LogInfo;
      return `${timestamp} [${level}]: ${message}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
});

export default logger;
