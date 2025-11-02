import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import type {
  ParsedState,
  ParsedBuyerState,
  ParsedWhitelistEntry,
  PresaleIdl,
  InitializeParams
} from "./types";
import { deriveBuyerState, deriveState, deriveWhitelist } from "./pdas";
import { fetchParsedBuyerState, fetchParsedState, fetchParsedWhitelist } from "./parse";

export async function fetchState(
  program: Program<PresaleIdl>,
  statePk: PublicKey
): Promise<ParsedState> {
  return fetchParsedState(program, statePk);
}

export async function fetchBuyerState(
  program: Program<PresaleIdl>,
  statePk: PublicKey,
  buyerPk: PublicKey
): Promise<ParsedBuyerState | null> {
  const [buyerStatePk] = deriveBuyerState(statePk, buyerPk);
  return fetchParsedBuyerState(program, buyerStatePk);
}

export async function fetchWhitelist(
  program: Program<PresaleIdl>,
  statePk: PublicKey,
  buyerPk: PublicKey
): Promise<ParsedWhitelistEntry | null> {
  const [whitelistPk] = deriveWhitelist(statePk, buyerPk);
  return fetchParsedWhitelist(program, whitelistPk);
}

export function getCurrentPhaseLabel(state: ParsedState): "Whitelist" | "Public" | "Final" {
  return state.currentPhase;
}

export function buildTransferLamportsIx(
  from: PublicKey,
  to: PublicKey,
  lamports: bigint
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: Number(lamports)
  });
}

interface BuyArgs {
  program: Program<PresaleIdl>;
  buyer: PublicKey;
  state: ParsedState;
  lamports: bigint;
}

export async function buy({ program, buyer, state, lamports }: BuyArgs) {
  const authorityPk = new PublicKey(state.authority);
  const mintPk = new PublicKey(state.mint);
  const [derivedStatePk] = deriveState(authorityPk, mintPk);
  const statePk = new PublicKey(state.publicKey);

  if (!statePk.equals(derivedStatePk)) {
    throw new Error("State PDA mismatch with provided state data");
  }

  const [buyerStatePk] = deriveBuyerState(statePk, buyer);
  const transferIx = buildTransferLamportsIx(buyer, statePk, lamports);

  let whitelistPk: PublicKey | null = null;
  if (state.currentPhase === "Whitelist") {
    [whitelistPk] = deriveWhitelist(statePk, buyer);
  }

  const buyIx = await program.methods
    .buy(new BN(lamports.toString()))
    .accounts({
      buyer,
      state: statePk,
      buyerState: buyerStatePk,
      whitelist: whitelistPk ?? PublicKey.default,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  return {
    instructions: [transferIx, buyIx],
    buyerStatePk
  };
}

interface ClaimArgs {
  program: Program<PresaleIdl>;
  buyer: PublicKey;
  state: ParsedState;
}

export async function claim({ program, buyer, state }: ClaimArgs) {
  const statePk = new PublicKey(state.publicKey);
  const mintPk = new PublicKey(state.mint);
  const [buyerStatePk] = deriveBuyerState(statePk, buyer);
  const buyerAta = getAssociatedTokenAddressSync(mintPk, buyer, false);
  const vaultPk = new PublicKey(state.vault);

  const ix = await program.methods
    .claim()
    .accounts({
      buyer,
      state: statePk,
      buyerState: buyerStatePk,
      vault: vaultPk,
      buyerAta,
      mint: mintPk,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    })
    .instruction();

  return { instruction: ix };
}

interface RefundArgs {
  program: Program<PresaleIdl>;
  buyer: PublicKey;
  state: ParsedState;
}

export async function refund({ program, buyer, state }: RefundArgs) {
  const statePk = new PublicKey(state.publicKey);
  const [buyerStatePk] = deriveBuyerState(statePk, buyer);

  const ix = await program.methods
    .refund()
    .accounts({
      buyer,
      state: statePk,
      buyerState: buyerStatePk
    })
    .instruction();

  return { instruction: ix };
}

export async function initialize({
  program,
  authority,
  treasury,
  mint,
  params
}: {
  program: Program<PresaleIdl>;
  authority: PublicKey;
  treasury: PublicKey;
  mint: PublicKey;
  params: InitializeParams;
}) {
  const [statePk] = deriveState(authority, mint);
  const vaultPk = getAssociatedTokenAddressSync(mint, statePk, true);

  const ix = await program.methods
    .initialize(params)
    .accounts({
      authority,
      treasury,
      mint,
      vault: vaultPk,
      state: statePk,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY
    })
    .instruction();

  return { instruction: ix, statePk, vaultPk };
}

export async function whitelistSet({
  program,
  authority,
  statePk,
  buyer,
  maxContributionLamports
}: {
  program: Program<PresaleIdl>;
  authority: PublicKey;
  statePk: PublicKey;
  buyer: PublicKey;
  maxContributionLamports: bigint;
}) {
  const [whitelistPk] = deriveWhitelist(statePk, buyer);
  return program.methods
    .whitelistSet(new BN(maxContributionLamports.toString()))
    .accounts({
      authority,
      state: statePk,
      buyer,
      whitelist: whitelistPk,
      systemProgram: SystemProgram.programId
    })
    .instruction();
}

export async function advancePhase({
  program,
  authority,
  statePk
}: {
  program: Program<PresaleIdl>;
  authority: PublicKey;
  statePk: PublicKey;
}) {
  return program.methods
    .advancePhase()
    .accounts({
      authority,
      state: statePk
    })
    .instruction();
}

export async function finalize({
  program,
  authority,
  statePk,
  treasury
}: {
  program: Program<PresaleIdl>;
  authority: PublicKey;
  statePk: PublicKey;
  treasury: PublicKey;
}) {
  return program.methods
    .finalize()
    .accounts({
      authority,
      state: statePk,
      treasury,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .instruction();
}

export async function cancel({
  program,
  authority,
  statePk,
  treasury
}: {
  program: Program<PresaleIdl>;
  authority: PublicKey;
  statePk: PublicKey;
  treasury: PublicKey;
}) {
  return program.methods
    .cancel()
    .accounts({
      authority,
      state: statePk,
      treasury,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .instruction();
}

export async function withdrawFunds({
  program,
  authority,
  statePk,
  treasury
}: {
  program: Program<PresaleIdl>;
  authority: PublicKey;
  statePk: PublicKey;
  treasury: PublicKey;
}) {
  return program.methods
    .withdrawFunds()
    .accounts({
      authority,
      state: statePk,
      treasury,
      tokenProgram: TOKEN_PROGRAM_ID
    })
    .instruction();
}
