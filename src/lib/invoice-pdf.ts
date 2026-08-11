export type DownloadInvoicePdfInput = {
  id: string;
  date: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  totalCents: number;
  description: string;
  lines?:
    | Array<{
        description: string;
        qty: number;
        unitPriceCents: number;
        totalCents: number;
      }>
    | undefined;
  status?: string | undefined;
  notes?: string | null | undefined;
};

function ascii(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function pdfText(value: string): string {
  return ascii(value).replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function downloadInvoicePdf(invoice: DownloadInvoicePdfInput): void {
  const invoiceLines = invoice.lines?.length
    ? invoice.lines
    : [
        {
          description: invoice.description,
          qty: 1,
          unitPriceCents: invoice.totalCents,
          totalCents: invoice.totalCents,
        },
      ];
  const lines = [
    "AE2V — FACTURE",
    `Numero : ${invoice.id}`,
    `Date : ${invoice.date}`,
    "",
    `Client : ${invoice.customerName}`,
    `E-mail : ${invoice.customerEmail}`,
    `Paiement : ${invoice.paymentMethod}`,
    ...(invoice.status ? [`Statut : ${invoice.status}`] : []),
    "",
    "Détail :",
    ...invoiceLines.map(
      (line) =>
        `${line.qty} x ${(line.unitPriceCents / 100).toFixed(2).replace(".", ",")} EUR — ${line.description} — ${(line.totalCents / 100).toFixed(2).replace(".", ",")} EUR`,
    ),
    ...(invoice.notes ? ["", `Note : ${invoice.notes}`] : []),
    `Total : ${(invoice.totalCents / 100).toFixed(2).replace(".", ",")} EUR`,
  ];
  const commands = ["BT", "/F1 16 Tf", "50 760 Td"];
  lines.forEach((line, index) => {
    if (index > 0) commands.push("0 -30 Td", "/F1 11 Tf");
    commands.push(`(${pdfText(line)}) Tj`);
  });
  commands.push("ET");
  const content = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoice.id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
