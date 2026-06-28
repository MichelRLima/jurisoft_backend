// src/shared/database/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prismaBase = new PrismaClient();

export const prisma = prismaBase.$extends({
  query: {
    // 1. MODELO DE PROCESSOS
    processos: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        // findUnique não aceita filtros complexos no where nativamente, transformamos em findFirst de segurança
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },

    // 2. MODELO DE PRAZOS
    prazos: {
      async findMany({ args, query }) {
        args.where = { ...args.where, processo: { deletedAt: null } };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, processo: { deletedAt: null } };
        return query(args);
      },
      async findUnique({ args, query }) {
        args.where = { ...args.where, processo: { deletedAt: null } };
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, processo: { deletedAt: null } };
        return query(args);
      },
    },

    // 3. MODELO DE ANEXOS DOS PROCESSOS
    anexosProcesso: {
      async findMany({ args, query }) {
        args.where = { ...args.where, processo: { deletedAt: null } };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, processo: { deletedAt: null } };
        return query(args);
      },
      async findUnique({ args, query }) {
        args.where = { ...args.where, processo: { deletedAt: null } };
        return query(args);
      },
    },
  },
});
