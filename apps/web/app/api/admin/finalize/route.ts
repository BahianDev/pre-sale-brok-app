import { NextResponse } from "next/server";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { loadAdminKeypair } from "@/lib/admin";
import { getServerProgram } from "@/lib/anchor/server";
import { finalize } from "@/lib/anchor/tx";
import { sendAdminTransaction } from "@/lib/anchor/admin";
import { config } from "@/lib/config";

const schema = z.object({
  state: z.string()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const authority = loadAdminKeypair();
    const program = getServerProgram(authority);
    const statePk = new PublicKey(body.state);
    const treasuryPk = new PublicKey(config.treasury);
    const ix = await finalize({
      program,
      authority: authority.publicKey,
      statePk,
      treasury: treasuryPk
    });
    const signature = await sendAdminTransaction([ix], authority);
    return NextResponse.json({ result: signature });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
