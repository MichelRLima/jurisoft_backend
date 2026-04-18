import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initializeStatusProcesso = async () => {
  try {
    const statusInitialize = [
      {
        nomeStatus: "Concluído",
        codigoStatus: "concluido",
        status: true,
      },
      {
        nomeStatus: "Urgente",
        codigoStatus: "urgente",
        status: true,
      },
      {
        nomeStatus: "Em andamento",
        codigoStatus: "em_andamento",
        status: true,
      },
      {
        nomeStatus: "Documentação Pendente",
        codigoStatus: "documentacao_pendente",
        status: true,
      },
    ];

    console.log("🔄 Sincronizando status dos processos...");

    // 1. UPSERT (Update ou Insert): Para cada item no seu array
    // Se o codigoStatus existir, ele atualiza o nome e o status. Se não existir, ele cria.
    for (const item of statusInitialize) {
      await prisma.statusProcesso.upsert({
        where: { codigoStatus: item.codigoStatus },
        update: {
          nomeStatus: item.nomeStatus,
          ativo: item.status,
        },
        create: {
          nomeStatus: item.nomeStatus,
          codigoStatus: item.codigoStatus,
          ativo: item.status,
        },
      });
    }

    // 2. DELETE: Remove do banco o que não está na sua lista do código
    // Pegamos todos os códigos que você quer manter
    const codigosManter = statusInitialize?.map((s) => s.codigoStatus);

    // Deletamos qualquer registro cujo codigoStatus NÃO esteja na lista acima
    const deletados = await prisma.statusProcesso.deleteMany({
      where: {
        codigoStatus: {
          notIn: codigosManter,
        },
      },
    });

    if (deletados.count > 0) {
      console.log(`🗑️  ${deletados.count} status antigos removidos.`);
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar status:", error);
    throw error; // Lança o erro para o initializeApp tratar (parar o servidor)
  }
};

export const initializeApp = async () => {
  console.log("🚀 Executando scripts de inicialização...");
  await initializeStatusProcesso();
  try {
    // Exemplo: Verificar conexão com DB, rodar migrations, seed de admin, etc.
    // await database.connect();
    // await seedUsers();

    console.log("✅ Inicialização concluída com sucesso!");
  } catch (error) {
    console.error("❌ Falha na inicialização:", error);
    process.exit(1); // Encerra o processo se a inicialização for crítica
  }
};
