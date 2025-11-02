import { PublicKey } from "@solana/web3.js";
import { config } from "@/lib/config";
import { PROGRAM_ID } from "./client";

function toSeedBuffer(seed: string): Buffer {
  return Buffer.from(seed);
}

export function deriveState(authority: PublicKey, mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [toSeedBuffer(config.seedState), authority.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveWhitelist(state: PublicKey, buyer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [toSeedBuffer(config.seedWhitelist), state.toBuffer(), buyer.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveBuyerState(state: PublicKey, buyer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [toSeedBuffer(config.seedBuyer), state.toBuffer(), buyer.toBuffer()],
    PROGRAM_ID
  );
}
