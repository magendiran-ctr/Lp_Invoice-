// sendInvoice.ts – helper to POST invoice data to backend
export interface InvoicePayload {
  invoiceNumber: string;
  data: Record<string, unknown>;
  html: string;
}

/**
 * Sends invoice payload to the Express backend (http://localhost:5000/api/invoice).
 */
export async function sendInvoice(payload: InvoicePayload) {
  const resp = await fetch('http://localhost:5000/api/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Backend error ${resp.status}: ${txt}`);
  }
  return resp.json();
}
