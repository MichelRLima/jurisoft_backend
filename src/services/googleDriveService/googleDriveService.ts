// src/services/googleDriveService.ts
import { google } from "googleapis";
import path from "path";
import fs from "fs";

// Caminho para o arquivo que você baixou do Google
const KEY_PATH = path.join(process.cwd(), "credentials.json");
console.log(KEY_PATH);

// Carrega o conteúdo do JSON
const keys = JSON.parse(fs.readFileSync(KEY_PATH, "utf8"));
const client = keys.installed || keys.web; // O Google muda o nome da chave dependendo do tipo de app

export const oauth2Client = new google.auth.OAuth2(
  client.client_id,
  client.client_secret,
  "http://localhost:3333/oauth2callback", // Ele pega a primeira URL de redirecionamento que você cadastrou
);

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];
