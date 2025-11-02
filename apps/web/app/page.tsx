import { PublicKey } from "@solana/web3.js";
import { deriveState } from "@/lib/anchor/pdas";
import { config } from "@/lib/config";
import { InitializeForm } from "@/components/presale/InitializeForm";

export default function Page() {
  const authorityPk = new PublicKey(config.authority);
  const mintPk = new PublicKey(config.mint);
  const [statePk] = deriveState(authorityPk, mintPk);

  return (
    <main className="container mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Inicializar venda</h1>
        <p className="text-sm text-slate-400">
          Defina os parâmetros iniciais da venda antes de permitir contribuições dos compradores.
        </p>
      </div>
      <InitializeForm statePk={statePk.toBase58()} />
    </main>
  );
}
