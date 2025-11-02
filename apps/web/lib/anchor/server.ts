import { AnchorProvider, Program, type Wallet } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import presaleIdl from "../../../../anchor/idl/presale.json";
import { config } from "@/lib/config";
import { getConnection } from "@/lib/solana";
import type { PresaleIdl } from "./types";

const PROGRAM_ID = new PublicKey(config.programId);
const IDL = presaleIdl as PresaleIdl;

export function getServerProgram(authority: Keypair): Program<PresaleIdl> {
  const wallet: Wallet = {
    publicKey: authority.publicKey,
    signTransaction: async (tx: Transaction) => {
      tx.partialSign(authority);
      return tx;
    },
    signAllTransactions: async (txs: Transaction[]) => {
      txs.forEach((tx) => tx.partialSign(authority));
      return txs;
    }
  };

  const provider = new AnchorProvider(getConnection(), wallet, {
    commitment: config.commitment
  });
  return new Program<PresaleIdl>(IDL, PROGRAM_ID, provider);
}

export function getReadonlyProgram(): Program<PresaleIdl> {
  const dummy = Keypair.generate();
  return getServerProgram(dummy);
}
