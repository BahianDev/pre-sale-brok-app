import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { config } from "./config";

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(config.rpcUrl || clusterApiUrl("devnet"), {
      commitment: config.commitment
    });
  }
  return connection;
}

export function toPublicKey(value: string | PublicKey): PublicKey {
  return typeof value === "string" ? new PublicKey(value) : value;
}
