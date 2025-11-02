import { PublicKey } from "@solana/web3.js";
import { config } from "@/lib/config";
import { PROGRAM_ID } from "./client";

const configuredStatePda = (() => {
  if (!config.stateAddress) {
    return null;
  }

  try {
    return {
      publicKey: new PublicKey(config.stateAddress),
      bump: config.stateBump ?? 0
    } as const;
  } catch (error) {
    throw new Error("Invalid NEXT_PUBLIC_STATE_ADDRESS provided", { cause: error });
  }
})();

function toSeedBuffer(seed: string, label: string): Buffer {
  const normalized = seed.trim();
  if (!normalized) {
    throw new Error(`Missing seed for ${label} PDA derivation`);
  }

  const buffer = Buffer.from(normalized, "utf8");
  if (buffer.length > 32) {
    throw new Error(
      `Seed for ${label} PDA derivation exceeds 32 bytes. Check NEXT_PUBLIC_SEED_${label.toUpperCase()} in your environment.`
    );
  }

  return buffer;
}

function findProgramAddress(label: string, seeds: (Buffer | Uint8Array)[]): [PublicKey, number] {
  try {
    return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
  } catch (error) {
    throw new Error(`Unable to derive ${label} PDA. Verify the configured seeds and addresses.`, { cause: error });
  }
}

export function deriveState(authority: PublicKey, mint: PublicKey): [PublicKey, number] {
  if (configuredStatePda) {
    return [configuredStatePda.publicKey, configuredStatePda.bump];
  }

  return findProgramAddress("state", [
    toSeedBuffer(config.seedState, "state"),
    authority.toBuffer(),
    mint.toBuffer()
  ]);
}

export function deriveWhitelist(state: PublicKey, buyer: PublicKey): [PublicKey, number] {
  return findProgramAddress("whitelist", [
    toSeedBuffer(config.seedWhitelist, "whitelist"),
    state.toBuffer(),
    buyer.toBuffer()
  ]);
}

export function deriveBuyerState(state: PublicKey, buyer: PublicKey): [PublicKey, number] {
  return findProgramAddress("buyer", [
    toSeedBuffer(config.seedBuyer, "buyer"),
    state.toBuffer(),
    buyer.toBuffer()
  ]);
}
