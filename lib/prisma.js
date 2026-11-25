import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

/**
 * Client Prisma unique par processus. En développement, il est conservé sur
 * globalThis pour éviter les multiples connexions lors des rechargements à chaud.
 */
export const prisma =
  globalForPrisma.__autoGlPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__autoGlPrisma = prisma
}

export default prisma
