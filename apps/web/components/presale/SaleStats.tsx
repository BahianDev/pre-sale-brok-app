import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import PhaseBadge from "./PhaseBadge";
import { formatLamports, formatTsRange } from "@/lib/format";
import type { ParsedState } from "@/lib/anchor/types";

interface SaleStatsProps {
  state: ParsedState;
}

export function SaleStats({ state }: SaleStatsProps) {
  const totalRaisedSol = formatLamports(state.totalRaisedLamports);
  const softCapSol = formatLamports(state.softCapLamports);
  const hardCapSol = formatLamports(state.hardCapLamports);

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle className="text-2xl font-semibold">Sale Overview</CardTitle>
          <p className="text-sm text-slate-400">{formatTsRange(state.startTs, state.endTs)}</p>
        </div>
        <PhaseBadge phase={state.currentPhase} />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Total Raised" value={`${totalRaisedSol} SOL`} />
          <Metric label="Soft Cap" value={`${softCapSol} SOL`} />
          <Metric label="Hard Cap" value={`${hardCapSol} SOL`} />
        </div>
        <div className="space-y-4">
          {Object.entries(state.phaseStats).map(([phase, stats]) => {
            const percent = Math.min(100, stats.soldPercent);
            return (
              <div key={phase} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{phase}</span>
                  <span>
                    {stats.sold}/{stats.offered} tokens ({percent.toFixed(2)}%)
                  </span>
                </div>
                <Progress value={percent} />
                <p className="text-xs text-slate-500">
                  {stats.tokensPerSol} tokens / SOL
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default SaleStats;
