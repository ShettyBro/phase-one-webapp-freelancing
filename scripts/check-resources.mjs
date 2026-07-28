import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const resources = await prisma.resource.findMany({ include: { category: true, file: true } });
  console.log('RESOURCES:', JSON.stringify(resources, null, 2));
  const categories = await prisma.resourceCategory.findMany({ include: { resources: true } });
  console.log('CATEGORIES:', JSON.stringify(categories, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
