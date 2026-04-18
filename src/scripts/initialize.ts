import { PrismaClient } from "@prisma/client";
import { createUser } from "../models/user/createUser";

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

const inicializeUsers = async () => {
  try {
    const user = {
      login: process.env.FIRST_USER_LOGIN || "admin",
      password: process.env.FIRST_USER_PASSWORD || "admin",
      email: process.env.FIRST_USER_EMAIL || "projetoadvocacy@gmail.com",
    };
    const firstUser = await prisma.usuario.findUnique({
      where: {
        login: user?.login,
      },
    });

    if (firstUser) {
      console.log("🚀 Usuário admin ja cadastrado");
      return;
    } else {
      console.log("🚀 Criando usuário admin");
      await createUser.execute(user?.login, user?.password, user?.email, "1");
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar cadastros de usuários:", error);
    throw error; // Lança o erro para o initializeApp tratar (parar o servidor)
  }
};

export const initializeApp = async () => {
  console.log("🚀 Executando scripts de inicialização...");

  try {
    await initializeStatusProcesso();
    await inicializeUsers();

    console.log("✅ Inicialização concluída com sucesso!");
  } catch (error) {
    console.error("❌ Falha na inicialização:", error);
    process.exit(1); // Encerra o processo se a inicialização for crítica
  }
};
