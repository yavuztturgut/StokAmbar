import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const ingredients = await prisma.ingredient.findMany({
    where: { accountId: 1 }
  });
  console.log('Ingredients (Acc 1):', JSON.stringify(ingredients, null, 2));
}
main();
