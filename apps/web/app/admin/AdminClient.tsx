"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import type { ParsedState } from "@/lib/anchor/types";
import { getReadonlyClientProgram } from "@/lib/anchor/client";
import { fetchState } from "@/lib/anchor/tx";
import { Button } from "@/components/ui/button";
import WhitelistForm from "@/components/presale/WhitelistForm";
import PhaseControls from "@/components/presale/PhaseControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { config } from "@/lib/config";
import { ConnectButton } from "@/components/wallet/ConnectButton";

interface AdminClientProps {
  state: ParsedState;
  statePk: string;
}

export default function AdminClient({ state: initialState, statePk }: AdminClientProps) {
  const wallet = useWallet();
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const program = useMemo(() => getReadonlyClientProgram(), []);
  const statePublicKey = new PublicKey(statePk);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextState = await fetchState(program, statePublicKey);
      setState(nextState);
    } finally {
      setLoading(false);
    }
  }, [program, statePublicKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isAuthority = wallet.publicKey?.toBase58() === state.authority;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">Treasury: {config.treasury}</p>
        </div>
        <ConnectButton />
      </header>
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Estado</p>
          <p className="text-sm font-mono text-slate-200">{statePk}</p>
        </div>
        <Button onClick={() => refresh()} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>
      {!isAuthority ? (
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400">Conecte a carteira da autoridade ({state.authority}).</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <WhitelistForm statePk={statePk} onCompleted={refresh} />
          <PhaseControls state={state} onRefresh={refresh} />
        </div>
      )}
    </div>
  );
}
