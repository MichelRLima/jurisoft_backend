import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const ALGORITHM = "aes-256-gcm";

// 1. Converte a string hexadecimal do .env para um Buffer de exatamente 32 bytes
const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");

// 2. Validação Fail-Fast: Se o tamanho não for 32 bytes, a aplicação nem inicia,
// facilitando a identificação do erro antes mesmo de tentar salvar no banco.
if (keyBuffer.length !== 32) {
  throw new Error(
    `A ENCRYPTION_KEY deve ter exatamente 32 bytes. Tamanho atual: ${keyBuffer.length} bytes. Verifique seu .env.`,
  );
}

export function encryptDado(text: string): string {
  const iv = crypto.randomBytes(16);
  // Usa o keyBuffer validado
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptDado(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  // Usa o keyBuffer validado
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    keyBuffer,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
