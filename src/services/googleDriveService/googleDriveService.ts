// src/services/googleDriveService/googleDriveService.ts
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import "dotenv/config";

let client: any;
let tokenData: any;

// --- 1. CARREGAMENTO DAS CREDENCIAIS (CLIENT ID / SECRET) ---
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    const keys = JSON.parse(
      process.env.GOOGLE_CREDENTIALS_JSON.trim().replace(/^'|'$/g, ""),
    );
    client = keys.installed || keys.web;
  } catch (err) {
    console.error("Erro no parse de GOOGLE_CREDENTIALS_JSON:", err);
  }
}

if (!client) {
  const KEY_PATH = path.join(process.cwd(), "credentials.json");
  if (fs.existsSync(KEY_PATH)) {
    client =
      JSON.parse(fs.readFileSync(KEY_PATH, "utf8")).installed ||
      JSON.parse(fs.readFileSync(KEY_PATH, "utf8")).web;
  }
}

if (!client) throw new Error("Credenciais do Google não encontradas.");

// --- 2. CONFIGURAÇÃO DO CLIENTE OAUTH2 ---
export const oauth2Client = new google.auth.OAuth2(
  client.client_id,
  client.client_secret,
  process.env.NODE_ENV === "production"
    ? "https://seu-app-no-render.onrender.com/oauth2callback"
    : "http://localhost:3333/oauth2callback",
);

// --- 3. CARREGAMENTO DO TOKEN (ACCESS / REFRESH TOKEN) ---
// Tenta primeiro pela Variável de Ambiente (Render)
if (process.env.GOOGLE_TOKEN_JSON) {
  try {
    tokenData = JSON.parse(
      process.env.GOOGLE_TOKEN_JSON.trim().replace(/^'|'$/g, ""),
    );
    oauth2Client.setCredentials(tokenData);
    console.log("✅ Token do Google carregado via Variável de Ambiente.");
  } catch (err) {
    console.error("Erro no parse de GOOGLE_TOKEN_JSON:", err);
  }
}

// Se não houver variável, tenta pelo arquivo local (Desenvolvimento)
if (!tokenData) {
  const TOKEN_PATH = path.join(process.cwd(), "token.json");
  if (fs.existsSync(TOKEN_PATH)) {
    tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oauth2Client.setCredentials(tokenData);
    console.log("✅ Token do Google carregado via arquivo local.");
  }
}

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];
