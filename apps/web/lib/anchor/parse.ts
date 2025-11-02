import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { PresaleIdl, PresaleStateAccount, BuyerStateAccount, WhitelistEntryAccount } from "./types";
import type { ParsedState, ParsedBuyerState, ParsedWhitelistEntry } from "./types";

const PHASE_ORDER: Array<"Whitelist" | "Public" | "Final"> = [
  "Whitelist",
  "Public",
  "Final"
];

function bnToString(value: BN): string {
  return value.toString();
}

function parseStateAccount(account: PresaleStateAccount, pubkey: PublicKey): ParsedState {
  const phaseStats = {
    Whitelist: {
      offered: account.phase1TokensOffered.toNumber(),
      sold: account.phase1SoldTokens.toNumber(),
      tokensPerSol: account.phase1TokensPerSol.toNumber(),
      soldPercent:
        account.phase1TokensOffered.eq(new BN(0))
          ? 0
          : account.phase1SoldTokens.mul(new BN(10_000)).div(account.phase1TokensOffered).toNumber() / 100
    },
    Public: {
      offered: account.phase2TokensOffered.toNumber(),
      sold: account.phase2SoldTokens.toNumber(),
      tokensPerSol: account.phase2TokensPerSol.toNumber(),
      soldPercent:
        account.phase2TokensOffered.eq(new BN(0))
          ? 0
          : account.phase2SoldTokens.mul(new BN(10_000)).div(account.phase2TokensOffered).toNumber() / 100
    },
    Final: {
      offered: account.phase3TokensOffered.toNumber(),
      sold: account.phase3SoldTokens.toNumber(),
      tokensPerSol: account.phase3TokensPerSol.toNumber(),
      soldPercent:
        account.phase3TokensOffered.eq(new BN(0))
          ? 0
          : account.phase3SoldTokens.mul(new BN(10_000)).div(account.phase3TokensOffered).toNumber() / 100
    }
  } as const;

  return {
    publicKey: pubkey.toBase58(),
    authority: account.authority.toBase58(),
    mint: account.mint.toBase58(),
    vault: account.vault.toBase58(),
    treasury: account.treasury.toBase58(),
    startTs: account.startTs.toNumber(),
    endTs: account.endTs.toNumber(),
    tgeTs: account.tgeTs.toNumber(),
    tgeBps: account.tgeBps,
    cliffSeconds: account.cliffSeconds.toNumber(),
    vestingSeconds: account.vestingSeconds.toNumber(),
    softCapLamports: bnToString(account.softCapLamports),
    hardCapLamports: bnToString(account.hardCapLamports),
    totalRaisedLamports: bnToString(account.totalRaisedLamports),
    currentPhase: PHASE_ORDER[account.currentPhase] ?? "Whitelist",
    phaseStats: phaseStats as ParsedState["phaseStats"],
    finalized: account.finalized,
    canceled: account.canceled,
    bump: account.bump
  };
}

function parseBuyerState(account: BuyerStateAccount, pubkey: PublicKey): ParsedBuyerState {
  return {
    publicKey: pubkey.toBase58(),
    state: account.state.toBase58(),
    buyer: account.buyer.toBase58(),
    contributedLamports: bnToString(account.contributedLamports),
    allocatedTokens: bnToString(account.allocatedTokens),
    claimedTokens: bnToString(account.claimedTokens),
    phaseTokens: {
      Whitelist: bnToString(account.phase1Tokens),
      Public: bnToString(account.phase2Tokens),
      Final: bnToString(account.phase3Tokens)
    }
  };
}

function parseWhitelist(account: WhitelistEntryAccount, pubkey: PublicKey): ParsedWhitelistEntry {
  return {
    publicKey: pubkey.toBase58(),
    state: account.state.toBase58(),
    buyer: account.buyer.toBase58(),
    maxContributionLamports: bnToString(account.maxContributionLamports)
  };
}

export async function fetchParsedState(
  program: Program<PresaleIdl>,
  statePk: PublicKey
): Promise<ParsedState> {
  const account = await program.account.presaleState.fetch(statePk);
  return parseStateAccount(account, statePk);
}

export async function fetchParsedBuyerState(
  program: Program<PresaleIdl>,
  buyerStatePk: PublicKey
): Promise<ParsedBuyerState | null> {
  try {
    const account = await program.account.buyerState.fetch(buyerStatePk);
    return parseBuyerState(account, buyerStatePk);
  } catch (error) {
    if ((error as Error).message?.includes("Account does not exist")) {
      return null;
    }
    throw error;
  }
}

export async function fetchParsedWhitelist(
  program: Program<PresaleIdl>,
  whitelistPk: PublicKey
): Promise<ParsedWhitelistEntry | null> {
  try {
    const account = await program.account.whitelistEntry.fetch(whitelistPk);
    return parseWhitelist(account, whitelistPk);
  } catch (error) {
    if ((error as Error).message?.includes("Account does not exist")) {
      return null;
    }
    throw error;
  }
}
