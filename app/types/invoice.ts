export interface InvoiceRow {
  _rowIndex: number;
  [key: string]: string | number | null | undefined;
}

export interface DuplicateRow extends InvoiceRow {
  _originalIndex: number;
}

export interface DuplicateGroup {
  value: string;
  count: number;
  rows: DuplicateRow[];
}

export interface InvoicePreview {
  data: InvoiceRow[];
  headers: string[];
}

export interface DetectedColumns {
  transactionDate?: string;
  transactionTime?: string;
  merchantName?: string;
  amount?: string;
  vpa?: string;
  utr?: string;
  remarks?: string;
}

export interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error" | "info";
}
