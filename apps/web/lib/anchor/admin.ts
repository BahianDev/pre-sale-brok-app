import { Transaction, Keypair, TransactionInstruction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana";
import { config } from "@/lib/config";

export async function sendAdminTransaction(
  instructions: TransactionInstruction[],
  authority: Keypair
): Promise<string> {
  const connection = getConnection();
  const tx = new Transaction();
  instructions.forEach((ix) => tx.add(ix));
  tx.feePayer = authority.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(authority);
  const signature = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    config.commitment
  );
  return signature;
}
