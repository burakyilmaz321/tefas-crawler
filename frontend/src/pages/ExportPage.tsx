import { useState, useEffect } from 'react';
import { FundKind, FundSummary } from '../types';
import { fetchFunds, fetchFundDetails } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportPageProps {
    fundKind: FundKind;
}

const ExportPage = ({ fundKind: initialFundKind }: ExportPageProps) => {
    const [fundKind, setFundKind] = useState<FundKind>(initialFundKind);
    const [allFunds, setAllFunds] = useState<FundSummary[]>([]);
    const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
    const [fromDate, setFromDate] = useState('01/01/2024');
    const [toDate, setToDate] = useState(new Date().toLocaleDateString('en-GB'));
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['fund_type', 'price', 'investor_count', 'market_cap']);
    const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [tefasFilter, setTefasFilter] = useState<'all' | 'tefas_only' | 'non_tefas'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const tefasFilterOptions = [
        { label: 'Tümü', value: 'all' as const },
        { label: 'Sadece TEFAS\'ta İşlem Görenler', value: 'tefas_only' as const },
        { label: 'Sadece TEFAS Dışı', value: 'non_tefas' as const },
    ];

    const fundKinds = [
        { label: 'Yatırım Fonları (YAT)', value: 'YAT' as FundKind },
        { label: 'Emeklilik Fonları (EMK)', value: 'EMK' as FundKind },
        { label: 'Borsa Yatırım Fonları (BYF)', value: 'BYF' as FundKind },
    ];

    const columns = [
        { id: 'fund_type', label: 'Fon Türü' },
        { id: 'date', label: 'Tarih' },
        { id: 'price', label: 'Fiyat' },
        { id: 'investor_count', label: 'Yatırımcı Sayısı' },
        { id: 'market_cap', label: 'Portföy Büyüklüğü' },
    ];

    useEffect(() => {
        loadFunds();
        // Reset TEFAS filter when fund type changes (only applicable to YAT)
        if (fundKind !== 'YAT') {
            setTefasFilter('all');
        }
    }, [fundKind]);

    const loadFunds = async () => {
        try {
            const funds = await fetchFunds(fundKind);
            setAllFunds(funds);
            setSelectedFunds(funds.map(f => f.code)); // Select all by default
        } catch (err) {
            setError('Fonlar yüklenemedi');
        }
    };

    // Filter funds based on TEFAS availability (only for YAT) and search query
    const getFilteredFunds = () => {
        let funds = allFunds;

        // Apply TEFAS filter (only for YAT)
        if (fundKind === 'YAT' && tefasFilter !== 'all') {
            funds = funds.filter(fund => {
                if (tefasFilter === 'tefas_only') {
                    return fund.isTefasAvailable === true;
                }
                return fund.isTefasAvailable === false;
            });
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            funds = funds.filter(fund =>
                fund.code.toLowerCase().includes(query) ||
                fund.title.toLowerCase().includes(query)
            );
        }

        return funds;
    };

    const filteredFunds = getFilteredFunds();

    // Count funds after TEFAS filter but before search (for display)
    const tefasFilteredCount = fundKind === 'YAT' && tefasFilter !== 'all'
        ? allFunds.filter(fund => tefasFilter === 'tefas_only' ? fund.isTefasAvailable === true : fund.isTefasAvailable === false).length
        : allFunds.length;

    const toggleSelectAll = () => {
        const filteredCodes = filteredFunds.map(f => f.code);
        const allFilteredSelected = filteredCodes.every(code => selectedFunds.includes(code));

        if (allFilteredSelected) {
            // Deselect all filtered funds
            setSelectedFunds(prev => prev.filter(code => !filteredCodes.includes(code)));
        } else {
            // Select all filtered funds (add to existing selection)
            setSelectedFunds(prev => [...new Set([...prev, ...filteredCodes])]);
        }
    };

    const toggleFund = (code: string) => {
        setSelectedFunds(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const toggleColumn = (columnId: string) => {
        setSelectedColumns(prev =>
            prev.includes(columnId) ? prev.filter(c => c !== columnId) : [...prev, columnId]
        );
    };

    const parseDateDDMMYYYY = (dateStr: string): Date | null => {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        const date = new Date(year, month, day);
        return isNaN(date.getTime()) ? null : date;
    };

    const validateDates = (): boolean => {
        const from = parseDateDDMMYYYY(fromDate);
        const to = parseDateDDMMYYYY(toDate);

        if (!from || !to) {
            setError('Geçersiz tarih formatı. GG/AA/YYYY kullanın');
            return false;
        }

        if (from > to) {
            setError('Başlangıç tarihi bitiş tarihinden önce olmalı');
            return false;
        }

        const diffYears = (to.getTime() - from.getTime()) / (365 * 24 * 60 * 60 * 1000);
        if (diffYears > 5) {
            setError('Tarih aralığı 5 yılı geçemez');
            return false;
        }

        return true;
    };

    const calculateDays = (): number => {
        const from = parseDateDDMMYYYY(fromDate)!;
        const to = parseDateDDMMYYYY(toDate)!;
        return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
    };

    const exportData = async () => {
        if (selectedFunds.length === 0) {
            setError('Lütfen en az bir fon seçin');
            return;
        }

        if (selectedColumns.length === 0) {
            setError('Lütfen en az bir sütun seçin');
            return;
        }

        if (!validateDates()) return;

        setIsExporting(true);
        setError(null);
        setProgress(0);

        try {
            const days = calculateDays();
            const fundsData = [];
            const failedFunds: string[] = [];

            for (let i = 0; i < selectedFunds.length; i++) {
                const code = selectedFunds[i];
                const fundSummary = allFunds.find(f => f.code === code);
                if (!fundSummary) continue;

                setProgress(((i + 1) / selectedFunds.length) * 100);

                try {
                    const fundDetails = await fetchFundDetails(code, fundKind, days);
                    fundsData.push({
                        code,
                        title: fundDetails.title || fundSummary.title,
                        details: fundDetails
                    });
                } catch (err) {
                    console.error(`Failed to fetch ${code}:`, err);
                    failedFunds.push(code);
                    // Continue with remaining funds
                }
            }

            if (fundsData.length === 0) {
                setError('Hiçbir fon verisi alınamadı. Lütfen daha sonra tekrar deneyin.');
                return;
            }

            // Generate export based on format
            if (format === 'csv') {
                exportCSV(fundsData);
            } else if (format === 'excel') {
                exportExcel(fundsData);
            } else {
                exportPDF(fundsData);
            }

            setProgress(100);

            if (failedFunds.length > 0) {
                setError(`Dışa aktarma tamamlandı, ancak ${failedFunds.length} fon yüklenemedi: ${failedFunds.slice(0, 5).join(', ')}${failedFunds.length > 5 ? '...' : ''}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setTimeout(() => {
                setIsExporting(false);
                setProgress(0);
            }, 1000);
        }
    };

    const exportCSV = (fundsData: any[]) => {
        let csv = 'Fund Code,Fund Name';
        if (selectedColumns.includes('fund_type')) csv += ',Fund Type';
        if (selectedColumns.includes('date')) csv += ',Date';
        if (selectedColumns.includes('price')) csv += ',Price';
        if (selectedColumns.includes('investor_count')) csv += ',Investor Count';
        if (selectedColumns.includes('market_cap')) csv += ',Market Cap';
        csv += '\n';

        fundsData.forEach(({ code, title, details }) => {
            const history = details.priceHistory || details.investorHistory || details.marketCapHistory;

            history?.forEach((point: any) => {
                csv += `${code},"${title}"`;
                if (selectedColumns.includes('fund_type')) csv += `,${fundKind}`;
                if (selectedColumns.includes('date')) csv += `,${point.date}`;
                if (selectedColumns.includes('price')) csv += `,${details.priceHistory.find((p: any) => p.date === point.date)?.value || ''}`;
                if (selectedColumns.includes('investor_count')) csv += `,${details.investorHistory.find((p: any) => p.date === point.date)?.value || ''}`;
                if (selectedColumns.includes('market_cap')) csv += `,${details.marketCapHistory.find((p: any) => p.date === point.date)?.value || ''}`;
                csv += '\n';
            });
        });

        downloadFile(csv, `tefas_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    };

    const exportExcel = (fundsData: any[]) => {
        const rows: any[] = [];

        fundsData.forEach(({ code, title, details }) => {
            const maxLength = Math.max(
                details.priceHistory?.length || 0,
                details.investorHistory?.length || 0,
                details.marketCapHistory?.length || 0
            );

            for (let i = 0; i < maxLength; i++) {
                const row: any = {
                    'Fund Code': code,
                    'Fund Name': title
                };

                if (selectedColumns.includes('fund_type')) row['Fund Type'] = fundKind;
                if (selectedColumns.includes('date')) row['Date'] = details.priceHistory?.[i]?.date || details.investorHistory?.[i]?.date || details.marketCapHistory?.[i]?.date || '';
                if (selectedColumns.includes('price')) row['Price'] = details.priceHistory?.[i]?.value || '';
                if (selectedColumns.includes('investor_count')) row['Investor Count'] = details.investorHistory?.[i]?.value || '';
                if (selectedColumns.includes('market_cap')) row['Market Cap'] = details.marketCapHistory?.[i]?.value || '';

                rows.push(row);
            }
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'TEFAS Data');
        XLSX.writeFile(wb, `tefas_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportPDF = (fundsData: any[]) => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('TEFAS Fund Export', 14, 15);
        doc.setFontSize(10);
        doc.text(`Date Range: ${fromDate} - ${toDate}`, 14, 22);

        let startY = 30;

        fundsData.forEach(({ code, title, details }) => {
            if (startY > 250) {
                doc.addPage();
                startY = 20;
            }

            doc.setFontSize(12);
            doc.text(`${code} - ${title}`, 14, startY);
            startY += 7;

            const headers = [];
            if (selectedColumns.includes('fund_type')) headers.push('Type');
            if (selectedColumns.includes('date')) headers.push('Date');
            if (selectedColumns.includes('price')) headers.push('Price');
            if (selectedColumns.includes('investor_count')) headers.push('Investors');
            if (selectedColumns.includes('market_cap')) headers.push('Market Cap');

            const rows: any[] = [];
            const maxLength = Math.max(
                details.priceHistory?.length || 0,
                details.investorHistory?.length || 0,
                details.marketCapHistory?.length || 0
            );

            for (let i = 0; i < Math.min(maxLength, 50); i++) { // Limit to 50 rows per fund for PDF
                const row = [];
                if (selectedColumns.includes('fund_type')) row.push(fundKind);
                if (selectedColumns.includes('date')) row.push(details.priceHistory?.[i]?.date || '');
                if (selectedColumns.includes('price')) row.push(details.priceHistory?.[i]?.value?.toFixed(6) || '');
                if (selectedColumns.includes('investor_count')) row.push(details.investorHistory?.[i]?.value?.toString() || '');
                if (selectedColumns.includes('market_cap')) row.push(details.marketCapHistory?.[i]?.value?.toFixed(2) || '');
                rows.push(row);
            }

            autoTable(doc, {
                startY,
                head: [headers],
                body: rows,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [37, 99, 235] }
            });

            startY = (doc as any).lastAutoTable.finalY + 10;
        });

        doc.save(`tefas_export_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="export-container">
            <h2 className="section-title">Fon Verilerini Dışa Aktar</h2>

            {error && (
                <div className="error-banner">{error}</div>
            )}

            {/* Fund Type Selection */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Fon Türü</h3>
                <div className="chip-group">
                    {fundKinds.map(kind => (
                        <button
                            key={kind.value}
                            className={`chip ${fundKind === kind.value ? 'active' : ''}`}
                            onClick={() => setFundKind(kind.value)}
                        >
                            {kind.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TEFAS Filter - Only shown for YAT funds */}
            {fundKind === 'YAT' && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <h3 className="section-title">TEFAS İşlem Durumu</h3>
                    <div className="chip-group">
                        {tefasFilterOptions.map(option => (
                            <button
                                key={option.value}
                                className={`chip ${tefasFilter === option.value ? 'active' : ''}`}
                                onClick={() => setTefasFilter(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                        Gösterilen: {filteredFunds.length} / {allFunds.length} fon
                    </p>
                </div>
            )}

            {/* Fund Selection */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Fon Seçimi</h3>
                <div style={{ marginBottom: 12 }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Fon kodu veya ismi ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ marginBottom: 12, width: '100%', maxWidth: 400 }}
                    />
                </div>
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filteredFunds.length > 0 && filteredFunds.every(f => selectedFunds.includes(f.code))}
                            onChange={toggleSelectAll}
                        />
                        <span style={{ marginLeft: 8, fontWeight: 600 }}>Tümünü Seç ({filteredFunds.length} fon)</span>
                    </label>
                    {searchQuery && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                            Arama sonucu: {filteredFunds.length} fon
                        </span>
                    )}
                </div>
                <div className="fund-selection-grid">
                    {filteredFunds.map(fund => (
                        <label key={fund.code} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={selectedFunds.includes(fund.code)}
                                onChange={() => toggleFund(fund.code)}
                            />
                            <span style={{ marginLeft: 8 }}>{fund.code} - {fund.title}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Date Range */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Tarih Aralığı (Maks 5 yıl)</h3>
                <div className="date-range-inputs">
                    <div>
                        <label className="input-label">Başlangıç (GG/AA/YYYY)</label>
                        <input
                            type="text"
                            className="input"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            placeholder="01/01/2024"
                        />
                    </div>
                    <div>
                        <label className="input-label">Bitiş (GG/AA/YYYY)</label>
                        <input
                            type="text"
                            className="input"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            placeholder="25/12/2025"
                        />
                    </div>
                </div>
            </div>

            {/* Column Selection */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Sütun Seçimi</h3>
                <div className="column-selection">
                    {columns.map(col => (
                        <label key={col.id} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={selectedColumns.includes(col.id)}
                                onChange={() => toggleColumn(col.id)}
                            />
                            <span style={{ marginLeft: 8 }}>{col.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Format Selection */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="section-title">Dışa Aktarma Formatı</h3>
                <div className="format-selection">
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="format"
                            checked={format === 'csv'}
                            onChange={() => setFormat('csv')}
                        />
                        <span style={{ marginLeft: 8 }}>CSV (Büyük veri setleri için önerilir)</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="format"
                            checked={format === 'excel'}
                            onChange={() => setFormat('excel')}
                        />
                        <span style={{ marginLeft: 8 }}>Excel (.xlsx)</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            name="format"
                            checked={format === 'pdf'}
                            onChange={() => setFormat('pdf')}
                        />
                        <span style={{ marginLeft: 8 }}>PDF (Fon başına maks 50 satır)</span>
                    </label>
                </div>
            </div>

            {/* Export Button */}
            <button
                className="export-button"
                onClick={exportData}
                disabled={isExporting}
            >
                {isExporting ? `Dışa aktarılıyor... ${Math.round(progress)}%` : 'Verileri Dışa Aktar'}
            </button>

            {/* Progress Bar */}
            {isExporting && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
};

export default ExportPage;
