/**
 * Print and Export Module
 * Handles printing and PNG export functionality
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var PrintManager = {
        // Print header management
        updatePrintHeader: function() {
            var state = window.DashboardState ? window.DashboardState.getState() : {};
            var data = window.DataManager ? window.DataManager.getData() : {};
            
            // Update print header with current company and period
            var company = data.meta ? data.meta.company : 'CFO Dashboard';
            var period = data.meta ? data.meta.period : new Date().toISOString().split('T')[0];
            var currency = data.meta ? data.meta.currency : 'RUB';
            
            // Find or create print header
            var printHeader = document.querySelector('.print-header');
            if (!printHeader) {
                printHeader = document.createElement('div');
                printHeader.className = 'print-header';
                document.body.insertBefore(printHeader, document.body.firstChild);
            }
            
            // Update header content
            printHeader.innerHTML = 
                '<div class="print-header-content">' +
                    '<div class="print-title">CFO Dashboard</div>' +
                    '<div class="print-subtitle">' + company + '</div>' +
                    '<div class="print-period">Период: ' + this.formatPeriod(period) + '</div>' +
                    '<div class="print-date">Создано: ' + this.formatDate(new Date()) + '</div>' +
                '</div>';
            
            // Add print styles if not exists
            this.addPrintStyles();
        },
        
        addPrintStyles: function() {
            var existingStyle = document.getElementById('print-styles');
            if (existingStyle) return;
            
            var style = document.createElement('style');
            style.id = 'print-styles';
            style.textContent = 
                '@media print {' +
                    'body { margin: 0; padding: 20px; font-size: 12px; }' +
                    '.print-header { display: block !important; margin-bottom: 20px; ' +
                        'border-bottom: 2px solid #3498db; padding-bottom: 10px; }' +
                    '.print-header-content { display: flex; justify-content: space-between; ' +
                        'align-items: center; flex-wrap: wrap; }' +
                    '.print-title { font-size: 24px; font-weight: bold; color: #2c3e50; }' +
                    '.print-subtitle { font-size: 16px; color: #7f8c8d; }' +
                    '.print-period, .print-date { font-size: 12px; color: #95a5a6; }' +
                    '.print-hidden { display: none !important; }' +
                    '.dashboard-header { position: static !important; box-shadow: none; ' +
                        'border-bottom: 1px solid #bdc3c7; margin-bottom: 10px; }' +
                    '.tab-navigation { display: none !important; }' +
                    '.error-boundary, .recommendations-banner { display: none !important; }' +
                    '.page-content { page-break-after: always; margin-bottom: 20px; }' +
                    '.page-content:last-child { page-break-after: auto; }' +
                    '.widget { border: 1px solid #bdc3c7; margin-bottom: 15px; ' +
                        'border-radius: 6px; overflow: hidden; }' +
                    '.widget-header { background: #ecf0f1; padding: 8px 12px; ' +
                        'font-weight: bold; border-bottom: 1px solid #bdc3c7; }' +
                    '.chart-container { padding: 10px; }' +
                    'canvas { max-height: 300px !important; }' +
                    '.kpi-card { border: 1px solid #bdc3c7; margin-bottom: 10px; ' +
                        'page-break-inside: avoid; }' +
                '}' +
                '.print-header { display: none; }';
            
            document.head.appendChild(style);
        },
        
        // Optimize print layout
        optimizePrintLayout: function() {
            // Force chart re-rendering for print
            var canvases = document.querySelectorAll('canvas');
            canvases.forEach(function(canvas) {
                var chart = Chart.getChart(canvas);
                if (chart) {
                    chart.resize();
                }
            });
            
            // Ensure all images are loaded
            var images = document.querySelectorAll('img');
            var imagePromises = Array.from(images).map(function(img) {
                return new Promise(function(resolve) {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = resolve;
                    }
                });
            });
            
            return Promise.all(imagePromises);
        },
        
        // Print current page
        printCurrentPage: function() {
            var startTime = Date.now();
            
            try {
                // Update print header
                this.updatePrintHeader();
                
                // Set print mode
                document.body.setAttribute('data-print-mode', 'current-page');
                
                // Hide all pages except current
                var currentPage = window.getCurrentPage ? window.getCurrentPage() : 'overview';
                var pages = document.querySelectorAll('.page-content');
                pages.forEach(function(page) {
                    if (page.id !== 'page-' + currentPage) {
                        page.classList.add('print-hidden');
                    } else {
                        page.classList.remove('print-hidden');
                    }
                });
                
                // Optimize layout
                this.optimizePrintLayout().then(function() {
                    // Small delay for chart rendering
                    setTimeout(function() {
                        window.print();
                        
                        // Clean up after print
                        setTimeout(function() {
                            document.body.removeAttribute('data-print-mode');
                            pages.forEach(function(page) {
                                page.classList.remove('print-hidden');
                            });
                        }, 1000);
                    }, 200);
                });
                
                // Record performance
                var duration = Date.now() - startTime;
                if (window.PerformanceUtils) {
                    window.PerformanceUtils.mark('print-current-page');
                }
                
                return { success: true, duration: duration };
                
            } catch (error) {
                console.error('Print error:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Print all pages
        printAllPages: function() {
            var startTime = Date.now();
            
            try {
                // Update print header
                this.updatePrintHeader();
                
                // Set print mode for all pages
                document.body.setAttribute('data-print-mode', 'all-pages');
                
                // Show all pages
                var pages = document.querySelectorAll('.page-content');
                pages.forEach(function(page) {
                    page.classList.remove('print-hidden');
                });
                
                // Optimize layout
                this.optimizePrintLayout().then(function() {
                    setTimeout(function() {
                        window.print();
                        
                        // Clean up
                        setTimeout(function() {
                            document.body.removeAttribute('data-print-mode');
                        }, 1000);
                    }, 500); // More time for multiple pages
                });
                
                var duration = Date.now() - startTime;
                if (window.PerformanceUtils) {
                    window.PerformanceUtils.mark('print-all-pages');
                }
                
                return { success: true, duration: duration };
                
            } catch (error) {
                console.error('Print all pages error:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Export current page as PNG
        exportCurrentPagePNG: function() {
            return new Promise(function(resolve, reject) {
                try {
                    var currentPage = window.getCurrentPage ? window.getCurrentPage() : 'overview';
                    var pageElement = document.getElementById('page-' + currentPage);
                    
                    if (!pageElement) {
                        reject(new Error('Current page not found'));
                        return;
                    }
                    
                    // Use html2canvas if available, otherwise fallback
                    if (window.html2canvas) {
                        window.html2canvas(pageElement, {
                            backgroundColor: '#ffffff',
                            scale: 2, // High DPI
                            useCORS: true,
                            allowTaint: true,
                            width: pageElement.scrollWidth,
                            height: pageElement.scrollHeight
                        }).then(function(canvas) {
                            var dataURL = canvas.toDataURL('image/png', 1.0);
                            resolve({
                                success: true,
                                data: dataURL,
                                width: canvas.width,
                                height: canvas.height,
                                pageName: currentPage
                            });
                        }).catch(function(error) {
                            reject(new Error('Canvas export failed: ' + error.message));
                        });
                    } else {
                        // Fallback method - capture visible area
                        PrintManager.captureVisibleArea(pageElement).then(function(result) {
                            resolve(result);
                        }).catch(function(error) {
                            reject(error);
                        });
                    }
                    
                } catch (error) {
                    reject(new Error('Export failed: ' + error.message));
                }
            });
        },
        
        // Fallback capture method
        captureVisibleArea: function(element) {
            return new Promise(function(resolve, reject) {
                try {
                    // Create temporary canvas
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    
                    // Set canvas size
                    var rect = element.getBoundingClientRect();
                    canvas.width = rect.width * 2; // High DPI
                    canvas.height = rect.height * 2;
                    ctx.scale(2, 2);
                    
                    // Fill background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, rect.width, rect.height);
                    
                    // Add text warning
                    ctx.fillStyle = '#333333';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Dashboard Export', rect.width / 2, 30);
                    ctx.fillText('(Limited export - install html2canvas for full capture)', rect.width / 2, 60);
                    
                    var dataURL = canvas.toDataURL('image/png', 1.0);
                    resolve({
                        success: true,
                        data: dataURL,
                        width: canvas.width,
                        height: canvas.height,
                        pageName: window.getCurrentPage ? window.getCurrentPage() : 'overview',
                        limited: true
                    });
                    
                } catch (error) {
                    reject(new Error('Fallback capture failed: ' + error.message));
                }
            });
        },
        
        // Batch export all pages
        exportAllPagesPNG: function() {
            var self = this;
            var pages = ['overview', 'sales', 'profit', 'cash', 'ar'];
            var results = [];
            
            return pages.reduce(function(promise, pageId) {
                return promise.then(function() {
                    // Switch to page
                    if (window.setCurrentPage) {
                        window.setCurrentPage(pageId);
                    }
                    
                    // Wait for render
                    return new Promise(function(resolve) {
                        setTimeout(function() {
                            self.exportCurrentPagePNG().then(function(result) {
                                results.push(Object.assign(result, { pageId: pageId }));
                                resolve();
                            }).catch(function(error) {
                                results.push({ pageId: pageId, success: false, error: error.message });
                                resolve();
                            });
                        }, 300); // Wait for page switch
                    });
                });
            }, Promise.resolve()).then(function() {
                return {
                    success: true,
                    results: results,
                    timestamp: new Date().toISOString()
                };
            });
        },
        
        // Helper formatting functions
        formatDate: function(date) {
            var d = new Date(date);
            var day = ('0' + d.getDate()).slice(-2);
            var month = ('0' + (d.getMonth() + 1)).slice(-2);
            var year = d.getFullYear();
            var hours = ('0' + d.getHours()).slice(-2);
            var minutes = ('0' + d.getMinutes()).slice(-2);
            
            return day + '.' + month + '.' + year + ' ' + hours + ':' + minutes;
        },
        
        formatPeriod: function(period) {
            if (!period) return '';
            
            var date = new Date(period);
            if (isNaN(date.getTime())) return period;
            
            var months = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ];
            
            return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
        }
    };
    
    // Export the missing function that was causing errors
    window.updatePrintHeader = PrintManager.updatePrintHeader.bind(PrintManager);
    
    // Export print functions globally
    window.printCurrentPage = PrintManager.printCurrentPage.bind(PrintManager);
    window.printAllPages = PrintManager.printAllPages.bind(PrintManager);
    window.exportCurrentPagePNG = PrintManager.exportCurrentPagePNG.bind(PrintManager);
    window.exportAllPagesPNG = PrintManager.exportAllPagesPNG.bind(PrintManager);
    
    // Export print manager
    window.PrintManager = PrintManager;
    
})();