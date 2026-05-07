import type { DetectedColumns } from "../../../types/invoice";

export const detectRequiredColumns = (headers: string[]): DetectedColumns => {
  const detectedColumns: DetectedColumns = {};

  detectedColumns.transactionDate = headers.find((header) => {
    const lower = header.toLowerCase();
    return (
      (lower.includes("transaction") && lower.includes("date")) ||
      (lower.includes("txn") && lower.includes("date")) ||
      lower.includes("date")
    );
  });

  detectedColumns.transactionTime = headers.find((header) => {
    const lower = header.toLowerCase();
    return (
      (lower.includes("transaction") && lower.includes("time")) ||
      (lower.includes("txn") && lower.includes("time")) ||
      lower.includes("time")
    );
  });

  detectedColumns.merchantName = headers.find((header) => {
    const lower = header.toLowerCase();
    return (
      (lower.includes("merchant") && lower.includes("name")) ||
      lower.includes("merchant") ||
      lower.includes("business") ||
      lower.includes("store")
    );
  });

  detectedColumns.amount = headers.find((header) => {
    const lower = header.toLowerCase();
    return (
      lower.includes("amount") ||
      lower.includes("value") ||
      lower.includes("txnamount") ||
      lower.includes("transaction_amount")
    );
  });

  detectedColumns.vpa = headers.find((header) => {
    const lower = header.toLowerCase();
    return (
      lower.includes("vpa") ||
      lower.includes("vba") ||
      (lower.includes("virtual") && lower.includes("payment")) ||
      (lower.includes("payee") &&
        (lower.includes("vpa") || lower.includes("upi")))
    );
  });

  detectedColumns.utr = headers.find((header) => {
    const lower = header.toLowerCase();
    return (
      lower.includes("utr") ||
      (lower.includes("unique") && lower.includes("transaction")) ||
      (lower.includes("transaction") && lower.includes("reference")) ||
      (lower.includes("txn") && lower.includes("ref"))
    );
  });

  detectedColumns.remarks = headers.find((header) => {
    const lower = header.toLowerCase();
    return (
      lower.includes("remark") ||
      lower.includes("comment") ||
      lower.includes("description") ||
      lower.includes("note")
    );
  });

  return detectedColumns;
};
