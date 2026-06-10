// src/jobs/cronitorCliente.ts
import cronitor from "cronitor";
import cron from "node-cron";

const cronitorClient = cronitor(process.env.CRONITOR_API_KEY || "");

// Isso apenas injeta o monitoramento no node-cron (retorna void)
cronitorClient.wraps(cron);

// Exportamos o próprio cliente, que agora possui o método .schedule()
export { cronitorClient };
