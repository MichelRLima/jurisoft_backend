import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Inicializando o cliente compatível com S3 apontando para o R2
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY as string,
    secretAccessKey: process.env.R2_SECRET_KEY as string,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * 1. Fazer Upload de um Arquivo
 * @param fileBuffer O buffer do arquivo (vindo do multer, por exemplo)
 * @param fileName O caminho onde será salvo (ex: clientes/123/proc-45/doc.pdf)
 * @param mimeType O tipo do arquivo (ex: application/pdf)
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return { success: true, path: fileName };
}

/**
 * 2. Gerar Link Seguro Temporário (Para Receber/Baixar o Arquivo)
 * @param fileName O caminho do arquivo salvo (ex: clientes/123/proc-45/doc.pdf)
 * @returns URL que expira automaticamente
 */
export async function getSecureUrl(fileName: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  // Gera o link que o cliente usará. Expira em 3600 segundos (1 hora).
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
}

/**
 * 3. Deletar um Arquivo
 * @param fileName O caminho do arquivo salvo
 */
export async function deleteFile(fileName: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  await s3Client.send(command);
  return { success: true };
}
