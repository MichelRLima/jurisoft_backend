// src/jobs/index.ts
import { iniciarJobVerificacaoPrazos } from "./alertaPrazos";
import { iniciarJobLimpezaLogs } from "./limparLogs";
import { iniciarJobLimpezaNotificacoes } from "./limparNotificacoes";
// import { iniciarJobEmailLembrete } from "./emailLembretes";

export const startCronJobs = () => {
  console.log("🕒 Inicializando rotinas agendadas (Cronitor)...");

  iniciarJobLimpezaNotificacoes();
  iniciarJobLimpezaLogs();
  iniciarJobVerificacaoPrazos();
  // iniciarJobEmailLembrete();
};
