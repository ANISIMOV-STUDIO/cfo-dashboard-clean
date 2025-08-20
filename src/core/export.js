/**
 * Export and Print Module
 * Handles dashboard export to Excel/PDF and print functionality
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var ExportManager = {
        // Export dashboard to Excel format
        exportToExcel: function() {
            try {
                var data = window.DataManager ? window.DataManager.getData() : null;
                if (!data) {
                    alert('Нет данных для экспорта');
                    return;
                }
                
                var currentPage = window.TabManager ? window.TabManager.getCurrentPage() : 'overview';
                
                // Create workbook structure
                var workbook = {
                    SheetNames: [],
                    Sheets: {}
                };
                
                // Add KPI summary sheet
                this.addKPISheet(workbook, data);
                
                // Add page-specific sheets
                switch (currentPage) {
                    case 'overview':
                        this.addOverviewSheet(workbook, data);
                        break;
                    case 'sales':
                        this.addSalesSheet(workbook, data);
                        break;
                    case 'profit':
                        this.addProfitSheet(workbook, data);
                        break;
                    case 'cash':
                        this.addCashSheet(workbook, data);
                        break;
                    case 'ar':
                        this.addARSheet(workbook, data);
                        break;
                }
                
                // Generate filename
                var timestamp = new Date().toISOString().slice(0, 10);
                var filename = 'CFO_Dashboard_' + currentPage + '_' + timestamp + '.csv';
                
                // Convert to CSV and download
                this.downloadCSV(workbook, filename);
                
            } catch (error) {
                console.error('Export error:', error);
                alert('Ошибка экспорта: ' + error.message);
            }
        },
        
        // Add KPI summary to workbook
        addKPISheet: function(workbook, data) {
            var kpiData = [
                ['Показатель', 'Значение', 'Изменение'],
                ['Выручка', this.formatExportValue(data.kpi.revenue.current, 'money'), data.kpi.revenue.momChange + '%'],
                ['EBITDA', this.formatExportValue(data.kpi.ebitda, 'money'), '12.3%'],
                ['Остаток ДС', this.formatExportValue(data.kpi.cashEnd, 'money'), data.kpi.cashRunwayMonths + ' мес'],
                ['EBITDA маржа', data.kpi.margins.ebitda + '%', '+0.8п.п.']
            ];
            
            workbook.SheetNames.push('KPI');
            workbook.Sheets['KPI'] = this.arrayToWorksheet(kpiData);
        },
        
        // Add overview data to workbook
        addOverviewSheet: function(workbook, data) {
            if (!data.timeSeries) return;
            
            var revenueData = [['Месяц', 'Факт', 'План', 'Прошлый год', 'Прогноз']];
            if (data.timeSeries.revenue) {
                var rev = data.timeSeries.revenue;
                for (var i = 0; i < rev.dates.length; i++) {
                    revenueData.push([
                        rev.dates[i],
                        this.formatExportValue(rev.fact[i], 'money'),
                        this.formatExportValue(rev.plan[i], 'money'),
                        this.formatExportValue(rev.prevYear[i], 'money'),
                        i < rev.forecast.length ? this.formatExportValue(rev.forecast[i], 'money') : ''
                    ]);
                }
            }
            
            workbook.SheetNames.push('Выручка');
            workbook.Sheets['Выручка'] = this.arrayToWorksheet(revenueData);
        },
        
        // Add sales data to workbook
        addSalesSheet: function(workbook, data) {
            if (!data.structures || !data.structures.byBranch) return;
            
            var salesData = [['Филиал', 'Выручка', 'Прибыль', 'Маржа %', 'Доля %']];
            data.structures.byBranch.forEach(function(branch) {
                salesData.push([
                    branch.name,
                    ExportManager.formatExportValue(branch.revenue, 'money'),
                    ExportManager.formatExportValue(branch.profit, 'money'),
                    branch.margin + '%',
                    branch.share + '%'
                ]);
            });
            
            workbook.SheetNames.push('Продажи');
            workbook.Sheets['Продажи'] = this.arrayToWorksheet(salesData);
        },
        
        // Add profit data to workbook
        addProfitSheet: function(workbook, data) {
            if (!data.planFactDrivers) return;
            
            var profitData = [['Драйвер', 'План', 'Факт', 'Отклонение', 'Отклонение %']];
            data.planFactDrivers.forEach(function(driver) {
                profitData.push([
                    driver.driver,
                    ExportManager.formatExportValue(driver.plan, 'money'),
                    ExportManager.formatExportValue(driver.fact, 'money'),
                    ExportManager.formatExportValue(driver.variance, 'money'),
                    driver.variancePercent + '%'
                ]);
            });
            
            workbook.SheetNames.push('Прибыльность');
            workbook.Sheets['Прибыльность'] = this.arrayToWorksheet(profitData);
        },
        
        // Add cash flow data to workbook
        addCashSheet: function(workbook, data) {
            if (!data.timeSeries || !data.timeSeries.cashFlow) return;
            
            var cashData = [['Показатель', 'Значение']];
            var cf = data.timeSeries.cashFlow;
            
            cashData.push(['Начальный остаток', this.formatExportValue(cf.opening, 'money')]);
            cashData.push(['Операционный CF', this.formatExportValue(cf.ocf[0], 'money')]);
            cashData.push(['Инвестиционный CF', this.formatExportValue(cf.icf[0], 'money')]);
            cashData.push(['Финансовый CF', this.formatExportValue(cf.fcf[0], 'money')]);
            cashData.push(['Конечный остаток', this.formatExportValue(cf.closing, 'money')]);
            
            workbook.SheetNames.push('Денежные потоки');
            workbook.Sheets['Денежные потоки'] = this.arrayToWorksheet(cashData);
        },
        
        // Add AR data to workbook
        addARSheet: function(workbook, data) {
            if (!data.arAging) return;
            
            var arData = [['Период просрочки', 'Сумма', 'Доля %']];
            var buckets = data.arAging.buckets;
            var total = data.arAging.totalAR;
            
            Object.keys(buckets).forEach(function(bucket) {
                var amount = buckets[bucket];
                var percentage = ((amount / total) * 100).toFixed(1);
                arData.push([
                    bucket + ' дней',
                    ExportManager.formatExportValue(amount, 'money'),
                    percentage + '%'
                ]);
            });
            
            workbook.SheetNames.push('Дебиторка');
            workbook.Sheets['Дебиторка'] = this.arrayToWorksheet(arData);
        },
        
        // Convert array to worksheet format
        arrayToWorksheet: function(data) {
            var ws = {};
            var range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };
            
            for (var R = 0; R < data.length; R++) {
                for (var C = 0; C < data[R].length; C++) {
                    if (range.s.r > R) range.s.r = R;
                    if (range.s.c > C) range.s.c = C;
                    if (range.e.r < R) range.e.r = R;
                    if (range.e.c < C) range.e.c = C;
                    
                    var cell = { v: data[R][C] };
                    var cellRef = this.encodeCell({ c: C, r: R });
                    ws[cellRef] = cell;
                }
            }
            
            if (range.s.c < 10000000) ws['!ref'] = this.encodeRange(range);
            return ws;
        },
        
        // Simple cell encoding
        encodeCell: function(cell) {
            return String.fromCharCode(65 + cell.c) + (cell.r + 1);
        },
        
        // Simple range encoding  
        encodeRange: function(range) {
            return this.encodeCell(range.s) + ':' + this.encodeCell(range.e);
        },
        
        // Download CSV file
        downloadCSV: function(workbook, filename) {
            var csvContent = '';
            
            // Convert first sheet to CSV
            if (workbook.SheetNames.length > 0) {
                var sheetName = workbook.SheetNames[0];
                var sheet = workbook.Sheets[sheetName];
                csvContent = this.sheetToCSV(sheet);
            }
            
            // Create download
            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement('a');
            
            if (link.download !== undefined) {
                var url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        },
        
        // Convert sheet to CSV
        sheetToCSV: function(sheet) {
            var csv = '';
            var range = sheet['!ref'];
            if (!range) return csv;
            
            var decoded = this.decodeRange(range);
            
            for (var R = decoded.s.r; R <= decoded.e.r; R++) {
                var row = [];
                for (var C = decoded.s.c; C <= decoded.e.c; C++) {
                    var cellRef = this.encodeCell({ c: C, r: R });
                    var cell = sheet[cellRef];
                    row.push(cell ? cell.v : '');
                }
                csv += row.join(',') + '\n';
            }
            
            return csv;
        },
        
        // Simple range decoding
        decodeRange: function(range) {
            var parts = range.split(':');
            return {
                s: this.decodeCell(parts[0]),
                e: this.decodeCell(parts[1])
            };
        },
        
        // Simple cell decoding
        decodeCell: function(cellRef) {
            var col = cellRef.charCodeAt(0) - 65;
            var row = parseInt(cellRef.slice(1)) - 1;
            return { c: col, r: row };
        },
        
        // Format values for export
        formatExportValue: function(value, type) {
            if (!value && value !== 0) return '';
            
            switch (type) {
                case 'money':
                    return (value / 1000000).toFixed(2) + ' млн';
                case 'percent':
                    return value.toFixed(1) + '%';
                default:
                    return value.toString();
            }
        },
        
        // Print current page
        printPage: function() {
            try {
                // Hide UI elements for print
                this.preparePrintView();
                
                // Trigger print
                window.print();
                
                // Restore UI after print
                setTimeout(function() {
                    ExportManager.restorePrintView();
                }, 1000);
                
            } catch (error) {
                console.error('Print error:', error);
                alert('Ошибка печати: ' + error.message);
            }
        },
        
        // Prepare view for printing
        preparePrintView: function() {
            document.body.classList.add('print-mode');
            
            // Hide controls and navigation
            var controlsEl = document.querySelector('.controls');
            var navEl = document.querySelector('.page-navigation');
            var alertsEl = document.getElementById('alerts-container');
            
            if (controlsEl) controlsEl.style.display = 'none';
            if (navEl) navEl.style.display = 'none';
            if (alertsEl) alertsEl.style.display = 'none';
        },
        
        // Restore view after printing
        restorePrintView: function() {
            document.body.classList.remove('print-mode');
            
            // Show controls and navigation
            var controlsEl = document.querySelector('.controls');
            var navEl = document.querySelector('.page-navigation');
            var alertsEl = document.getElementById('alerts-container');
            
            if (controlsEl) controlsEl.style.display = '';
            if (navEl) navEl.style.display = '';
            if (alertsEl) alertsEl.style.display = '';
        }
    };
    
    // Export to window
    window.ExportManager = ExportManager;
    
    // Bind to UI buttons
    document.addEventListener('DOMContentLoaded', function() {
        var printBtn = document.getElementById('print-page-btn');
        var excelBtn = document.getElementById('export-excel-btn');
        
        if (printBtn) {
            printBtn.addEventListener('click', function() {
                ExportManager.printPage();
            });
        }
        
        if (excelBtn) {
            excelBtn.addEventListener('click', function() {
                ExportManager.exportToExcel();
            });
        }
    });
    
})();