import { Badge } from "@/components/ui/badge";

export interface PhaseBadgeProps {
  phase: "Whitelist" | "Public" | "Final";
}

const PHASE_COLORS: Record<PhaseBadgeProps["phase"], string> = {
  Whitelist: "bg-emerald-500/20 text-emerald-200 border-emerald-400/50",
  Public: "bg-sky-500/20 text-sky-200 border-sky-400/50",
  Final: "bg-purple-500/20 text-purple-200 border-purple-400/50"
};

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  return <Badge className={PHASE_COLORS[phase]}>{phase}</Badge>;
}

export default PhaseBadge;
