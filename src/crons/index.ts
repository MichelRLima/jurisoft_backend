// src/jobs/index.ts
import { iniciarJobVerificacaoPrazos } from "./alertaPrazos";
import { iniciarJobLimpezaProcessos } from "./hardDeleteProcessos";
import { iniciarJobLimpezaLogs } from "./limparLogs";
import { iniciarJobLimpezaNotificacoes } from "./limparNotificacoes";
// import { iniciarJobEmailLembrete } from "./emailLembretes";

export const startCronJobs = () => {
  console.log("🕒 Inicializando rotinas agendadas (Cronitor)...");

  iniciarJobLimpezaNotificacoes();
  iniciarJobLimpezaLogs();
  iniciarJobVerificacaoPrazos();
  iniciarJobLimpezaProcessos();
  // iniciarJobEmailLembrete();
};
