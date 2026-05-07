// @ts-nocheck
import { APP_ASSETS } from "../../../constants/assets";

const SPARKLEAP_ADDRESS = 'NO 195, VINAYAKAR KOVIL, STREET, VANUR TK, Eraiyur,<br/>Tindivanam, Villupuram- 604304 IN<br/>GST: 33ABOCS4605D1ZI';
const   SPARKLEAP_CONFIG = {
    companyName: 'SPARKLEAP TECH SOFTWARE SOLUTIONS PRIVATE LIMITED',
    address: SPARKLEAP_ADDRESS,
    termsAcronym: 'SPKL'
};

export const getMerchantConfig = (rowData, merchantColumn) => {

    if (!merchantColumn || !rowData[merchantColumn]) {
        return SPARKLEAP_CONFIG;
    }

    const merchantName = String(rowData[merchantColumn]).toLowerCase().trim();

    if (merchantName.includes('sparkleap')) {
        return SPARKLEAP_CONFIG;
    }

    return SPARKLEAP_CONFIG;
};

export const detectRequiredColumns = (headers) => {
    const detectedColumns = {};

    detectedColumns.amount = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('amount') ||
            lower.includes('value') ||
            lower.includes('txnamount') ||
            lower.includes('transaction_amount');
    });

    detectedColumns.vpa = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('vpa') ||
            lower.includes('virtual') && lower.includes('payment') ||
            lower.includes('payee') && (lower.includes('vpa') || lower.includes('upi'));
    });

    return detectedColumns;
};

