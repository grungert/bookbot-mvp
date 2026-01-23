import { prisma } from '../src/lib/prisma';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'bojan.atman@gmail.com' },
    select: { id: true, email: true, image: true }
  });

  if (user) {
    console.log('Found user:', user.id, user.email);
    console.log('Image length:', user.image?.length || 0);
    console.log('Image starts with:', user.image?.substring(0, 50));

    if (user.image && user.image.length > 500) {
      await prisma.user.update({
        where: { id: user.id },
        data: { image: null }
      });
      console.log('Cleared base64 image');
    }
  } else {
    console.log('User not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
