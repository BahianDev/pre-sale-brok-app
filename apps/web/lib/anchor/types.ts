import type { IdlAccounts, IdlTypes } from "@coral-xyz/anchor";
import type presaleIdl from "../../../../anchor/idl/presale.json";

export type PresaleIdl = typeof presaleIdl;

export type InitializeParams = IdlTypes<PresaleIdl>["InitializeParams"];
export type Phase = IdlTypes<PresaleIdl>["Phase"];

export type PresaleStateAccount = IdlAccounts<PresaleIdl>["presaleState"];
export type BuyerStateAccount = IdlAccounts<PresaleIdl>["buyerState"];
export type WhitelistEntryAccount = IdlAccounts<PresaleIdl>["whitelistEntry"];

export interface ParsedPhaseStats {
  offered: number;
  sold: number;
  tokensPerSol: number;
  soldPercent: number;
}

export interface ParsedState {
  publicKey: string;
  authority: string;
  mint: string;
  vault: string;
  treasury: string;
  startTs: number;
  endTs: number;
  tgeTs: number;
  tgeBps: number;
  cliffSeconds: number;
  vestingSeconds: number;
  softCapLamports: string;
  hardCapLamports: string;
  totalRaisedLamports: string;
  currentPhase: "Whitelist" | "Public" | "Final";
  phaseStats: Record<"Whitelist" | "Public" | "Final", ParsedPhaseStats>;
  finalized: boolean;
  canceled: boolean;
  bump: number;
}

export interface ParsedBuyerState {
  publicKey: string;
  state: string;
  buyer: string;
  contributedLamports: string;
  allocatedTokens: string;
  claimedTokens: string;
  phaseTokens: Record<"Whitelist" | "Public" | "Final", string>;
}

export interface ParsedWhitelistEntry {
  publicKey: string;
  state: string;
  buyer: string;
  maxContributionLamports: string;
}
