import { prisma } from "@/server/db";

/**
 * Generates sequential, collision-proof document numbers per type and year
 * wrapped in an InnoDB transaction.
 * 
 * Types:
 * - FEO -> 001/FEO/2026/R0
 * - PPC -> 001/PPC/2026
 */
export async function generateDocNumber(
  docType: "FEO" | "PPC",
  year: number = new Date().getFullYear(),
  revision: number = 0
): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // 1. Ensure sequence row exists
    await tx.$executeRaw`
      INSERT INTO doc_sequences (doc_type, doc_year, last_number)
      VALUES (${docType}, ${year}, 0)
      ON DUPLICATE KEY UPDATE doc_type = doc_type;
    `;

    // 2. Atomically increment last_number and fetch updated value
    await tx.$executeRaw`
      UPDATE doc_sequences
      SET last_number = last_number + 1
      WHERE doc_type = ${docType} AND doc_year = ${year};
    `;

    const result: Array<{ last_number: number }> = await tx.$queryRaw`
      SELECT last_number FROM doc_sequences
      WHERE doc_type = ${docType} AND doc_year = ${year}
      FOR UPDATE;
    `;

    let seqNumber = result[0]?.last_number ?? 1;

    // 3. Collision safety: check against existing table records and fast-forward if needed
    if (docType === "PPC") {
      const candidate = `${String(seqNumber).padStart(3, "0")}/PPC/${year}`;
      const exists = await tx.ppcRequest.findUnique({ where: { requestNo: candidate } });
      if (exists) {
        const allPpc = await tx.ppcRequest.findMany({
          where: { requestNo: { endsWith: `/PPC/${year}` } },
          select: { requestNo: true },
        });
        const maxNum = allPpc.reduce((max, p) => {
          const num = parseInt(p.requestNo.split("/")[0], 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, seqNumber);
        seqNumber = maxNum + 1;
        await tx.$executeRaw`
          UPDATE doc_sequences
          SET last_number = ${seqNumber}
          WHERE doc_type = ${docType} AND doc_year = ${year};
        `;
        return `${String(seqNumber).padStart(3, "0")}/PPC/${year}`;
      }
      return candidate;
    }

    if (docType === "FEO") {
      const candidate = `${String(seqNumber).padStart(3, "0")}/FEO/${year}/R${revision}`;
      const exists = await tx.tenderDocument.findUnique({ where: { tenderNo: candidate } });
      if (exists) {
        const allTenders = await tx.tenderDocument.findMany({
          where: { tenderNo: { contains: `/FEO/${year}/` } },
          select: { tenderNo: true },
        });
        const maxNum = allTenders.reduce((max, t) => {
          const num = parseInt(t.tenderNo.split("/")[0], 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, seqNumber);
        seqNumber = maxNum + 1;
        await tx.$executeRaw`
          UPDATE doc_sequences
          SET last_number = ${seqNumber}
          WHERE doc_type = ${docType} AND doc_year = ${year};
        `;
        return `${String(seqNumber).padStart(3, "0")}/FEO/${year}/R${revision}`;
      }
      return candidate;
    }

    const padded = String(seqNumber).padStart(3, "0");
    return `${padded}/${docType}/${year}`;
  });
}
