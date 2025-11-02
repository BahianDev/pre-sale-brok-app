"use client";

import { useState } from "react";
import Decimal from "decimal.js";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedBuyerState, ParsedState } from "@/lib/anchor/types";
import { claim as buildClaim } from "@/lib/anchor/tx";
import { getClientProgram } from "@/lib/anchor/client";
import { computeVestedBps } from "@/lib/format";
import { config } from "@/lib/config";

interface ClaimCardProps {
  state: ParsedState;
  buyerState: ParsedBuyerState | null;
  onRefresh?: () => Promise<void>;
}

export function ClaimCard({ state, buyerState, onRefresh }: ClaimCardProps) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!buyerState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Nenhuma contribuição encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  const totalAllocated = new Decimal(buyerState.allocatedTokens);
  const claimed = new Decimal(buyerState.claimedTokens);
  const vestedBps = computeVestedBps(
    Math.floor(Date.now() / 1000),
    state.tgeTs,
    state.tgeBps,
    state.cliffSeconds,
    state.vestingSeconds
  );
  const vestedAmount = totalAllocated.mul(vestedBps).div(10_000);
  const available = Decimal.max(vestedAmount.minus(claimed), 0);

  const handleClaim = async () => {
    if (!publicKey || !anchorWallet) {
      setStatus("Conecte uma carteira para executar o claim");
      return;
    }

    try {
      setLoading(true);
      const program = getClientProgram(anchorWallet);
      const { instruction } = await buildClaim({ program, buyer: publicKey, state });
      const tx = new Transaction().add(instruction);
      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, config.commitment);
      setStatus(`Claim enviado: ${signature}`);
      await onRefresh?.();
    } catch (error) {
      setStatus((error as Error).message ?? "Erro ao executar claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim</CardTitle>
        <p className="text-sm text-slate-400">Tokens disponíveis: {available.toFixed()}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>Total alocado: {totalAllocated.toFixed()}</p>
        <p>Já reivindicado: {claimed.toFixed()}</p>
        <p>Vested: {vestedBps / 100}%</p>
        <Button onClick={handleClaim} disabled={loading || available.lte(0)}>
          {loading ? "Enviando..." : "Claim"}
        </Button>
        {status && <p className="text-xs text-slate-400">{status}</p>}
      </CardContent>
    </Card>
  );
}

export default ClaimCard;
