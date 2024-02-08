import { genSalt, hash, compare } from "bcrypt";

export async function createHashPassword(password: string) {
  const salt = await genSalt(10);
  const hashed = await hash(password, salt);
  return hashed;
}

export async function validateHashPassword(password: string, hash: string) {
  return await compare(password, hash);
}
