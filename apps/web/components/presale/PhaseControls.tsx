"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedState } from "@/lib/anchor/types";
import { formatLamports, lamportsToSol } from "@/lib/format";

interface PhaseControlsProps {
  state: ParsedState;
  onRefresh?: () => Promise<void>;
}

export function PhaseControls({ state, onRefresh }: PhaseControlsProps) {
  const { connection } = useConnection();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [stateBalance, setStateBalance] = useState<number>(0);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(new PublicKey(state.publicKey));
        setStateBalance(balance);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBalance();
  }, [connection, state.publicKey]);

  const callAction = async (path: string) => {
    try {
      setLoading(path);
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: state.publicKey })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Erro na ação do admin");
      }
      setStatus(payload.result ?? "Ação executada com sucesso");
      await onRefresh?.();
    } catch (error) {
      setStatus((error as Error).message ?? "Erro na ação do admin");
    } finally {
      setLoading(null);
    }
  };

  const stateBalanceSol = useMemo(() => formatLamports(stateBalance), [stateBalance]);
  const balanceIsZero = lamportsToSol(stateBalance).lte(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
        <p className="text-sm text-slate-400">Fase atual: {state.currentPhase}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => callAction("/api/admin/advance-phase")} disabled={loading !== null}>
            {loading === "/api/admin/advance-phase" ? "Processando..." : "Avançar fase"}
          </Button>
          <Button onClick={() => callAction("/api/admin/finalize")} disabled={loading !== null}>
            {loading === "/api/admin/finalize" ? "Processando..." : "Finalizar"}
          </Button>
          <Button onClick={() => callAction("/api/admin/cancel")} variant="destructive" disabled={loading !== null}>
            {loading === "/api/admin/cancel" ? "Processando..." : "Cancelar"}
          </Button>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-300">Saldo na conta do estado: {stateBalanceSol} SOL</p>
          <Button
            className="mt-3"
            onClick={() => callAction("/api/admin/withdraw")}
            disabled={loading !== null || balanceIsZero}
          >
            {loading === "/api/admin/withdraw" ? "Processando..." : "Withdraw"}
          </Button>
        </div>
        {status && <p className="text-xs text-slate-400">{status}</p>}
      </CardContent>
    </Card>
  );
}

export default PhaseControls;
