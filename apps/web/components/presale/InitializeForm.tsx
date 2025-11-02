"use client";

import { useMemo, useState } from "react";
import type { FormEvent, InputHTMLAttributes } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { config } from "@/lib/config";

const numericField = (label: string) =>
  z
    .string()
    .min(1, { message: `${label} é obrigatório` })
    .regex(/^[0-9]+$/, { message: `${label} deve ser um inteiro positivo` });

const schema = z.object({
  startTs: numericField("Início (epoch seconds)"),
  endTs: numericField("Fim (epoch seconds)"),
  tgeTs: numericField("TGE (epoch seconds)"),
  tgeBps: numericField("TGE BPS").refine((value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 10_000;
  }, "TGE BPS deve estar entre 0 e 10000"),
  cliffSeconds: numericField("Cliff (segundos)"),
  vestingSeconds: numericField("Vesting (segundos)"),
  softCapLamports: numericField("Soft cap (lamports)"),
  hardCapLamports: numericField("Hard cap (lamports)"),
  phase1TokensPerSol: numericField("Fase 1 – tokens por SOL"),
  phase2TokensPerSol: numericField("Fase 2 – tokens por SOL"),
  phase3TokensPerSol: numericField("Fase 3 – tokens por SOL"),
  phase1TokensOffered: numericField("Fase 1 – tokens ofertados"),
  phase2TokensOffered: numericField("Fase 2 – tokens ofertados"),
  phase3TokensOffered: numericField("Fase 3 – tokens ofertados")
});

type FormValues = z.infer<typeof schema>;

const getInitialValues = (): FormValues => ({
  startTs: "",
  endTs: "",
  tgeTs: "",
  tgeBps: "",
  cliffSeconds: "",
  vestingSeconds: "",
  softCapLamports: "",
  hardCapLamports: "",
  phase1TokensPerSol: "",
  phase2TokensPerSol: "",
  phase3TokensPerSol: "",
  phase1TokensOffered: "",
  phase2TokensOffered: "",
  phase3TokensOffered: ""
});

const FIELD_GROUPS: Array<{
  title: string;
  description?: string;
  fields: Array<{
    name: keyof FormValues;
    label: string;
    inputProps?: InputHTMLAttributes<HTMLInputElement>;
  }>;
}> = [
  {
    title: "Cronograma",
    description: "Valores em segundos (epoch).",
    fields: [
      { name: "startTs", label: "Início (epoch seconds)" },
      { name: "endTs", label: "Fim (epoch seconds)" },
      { name: "tgeTs", label: "TGE (epoch seconds)" },
      { name: "tgeBps", label: "TGE BPS", inputProps: { max: 10000 } },
      { name: "cliffSeconds", label: "Cliff (segundos)" },
      { name: "vestingSeconds", label: "Vesting (segundos)" }
    ]
  },
  {
    title: "Caps",
    description: "Valores inteiros em lamports.",
    fields: [
      { name: "softCapLamports", label: "Soft cap (lamports)" },
      { name: "hardCapLamports", label: "Hard cap (lamports)" }
    ]
  },
  {
    title: "Fases",
    description: "Configure tokens ofertados e taxa por SOL por fase.",
    fields: [
      { name: "phase1TokensPerSol", label: "Fase 1 – tokens por SOL" },
      { name: "phase1TokensOffered", label: "Fase 1 – tokens ofertados" },
      { name: "phase2TokensPerSol", label: "Fase 2 – tokens por SOL" },
      { name: "phase2TokensOffered", label: "Fase 2 – tokens ofertados" },
      { name: "phase3TokensPerSol", label: "Fase 3 – tokens por SOL" },
      { name: "phase3TokensOffered", label: "Fase 3 – tokens ofertados" }
    ]
  }
];

interface InitializeFormProps {
  statePk: string;
  onCompleted?: () => Promise<void>;
}

export function InitializeForm({ statePk, onCompleted }: InitializeFormProps) {
  const [form, setForm] = useState<FormValues>(() => getInitialValues());
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stateInfo = useMemo(
    () => ({
      statePk,
      mint: config.mint,
      treasury: config.treasury
    }),
    [statePk]
  );

  const updateField = (name: keyof FormValues, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? "Erro de validação nos parâmetros");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/admin/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao inicializar a venda");
      }

      setStatus(
        payload.result ? `Venda inicializada com sucesso. Tx: ${payload.result}` : "Venda inicializada com sucesso"
      );
      setForm(getInitialValues());
      await onCompleted?.();
    } catch (error) {
      setStatus((error as Error).message ?? "Erro ao inicializar a venda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Inicializar venda</CardTitle>
        <div className="space-y-1 text-xs text-slate-400">
          <p>State PDA: {stateInfo.statePk}</p>
          <p>Mint: {stateInfo.mint}</p>
          <p>Treasury: {stateInfo.treasury}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {FIELD_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-slate-200">{group.title}</h3>
                {group.description && <p className="text-xs text-slate-500">{group.description}</p>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-slate-400">{field.label}</label>
                    <Input
                      value={form[field.name]}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      type="number"
                      min="0"
                      step="1"
                      {...field.inputProps}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button type="submit" disabled={loading}>
            {loading ? "Inicializando..." : "Inicializar venda"}
          </Button>
          {status && <p className="text-xs text-slate-400">{status}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export default InitializeForm;

