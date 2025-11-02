import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

export function loadAdminKeypair(): Keypair {
  const raw = process.env.ADMIN_KEYPAIR_BASE58;
  if (!raw) {
    throw new Error("ADMIN_KEYPAIR_BASE58 não configurado no servidor");
  }

  try {
    if (raw.trim().startsWith("[")) {
      const secret = JSON.parse(raw) as number[];
      return Keypair.fromSecretKey(Uint8Array.from(secret));
    }
    const decoded = bs58.decode(raw.trim());
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    throw new Error(`Falha ao carregar chave ADMIN: ${(error as Error).message}`);
  }
}
