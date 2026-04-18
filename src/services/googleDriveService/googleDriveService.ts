// src/services/googleDriveService.ts
import { google } from "googleapis";
import path from "path";
import fs from "fs";

let client;

// 1. Tenta carregar da Variável de Ambiente (Render)
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    const keys = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    client = keys.installed || keys.web;
    console.log("Credenciais do Google carregadas via Variável de Ambiente.");
  } catch (err) {
    console.error(
      "Erro ao fazer parse da variável GOOGLE_CREDENTIALS_JSON",
      err,
    );
  }
}

// 2. Se não encontrou a variável, tenta carregar do arquivo local (Desenvolvimento)
if (!client) {
  const KEY_PATH = path.join(process.cwd(), "credentials.json");

  if (fs.existsSync(KEY_PATH)) {
    const keys = JSON.parse(fs.readFileSync(KEY_PATH, "utf8"));
    client = keys.installed || keys.web;
    console.log("Credenciais do Google carregadas via arquivo local.");
  } else {
    throw new Error(
      "Credenciais do Google não encontradas! Verifique a variável de ambiente ou o arquivo credentials.json.",
    );
  }
}

// Configuração do OAuth2
export const oauth2Client = new google.auth.OAuth2(
  client.client_id,
  client.client_secret,
  // DICA: No Render, essa URL deve ser a da sua API, não localhost!
  process.env.NODE_ENV === "production"
    ? "https://seu-app-no-render.onrender.com/oauth2callback"
    : "http://localhost:3333/oauth2callback",
);

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];
