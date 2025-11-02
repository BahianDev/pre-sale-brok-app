"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { SaleStats } from "@/components/presale/SaleStats";
import { BuyForm } from "@/components/presale/BuyForm";
import { ClaimCard } from "@/components/presale/ClaimCard";
import { RefundCard } from "@/components/presale/RefundCard";
import type { ParsedBuyerState, ParsedState, ParsedWhitelistEntry } from "@/lib/anchor/types";
import { config } from "@/lib/config";
import { getReadonlyClientProgram } from "@/lib/anchor/client";
import { fetchBuyerState, fetchState, fetchWhitelist } from "@/lib/anchor/tx";
import { Button } from "@/components/ui/button";

interface BuyerClientProps {
  initialState: ParsedState;
  statePk: string;
}

export function BuyerClient({ initialState, statePk }: BuyerClientProps) {
  const [state, setState] = useState(initialState);
  const [buyerState, setBuyerState] = useState<ParsedBuyerState | null>(null);
  const [whitelistEntry, setWhitelistEntry] = useState<ParsedWhitelistEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();

  const program = useMemo(() => getReadonlyClientProgram(), []);
  const statePublicKey = new PublicKey(statePk);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextState = await fetchState(program, statePublicKey);
      setState(nextState);
      if (wallet.publicKey) {
        const buyer = wallet.publicKey;
        const [buyerStateInfo, whitelistInfo] = await Promise.all([
          fetchBuyerState(program, statePublicKey, buyer),
          fetchWhitelist(program, statePublicKey, buyer)
        ]);
        setBuyerState(buyerStateInfo);
        setWhitelistEntry(whitelistInfo ?? null);
      } else {
        setBuyerState(null);
        setWhitelistEntry(null);
      }
    } finally {
      setLoading(false);
    }
  }, [program, statePublicKey, wallet.publicKey]);

  useEffect(() => {
    if (!wallet.publicKey) {
      setBuyerState(null);
      setWhitelistEntry(null);
      return;
    }
    void refresh();
  }, [wallet.publicKey, refresh]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Presale</h1>
          <p className="text-sm text-slate-400">Commitment: {config.commitment}</p>
          <p className="text-sm text-slate-500">RPC: {config.rpcUrl}</p>
        </div>
        <ConnectButton />
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <InfoRow label="Program ID" value={config.programId} />
          <InfoRow label="Mint" value={config.mint} />
          <InfoRow label="State" value={statePk} />
        </div>
        <div className="flex items-start justify-end">
          <Button onClick={() => refresh()} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </section>
      <SaleStats state={state} />
      <section className="grid gap-6 md:grid-cols-3">
        <BuyForm
          state={state}
          buyerState={buyerState}
          whitelistEntry={whitelistEntry}
          onRefresh={refresh}
        />
        <ClaimCard state={state} buyerState={buyerState} onRefresh={refresh} />
        <RefundCard state={state} buyerState={buyerState} onRefresh={refresh} />
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(value).catch(() => {
      console.warn("Clipboard API indisponível");
    });
  };
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-mono text-slate-200">{value}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        Copiar
      </Button>
    </div>
  );
}

export default BuyerClient;