export const formatCellValue = (value, header) => {
    const headerLower = header?.toLowerCase() || '';

    if (typeof value === 'number') {
        if (headerLower.includes('amount') || headerLower.includes('txnamount')) {
            return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }
        if (value > 10000 && value < 100000) {
            const excelDate = new Date((value - 25569) * 86400 * 1000);

            if (!isNaN(excelDate.getTime())) {
                const day = String(excelDate.getUTCDate()).padStart(2, '0');
                const month = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
                const year = excelDate.getUTCFullYear();
                const hours = String(excelDate.getUTCHours()).padStart(2, '0');
                const minutes = String(excelDate.getUTCMinutes()).padStart(2, '0');

                return `${day}/${month}/${year} ${hours}:${minutes}`;
            }
        }

        return value.toString();
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
        const day = String(value.getDate()).padStart(2, '0');
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const year = value.getFullYear();
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    if (typeof value === 'string' && value.trim()) {
        const trimmed = value.trim();
        const parsedDate = new Date(trimmed);
        if (!isNaN(parsedDate.getTime())) {
            const day = String(parsedDate.getDate()).padStart(2, '0');
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const year = parsedDate.getFullYear();
            const hours = String(parsedDate.getUTCHours()).padStart(2, '0');
            const minutes = String(parsedDate.getUTCMinutes()).padStart(2, '0');

            return `${day}/${month}/${year} ${hours}:${minutes}`;
        }
    }

    return String(value || '');
};

export const generateProfessionalInvoiceHTML = (
    rowData,
    invoiceNumber,
    rrnColumn,
    upiColumn,
    merchantColumn,
    amountColumn,
    dateColumn
) => {
    const merchantInfo = getMerchantConfig(rowData, merchantColumn);

    const invoiceNumberToDisplay = invoiceNumber ? String(invoiceNumber) : '-';

    let transactionDateTimeDisplay = 'N/A';
    if (dateColumn && rowData[dateColumn] !== undefined) {
        transactionDateTimeDisplay = formatCellValue(rowData[dateColumn], dateColumn);
    }

    const detectedCols = detectRequiredColumns([]);

    let amountValue = 0;
    if (amountColumn && rowData[amountColumn] !== undefined && rowData[amountColumn] !== null && rowData[amountColumn] !== '') {
        const rawValue = String(rowData[amountColumn]).replace(/[₹,\s]/g, '');
        amountValue = parseFloat(rawValue) || 0;
    } else if (detectedCols.amount && rowData[detectedCols.amount] !== undefined && rowData[detectedCols.amount] !== null && rowData[detectedCols.amount] !== '') {
        const rawValue = String(rowData[detectedCols.amount]).replace(/[₹,\s]/g, '');
        amountValue = parseFloat(rawValue) || 0;
    }
    const formattedAmount = amountValue.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    const upiIdValue = upiColumn && rowData[upiColumn] ? formatCellValue(rowData[upiColumn], upiColumn) :
        (detectedCols.vpa && rowData[detectedCols.vpa] ? formatCellValue(rowData[detectedCols.vpa], detectedCols.vpa) : 'N/A');

    const rrnValue = rrnColumn && rowData[rrnColumn] ? formatCellValue(rowData[rrnColumn], rrnColumn) : 'N/A';

    const termsAcronym = merchantInfo.termsAcronym;
    
    const COLOR_LIGHT = '#141E30'; 
    const COLOR_DARK = '#243B55';  

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Statement ${invoiceNumberToDisplay} - ${rrnValue}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #1a202c;
            background: #f0f4f8;
            padding: 0;
            margin: 0;
            font-size: 10px;
            min-height: 100vh;
            font-weight: 700; 
        }

        .container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
        }

        .invoice {
            background: #ffffff;
            padding: 8mm; 
            width: 100%;
            min-height: auto; 
            position: relative;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border-radius: 8px;
        }

        .accent-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            
            
        }

        .header {
            margin-bottom: 6mm; 
            padding-bottom: 4mm; 
            padding-top: 4mm;
            border-bottom: 1px solid #e2e8f0;
            position: relative;
            z-index: 1;
        }

        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4mm; 
        }


    

        .company-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8mm;
        }

        .company-info {
            flex: 1;
        }

        .company-name {
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2mm;
            font-size: 14px;
            line-height: 1.3;
        }

        .company-address {
            font-size: 10px;
            color: #718096;
            line-height: 1.6;
            font-weight: 700;
        }

        .invoice-ids {
            text-align: right;
            min-width: 70mm;
        }

        .id-row {
            margin-bottom: 2mm; 
            background: #f8fafc;
            padding: 3mm;
            border-radius: 8px;
            border-left: 4px solid ${COLOR_LIGHT}; 
        }

        .id-label {
            font-size: 8px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 1mm;
            font-weight: 800;
        }

        .id-value {
            font-size: 11px;
            color: #2d3748;
            font-weight: 900;
            font-family: 'Courier New', monospace;
            word-break: break-all;
        }

        .billing-section {
            margin-bottom: 6mm; 
            background: #f8fafc;
            padding: 5mm; 
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            position: relative;
        }

        .section-header {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3mm; 
            text-transform: uppercase;
            letter-spacing: 1.5px;
            position: relative;
            padding-left: 4mm;
        }

        .section-header::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 100%;
            background: linear-gradient(180deg, ${COLOR_LIGHT} 0%, ${COLOR_DARK} 100%);
            border-radius: 2px;
        }

        .billing-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4mm; 
            position: relative;
            z-index: 1;
        }

        .billing-item {
            background: white;
            padding: 4mm;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .billing-label {
            font-size: 8px;
            color: #718096;
            text-transform: uppercase;
            margin-bottom: 1.5mm; 
            font-weight: 800;
            letter-spacing: 1px;
        }

        .billing-value {
            font-size: 10px;
            color: #2d3748;
            font-weight: 800;
            word-break: break-all;
            line-height: 1.4;
        }

        .invoice-details {
            margin-bottom: 6mm; 
        }

        .table-wrapper {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        .invoice-table thead {
            background: linear-gradient(135deg, ${COLOR_LIGHT} 0%, ${COLOR_DARK} 100%);
        }

        .invoice-table th {
            color: #ffffff; 
            padding: 3mm 3mm; 
            text-align: center;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 1px;
        }

        .invoice-table td {
            padding: 3mm 3mm; 
            text-align: center;
            color: #4a5568;
            border-bottom: 1px solid #e2e8f0;
            background: white;
            font-weight: 700;
        }

        .invoice-table tbody tr:nth-child(odd) td {
            background: #f7fafc;
        }

        .total-row {
            background: linear-gradient(135deg, ${COLOR_LIGHT} 0%, ${COLOR_DARK} 100%) !important;
        }

        .total-row td {
            color: #ffffff !important;
            font-weight: 900 !important;
            font-size: 11px;
            border: none !important;
            padding: 3mm 3mm !important;
        }

        .amount-highlight {
            background: linear-gradient(135deg, ${COLOR_LIGHT} 0%, ${COLOR_DARK} 100%);
            color: white;
            padding: 5mm; 
            border-radius: 12px;
            text-align: center;
            margin-bottom: 6mm; 
            box-shadow: 0 6px 20px rgba(44, 62, 80, 0.5);
            position: relative;
        }

        .amount-label {
            font-size: 11px;
            opacity: 0.95;
            margin-bottom: 2mm;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 800;
        }

        .amount-value {
            font-size: 30px; 
            font-weight: 900;
            letter-spacing: 2px;
        }

        .terms {
            background: #f8fafc;
            border: 1px solid #bdc3c7;
            border-left: 4px solid #141E30;
            padding: 6mm;
            border-radius: 8px;
            margin-top: 6mm; 
        }

        .terms h3 {
            font-weight: 800;
            color: #141E30;
            margin-bottom: 3mm;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .terms-list {
            list-style: none;
            padding: 0;
        }

        .terms-list li {
            font-size: 10px;
            color: #141E30;
            line-height: 1.6; 
            margin-bottom: 2mm; 
            padding-left: 6mm;
            position: relative;
            font-weight: 500;
        }

        .terms-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #141E30;
            font-weight: 900;
            font-size: 14px;
        }


        @media print {
            body {
                margin: 0;
                padding: 0;
                background: white;
            }

            .container {
                padding: 0;
                width: 100%;
                max-width: none;
                margin: 0;
            }

            .invoice {
                padding: 8mm; 
                min-height: 296mm; 
                max-height: 296mm; 
                box-shadow: none;
                border-radius: 0;
                overflow: hidden; 
            }

            @page {
                size: A4 portrait;
                margin: 0; 
            }

            .invoice-badge,
            .invoice-table thead,
            .total-row,
            .amount-highlight,
            .logo-section,
            .billing-section,
            .terms,
            .id-row,
            .billing-item,
            .accent-bar,
            .document-title {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="invoice">
            <div class="accent-bar"></div>

            <div class="header">
                <div class="header-top">

                    <div class="logo-section">
                        <img
                            src="${APP_ASSETS.merchants.easybuzzLogo}"
                            alt="Company Logo"
                            style="width: 200px; height: auto; display: block;"
                        />
                    </div>
                </div>

                <div class="company-section">
                    <div class="company-info">
                        <h2 class="company-name">${merchantInfo.companyName}</h2>
                        <p class="company-address">
                            ${merchantInfo.address.replace(/<br\/>/g, '<br/>')}
                        </p>
                    </div>

                    <div class="invoice-ids">
                        <div class="id-row">
                            <div class="id-label">Invoice Number</div>
                            <div class="id-value">${invoiceNumberToDisplay}</div>
                        </div>
                        <div class="id-row">
                            <div class="id-label">Transaction ID</div>
                            <div class="id-value">${rrnValue}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="billing-section">
                <div class="section-header">Payment Information</div>
                <div class="billing-grid">
                    <div class="billing-item">
                        <div class="billing-label">Bill To</div>
                        <div class="billing-value">${upiIdValue}</div>
                    </div>
                    <div class="billing-item">
                        <div class="billing-label">Transaction Date</div>
                        <div class="billing-value">${transactionDateTimeDisplay}</div>
                    </div>
                    <div class="billing-item">
                        <div class="billing-label">Wallet Load Date</div>
                        <div class="billing-value">${transactionDateTimeDisplay}</div>
                    </div>
                </div>
            </div>

            <div class="invoice-details">
                <div class="section-header">Transaction Details</div>
                <div class="table-wrapper">
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th style="width: 8%;">Sl No.</th>
                                <th style="width: 30%;">Description</th>
                                <th style="width: 10%;">Quantity</th>
                                <th style="width: 15%;">Unit Price</th>
                                <th style="width: 15%;">Gross Amount</th>
                                <th style="width: 12%;">Tax Amount</th>
                                <th style="width: 15%;">Net Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Wallet Loading</td>
                                <td>1</td>
                                <td>₹ ${formattedAmount}</td>
                                <td>₹ ${formattedAmount}</td>
                                <td>—</td>
                                <td>₹ ${formattedAmount}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="4">TOTAL</td>
                                <td>₹ ${formattedAmount}</td>
                                <td>₹ 0.00</td>
                                <td>₹ ${formattedAmount}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="amount-highlight">
                <div class="amount-label">Total Amount Paid</div>
                <div class="amount-value">₹ ${formattedAmount}</div>
            </div>

            <div class="terms">
                <h3>Terms & Conditions</h3>
                <ul class="terms-list">
                    <li>By receiving this receipt, the user has paid the appropriate fees to ${termsAcronym} through Payment Gateway and accepts the company's terms and conditions in connection with the transaction.</li>
                    <li>All receipts are issued against the UPI ID through which the payment is collected and verified.</li>
                    <li>This is a computer-generated receipt and does not require a physical seal or signature for validation.</li>
                </ul>
            </div>


        </div>
    </div>
</body>
</html>`;
};
