import "server-only";
import bcrypt from "bcryptjs";

const ROUNDS = 10;

// Compared against when a name doesn't exist, so sign-in takes the same time
// whether or not the player is registered.
const DUMMY_HASH = "$2b$10$Wv2IEXtp5UUQXjImwUIb9O7MZ/D.s/NgHj4qWA371bsjCpatvmILy";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  return bcrypt.compare(password, hash ?? DUMMY_HASH).then((ok) => ok && hash !== null);
}
