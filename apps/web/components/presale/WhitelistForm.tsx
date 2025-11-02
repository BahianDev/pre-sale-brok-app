"use client";

import { useState } from "react";
import Decimal from "decimal.js";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { solToLamports } from "@/lib/format";

const schema = z.object({
  buyer: z.string().min(32, "Informe uma chave pública válida"),
  maxContribution: z.string().nonempty("Informe o limite em SOL")
});

interface WhitelistFormProps {
  statePk: string;
  onCompleted?: () => Promise<void>;
}

export function WhitelistForm({ statePk, onCompleted }: WhitelistFormProps) {
  const [buyer, setBuyer] = useState("");
  const [maxContribution, setMaxContribution] = useState("1");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse({ buyer, maxContribution });
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? "Erro de validação");
      return;
    }

    try {
      setLoading(true);
      const lamports = solToLamports(new Decimal(parsed.data.maxContribution)).toDecimalPlaces(
        0,
        Decimal.ROUND_FLOOR
      );
      const response = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: statePk,
          buyer: parsed.data.buyer,
          maxContributionLamports: lamports.toString()
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Erro ao atualizar whitelist");
      }
      setStatus("Whitelist atualizada com sucesso");
      setBuyer("");
      setMaxContribution("1");
      await onCompleted?.();
    } catch (error) {
      setStatus((error as Error).message ?? "Erro ao atualizar whitelist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Whitelist</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Buyer (pubkey)</label>
            <Input value={buyer} onChange={(event) => setBuyer(event.target.value)} placeholder="Buyer public key" />
          </div>
          <div>
            <label className="text-sm text-slate-400">Max contribution (SOL)</label>
            <Input
              value={maxContribution}
              onChange={(event) => setMaxContribution(event.target.value)}
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Atualizando..." : "Adicionar/Atualizar"}
          </Button>
          {status && <p className="text-xs text-slate-400">{status}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export default WhitelistForm;
