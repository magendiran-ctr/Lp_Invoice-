// @ts-nocheck
import { APP_ASSETS } from "../../../constants/assets";

export const getMerchantConfig = (rowData, merchantColumn) => {
    const auxfordAddress = 'NO 15 11 CROSS POONGAVANAM GARDEN MANAVELY KARIKALAMBAKAM PONDICHERRY - 605007 IN<br/>GST: 34AAYCA4056H1ZD';
    const jetpackAddress = 'No.195A Vinayagar koil St Eraiyur Tindivanam, Villupuram Tamil Nadu-604304 IN<br/>GST: 33AAFCJ9470R1ZS';

    const merchantConfig = {
        'auxford': {
            companyName: 'AUXFORD PRIVATE LIMITED',
            address: auxfordAddress,
            termsAcronym: 'APL',
            logoPath: APP_ASSETS.merchants.auxfordLogo
        },
        'jetpack': {
            companyName: 'JETPACK PAMNETWORK PRIVATE LIMITED',
            address: jetpackAddress,
            termsAcronym: 'JPPL',
            logoPath: APP_ASSETS.merchants.jetpackLogo
        }
    };

    if (!merchantColumn || !rowData[merchantColumn]) {
        return {
            ...merchantConfig['jetpack'],
            termsAcronym: merchantConfig['jetpack'].termsAcronym
        };
    }

    const merchantName = String(rowData[merchantColumn]).toLowerCase().trim();

    if (merchantName.includes('auxford')) {
        return merchantConfig['auxford'];
    } else if (merchantName.includes('jetpack')) {
        return merchantConfig['jetpack'];
    }

    return merchantConfig[merchantName] || merchantConfig['jetpack'];
};

export const detectRequiredColumns = (headers) => {
    const detectedColumns = {};

    detectedColumns.transactionDate = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('transaction') && lower.includes('date') ||
            lower.includes('txn') && lower.includes('date') ||
            lower.includes('date');
    });

    detectedColumns.transactionTime = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('transaction') && lower.includes('time') ||
            lower.includes('txn') && lower.includes('time') ||
            lower.includes('time');
    });

    detectedColumns.merchantName = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('merchant') && lower.includes('name') ||
            lower.includes('merchant') ||
            lower.includes('business') ||
            lower.includes('store');
    });

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
            lower.includes('vba') ||
            lower.includes('virtual') && lower.includes('payment') ||
            lower.includes('payee') && (lower.includes('vpa') || lower.includes('upi'));
    });

    detectedColumns.utr = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('utr') ||
            lower.includes('unique') && lower.includes('transaction') ||
            lower.includes('transaction') && lower.includes('reference') ||
            lower.includes('txn') && lower.includes('ref');
    });

    detectedColumns.remarks = headers.find(h => {
        const lower = h.toLowerCase();
        return lower.includes('remark') ||
            lower.includes('comment') ||
            lower.includes('description') ||
            lower.includes('note');
    });

    return detectedColumns;
};

export const formatCellValue = (value, header) => {
    const headerLower = header?.toLowerCase() || '';

    if (typeof value === 'number') {
        if (headerLower.includes('amount') || headerLower.includes('txnamount')) {
            return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }
        else if (headerLower.includes('date') && value > 40000 && value < 60000) {
            const excelDate = new Date((value - 25569) * 86400 * 1000);
            return excelDate.toISOString().split('T')[0];
        }
        else if (headerLower.includes('time') && value < 1) {
            return new Date(value * 24 * 60 * 60 * 1000).toTimeString().split(' ')[0];
        }
        else {
            return value.toString();
        }
    }

    return String(value || '');
};

