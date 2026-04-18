import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default class CreateProcesso {
  async execute({ processo = {} }) {
    try {
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
    }
  }
}
