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
  NEXT_PUBLIC_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_TREASURY_ADDRESS
} satisfies Record<string, string | undefined>;

function requiredEnv<K extends keyof typeof rawEnv>(name: K): string {
  const value = rawEnv[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const config = {
  rpcUrl: requiredEnv("NEXT_PUBLIC_SOLANA_RPC"),
  commitment: rawEnv.NEXT_PUBLIC_SOLANA_COMMITMENT ?? "confirmed",
  programId: requiredEnv("NEXT_PUBLIC_PROGRAM_ID"),
  mint: requiredEnv("NEXT_PUBLIC_MINT_ADDRESS"),
  authority: requiredEnv("NEXT_PUBLIC_AUTHORITY_ADDRESS"),
  seedState: rawEnv.NEXT_PUBLIC_SEED_STATE ?? "state",
  seedWhitelist: rawEnv.NEXT_PUBLIC_SEED_WHITELIST ?? "whitelist",
  seedBuyer: rawEnv.NEXT_PUBLIC_SEED_BUYER ?? "buyer",
  treasury: requiredEnv("NEXT_PUBLIC_TREASURY_ADDRESS")
} as const;

export type AppConfig = typeof config;
