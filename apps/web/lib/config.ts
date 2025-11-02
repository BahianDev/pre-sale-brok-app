export const BUY_MODE = "pretransfer" as const;

const rawEnv = {
  NEXT_PUBLIC_SOLANA_RPC: process.env.NEXT_PUBLIC_SOLANA_RPC,
  NEXT_PUBLIC_SOLANA_COMMITMENT: process.env.NEXT_PUBLIC_SOLANA_COMMITMENT,
  NEXT_PUBLIC_PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID,
  NEXT_PUBLIC_MINT_ADDRESS: process.env.NEXT_PUBLIC_MINT_ADDRESS,
  NEXT_PUBLIC_AUTHORITY_ADDRESS: process.env.NEXT_PUBLIC_AUTHORITY_ADDRESS,
  NEXT_PUBLIC_SEED_STATE: process.env.NEXT_PUBLIC_SEED_STATE,
  NEXT_PUBLIC_SEED_WHITELIST: process.env.NEXT_PUBLIC_SEED_WHITELIST,
  NEXT_PUBLIC_SEED_BUYER: process.env.NEXT_PUBLIC_SEED_BUYER,
  NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
  NEXT_PUBLIC_STATE_ADDRESS: process.env.NEXT_PUBLIC_STATE_ADDRESS,
  NEXT_PUBLIC_STATE_BUMP: process.env.NEXT_PUBLIC_STATE_BUMP
} satisfies Record<string, string | undefined>;

function trimOrUndefined(value: string | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredEnv<K extends keyof typeof rawEnv>(name: K): string {
  const value = trimOrUndefined(rawEnv[name]);
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function optionalEnv<K extends keyof typeof rawEnv>(name: K): string | undefined {
  return trimOrUndefined(rawEnv[name]);
}

function optionalBumpEnv<K extends keyof typeof rawEnv>(name: K): number | undefined {
  const value = optionalEnv(name);
  if (value == null) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
    throw new Error(`Environment variable ${String(name)} must be an integer between 0 and 255 when provided`);
  }

  return parsed;
}

export const config = {
  rpcUrl: requiredEnv("NEXT_PUBLIC_SOLANA_RPC"),
  commitment: rawEnv.NEXT_PUBLIC_SOLANA_COMMITMENT ?? "confirmed",
  programId: requiredEnv("NEXT_PUBLIC_PROGRAM_ID"),
  mint: requiredEnv("NEXT_PUBLIC_MINT_ADDRESS"),
  authority: requiredEnv("NEXT_PUBLIC_AUTHORITY_ADDRESS"),
  seedState: optionalEnv("NEXT_PUBLIC_SEED_STATE") ?? "state",
  seedWhitelist: optionalEnv("NEXT_PUBLIC_SEED_WHITELIST") ?? "whitelist",
  seedBuyer: optionalEnv("NEXT_PUBLIC_SEED_BUYER") ?? "buyer",
  treasury: requiredEnv("NEXT_PUBLIC_TREASURY_ADDRESS"),
  stateAddress: optionalEnv("NEXT_PUBLIC_STATE_ADDRESS"),
  stateBump: optionalBumpEnv("NEXT_PUBLIC_STATE_BUMP")
} as const;

export type AppConfig = typeof config;
