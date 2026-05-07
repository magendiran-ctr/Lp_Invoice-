// @ts-nocheck
// hooks/useInvoiceDataProcessing.ts

import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { detectRequiredColumns } from '../utils/columnDetection';

const useInvoiceDataProcessing = (file) => {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [rrnColumn, setRrnColumn] = useState('');
    const [upiColumn, setUpiColumn] = useState('');
    const [merchantColumn, setMerchantColumn] = useState('');
    const [amountColumn, setAmountColumn] = useState('');
    const [duplicateColumn, setDuplicateColumn] = useState('');
    const [duplicates, setDuplicates] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const findDuplicates = useCallback((data, columnName) => {
        if (!columnName || !data.length) return [];

        const valueMap = {};
        const duplicateRows = [];

        data.forEach((row, index) => {
            const value = String(row[columnName] || '').trim();
            if (value) {
                if (!valueMap[value]) {
                    valueMap[value] = [];
                }
                valueMap[value].push({ ...row, _originalIndex: index });
            }
        });

        Object.entries(valueMap).forEach(([value, rows]) => {
            if (rows.length > 1) {
                duplicateRows.push({
                    value,
                    count: rows.length,
                    rows: rows
                });
            }
        });

        return duplicateRows;
    }, []);

    useEffect(() => {
        if (preview && duplicateColumn) {
            const foundDuplicates = findDuplicates(preview.data, duplicateColumn);
            setDuplicates(foundDuplicates);
        } else {
            setDuplicates([]);
        }
    }, [preview, duplicateColumn, findDuplicates]);

    const detectUpiColumn = (headers, sampleData) => {
        const upiPatterns = [
            'upi', 'upiid', 'upi_id', 'vpa', 'vba', 'payeevpa', 'payervpa', 'payee_vpa', 'payer_vpa',
            'payee_upi', 'payer_upi', 'upivirtualpaymentaddress'
        ];

        for (const header of headers) {
            const headerLower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (upiPatterns.some(pattern => headerLower.includes(pattern))) {
                return header;
            }
        }

        if (sampleData && sampleData.length > 0) {
            for (const header of headers) {
                if (header === '_rowIndex') continue;

                const sampleValues = sampleData.slice(0, Math.min(5, sampleData.length))
                    .map(row => String(row[header] || ''))
                    .filter(val => val.length > 0);

                if (sampleValues.length > 0) {
                    const upiLikeCount = sampleValues.filter(val => {
                        return val.includes('@') &&
                            val.split('@').length === 2 &&
                            val.split('@')[0].length > 0 &&
                            val.split('@')[1].length > 0 &&
                            !val.includes(' ') &&
                            val.length < 100;
                    }).length;

                    if (upiLikeCount / sampleValues.length > 0.7) {
                        return header;
                    }
                }
            }
        }
        return null;
    };

    const readExcelFile = (selectedFile) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        raw: false,
                        dateNF: 'yyyy-mm-dd'
                    });

                    let headers, rows;

                    if (jsonData.length > 0) {
                        const firstRow = jsonData[0];
                        const hasStringHeaders = firstRow.some(cell =>
                            typeof cell === 'string' && isNaN(parseFloat(cell))
                        );

                        if (hasStringHeaders) {
                            headers = jsonData[0].map(h => String(h).trim());
                            rows = jsonData.slice(1);
                        } else {
                            headers = jsonData[0].map((_, index) => `Column ${index + 1}`);
                            rows = jsonData;
                        }
                    } else {
                        headers = [];
                        rows = [];
                    }

                    const formattedData = rows.map((row, rowIndex) => {
                        const obj = { _rowIndex: rowIndex + 1 };
                        headers.forEach((header, index) => {
                            let value = row[index] || '';
                            obj[header] = value;
                        });
                        return obj;
                    }).filter(row => Object.values(row).some(val => val !== '' && val !== row._rowIndex));

                    resolve({ data: formattedData, headers });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(selectedFile);
        });
    };

    const readCSVFile = (selectedFile) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim());

                    if (lines.length === 0) {
                        reject(new Error('Empty CSV file'));
                        return;
                    }

                    const parseCSVLine = (line) => {
                        const result = [];
                        let current = '';
                        let inQuotes = false;
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                result.push(current.trim().replace(/^"|"$/g, ''));
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        result.push(current.trim().replace(/^"|"$/g, ''));
                        return result;
                    };

                    const firstLine = parseCSVLine(lines[0]);
                    const hasStringHeaders = firstLine.some(cell =>
                        typeof cell === 'string' && isNaN(parseFloat(cell)) && cell.length > 0
                    );

                    let headers, dataLines;
                    if (hasStringHeaders && lines.length > 1) {
                        headers = firstLine.map(h => h.trim());
                        dataLines = lines.slice(1);
                    } else {
                        headers = firstLine.map((_, index) => `Column ${index + 1}`);
                        dataLines = lines;
                    }
                      
                    const data = [];
                    dataLines.forEach((line, rowIndex) => {
                        const values = parseCSVLine(line);
                        const row = { _rowIndex: rowIndex + 1 };
                        headers.forEach((header, index) => {
                            let value = values[index] || '';
                            if (typeof value === 'string' && !isNaN(value) && value !== '') {
                                value = parseFloat(value);
                            }
                            row[header] = value;
                        });
                        data.push(row);
                    });

                    const formattedData = data.filter(row => Object.values(row).some(val => val !== '' && val !== row._rowIndex));


                    resolve({ data: formattedData, headers });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(selectedFile);
        });
    };

    const previewData = useCallback(async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setCurrentPage(1);

        try {
            let result;

            if (file.type === 'text/csv') {
                result = await readCSVFile(file);
            } else {
                result = await readExcelFile(file);
            }

            setPreview(result);

            // Auto-detect columns
            const detectedCols = detectRequiredColumns(result.headers, result.data);

            const possibleRrnColumns = result.headers.filter(header => {
                const lower = header.toLowerCase();
                return lower.includes('rrn') || lower.includes('reference') || lower.includes('ref') || lower.includes('transactionid');
            });

            if (possibleRrnColumns.length > 0) {
                setRrnColumn(possibleRrnColumns[0]);
                setDuplicateColumn(possibleRrnColumns[0]);
            }

            const detectedUpiColumn = detectUpiColumn(result.headers, result.data);
            if (detectedUpiColumn) {
                setUpiColumn(detectedUpiColumn);
            }

            if (detectedCols.amount) {
                setAmountColumn(detectedCols.amount);
            }

            if (detectedCols.merchantName) {
                setMerchantColumn(detectedCols.merchantName);
            }


        } catch (err) {
            console.error('Preview error:', err);
            setError('Error reading file: ' + err.message);
        }

        setLoading(false);
    }, [file]);

    const totalPages = preview ? Math.ceil(preview.data.length / rowsPerPage) : 0;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentRows = preview ? preview.data.slice(startIndex, endIndex) : [];

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return {
        loading,
        preview,
        error,
        rrnColumn, setRrnColumn,
        upiColumn, setUpiColumn,
        merchantColumn, setMerchantColumn,
        amountColumn, setAmountColumn,
        duplicateColumn, setDuplicateColumn,
        duplicates,
        previewData,
        // Pagination state and handlers
        currentPage,
        rowsPerPage,
        totalPages,
        startIndex,
        endIndex,
        currentRows,
        goToNextPage,
        goToPreviousPage,
        goToPage,
        setError,
    };
};

export default useInvoiceDataProcessing;
