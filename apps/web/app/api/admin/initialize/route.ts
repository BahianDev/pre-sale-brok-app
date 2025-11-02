import { NextResponse } from "next/server";
import { BN } from "@coral-xyz/anchor";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { loadAdminKeypair } from "@/lib/admin";
import { getServerProgram } from "@/lib/anchor/server";
import { initialize } from "@/lib/anchor/tx";
import { sendAdminTransaction } from "@/lib/anchor/admin";
import { config } from "@/lib/config";
import type { InitializeParams } from "@/lib/anchor/types";
import { deriveState } from "@/lib/anchor/pdas";

const u64 = z.coerce.bigint().refine((value) => value >= 0n, {
  message: "Valor deve ser um inteiro positivo"
});

const schema = z.object({
  startTs: u64,
  endTs: u64,
  tgeTs: u64,
  tgeBps: z.coerce
    .number()
    .int()
    .min(0, { message: "TGE BPS deve ser positivo" })
    .max(10_000, { message: "TGE BPS deve ser menor ou igual a 10000" }),
  cliffSeconds: u64,
  vestingSeconds: u64,
  softCapLamports: u64,
  hardCapLamports: u64,
  phase1TokensPerSol: u64,
  phase2TokensPerSol: u64,
  phase3TokensPerSol: u64,
  phase1TokensOffered: u64,
  phase2TokensOffered: u64,
  phase3TokensOffered: u64
});

function toBn(value: bigint): BN {
  return new BN(value.toString());
}

function buildParams(parsed: z.infer<typeof schema>): InitializeParams {
  return {
    startTs: toBn(parsed.startTs),
    endTs: toBn(parsed.endTs),
    tgeTs: toBn(parsed.tgeTs),
    tgeBps: parsed.tgeBps,
    cliffSeconds: toBn(parsed.cliffSeconds),
    vestingSeconds: toBn(parsed.vestingSeconds),
    softCapLamports: toBn(parsed.softCapLamports),
    hardCapLamports: toBn(parsed.hardCapLamports),
    phase1TokensPerSol: toBn(parsed.phase1TokensPerSol),
    phase2TokensPerSol: toBn(parsed.phase2TokensPerSol),
    phase3TokensPerSol: toBn(parsed.phase3TokensPerSol),
    phase1TokensOffered: toBn(parsed.phase1TokensOffered),
    phase2TokensOffered: toBn(parsed.phase2TokensOffered),
    phase3TokensOffered: toBn(parsed.phase3TokensOffered)
  };
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const authority = loadAdminKeypair();
    const expectedAuthority = new PublicKey(config.authority);

    if (!authority.publicKey.equals(expectedAuthority)) {
      throw new Error("ADMIN_KEYPAIR_BASE58 não corresponde ao endereço da autoridade configurado");
    }

    const program = getServerProgram(authority);
    const mintPk = new PublicKey(config.mint);
    const treasuryPk = new PublicKey(config.treasury);
    const [derivedStatePk] = deriveState(authority.publicKey, mintPk);
    const accountInfo = await program.provider.connection.getAccountInfo(derivedStatePk);

    if (accountInfo) {
      throw new Error("Estado já inicializado para o PDA informado");
    }

    const params = buildParams(body);
    const { instruction, statePk, vaultPk } = await initialize({
      program,
      authority: authority.publicKey,
      treasury: treasuryPk,
      mint: mintPk,
      params
    });
    if (!statePk.equals(derivedStatePk)) {
      throw new Error("PDA derivado não corresponde ao esperado");
    }
    const signature = await sendAdminTransaction([instruction], authority);
    return NextResponse.json({
      result: signature,
      state: statePk.toBase58(),
      vault: vaultPk.toBase58()
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

