import { PublicKey } from "@solana/web3.js";
import BuyerClient from "./BuyerClient";
import { config } from "@/lib/config";
import { deriveState } from "@/lib/anchor/pdas";
import { getReadonlyProgram } from "@/lib/anchor/server";
import { fetchState } from "@/lib/anchor/tx";

export default async function Page() {
  const authorityPk = new PublicKey(config.authority);
  const mintPk = new PublicKey(config.mint);
  const [statePk] = deriveState(authorityPk, mintPk);
  const program = getReadonlyProgram();
  const state = await fetchState(program, statePk);

  return <BuyerClient initialState={state} statePk={statePk.toBase58()} />;
}