const generateAuxfordInvoiceHTML = (
    merchantInfo,
    invoiceNumberToDisplay,
    combinedDateTime,
    upiIdValue,
    rrnValue,
    formattedAmount
) => {
    const logoSource = merchantInfo.logoPath || APP_ASSETS.branding.defaultMerchantLogo;
    const termsAcronym = merchantInfo.termsAcronym;
    const themeColor = '#2c3e50'; 
    const headerBgColor = 'white';
    const neutralLineColor = '#bdc3c7'; 
    
    const addressLines = merchantInfo.address.split('<br/>').map(line => `<p>${line}</p>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumberToDisplay} - ${rrnValue}</title>
    <style>
        /* Note: Fonts already set to a good stack: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.4;
            color: #2c3e50;
            background: #ecf0f1;
            padding: 20px 20px;
            min-height: 100vh;
        }
        
        .invoice-wrapper {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .invoice-header {
            background: ${headerBgColor};
            color: ${themeColor};
            padding: 30px 40px;
            position: relative;
        }
        
        /* --- NEW CSS: Header Separator Line --- */
        .header-separator {
            height: 2px;
            background: #e0e0e0; /* Slightly darker grey for better visibility under header */
            width: 100%;
            margin-top: -1px; /* Pull it up slightly to hide potential gap */
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* subtle shadow for depth */
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .logo-section img {
            width: 200px;
            height: 70px;
            object-fit: contain;
            padding: 8px;
        }
        
        .company-info h1 {
            font-size: 22px;
            font-weight: 700; 
            margin-bottom: 8px;
            color: ${themeColor};
            letter-spacing: 1px;
        }
        
        .company-info p {
            font-size: 11px;
            line-height: 1.5;
            color: #555;
            margin-bottom: 2px;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        
        .company-info p:last-child {
            margin-bottom: 0;
        }
        
        .invoice-title-section {
            text-align: right;
            padding: 14px 18px;
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }
        
        .invoice-title {
            font-size: 12px;
            font-weight: 400;
            letter-spacing: 1px;
            color: #7f8c8d;
            text-transform: uppercase;
            margin-bottom: 0;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        
        .invoice-number {
            font-size: 18px;
            color: ${themeColor};
            font-weight: 700;
            letter-spacing: 1px;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        
        .invoice-body {
            padding: 30px 40px;
        }
        
        .section-divider {
            height: 2px;
            background: ${neutralLineColor};
            margin: 20px 0;
            border-radius: 4px; 
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .info-card {
            padding: 14px;
            border: 2px solid #ecf0f1;
            border-radius: 8px;
            background: #fafbfc;
        }
        
        .info-card h3 {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #7f8c8d;
            margin-bottom: 6px;
            font-weight: 600;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        
        .info-card p {
            font-size: 12px;
            font-weight: 400;
            color: ${themeColor};
            word-break: break-word;
            line-height: 1.4;
        }
        
        .transaction-section-title {
            font-size: 16px;
            font-weight: 400;
            color: ${themeColor};
            margin-bottom: 16px;
            letter-spacing: 0.5px;
        }
        
        .transaction-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 24px;
            border: 2px solid #ecf0f1;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .transaction-table thead {
            border-bottom: 3px solid ${neutralLineColor};
        }
        
        .transaction-table th {
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${themeColor};
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #f8f9fa;
        }
        
        .transaction-table th:first-child {
            border-top-left-radius: 6px;
        }
        
        .transaction-table th:last-child {
            border-top-right-radius: 6px;
        }
        
        .transaction-table td {
            padding: 16px 10px;
            font-size: 12px;
            color: #2c3e50;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .transaction-table tbody tr:last-child td {
            border-bottom: none;
        }
        
        .transaction-table tbody tr:last-child td:first-child {
            border-bottom-left-radius: 6px;
        }
        
        .transaction-table tbody tr:last-child td:last-child {
            border-bottom-right-radius: 6px;
        }
        
        .total-section {
            background: #f8f9fa;
            padding: 20px;
            margin-bottom: 24px;
            border-left: 4px solid ${neutralLineColor};
            border-radius: 8px;
            border: 2px solid #ecf0f1;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 12px;
            color: #2c3e50;
        }
        
        .total-row:last-child {
            margin-bottom: 0;
            padding-top: 14px;
            margin-top: 10px;
            border-top: 2px solid ${neutralLineColor};
            font-size: 12px;
        }
        
        .total-label {
            font-weight: 400;
            font-size: 12px;
        }
        
        .total-row:last-child .total-label {
            font-size: 12px;
            font-weight: 600;
            color: ${themeColor};
        }
        
        .total-amount {
            font-size: 12px;
            font-weight: 700;
            color: ${themeColor};
            letter-spacing: 0px;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        
        .terms-section {
            background: white;
            padding: 20px;
            border: 2px solid #ecf0f1;
            border-radius: 8px;
        }
        
        .terms-section h3 {
            font-size: 14px;
            margin-bottom: 12px;
            color: ${themeColor};
            font-weight: 400;
            letter-spacing: 0.5px;
            border-bottom: 2px solid ${neutralLineColor};
            padding-bottom: 8px;
        }
        
        .terms-section p {
            font-size: 11px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 8px;
            padding-left: 18px;
            position: relative;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }

        .terms-section p::before {
            content: '▪';
            position: absolute;
            left: 0;
            top: 0;
            color: ${neutralLineColor};
            font-size: 14px;
        }
        
        .terms-section p:last-child {
            margin-bottom: 0;
        }
        
        .invoice-footer {
            background: #f8f9fa;
            padding: 16px 40px;
            text-align: center;
            font-size: 10px;
            color: #7f8c8d;
            border-top: 1px solid #ecf0f1;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-wrapper {
                box-shadow: none;
                width: 100%;
                border-radius: 0;
            }
            
            .invoice-header {
                padding: 12mm 15mm;
            }
            
            .invoice-body {
                padding: 15mm;
            }

            .logo-section img {
                width: 75px;
                height: 75px;
            }
            
            .company-info h1 {
                font-size: 22px;
            }
            
            .company-info p {
                font-size: 11px;
            }

            .info-grid {
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .info-card {
                padding: 12px;
            }

            .info-card h3 {
                font-size: 9px;
                margin-bottom: 6px;
            }

            .info-card p {
                font-size: 12px;
            }

            .transaction-table th {
                padding: 10px 8px;
                font-size: 10px;
            }
            
            .transaction-table td {
                padding: 14px 8px;
                font-size: 12px;
            }
            
            .total-section {
                padding: 20px;
                margin-bottom: 20px;
            }

            .total-amount {
                font-size: 24px;
            }
            
            .terms-section {
                padding: 20px;
            }

            .terms-section h3 {
                font-size: 14px;
                margin-bottom: 12px;
            }

            .terms-section p {
                font-size: 10px;
                line-height: 1.6;
                margin-bottom: 8px;
                padding-left: 18px;
            }

            .invoice-footer {
                padding: 15px;
                font-size: 10px;
            }

            @page {
                size: A4;
                margin: 5mm;
            }
            
            .transaction-table {
                margin-bottom: 20px;
            }
            
            .total-section {
                margin-bottom: 20px;
            }
            
            .section-divider {
                margin: 20px 0;
            }
        }
        
        @media (max-width: 768px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .invoice-body {
                padding: 32px 24px;
            }
            
            .invoice-header {
                padding: 32px 24px;
            }
            
            .header-content {
                flex-direction: column;
                gap: 24px;
                align-items: flex-start;
            }
            
            .invoice-title-section {
                width: 100%;
                text-align: left;
                flex-direction: row;
            }
            
            .logo-section {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-wrapper">
        <div class="invoice-header">
            <div class="header-content">
                <div class="logo-section">
                    <img src="${logoSource}" alt="Company Logo" />
                    <div class="company-info">
                        <h1>${merchantInfo.companyName}</h1>
                        ${addressLines}
                    </div>
                </div>
               
                <div class="invoice-title-section">
                    <div class="invoice-title">Invoice No:</div>
                    <div class="invoice-number">${invoiceNumberToDisplay}</div>
                </div>
            </div>
        </div>
        
        <div class="header-separator"></div>

        <div class="invoice-body">
            <div class="info-grid">
                <div class="info-card">
                    <h3>Bill To</h3>
                    <p>${upiIdValue}</p>
                </div>
                <div class="info-card">
                    <h3>RRN Number</h3>
                    <p>${rrnValue}</p>
                </div>
                <div class="info-card">
                    <h3>Transaction Date & Time</h3>
                    <p>${combinedDateTime}</p>
                </div>
                <div class="info-card"> 
                    <h3>Wallet Load Date & Time</h3>
                    <p>${combinedDateTime}</p>
                </div>
            </div>
            
            <div class="section-divider"></div>
            
            <h2 class="transaction-section-title">Transaction Details</h2>
            
            <table class="transaction-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Wallet Loading Service</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;">₹ ${formattedAmount}</td>
                        <td style="text-align: right;">₹ ${formattedAmount}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row">
                    <span class="total-label">Subtotal</span>
                    <span>₹ ${formattedAmount}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">Tax</span>
                    <span>₹ 0.00</span>
                </div>
                <div class="total-row">
                    <span class="total-label">Total Amount</span>
                    <span class="total-amount">₹ ${formattedAmount}</span>
                </div>
            </div>
            
            <div class="terms-section">
                <h3>Terms & Conditions</h3>
                <p>By receiving this invoice, the user has paid the appropriate fees to ${termsAcronym} through Payment Gate and accepts the company's terms and conditions in connection with the transaction.</p>
                <p>All the invoices are raised against the UPI id through which the payment is collected.</p>
                <p>This is computer generated invoice and doesn't require a seal and signature.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

const generateJetpackInvoiceHTML = (
    merchantInfo,
    invoiceNumberToDisplay,
    combinedDateTime,
    upiIdValue,
    rrnValue,
    formattedAmount
) => {
    const logoSource = merchantInfo.logoPath || APP_ASSETS.branding.defaultMerchantLogo;
    const termsAcronym = merchantInfo.termsAcronym;
    
    const addressLines = merchantInfo.address.split('<br/>').map(line => `<p>${line}</p>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumberToDisplay} - ${rrnValue}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #1e293b;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .invoice-header {
            background: white;
            color: white;
            padding: 40px 40px;
            position: relative;
            overflow: hidden;
            padding-bottom: 70px;
        }
        
        .invoice-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 400px;
            height: 400px;
            background: #ffffff1a;
            border-radius: 50%;
        }
        
        .company-section {
            display: flex;
            align-items: center;
            gap: 24px;
            position: relative;
            z-index: 1;
        }
        
        .company-logo {
            width: 160px;
            height: 110px;
            object-fit: contain;
            padding: 12px;
        }
        
        .company-details h1 {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
            color: black;
        }
        
        .company-details p {
            font-size: 12px;
            line-height: 1.6;
            color: black;
            margin-bottom: 3px;
        }
        
        .company-details p:last-child {
            margin-bottom: 0;
        }
        
       
        .invoice-meta-right {
            position: absolute;
            bottom: 40px;
            right: 40px;
            text-align: right;
            padding: 0;
            margin: 0;
        }
        
        .invoice-meta-row {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
        }
        
        .invoice-label {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
            font-weight: 600;
        }
        
        .invoice-id {
            font-size: 16px;
            color: #0f172a;
            font-weight: 700;
            padding: 0;
        }

        .invoice-content {
            padding: 35px 40px;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .detail-box {
            background: #f8fafc;
            padding: 18px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .detail-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 3px;
            height: 100%;
            background: #0f172a;
            transform: scaleY(0);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .detail-box:hover {
            background: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
        }
        
        .detail-box:hover::before {
            transform: scaleY(1);
        }
        
        .detail-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .detail-value {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
        }
        
        .line-items {
            margin-bottom: 25px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-bottom: 25px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        
        .items-table thead {
            background: #0f172a;
        }
        
        .items-table th {
            padding: 14px 16px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: white;
            font-weight: 600;
        }
        
        .items-table td {
            padding: 16px;
            font-size: 14px;
            background: white;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .items-table tbody tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tbody tr:hover td {
            background: #f8fafc;
        }
        
        .items-table .amount-col {
            text-align: right;
            font-weight: 600;
            color: #0f172a;
        }
        
        .summary-section {
            margin-left: auto;
            width: 380px;
            background: #f8fafc;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 14px;
            color: #475569;
        }
        
        .summary-row.total {
            border-top: 2px solid #cbd5e1;
            margin-top: 12px;
            padding-top: 16px;
            font-size: 17px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .summary-row.total .amount {
            color: #0f172a;
            font-size: 22px;
            letter-spacing: -0.5px;
        }
        
        .footer-section {
            background: #f8fafc;
            padding: 24px;
            margin-top: 30px;
            border-radius: 8px;
            border-left: 4px solid #0f172a;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #0f172a;
        }
        
        .footer-section h3 {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 14px;
            color: #0f172a;
            font-weight: 700;
        }
        
        .footer-section p {
            font-size: 12px;
            line-height: 1.7;
            color: #475569;
            margin-bottom: 10px;
        }
        
        .footer-section p:last-child {
            margin-bottom: 0;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
                width: 100%;
            }

            .company-logo {
                width: 100px;
                height: 70px;
            }

            .company-details h1 {
                font-size: 18px;
                margin-bottom: 5px;
            }
            
            .company-details p {
                font-size: 10px;
                line-height: 1.4;
            }
            
            .invoice-header {
                padding: 10mm 15mm 5mm;
                padding-bottom: 30px;
            }
            
            .invoice-meta-right {
                bottom: 10px;
                right: 15mm;
            }

            .invoice-id {
                font-size: 15px;
                padding: 0;
            }

            .invoice-content {
                padding: 15mm;
            }
            
            .details-grid {
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .detail-box {
                padding: 12px;
                border-radius: 6px;
            }

            .detail-label {
                font-size: 9px;
                margin-bottom: 4px;
            }
            
            .detail-value {
                font-size: 13px;
            }

            .items-table th {
                padding: 10px 15px;
                font-size: 10px;
            }
            
            .items-table td {
                padding: 12px 15px;
                font-size: 13px;
            }

            .line-items {
                margin-bottom: 15px;
            }
            
            .summary-section {
                padding: 15px;
                width: 350px;
            }
            
            .summary-row {
                padding: 5px 0;
                font-size: 12px;
            }
            
            .summary-row.total {
                padding-top: 10px;
                font-size: 14px;
            }
            
            .summary-row.total .amount {
                font-size: 18px;
            }
            
            .footer-section {
                padding: 15px;
                margin-top: 20px;
                border-radius: 6px;
            }
            
            .footer-section h3 {
                font-size: 11px;
                margin-bottom: 8px;
            }
            
            .footer-section p {
                font-size: 10px;
                line-height: 1.6;
                margin-bottom: 5px;
            }
            
            
            @page {
                size: A4;
                margin: 5mm;
            }
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .invoice-header {
                padding: 25px 20px;
                padding-bottom: 25px;
            }

            .invoice-meta-right {
                position: static;
                margin-top: 20px;
                right: 0;
                bottom: 0;
                width: 100%;
                text-align: left;
                padding: 0;
                box-sizing: border-box;
                box-shadow: none;
            }
            
            .company-section {
                flex-direction: column;
                text-align: center;
                gap: 16px;
            }
            
            .invoice-content {
                padding: 20px;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }
            
            .summary-section {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="company-section">
                <img src="${logoSource}" alt="Logo" class="company-logo" />
                <div class="company-details">
                    <h1>${merchantInfo.companyName}</h1>
                    ${addressLines}
                </div>
            </div>
            
            <div class="invoice-meta-right">
                <div class="invoice-meta-row">
                    <div class="invoice-label">Invoice No:</div>
                    <div class="invoice-id">${invoiceNumberToDisplay}</div>
                </div>
            </div>
            </div>
        
        <div class="invoice-content">
            <div class="details-grid">
                <div class="detail-box">
                    <div class="detail-label">Billed To</div>
                    <div class="detail-value">${upiIdValue}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Transaction Date & Time</div>
                    <div class="detail-value">${combinedDateTime}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">RRN Number</div>
                    <div class="detail-value">${rrnValue}</div>
                </div>
                <div class="detail-box">
                    <div class="detail-label">Wallet Load Date & Time</div>
                    <div class="detail-value">${combinedDateTime}</div>
                </div>
            </div>
            
            <div class="line-items">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 10%;">Sl No.</th>
                            <th style="width: 40%;">Description</th>
                            <th style="width: 15%; text-align: center;">Qty</th>
                            <th style="width: 15%; text-align: right;">Rate</th>
                            <th style="width: 20%; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>Wallet Loading</td>
                            <td style="text-align: center;">1</td>
                            <td class="amount-col">₹ ${formattedAmount}</td>
                            <td class="amount-col">₹ ${formattedAmount}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="summary-section">
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span>₹ ${formattedAmount}</span>
                    </div>
                    <div class="summary-row">
                        <span>Tax Amount</span>
                        <span>₹ 0.00</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span class="amount">₹ ${formattedAmount}</span>
                    </div>
                </div>
            </div>
            
            <div class="footer-section">
                <h3>Terms & Conditions</h3>
                <p>1. By receiving this invoice, the user has paid the appropriate fees to ${termsAcronym} through Payment Gate and accepts the company's terms and conditions in connection with the transaction.</p>
                <p>2. All the invoices are raised against the UPI id through which the payment is collected.</p>
                <p>3. This is computer generated invoice and doesn't require a seal and signature.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

export const generateProfessionalInvoiceHTML = (
    rowData,
    headers,
    invoiceNumber,
    rrnColumn,
    upiColumn,
    merchantColumn,
    amountColumn,
    transactionDateColumn
) => {
    
    const currentDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const merchantInfo = getMerchantConfig(rowData, merchantColumn);
    const detectedCols = detectRequiredColumns(headers);

    const invoiceNumberToDisplay = invoiceNumber ? String(invoiceNumber) : '-';

    const transactionDateValue = detectedCols.transactionDate && rowData[detectedCols.transactionDate] ?
        formatCellValue(rowData[detectedCols.transactionDate], detectedCols.transactionDate).split(' ')[0] :
        currentDate.split(',')[0].split(' ')[0];

    const transactionTimeValue = detectedCols.transactionTime && rowData[detectedCols.transactionTime] ?
        formatCellValue(rowData[detectedCols.transactionTime], detectedCols.transactionTime) :
        currentDate.split(', ')[1]?.split(' ')[0] || '00:00';

    let finalTransactionDate;
    if (transactionDateValue.includes('-')) {
        const parts = transactionDateValue.split('-');
        finalTransactionDate = `${parts[2]}/${parts[1]}/${parts[0]}`; 
    } else {
        finalTransactionDate = transactionDateValue;
    }
    
    // Combining date and time for display
    const combinedDateTime = `${transactionTimeValue}`; 

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

    const merchantName = merchantColumn && rowData[merchantColumn] 
        ? String(rowData[merchantColumn]).toLowerCase().trim() 
        : 'jetpack';

    if (merchantName.includes('auxford')) {
        return generateAuxfordInvoiceHTML(
            merchantInfo,
            invoiceNumberToDisplay,
            combinedDateTime,
            upiIdValue,
            rrnValue,
            formattedAmount
        );
    } else {
        return generateJetpackInvoiceHTML(
            merchantInfo,
            invoiceNumberToDisplay,
            combinedDateTime,
            upiIdValue,
            rrnValue,
            formattedAmount
        );
    }
};
