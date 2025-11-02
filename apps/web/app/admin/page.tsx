import { PublicKey } from "@solana/web3.js";
import { config } from "@/lib/config";
import { deriveState } from "@/lib/anchor/pdas";
import { getReadonlyProgram } from "@/lib/anchor/server";
import { fetchState } from "@/lib/anchor/tx";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const authorityPk = new PublicKey(config.authority);
  const mintPk = new PublicKey(config.mint);
  const [statePk] = deriveState(authorityPk, mintPk);
  const program = getReadonlyProgram();
  let state: Awaited<ReturnType<typeof fetchState>> | null = null;

  try {
    state = await fetchState(program, statePk);
  } catch (error) {
    const message = (error as Error).message ?? "";
    if (!message.includes("Account does not exist")) {
      throw error;
    }
  }

  return <AdminClient state={state} statePk={statePk.toBase58()} />;
}
