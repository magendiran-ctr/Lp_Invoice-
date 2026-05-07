// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Building2, Hash, ChevronLeft, ChevronRight, DollarSign, Copy, Search, Tag, Eye } from 'lucide-react';
import { APP_ASSETS } from '../../../constants/assets';
import useInvoiceDataProcessing from '../../file-processing/hooks/useInvoiceDataProcessing';
import { generateProfessionalInvoiceHTML, formatCellValue, detectRequiredColumns } from '../utils/finoInvoiceTemplate';

export default function FinoInvoiceWorkspace() {
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatingZip, setGeneratingZip] = useState(false);
    const [isViewingInTabs, setIsViewingInTabs] = useState(false);
    const [zipProgress, setZipProgress] = useState(0);
    const [jetpackInvoiceStart, setJetpackInvoiceStart] = useState('');
    const [auxfordInvoiceStart, setAuxfordInvoiceStart] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    // **STATE FOR TRANSACTION DATE COLUMN**
    const [transactionDateColumn, setTransactionDateColumn] = useState('');

    const {
        loading,
        preview,
        error, setError,
        rrnColumn, setRrnColumn,
        upiColumn, setUpiColumn,
        merchantColumn, setMerchantColumn,
        amountColumn, setAmountColumn,
        duplicateColumn, setDuplicateColumn,
        duplicates,
        currentPage, rowsPerPage, totalPages, startIndex, endIndex, currentRows,
        previewData,
        goToNextPage, goToPreviousPage, goToPage,
    } = useInvoiceDataProcessing(file);

    // Effect to detect the date column when preview data is available
    useEffect(() => {
        if (preview && preview.headers.length > 0 && !transactionDateColumn) {
            const detectedCols = detectRequiredColumns(preview.headers);
            if (detectedCols.transactionDate) {
                setTransactionDateColumn(detectedCols.transactionDate);
            }
        }
    }, [preview, transactionDateColumn]);

    // Toast auto-hide effect
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ ...toast, show: false });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        // Dynamically load JSZip for ZIP creation
        const scriptZip = document.createElement('script');
        scriptZip.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        scriptZip.async = true;
        document.head.appendChild(scriptZip);

        // Dynamically load html2pdf for PDF generation
        const scriptPdf = document.createElement('script');
        scriptPdf.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        scriptPdf.async = true;
        document.head.appendChild(scriptPdf);

        return () => {
            // Cleanup scripts on component unmount
            if (document.head.contains(scriptZip)) {
                document.head.removeChild(scriptZip);
            }
            if (document.head.contains(scriptPdf)) {
                document.head.removeChild(scriptPdf);
            }
        };
    }, []);

    const getFilenameFromRRN = (rowData) => {
        if (!rrnColumn || !rowData[rrnColumn]) {
            return `${rowData._rowIndex}`;
        }
        const rrnValue = String(rowData[rrnColumn]);
        // Clean the RRN to be safe for filenames
        const cleanFilename = rrnValue.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `${cleanFilename}` || `${rowData._rowIndex}`;
    };

    const calculateInvoiceNumber = (rowIndex) => {
        if (!preview || !merchantColumn) return null;
        
        const row = preview.data[rowIndex];
        const merchantName = row[merchantColumn] ? String(row[merchantColumn]).toLowerCase() : '';
        
        if (merchantName.includes('jetpack') && jetpackInvoiceStart) {
            const jetpackRows = preview.data.slice(0, rowIndex + 1).filter(r => {
                const m = r[merchantColumn] ? String(r[merchantColumn]).toLowerCase() : '';
                return m.includes('jetpack');
            });
            
            // Extract numeric part from the starting number
            const numericMatch = jetpackInvoiceStart.match(/\d+/);
            const prefix = jetpackInvoiceStart.replace(/\d+/g, '');
            
            if (numericMatch) {
                const startNum = parseInt(numericMatch[0]);
                const newNum = startNum + jetpackRows.length - 1;
                return prefix + newNum;
            }
            return jetpackInvoiceStart;
            
        } else if (merchantName.includes('auxford') && auxfordInvoiceStart) {
            const auxfordRows = preview.data.slice(0, rowIndex + 1).filter(r => {
                const m = r[merchantColumn] ? String(r[merchantColumn]).toLowerCase() : '';
                return m.includes('auxford');
            });
            
            // Extract numeric part from the starting number
            const numericMatch = auxfordInvoiceStart.match(/\d+/);
            const prefix = auxfordInvoiceStart.replace(/\d+/g, '');
            
            if (numericMatch) {
                const startNum = parseInt(numericMatch[0]);
                const newNum = startNum + auxfordRows.length - 1;
                return prefix + newNum;
            }
            return auxfordInvoiceStart;
        }
        
        return null;
    };

    const processFile = (selectedFile) => {
        if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            selectedFile.type === 'application/vnd.ms-excel' ||
            selectedFile.type === 'text/csv')) {
            setIsProcessing(true);
            setUploadProgress(0);
            setError(null);

            // Simulate file upload and processing progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressInterval);
                        setTimeout(() => {
                            setFile(selectedFile);
                            setIsProcessing(false);
                        }, 500);
                        return 100;
                    }
                    // Incremental progress with a slight randomness
                    return prev + Math.random() * 15;
                });
            }, 100);
        } else {
            setError('Invalid file format. Please upload Excel (.xlsx, .xls) or CSV files only.');
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        processFile(selectedFile);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Check if the related target is outside the drag zone
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        processFile(droppedFile);
    };

    const downloadAsPDF = (htmlContent, filename = 'invoice') => {
        // Use the browser's native print function for simple PDF generation (best for direct printing/saving)
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>${filename}</title>
                    <style>
                        /* Essential for A4 sizing on print */
                        @media print {
                            @page { size: A4; margin: 0; }
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                    <script>
                        // Give browser time to render before printing
                        setTimeout(() => {
                            window.print();
                            // Optional: close the tab after print dialog is shown/closed
                            // window.close(); 
                        }, 500);
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            setError('Could not open print dialog. Please disable pop-up blockers.');
        }
    };
    
    const viewAllInTabs = () => {
        if (!preview || !preview.data.length) return;
        if (!rrnColumn || !upiColumn || !amountColumn) {
            setError('Please select all required columns.');
            return;
        }

        setIsViewingInTabs(true);
        setError(null);

        try {
            preview.data.forEach((rowData, i) => {
                const merchantName = rowData[merchantColumn] ? String(rowData[merchantColumn]).toLowerCase() : '';
                let currentInvoiceNumber = null;
                
                const actualRowIndex = i;
                
                // Calculate invoice number based on merchant type and starting number
                if (merchantColumn) {
                    if (merchantName.includes('jetpack') && jetpackInvoiceStart) {
                        const numericMatch = jetpackInvoiceStart.match(/\d+/);
                        const prefix = jetpackInvoiceStart.replace(/\d+/g, '');
                        if (numericMatch) {
                            const startNum = parseInt(numericMatch[0]);
                            const jetpackCount = preview.data.slice(0, actualRowIndex + 1).filter(r => String(r[merchantColumn] || '').toLowerCase().includes('jetpack')).length;
                            currentInvoiceNumber = prefix + (startNum + jetpackCount - 1);
                        } else {
                            currentInvoiceNumber = jetpackInvoiceStart;
                        }
                    } else if (merchantName.includes('auxford') && auxfordInvoiceStart) {
                        const numericMatch = auxfordInvoiceStart.match(/\d+/);
                        const prefix = auxfordInvoiceStart.replace(/\d+/g, '');
                        if (numericMatch) {
                            const startNum = parseInt(numericMatch[0]);
                            const auxfordCount = preview.data.slice(0, actualRowIndex + 1).filter(r => String(r[merchantColumn] || '').toLowerCase().includes('auxford')).length;
                            currentInvoiceNumber = prefix + (startNum + auxfordCount - 1);
                        } else {
                            currentInvoiceNumber = auxfordInvoiceStart;
                        }
                    }
                }

                const htmlContent = generateProfessionalInvoiceHTML(
                    rowData,
                    preview.headers,
                    currentInvoiceNumber,
                    rrnColumn,
                    upiColumn,
                    merchantColumn,
                    amountColumn,
                    transactionDateColumn // Pass the transaction date column
                );
                
                const filename = getFilenameFromRRN(rowData);
                
                // Open a new window/tab for the invoice HTML
                const newWindow = window.open('about:blank', `invoice-${i}`, 'width=800,height=600');
                if (newWindow) {
                    newWindow.document.write(`
                        <html>
                        <head>
                            <title>${filename}.pdf</title>
                            <style>
                                @media print {
                                    @page { size: A4; margin: 0; }
                                    body { margin: 0; }
                                }
                            </style>
                        </head>
                        <body>
                            ${htmlContent}
                        </body>
                        </html>
                    `);
                    newWindow.document.close();
                }
            });
            
            // Show toast instead of alert
            showToast(`Opening ${preview.data.length} invoices in new tabs. Please ensure pop-up blockers are disabled.`, 'info');

        } catch (err) {
            console.error('View in Tabs error:', err);
            setError('Error viewing invoices: ' + err.message);
        } finally {
            setIsViewingInTabs(false);
        }
    };

    // Helper to create an element for html2pdf to process
    const createInvoiceElement = (htmlContent) => {
        const tempDiv = document.createElement('div');
        // Set a width close to A4 size to help html2pdf with scaling
        tempDiv.style.width = '208mm'; 
        tempDiv.innerHTML = htmlContent;
        return tempDiv;
    };

    const downloadAllAsZip = async () => {
        if (!preview || !preview.data.length) return;

        if (!rrnColumn || !upiColumn || !amountColumn) {
            setError('Please select all required columns.');
            return;
        }

        // Check if the dynamically loaded libraries are available globally
        if (!window.JSZip || !window.html2pdf) {
            setError('PDF or ZIP library not fully loaded. Please wait a moment and try again.');
            return;
        }

        setGeneratingZip(true);
        setZipProgress(0);
        setError(null);

        // Create a temporary, hidden container to render the PDF content for html2pdf
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.top = '0';
        tempContainer.style.left = '0';
        tempContainer.style.zIndex = '-1000';
        tempContainer.style.opacity = '0';
        tempContainer.style.pointerEvents = 'none';
        tempContainer.style.width = '208mm';
        document.body.appendChild(tempContainer);

        try {
            const zip = new window.JSZip();
            const totalRows = preview.data.length;

            for (let i = 0; i < totalRows; i++) {
                const rowData = preview.data[i];
                const actualRowIndex = i;
                const currentInvoiceNumber = calculateInvoiceNumber(actualRowIndex);

                const htmlContent = generateProfessionalInvoiceHTML(
                    rowData,
                    preview.headers,
                    currentInvoiceNumber,
                    rrnColumn,
                    upiColumn,
                    merchantColumn,
                    amountColumn,
                    transactionDateColumn // Pass the transaction date column
                );
                const filename = getFilenameFromRRN(rowData);

                const element = createInvoiceElement(htmlContent);
                tempContainer.appendChild(element);

                // Generate PDF Blob using html2pdf
                const pdfBlob = await window.html2pdf()
                    .from(element)
                    .set({
                        margin: [1, 5, 1, 5],
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: {
                            scale: 2,
                            logging: false,
                            allowTaint: true,
                            useCORS: true
                        },
                        jsPDF: {
                            unit: 'mm',
                            format: 'a4',
                            orientation: 'portrait',
                            compress: true
                        },
                        pagebreak: { mode: 'none' } // Important to prevent page breaks in invoice HTML
                    })
                    .output('blob');

                // Add the PDF to the ZIP file
                zip.file(`${filename}.pdf`, pdfBlob);
                
                // Clean up the temporary element
                tempContainer.removeChild(element);
                
                // Update progress
                setZipProgress(Math.round(((i + 1) / totalRows) * 100));

                // Yield control to the browser to prevent UI freezing every few iterations
                if (i % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // Generate the final ZIP file
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // Trigger the download
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoices_PDF_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url); // Clean up the URL object

            showToast(`Successfully created ZIP file with ${totalRows} PDF invoices!`, 'success');
        } catch (err) {
            console.error('ZIP/PDF generation error:', err);
            setError('Error creating ZIP file: ' + err.message);
        } finally {
            // Ensure the temp container is removed even if an error occurs
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        }

        setGeneratingZip(false);
        setZipProgress(0);
    };

    const generateSinglePDF = async (index) => {
        // Index is the row number on the current page
        if (!preview || !preview.data[startIndex + index]) return;

        if (!rrnColumn || !upiColumn || !amountColumn) {
            setError('Please select all required columns.');
            return;
        }

        setError(null);

        try {
            const rowData = preview.data[startIndex + index];
            const actualRowIndex = startIndex + index;
            const invoiceNumber = calculateInvoiceNumber(actualRowIndex);

            const htmlContent = generateProfessionalInvoiceHTML(
                rowData,
                preview.headers,
                invoiceNumber,
                rrnColumn,
                upiColumn,
                merchantColumn,
                amountColumn,
                transactionDateColumn // Pass the transaction date column
            );

            // Use the simpler print method for single PDF download
            downloadAsPDF(htmlContent, getFilenameFromRRN(rowData));
        } catch (err) {
            console.error('Single PDF generation error:', err);
            setError('Error generating PDF: ' + err.message);
        }
    };

    const clearFile = () => {
        setFile(null);
        setError(null);
        // Reset all column selections and settings
        setRrnColumn('');
        setUpiColumn('');
        setMerchantColumn('');
        setAmountColumn('');
        setDuplicateColumn('');
        // **RESET NEW DATE COLUMN**
        setTransactionDateColumn('');
        setShowDuplicates(false);
        setJetpackInvoiceStart('');
        setAuxfordInvoiceStart('');
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset the file input element
        }
    };

    const isReadyToGenerate = rrnColumn && upiColumn && amountColumn;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f6f7f4]">
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-6 right-6 z-50 animate-[slideIn_0.3s_ease-out]">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl border-2 ${
                        toast.type === 'success' ? 'bg-green-500 border-green-400' : 
                        toast.type === 'error' ? 'bg-red-500 border-red-400' : 
                        'bg-blue-500 border-blue-400'
                    }`}>
                        {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-white" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-white" />}
                        {toast.type === 'info' && <FileText className="w-5 h-5 text-white" />}
                        <p className="text-white font-medium text-sm">{toast.message}</p>
                    </div>
                </div>
            )}

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap');
                    * {
                        font-family: 'M PLUS Rounded 1c', sans-serif !important;
                    }
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>
            
            <header className="relative z-20 px-5 pt-5 md:px-8 md:pt-6">
                <div className="mx-auto flex w-full max-w-7xl items-center">
                    <img
                        src={APP_ASSETS.branding.companyLogo}
                        alt="Company Logo"
                        className="h-11 w-auto object-contain md:h-12"
                    />
                </div>
            </header>

            <div className="relative z-10 pb-10 pt-4 md:pb-14">

                <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-7xl items-start justify-center px-4 md:px-6">
                    <div className="w-full overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                        <div className="p-5 md:p-7">
                            <div className="flex items-center space-x-2 mb-4">
                                <Upload className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Upload Your Data File</h3>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center">
                                        <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                                        <p className="text-red-800 text-sm">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
                                {file ? (
                                    <div className="space-y-3">
                                        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                                        <div>
                                            <p className="text-base font-semibold text-gray-900">{file.name}</p>
                                            <p className="text-sm text-gray-600 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button onClick={clearFile} className="text-sm font-medium text-red-600 hover:text-red-700">Remove file</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div>
                                            <p className="text-lg font-semibold text-gray-900">Drop your data file here</p>
                                            <p className="text-sm text-gray-600 mt-1">or click to browse</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Supports Excel (.xlsx, .xls) and CSV files</p>
                                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" id="file-upload" />
                                        <label htmlFor="file-upload" className="inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 cursor-pointer transition-colors">
                                            <Upload className="w-4 h-4 mr-2" />Choose File
                                        </label>
                                    </div>
                                )}
                            </div>

                            {file && (
                                <div className="mt-4 flex justify-center">
                                    <button onClick={previewData} disabled={loading || isProcessing} className="inline-flex items-center px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {loading || isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                {isProcessing ? `Uploading... ${Math.round(uploadProgress)}%` : 'Loading...'}
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4 mr-2" />Preview Data
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {preview && (
                            <div className="border-t border-gray-200 bg-gray-50 p-5 md:p-7">
                                <h3 className="text-base font-semibold text-gray-900 mb-4">Configure Invoice Settings</h3>

                                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                        <Tag className="w-4 h-4 text-green-600 mr-2" />Starting Invoice Numbers
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="jetpack-invoice-start" className="block text-xs font-medium text-gray-700 mb-1">
                                                Jetpack Merchant
                                            </label>
                                            <input id="jetpack-invoice-start" type="text" value={jetpackInvoiceStart} onChange={(e) => setJetpackInvoiceStart(e.target.value)} placeholder="e.g., JP101 or 101" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                        </div>
                                        <div>
                                            <label htmlFor="auxford-invoice-start" className="block text-xs font-medium text-gray-700 mb-1">
                                                Auxford Merchant
                                            </label>
                                            <input id="auxford-invoice-start" type="text" value={auxfordInvoiceStart} onChange={(e) => setAuxfordInvoiceStart(e.target.value)} placeholder="e.g., AX5001 or 5001" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                        <Copy className="w-4 h-4 text-green-600 mr-2" />Duplicate Detection
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Column to Check
                                            </label>
                                            <select value={duplicateColumn} onChange={(e) => setDuplicateColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select column</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            {duplicates.length > 0 && (
                                                <button onClick={() => setShowDuplicates(!showDuplicates)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                                                    {showDuplicates ? 'Hide' : 'Show'} {duplicates.length} Duplicates
                                                </button>
                                            )}
                                            {duplicateColumn && duplicates.length === 0 && (
                                                <div className="px-4 py-2 bg-lime-50 border border-lime-200 text-lime-700 rounded-lg text-sm font-medium">No duplicates</div>
                                            )}
                                        </div>
                                        {showDuplicates && duplicates.length > 0 && (
                                            <div className="mt-3 bg-white rounded-lg border border-gray-200 p-3 max-h-80 overflow-y-auto col-span-full">
                                                <div className="space-y-2">
                                                    {duplicates.map((duplicate, index) => (
                                                        <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h6 className="font-medium text-sm text-gray-900">"{duplicate.value}"</h6>
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{duplicate.count} times</span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                {duplicate.rows.map((row, rowIndex) => (
                                                                    <div key={rowIndex} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                                                                        Row #{row._originalIndex + 1}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Select Required Columns</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <FileText className="w-3 h-3 inline mr-1 text-green-600" />Date (Optional)
                                            </label>
                                            <select value={transactionDateColumn} onChange={(e) => setTransactionDateColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <Building2 className="w-3 h-3 inline mr-1 text-green-600" />Merchant (Optional)
                                            </label>
                                            <select value={merchantColumn} onChange={(e) => setMerchantColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <DollarSign className="w-3 h-3 inline mr-1" />Amount *
                                            </label>
                                            <select value={amountColumn} onChange={(e) => setAmountColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <Hash className="w-3 h-3 inline mr-1" />RRN *
                                            </label>
                                            <select value={rrnColumn} onChange={(e) => setRrnColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* UPI Column is moved down to make space for date, but kept as required */}
                                        <div className="lg:col-span-1"> 
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                <FileText className="w-3 h-3 inline mr-1" />UPI ID *
                                            </label>
                                            <select value={upiColumn} onChange={(e) => setUpiColumn(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                                <option value="">Select</option>
                                                {preview.headers.filter(header => header !== '_rowIndex').map(header => (
                                                    <option key={header} value={header}>{header}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="flex flex-wrap gap-2">
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${transactionDateColumn ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${transactionDateColumn ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                                                Date: {transactionDateColumn || 'Not set'}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${merchantColumn ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${merchantColumn ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                                                Merchant: {merchantColumn || 'Not set'}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${amountColumn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${amountColumn ? 'bg-green-600' : 'bg-red-500'}`}></div>
                                                Amount: {amountColumn || 'Required'}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${rrnColumn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${rrnColumn ? 'bg-green-600' : 'bg-red-500'}`}></div>
                                                RRN: {rrnColumn || 'Required'}
                                            </div>
                                            <div className={`flex items-center px-2 py-1 rounded text-xs ${upiColumn ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                <div className="w-1.5 h-1.5 rounded-full mr-1.5 bg-red-500"></div>
                                                UPI ID: {upiColumn || 'Required'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isReadyToGenerate && (
                                    <div className="mt-4 flex justify-center gap-3">
                                        <button onClick={viewAllInTabs} disabled={isViewingInTabs || generatingZip} className="inline-flex items-center px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Eye className="w-4 h-4 mr-2" />
                                            {isViewingInTabs ? `Opening ${preview.data.length} Tabs...` : 'View All in Tabs'}
                                        </button>

                                        <button onClick={downloadAllAsZip} disabled={generatingZip || isViewingInTabs} className="inline-flex items-center px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Download className="w-4 h-4 mr-2" />
                                            {generatingZip ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                    {`Creating ZIP... ${zipProgress}%`}
                                                </>
                                            ) : (
                                                `Download All (${preview.data.length})`
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {preview && (
                            <div className="border-t border-gray-200 bg-white p-5 md:p-7">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-gray-900">Data Preview</h3>
                                    <div className="text-xs text-gray-600">{startIndex + 1}-{Math.min(endIndex, preview.data.length)} of {preview.data.length}</div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">Row</th>
                                                    {/* **NEW DATE COLUMN HEADER** */}
                                                    {transactionDateColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{transactionDateColumn}</th>
                                                    )}
                                                    {rrnColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{rrnColumn}</th>
                                                    )}
                                                    {merchantColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{merchantColumn}</th>
                                                    )}
                                                    {upiColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{upiColumn}</th>
                                                    )}
                                                    {amountColumn && (
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{amountColumn}</th>
                                                    )}
                                                    {preview.headers.filter(header =>
                                                        header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn && header !== duplicateColumn && header !== transactionDateColumn
                                                    ).slice(0, 2).map((header) => (
                                                        <th key={header} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-b">{header}</th>
                                                    ))}
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Invoice #</th>
                                                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 border-b">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {currentRows.map((row, index) => {
                                                    const actualRowIndex = startIndex + index;
                                                    const invoiceNum = calculateInvoiceNumber(actualRowIndex);
                                                    
                                                    return (
                                                        <tr key={actualRowIndex} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-2 text-xs font-medium text-gray-900">{actualRowIndex + 1}</td>
                                                            {/* **NEW DATE COLUMN DATA** */}
                                                            {transactionDateColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">
                                                                    {formatCellValue(row[transactionDateColumn], transactionDateColumn).split(' ')[0]}
                                                                </td>
                                                            )}
                                                            {rrnColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">{getFilenameFromRRN(row)}.pdf</td>
                                                            )}
                                                            {merchantColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">
                                                                    {formatCellValue(row[merchantColumn], merchantColumn).substring(0, 15)}
                                                                    {formatCellValue(row[merchantColumn], merchantColumn).length > 15 ? '...' : ''}
                                                                </td>
                                                            )}
                                                            {upiColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">
                                                                    {formatCellValue(row[upiColumn], upiColumn).substring(0, 25)}
                                                                    {formatCellValue(row[upiColumn], upiColumn).length > 25 ? '...' : ''}
                                                                </td>
                                                            )}
                                                            {amountColumn && (
                                                                <td className="px-4 py-2 text-xs text-gray-700">{formatCellValue(row[amountColumn], amountColumn)}</td>
                                                            )}
                                                            {preview.headers.filter(header =>
                                                                header !== '_rowIndex' && header !== rrnColumn && header !== upiColumn && header !== merchantColumn && header !== amountColumn && header !== duplicateColumn && header !== transactionDateColumn
                                                            ).slice(0, 2).map((header) => (
                                                                <td key={header} className="px-4 py-2 text-xs text-gray-700">
                                                                    {formatCellValue(row[header], header).substring(0, 25)}
                                                                    {formatCellValue(row[header], header).length > 25 ? '...' : ''}
                                                                </td>
                                                            ))}
                                                            <td className="px-4 py-2 text-center">
                                                                <span className="text-xs font-medium text-gray-700">
                                                                    {invoiceNum !== null ? invoiceNum : '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                {isReadyToGenerate ? (
                                                                    <button onClick={() => generateSinglePDF(index)} className="inline-flex items-center px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded text-xs font-medium transition-colors">
                                                                        <Download className="w-3 h-3 mr-1" />Generate
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">Not ready</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-xs text-gray-600">Page {currentPage} of {totalPages}</div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={goToPreviousPage} disabled={currentPage === 1} className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            <ChevronLeft className="w-3 h-3 mr-1" />Previous
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNumber;
                                                if (totalPages <= 5) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNumber = totalPages - 4 + i;
                                                } else {
                                                    pageNumber = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button key={pageNumber} onClick={() => goToPage(pageNumber)} className={`px-2 py-1 text-xs font-medium rounded transition-colors ${currentPage === pageNumber ? 'bg-green-600 text-white' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'}`}>
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button onClick={goToNextPage} disabled={currentPage === totalPages} className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            Next<ChevronRight className="w-3 h-3 ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {generatingZip && (
                            <div className="border-t border-gray-200 bg-gray-50 p-5 md:p-7">
                                <div className="text-center mb-3">
                                    <h4 className="text-sm font-semibold text-gray-900">Creating PDF ZIP File</h4>
                                    <p className="text-xs text-gray-600 mt-1">Please wait...</p>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="flex-1 max-w-md bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${zipProgress}%` }}></div>
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 min-w-[3rem]">{zipProgress}%</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
