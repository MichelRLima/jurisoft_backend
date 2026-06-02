import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Exportamos o s3Client caso algum model precise de acesso direto a comandos avançados
export const s3Client = new S3Client({
  region: "auto", // A Cloudflare recomenda "auto" em vez de "us-east-1"
  endpoint: process.env.R2_ENDPOINT as string,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY as string,
    secretAccessKey: process.env.R2_SECRET_KEY as string,
  },
  forcePathStyle: true,
});

/**
 * 1. Fazer Upload de um Arquivo
 * @param fileBuffer O buffer do arquivo (vindo do multer ou base64)
 * @param fileName O caminho onde será salvo (ex: escritorios/123/perfis/foto.jpg)
 * @param mimeType O tipo do arquivo (ex: image/jpeg)
 * @param isPublic Se true, envia para o bucket de arquivos públicos
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  isPublic: boolean = false,
) {
  // Decide dinamicamente o destino
  const bucketName = isPublic
    ? process.env.R2_BUCKET_PERFIS_NAME
    : process.env.R2_BUCKET_NAME;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return { success: true, path: fileName };
}

/**
 * 2. Gerar Link Seguro Temporário (Exclusivo para o Bucket Privado)
 * @param fileName O caminho do arquivo salvo (ex: processos/123/doc.pdf)
 * @returns URL que expira automaticamente em 1 hora
 */
export async function getSecureUrl(fileName: string) {
  // Como fotos de perfil já têm link público, essa função aponta direto para o cofre
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
}

/**
 * 3. Deletar um Arquivo
 * @param fileName O caminho do arquivo salvo
 * @param isPublic Se true, deleta do bucket de arquivos públicos
 */
export async function deleteFile(fileName: string, isPublic: boolean = false) {
  const bucketName = isPublic
    ? process.env.R2_BUCKET_PERFIS_NAME
    : process.env.R2_BUCKET_NAME;

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  await s3Client.send(command);
  return { success: true };
}
