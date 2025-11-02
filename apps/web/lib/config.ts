export const BUY_MODE = "pretransfer" as const;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export const config = {
  rpcUrl: requiredEnv("NEXT_PUBLIC_SOLANA_RPC"),
  commitment: process.env.NEXT_PUBLIC_SOLANA_COMMITMENT ?? "confirmed",
  programId: requiredEnv("NEXT_PUBLIC_PROGRAM_ID"),
  mint: requiredEnv("NEXT_PUBLIC_MINT_ADDRESS"),
  authority: requiredEnv("NEXT_PUBLIC_AUTHORITY_ADDRESS"),
  seedState: process.env.NEXT_PUBLIC_SEED_STATE ?? "state",
  seedWhitelist: process.env.NEXT_PUBLIC_SEED_WHITELIST ?? "whitelist",
  seedBuyer: process.env.NEXT_PUBLIC_SEED_BUYER ?? "buyer",
  treasury: requiredEnv("NEXT_PUBLIC_TREASURY_ADDRESS")
} as const;

export type AppConfig = typeof config;
