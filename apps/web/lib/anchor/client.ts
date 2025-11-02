"use client";

import { AnchorProvider, Program, type Wallet } from "@coral-xyz/anchor";
import { type AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import presaleIdl from "../../../../anchor/idl/presale.json";
import { config } from "@/lib/config";
import { getConnection } from "@/lib/solana";
import type { PresaleIdl } from "./types";

const PROGRAM_ID = new PublicKey(config.programId);
const IDL = presaleIdl as PresaleIdl;

const readonlyWallet: Wallet = {
  publicKey: PublicKey.default,
  signTransaction: async (tx) => tx,
  signAllTransactions: async (txs) => txs
};

export function getClientProgram(wallet: AnchorWallet): Program<PresaleIdl> {
  const provider = new AnchorProvider(getConnection(), wallet as unknown as Wallet, {
    commitment: config.commitment
  });
  return new Program<PresaleIdl>(IDL, PROGRAM_ID, provider);
}

export function getReadonlyClientProgram(): Program<PresaleIdl> {
  const provider = new AnchorProvider(getConnection(), readonlyWallet, {
    commitment: config.commitment
  });
  return new Program<PresaleIdl>(IDL, PROGRAM_ID, provider);
}

export { PROGRAM_ID };
