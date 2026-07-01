import { randomInt } from 'crypto';
import { prisma } from './prisma';

// Unambiguous uppercase alphanumeric (no 0/O/1/I) for legible Application IDs.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Generates a random Application ID of the form COMUN26-XXXXXX. */
export function generateApplicationId(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(0, ALPHABET.length)];
  return `COMUN26-${code}`;
}

/** Generates an Application ID guaranteed not to collide with an existing one. */
export async function generateUniqueApplicationId(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const id = generateApplicationId();
    const existing = await prisma.registration.findUnique({
      where: { applicationId: id },
      select: { id: true },
    });
    if (!existing) return id;
  }
  throw new Error('Could not generate a unique Application ID.');
}
