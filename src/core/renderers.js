/**
 * Page Renderers Module
 * Creates and updates charts for each dashboard page
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var PageRenderers = {
        // Track created charts to avoid duplicates
        createdCharts: {},
        
        // Safe chart creation with fallback
        safeCreateChart: function(type, canvasId, data, options) {
            // console.log('safeCreateChart called:', type, canvasId);
            
            // Check if ChartsRedesigned is available
            if (window.ChartsRedesigned) {
                // console.log('Using ChartsRedesigned module');
                try {
                    switch(type) {
                        case 'line':
                            // Check if this is a multi-dataset line chart (like margins)
                            if (data.datasets && Array.isArray(data.datasets)) {
                                return this.createMultiLineChart(canvasId, data, options);
                            }
                            return window.ChartsRedesigned.createLineChart(canvasId, data, options);
                        case 'bar':
                            return window.ChartsRedesigned.createBarChart(canvasId, data, options);
                        case 'waterfall':
                            return window.ChartsRedesigned.createWaterfallChart(canvasId, data, options);
                        case 'pie':
                            return window.ChartsRedesigned.createPieChart(canvasId, data, options);
                        default:
                            console.warn('Unknown chart type:', type);
                            return null;
                    }
                } catch (error) {
                    console.error('Error creating redesigned chart:', error);
                    // Fall through to ChartFactory fallback
                }
            }
            
            // Fallback to ChartFactory
            // console.log('Falling back to ChartFactory');
            if (window.ChartFactory) {
                try {
                    switch(type) {
                        case 'line':
                            // Check if this is a multi-dataset line chart
                            if (data.datasets && Array.isArray(data.datasets)) {
                                return this.createMultiLineChart(canvasId, data, options);
                            }
                            // Create enhanced line chart with larger fonts
                            var lineChart = window.ChartFactory.createLineChart(canvasId, data);
                            if (lineChart && lineChart.options) {
                                lineChart.options = this.getEnhancedOptions(lineChart.options);
                                lineChart.update('none');
                            }
                            return lineChart;
                        case 'bar':
                        case 'waterfall':
                            // Simple bar chart fallback
                            var canvas = document.getElementById(canvasId);
                            if (!canvas) return null;
                            
                            window.ChartFactory.ensureCanvasSize(canvas);
                            
                            var config = {
                                type: 'bar',
                                data: {
                                    labels: data.labels || [],
                                    datasets: [{
                                        label: data.label || 'Data',
                                        data: data.values || data.data || [],
                                        backgroundColor: '#2563EB80',
                                        borderColor: '#2563EB',
                                        borderWidth: 1
                                    }]
                                },
                                options: this.getEnhancedOptions(window.ChartFactory ? window.ChartFactory.defaultOptions : {})
                            };
                            
                            return new Chart(canvas, config);
                        default:
                            console.warn('No fallback for chart type:', type);
                            return null;
                    }
                } catch (error) {
                    console.error('Error creating fallback chart:', error);
                    return null;
                }
            }
            
            console.error('No chart creation modules available');
            return null;
        },
        
        // Get enhanced options with larger fonts
        getEnhancedOptions: function(baseOptions) {
            var enhanced = Object.assign({}, baseOptions);
            
            // Enhanced font settings
            var fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
            
            // Chart.js 2.x style options
            if (!enhanced.scales) enhanced.scales = {};
            
            // X axis font settings
            if (!enhanced.scales.xAxes) enhanced.scales.xAxes = [{}];
            if (!enhanced.scales.xAxes[0].ticks) enhanced.scales.xAxes[0].ticks = {};
            enhanced.scales.xAxes[0].ticks.fontSize = 14;
            enhanced.scales.xAxes[0].ticks.fontFamily = fontFamily;
            enhanced.scales.xAxes[0].ticks.fontColor = '#374151';
            
            // Y axis font settings  
            if (!enhanced.scales.yAxes) enhanced.scales.yAxes = [{}];
            if (!enhanced.scales.yAxes[0].ticks) enhanced.scales.yAxes[0].ticks = {};
            enhanced.scales.yAxes[0].ticks.fontSize = 14;
            enhanced.scales.yAxes[0].ticks.fontFamily = fontFamily;
            enhanced.scales.yAxes[0].ticks.fontColor = '#374151';
            
            // Legend font settings
            if (!enhanced.legend) enhanced.legend = {};
            if (!enhanced.legend.labels) enhanced.legend.labels = {};
            enhanced.legend.labels.fontSize = 13;
            enhanced.legend.labels.fontFamily = fontFamily;
            enhanced.legend.labels.fontColor = '#111827';
            enhanced.legend.labels.padding = 20;
            
            // Tooltip font settings
            if (!enhanced.tooltips) enhanced.tooltips = {};
            enhanced.tooltips.titleFontSize = 14;
            enhanced.tooltips.bodyFontSize = 14;
            enhanced.tooltips.titleFontFamily = fontFamily;
            enhanced.tooltips.bodyFontFamily = fontFamily;
            enhanced.tooltips.backgroundColor = 'rgba(17, 24, 39, 0.95)';
            enhanced.tooltips.titleFontColor = '#FFFFFF';
            enhanced.tooltips.bodyFontColor = '#FFFFFF';
            enhanced.tooltips.cornerRadius = 8;
            enhanced.tooltips.displayColors = true;
            
            return enhanced;
        },
        
        // Create multi-line chart with safe colors
        createMultiLineChart: function(canvasId, data, options) {
            // console.log('Creating multi-line chart:', canvasId);
            
            var canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn('Canvas not found:', canvasId);
                return null;
            }
            
            // Ensure canvas size
            if (window.ChartsRedesigned && window.ChartsRedesigned.ensureCanvasSize) {
                window.ChartsRedesigned.ensureCanvasSize(canvas);
            } else if (window.ChartFactory && window.ChartFactory.ensureCanvasSize) {
                window.ChartFactory.ensureCanvasSize(canvas);
            }
            
            // Safe color palette
            var colors = window.ChartsRedesigned && window.ChartsRedesigned.colors ? 
                window.ChartsRedesigned.colors : {
                    secondary: '#059669',
                    primary: '#2563EB', 
                    accent: '#DC2626',
                    warning: '#D97706',
                    neutral: '#6B7280'
                };
            
            var colorKeys = ['secondary', 'primary', 'accent', 'warning', 'neutral'];
            
            // Process datasets with safe colors
            var processedDatasets = data.datasets.map(function(dataset, index) {
                var colorKey = colorKeys[index % colorKeys.length];
                var color = colors[colorKey];
                
                return {
                    label: dataset.label,
                    data: dataset.data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: color,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    fill: false,
                    tension: 0.3
                };
            });
            
            var config = {
                type: 'line',
                data: {
                    labels: data.labels || [],
                    datasets: processedDatasets
                },
                options: this.getEnhancedOptions(options || {})
            };
            
            // Merge with global defaults if available
            if (window.ChartsRedesigned && window.ChartsRedesigned.mergeOptions && window.ChartsRedesigned.getGlobalDefaults) {
                try {
                    var globalDefaults = window.ChartsRedesigned.getGlobalDefaults();
                    config.options = window.ChartsRedesigned.mergeOptions(globalDefaults, config.options);
                } catch (error) {
                    console.warn('Failed to merge options:', error);
                }
            }
            
            return new Chart(canvas, config);
        },
        
        // Initialize all page renderers
        initialize: function() {
            var self = this;
            
            // Register for data updates
            if (window.CFODashboard) {
                window.CFODashboard.onDataUpdate = this.handleDataUpdate.bind(this);
            }
            
            // Listen for page show events
            window.addEventListener('pageShow', function(event) {
                if (event.detail && event.detail.pageId && self.currentData) {
                    // Small delay to ensure DOM is ready
                    setTimeout(function() {
                        self.renderPageCharts(event.detail.pageId, self.currentData);
                    }, 100);
                }
            });
        },
        
        // Handle data update from main dashboard
        handleDataUpdate: function(data, currentPage) {
            if (!data) return;
            
            // If no current page specified, get it from TabManager
            if (!currentPage && window.TabManager) {
                currentPage = window.TabManager.getCurrentPage();
            }
            
            // Still no page? Default to overview
            if (!currentPage) {
                currentPage = 'overview';
            }
            
            // Store data for later use
            this.currentData = data;
            
            // Only render charts for the current active page
            try {
                this.renderPageCharts(currentPage, data);
            } catch (error) {
                console.error('Render error for page ' + currentPage + ':', error);
            }
        },
        
        // Render charts for specific page
        renderPageCharts: function(pageId, data) {
            // console.log('PageRenderers.renderPageCharts called:', pageId, data);
            // console.log('Data keys available:', data ? Object.keys(data) : 'No data');
            
            if (!data) {
                console.warn('No data provided to renderPageCharts');
                return;
            }
            
            // Clear any existing charts for this page first
            this.clearPageCharts(pageId);
            
            // Then render new charts
            // console.log('Rendering charts for page:', pageId);
            switch (pageId) {
                case 'overview':
                    // console.log('Calling renderOverview...');
                    this.renderOverview(data);
                    break;
                case 'sales':
                    // console.log('Calling renderSales...');
                    this.renderSales(data);
                    break;
                case 'profit':
                    // console.log('Calling renderProfitability...');
                    this.renderProfitability(data);
                    break;
                case 'cash':
                    // console.log('Calling renderCashFlow...');
                    this.renderCashFlow(data);
                    break;
                case 'ar':
                    // console.log('Calling renderAccReceivable...');
                    this.renderAccReceivable(data);
                    break;
                default:
                    console.warn('Unknown page ID:', pageId);
            }
        },
        
        // Overview page charts
        renderOverview: function(data) {
            // console.log('renderOverview called with data:', data);
            // console.log('Checking timeSeries:', data.timeSeries);
            // console.log('Checking revenue:', data.timeSeries ? data.timeSeries.revenue : 'No timeSeries');
            
            // Revenue trend chart using timeSeries.revenue data - REDESIGNED
            this.ensureChart('revenue-trend-chart', 'line', function() {
                // console.log('Creating redesigned revenue-trend-chart');
                
                // Fallback data if timeSeries.revenue is missing
                var revData = (data.timeSeries && data.timeSeries.revenue) || {
                    dates: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя'],
                    fact: [23500000, 25200000, 27800000, 26400000, 28900000, 31200000, 29800000, 32100000, 30500000, 33400000, 35600000],
                    plan: [24000000, 25000000, 27000000, 26000000, 29000000, 31000000, 30000000, 32000000, 31000000, 33000000, 35000000],
                    forecast: [36500000, 38200000, 39800000]
                };
                
                return PageRenderers.safeCreateChart('line', 'revenue-trend-chart', {
                    labels: revData.dates || [],
                    fact: revData.fact || [],
                    plan: revData.plan || [],
                    forecast: revData.forecast || []
                }, {
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var value = context.parsed.y;
                                    return context.dataset.label + ': ' + 
                                           (window.formatMoney ? window.formatMoney(value, 'RUB', 0) : 
                                            (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(value) : value));
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return window.formatMoney ? window.formatMoney(value, 'RUB', 0) : 
                                           (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(value) : value);
                                }
                            }
                        }
                    }
                });
            });
            
            // Margins trend chart using timeSeries.margins data - REDESIGNED
            this.ensureChart('margins-trend-chart', 'line', function() {
                // console.log('Creating redesigned margins-trend-chart');
                
                // Fallback data if timeSeries.margins is missing
                var marginsData = (data.timeSeries && data.timeSeries.margins) || {
                    dates: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя'],
                    gross: [42.5, 43.2, 41.8, 44.1, 43.7, 42.9, 44.3, 43.5, 42.2, 44.8, 45.1],
                    ebitda: [18.3, 19.1, 17.9, 19.5, 18.8, 17.6, 19.2, 18.4, 17.1, 19.8, 20.2],
                    net: [12.1, 12.8, 11.5, 13.2, 12.6, 11.3, 12.9, 12.2, 10.8, 13.5, 13.9]
                };
                
                // Use special line chart for margins with multiple datasets
                return PageRenderers.safeCreateChart('line', 'margins-trend-chart', {
                    labels: marginsData.dates || [],
                    datasets: [
                        {
                            label: 'Валовая маржа',
                            data: marginsData.gross || []
                        },
                        {
                            label: 'EBITDA',
                            data: marginsData.ebitda || []
                        },
                        {
                            label: 'Чистая маржа',
                            data: marginsData.net || []
                        }
                    ]
                }, {
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(1) + '%';
                                }
                            }
                        }
                    }
                });
            });
            
            // Cashflow waterfall chart using timeSeries.cashFlow data - REDESIGNED
            this.ensureChart('cashflow-chart', 'bar', function() {
                // console.log('Creating redesigned cashflow-chart');
                
                // Fallback data if timeSeries.cashFlow is missing
                var cashData = (data.timeSeries && data.timeSeries.cashFlow) || {
                    opening: 45600000,
                    ocf: [8200000],
                    icf: [-3400000],
                    fcf: [1200000],
                    closing: 51600000,
                    labels: ['Начальный остаток', 'Операционный CF', 'Инвестиционный CF', 'Финансовый CF', 'Конечный остаток']
                };
                
                var values = [
                    cashData.opening || 0,
                    (cashData.ocf && cashData.ocf[0]) || 0,
                    (cashData.icf && cashData.icf[0]) || 0,
                    (cashData.fcf && cashData.fcf[0]) || 0,
                    cashData.closing || 0
                ];
                
                var labels = cashData.labels || ['Начальный остаток', 'Операционный CF', 'Инвестиционный CF', 'Финансовый CF', 'Конечный остаток'];
                
                return PageRenderers.safeCreateChart('waterfall', 'cashflow-chart', {
                    labels: labels,
                    values: values,
                    startValue: values[0],
                    label: 'Денежный поток'
                }, {
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var index = context.dataIndex;
                                    var actualValue = values[index];
                                    
                                    if (index === 0 || index === labels.length - 1) {
                                        return 'Остаток: ' + (window.formatMoney ? 
                                            window.formatMoney(actualValue, 'RUB', 0) : 
                                            (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(actualValue) : actualValue));
                                    } else {
                                        var prefix = actualValue >= 0 ? '+' : '';
                                        return 'Поток: ' + prefix + (window.formatMoney ? 
                                            window.formatMoney(actualValue, 'RUB', 0) : 
                                            (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(actualValue) : actualValue));
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return window.formatMoney ? 
                                        window.formatMoney(value, 'RUB', 0) : 
                                        (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(value) : value);
                                }
                            }
                        }
                    }
                });
            });
            
            // Variance chart (Plan vs Fact waterfall) using planFactDrivers - REDESIGNED
            this.ensureChart('variance-chart', 'bar', function() {
                // console.log('Creating redesigned variance-chart');
                
                // Provide fallback data if planFactDrivers is missing
                var drivers = data.planFactDrivers || [
                    { driver: 'Выручка', variance: 1200000, variancePercent: 5.2 },
                    { driver: 'Себестоимость', variance: -800000, variancePercent: -3.1 },
                    { driver: 'Операционные расходы', variance: -200000, variancePercent: -1.8 },
                    { driver: 'Прочие доходы', variance: 150000, variancePercent: 2.1 }
                ];
                
                // console.log('variance-chart: Using drivers =', drivers);
                var labels = drivers.map(function(d) { return d.driver; });
                var variances = drivers.map(function(d) { return d.variance || 0; });
                
                return PageRenderers.safeCreateChart('waterfall', 'variance-chart', {
                    labels: labels,
                    values: variances,
                    startValue: 0,
                    label: 'Отклонение от плана'
                }, {
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var index = context.dataIndex;
                                    var driver = drivers[index];
                                    var variance = driver.variance || 0;
                                    var prefix = variance >= 0 ? '+' : '';
                                    return driver.driver + ': ' + prefix + 
                                           (window.formatMoney ? window.formatMoney(variance, 'RUB', 0) : 
                                            (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(variance) : variance)) + 
                                           ' (' + prefix + (driver.variancePercent || 0).toFixed(1) + '%)';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                maxRotation: 45
                            }
                        },
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return window.formatMoney ? 
                                        window.formatMoney(value, 'RUB', 0) : 
                                        (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(value) : value);
                                }
                            }
                        }
                    }
                });
            });
        },
        
        // Sales page charts
        renderSales: function(data) {
            // Branches sales chart with absolute/percentage mode support - REDESIGNED
            this.ensureChart('branches-sales-chart', 'bar', function() {
                // console.log('Creating redesigned branches-sales-chart');
                
                // Provide fallback data if structures.byBranch is missing
                var branches = (data.structures && data.structures.byBranch) || [
                    { name: 'Москва', revenue: 45600000, share: 38.5, margin: 24.2 },
                    { name: 'СПб', revenue: 32400000, share: 27.3, margin: 22.8 },
                    { name: 'Екатеринбург', revenue: 18900000, share: 15.9, margin: 19.5 },
                    { name: 'Новосибирск', revenue: 21700000, share: 18.3, margin: 21.1 }
                ];
                
                // console.log('branches-sales-chart: Using branches =', branches);
                
                // Check current mode from select
                var modeSelect = document.getElementById('mode-select');
                var isPercentage = modeSelect && modeSelect.value === 'percentage';
                
                var chartData = isPercentage ? 
                    branches.map(function(b) { return b.share || 0; }) :
                    branches.map(function(b) { return b.revenue || 0; });
                
                return PageRenderers.safeCreateChart('bar', 'branches-sales-chart', {
                    labels: branches.map(function(b) { return b.name || ''; }),
                    values: chartData,
                    label: isPercentage ? 'Доля %' : 'Выручка',
                    horizontal: true,
                    colorScheme: 'gradient'
                }, {
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var branch = branches[context.dataIndex];
                                    if (isPercentage) {
                                        return branch.name + ': ' + branch.share.toFixed(1) + '%';
                                    } else {
                                        return branch.name + ': ' + 
                                               (window.formatMoney ? window.formatMoney(branch.revenue, 'RUB', 0) : 
                                                window.ChartsRedesigned.formatNumber(branch.revenue));
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                callback: function(value) {
                                    if (isPercentage) {
                                        return value.toFixed(1) + '%';
                                    } else {
                                        return window.formatMoney ? 
                                            window.formatMoney(value, 'RUB', 0) : 
                                            window.ChartsRedesigned.formatNumber(value);
                                    }
                                }
                            }
                        }
                    }
                });
            });
            
            // Average check sparkline - REDESIGNED
            this.ensureChart('avg-check-chart', 'line', function() {
                // console.log('Creating redesigned avg-check-chart');
                
                // Generate sample average check trend data
                var avgCheckData = [12500, 13200, 12800, 13600, 14100, 13900, 14300];
                var labels = ['Мая', 'Июня', 'Июля', 'Авг', 'Сен', 'Окт', 'Ноя'];
                
                return PageRenderers.safeCreateChart('line', 'avg-check-chart', {
                    labels: labels,
                    fact: avgCheckData
                }, {
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Средний чек: ' + 
                                           (window.formatMoney ? window.formatMoney(context.parsed.y, 'RUB', 0) : 
                                            window.ChartsRedesigned.formatNumber(context.parsed.y));
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return window.formatMoney ? 
                                        window.formatMoney(value, 'RUB', 0) : 
                                        (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(value) : value);
                                }
                            }
                        }
                    }
                });
            });
        },
        
        // Profitability page charts
        renderProfitability: function(data) {
            // EBITDA Bridge chart using planFactDrivers - REDESIGNED
            this.ensureChart('ebitda-bridge-chart', 'bar', function() {
                // console.log('Creating redesigned ebitda-bridge-chart');
                
                // Provide fallback data if planFactDrivers is missing
                var drivers = data.planFactDrivers || [
                    { driver: 'Выручка', plan: 25000000, fact: 26200000, variance: 1200000 },
                    { driver: 'Себестоимость', plan: 15000000, fact: 14200000, variance: -800000 },
                    { driver: 'Валовая прибыль', plan: 10000000, fact: 12000000, variance: 2000000 },
                    { driver: 'Операционные расходы', plan: 7000000, fact: 6800000, variance: -200000 }
                ];
                
                // console.log('ebitda-bridge-chart: Using drivers =', drivers);
                var labels = drivers.map(function(d) { return d.driver; });
                var plannedValues = drivers.map(function(d) { return d.plan || 0; });
                var actualValues = drivers.map(function(d) { return d.fact || 0; });
                
                return PageRenderers.safeCreateChart('bar', 'ebitda-bridge-chart', {
                    labels: labels,
                    datasets: [
                        {
                            label: 'План',
                            data: plannedValues
                        },
                        {
                            label: 'Факт',
                            data: actualValues
                        }
                    ]
                }, {
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var driver = drivers[context.dataIndex];
                                    var label = context.dataset.label + ': ' + 
                                               (window.formatMoney ? window.formatMoney(context.parsed.y, 'RUB', 0) : 
                                                (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(context.parsed.y) : context.parsed.y));
                                    
                                    if (context.dataset.label === 'Факт') {
                                        var variance = driver.variance || 0;
                                        var prefix = variance >= 0 ? '+' : '';
                                        label += ' (откл: ' + prefix + 
                                                (window.formatMoney ? window.formatMoney(variance, 'RUB', 0) : 
                                                 window.ChartsRedesigned.formatNumber(variance)) + ')';
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                maxRotation: 45
                            }
                        },
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return window.formatMoney ? 
                                        window.formatMoney(value, 'RUB', 0) : 
                                        (window.ChartsRedesigned ? window.ChartsRedesigned.formatNumber(value) : value);
                                }
                            }
                        }
                    }
                });
            });
            
            // Margin by branches chart - REDESIGNED
            this.ensureChart('margin-branches-chart', 'bar', function() {
                // console.log('Creating redesigned margin-branches-chart');
                
                // Provide fallback data if structures.byBranch is missing
                var branches = (data.structures && data.structures.byBranch) || [
                    { name: 'Москва', revenue: 45600000, share: 38.5, margin: 24.2 },
                    { name: 'СПб', revenue: 32400000, share: 27.3, margin: 22.8 },
                    { name: 'Екатеринбург', revenue: 18900000, share: 15.9, margin: 19.5 },
                    { name: 'Новосибирск', revenue: 21700000, share: 18.3, margin: 21.1 }
                ];
                
                // console.log('margin-branches-chart: Using branches =', branches);
                
                return PageRenderers.safeCreateChart('bar', 'margin-branches-chart', {
                    labels: branches.map(function(b) { return b.name || ''; }),
                    values: branches.map(function(b) { return b.margin || 0; }),
                    label: 'Маржа по филиалам %',
                    horizontal: true,
                    colorScheme: 'gradient'
                }, {
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var branch = branches[context.dataIndex];
                                    return branch.name + ': ' + branch.margin.toFixed(1) + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(1) + '%';
                                }
                            }
                        }
                    }
                });
            });
        },
        
        // Cash Flow page charts
        renderCashFlow: function(data) {
            // Cash flow bridge chart (similar to overview but dedicated for cash page)
            this.ensureChart('cashflow-bridge-chart', 'bar', function() {
                if (!data.timeSeries || !data.timeSeries.cashFlow) return null;
                
                var cashData = data.timeSeries.cashFlow;
                var canvas = document.getElementById('cashflow-bridge-chart');
                if (!canvas) return null;
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                // Create more detailed cash flow bridge
                var labels = ['Начальный остаток', 'Операционный CF', 'Инвестиционный CF', 'Финансовый CF', 'Конечный остаток'];
                var values = [
                    cashData.opening || 0,
                    (cashData.ocf && cashData.ocf[0]) || 0,
                    (cashData.icf && cashData.icf[0]) || 0,
                    (cashData.fcf && cashData.fcf[0]) || 0,
                    cashData.closing || 0
                ];
                
                // Create cumulative values for waterfall effect
                var cumulative = [];
                var running = values[0]; // Opening balance
                cumulative.push(running);
                
                for (var i = 1; i < values.length - 1; i++) {
                    running += values[i];
                    cumulative.push(running);
                }
                cumulative.push(values[values.length - 1]); // Closing balance
                
                var colors = labels.map(function(label, index) {
                    if (index === 0 || index === labels.length - 1) return '#34495e';
                    var value = values[index];
                    return value >= 0 ? '#27ae60' : '#e74c3c';
                });
                
                var config = {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Денежный поток',
                            data: cumulative,
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1,
                        }]
                    },
                    options: Object.assign({}, window.ChartFactory.defaultOptions, {
                        scales: {
                            xAxes: [{
                                gridLines: { display: false },
                                ticks: { 
                                    fontSize: 10,
                                    maxRotation: 45
                                }
                            }],
                            yAxes: [{
                                gridLines: { color: 'rgba(189, 195, 199, 0.2)' },
                                ticks: {
                                    fontSize: 11,
                                    callback: function(value) {
                                        return window.formatMoney(value, 'RUB', 0);
                                    }
                                }
                            }]
                        },
                        tooltips: {
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    var index = tooltipItem.index;
                                    var actualValue = values[index];
                                    if (index === 0 || index === labels.length - 1) {
                                        return 'Остаток: ' + window.formatMoney(actualValue, 'RUB', 0);
                                    } else {
                                        var prefix = actualValue >= 0 ? '+' : '';
                                        return 'Поток: ' + prefix + window.formatMoney(actualValue, 'RUB', 0);
                                    }
                                }
                            }
                        }
                    })
                };
                
                return new Chart(canvas, config);
            });
            
            // Weekly forecast chart
            this.ensureChart('weekly-forecast-chart', 'line', function() {
                // Use real weekly forecast data if available
                var weeklyData = data.timeSeries && data.timeSeries.weeklyForecast;
                var weeks = weeklyData ? weeklyData.weeks : (function() {
                    var result = [];
                    for (var i = 0; i < 12; i++) {
                        result.push('Неделя ' + (i+1));
                    }
                    return result;
                })();
                var cashForecast = weeklyData ? weeklyData.cashBalance : [];
                
                // Fallback to sample data if no real data
                if (!weeklyData) {
                    weeks = [];
                    cashForecast = [];
                    var currentCash = (data.kpi && data.kpi.cashEnd) || 45600000;
                    
                    for (var i = 1; i <= 12; i++) {
                        weeks.push('Неделя ' + i);
                        currentCash += (Math.random() - 0.5) * 5000000;
                        cashForecast.push(Math.max(0, currentCash));
                    }
                }
                
                return window.ChartFactory.createLineChart('weekly-forecast-chart', {
                    dates: weeks,
                    fact: cashForecast,
                    options: {
                        scales: {
                            xAxes: [{
                                gridLines: { display: false },
                                ticks: { 
                                    fontSize: 10,
                                    maxRotation: 45
                                }
                            }],
                            yAxes: [{
                                gridLines: { color: 'rgba(189, 195, 199, 0.2)' },
                                ticks: {
                                    fontSize: 11,
                                    callback: function(value) {
                                        return window.formatMoney(value, 'RUB', 0);
                                    }
                                }
                            }]
                        },
                        tooltips: {
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    return 'Прогноз: ' + window.formatMoney(tooltipItem.yLabel, 'RUB', 0);
                                }
                            }
                        }
                    }
                });
            });
        },
        
        // Accounts Receivable page charts  
        renderAccReceivable: function(data) {
            // Aging analysis chart using arAging buckets
            this.ensureChart('aging-analysis-chart', 'bar', function() {
                // console.log('aging-analysis-chart factory: arAging =', data.arAging);
                
                var canvas = document.getElementById('aging-analysis-chart');
                if (!canvas) {
                    console.warn('aging-analysis-chart: Canvas not found');
                    return null;
                }
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                // Provide fallback data if arAging.buckets is missing
                var buckets = (data.arAging && data.arAging.buckets) || {
                    '0-30': 12500000,
                    '31-60': 8200000,
                    '61-90': 3400000,
                    '90+': 1900000
                };
                
                // console.log('aging-analysis-chart: Using buckets =', buckets);
                
                var labels = ['0-30 дней', '31-60 дней', '61-90 дней', '90+ дней'];
                var values = [
                    buckets['0-30'] || 0,
                    buckets['31-60'] || 0,
                    buckets['61-90'] || 0,
                    buckets['90+'] || 0
                ];
                
                // Color coding by risk level
                var colors = ['#34C759', '#FF9500', '#FF6B6B', '#FF3B30'];
                
                var config = {
                    type: 'horizontalBar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Дебиторка по срокам',
                            data: values,
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1
                        }]
                    },
                    options: Object.assign({}, window.ChartFactory.defaultOptions, {
                        scales: {
                            xAxes: [{
                                gridLines: { color: 'rgba(189, 195, 199, 0.2)' },
                                ticks: {
                                    fontSize: 11,
                                    callback: function(value) {
                                        return window.formatMoney(value, 'RUB', 0);
                                    }
                                }
                            }],
                            yAxes: [{
                                gridLines: { display: false },
                                ticks: { fontSize: 11 }
                            }]
                        },
                        tooltips: {
                            callbacks: {
                                label: function(tooltipItem, chartData) {
                                    var totalAR = values.reduce(function(sum, val) { return sum + val; }, 0);
                                    var percentage = ((tooltipItem.xLabel / totalAR) * 100).toFixed(1);
                                    return tooltipItem.yLabel + ': ' + window.formatMoney(tooltipItem.xLabel, 'RUB', 0) + ' (' + percentage + '%)';
                                }
                            }
                        }
                    })
                };
                
                return new Chart(canvas, config);
            });
            
            // DSO trends chart
            this.ensureChart('dso-trends-chart', 'line', function() {
                var canvas = document.getElementById('dso-trends-chart');
                if (!canvas) return null;
                
                // Use coefficients sparkline data for DSO or generate sample data
                var dsoData;
                var labels;
                
                if (data.coefficients && data.coefficients.sparklines && data.coefficients.sparklines.dso) {
                    dsoData = data.coefficients.sparklines.dso;
                    labels = ['Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь'];
                } else {
                    // Generate sample DSO trend
                    dsoData = [45, 46, 48, 47, 47];
                    labels = ['Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь'];
                }
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                var config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'DSO (дни)',
                            data: dsoData,
                            borderColor: '#FF9500',
                            backgroundColor: 'rgba(255, 149, 0, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.1,
                            pointRadius: 4,
                            pointBackgroundColor: '#FF9500',
                            pointBorderColor: '#FFFFFF',
                            pointBorderWidth: 2
                        }]
                    },
                    options: Object.assign({}, window.ChartFactory.defaultOptions, {
                        scales: {
                            xAxes: [{
                                gridLines: { display: false },
                                ticks: { fontSize: 11 }
                            }],
                            yAxes: [{
                                gridLines: { color: 'rgba(189, 195, 199, 0.2)' },
                                ticks: {
                                    fontSize: 11,
                                    callback: function(value) {
                                        return value + ' дн.';
                                    }
                                },
                                min: Math.min.apply(Math, dsoData) - 5,
                                max: Math.max.apply(Math, dsoData) + 5
                            }]
                        },
                        tooltips: {
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    return 'DSO: ' + tooltipItem.yLabel + ' дней';
                                }
                            }
                        }
                    })
                };
                
                return new Chart(canvas, config);
            });
        },
        
        // Ensure chart exists, create if needed
        ensureChart: function(canvasId, type, createFunction) {
            // console.log('ensureChart called for:', canvasId);
            
            // Add debug info to DOM if ChartFactory debug element exists
            var debugElement = document.getElementById('debug-info');
            if (debugElement) {
                debugElement.innerHTML += '<div><strong>ensureChart called:</strong> ' + canvasId + '</div>';
            }
            
            var canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn('Canvas not found:', canvasId);
                if (debugElement) debugElement.innerHTML += '<div>ERROR: Canvas not found: ' + canvasId + '</div>';
                return null;
            }
            
            // console.log('Canvas found:', canvasId, 'dimensions:', canvas.clientWidth + 'x' + canvas.clientHeight);
            
            // Ensure canvas context is available
            var ctx = canvas.getContext('2d');
            if (!ctx) {
                console.warn('Canvas context not available:', canvasId);
                return null;
            }
            
            // Ensure canvas has dimensions
            if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
                // console.log('Canvas has zero dimensions, setting defaults');
                // Set default dimensions if not set
                canvas.style.width = '400px';
                canvas.style.height = '300px';
            }
            
            // Check if there's already a Chart.js instance on this canvas
            var existingChart = canvas.chart;
            if (existingChart && existingChart.destroy) {
                // console.log('Destroying existing chart on:', canvasId);
                existingChart.destroy();
            }
            
            // Also clean up our tracking
            if (this.createdCharts[canvasId]) {
                delete this.createdCharts[canvasId];
            }
            
            try {
                // Set safe defaults for Chart.js global config
                if (window.Chart && window.Chart.defaults) {
                    Chart.defaults.global.defaultFontFamily = 'system-ui, -apple-system, sans-serif';
                    Chart.defaults.global.defaultFontSize = 16;
                    Chart.defaults.global.defaultFontColor = '#374151';
                }
                
                // console.log('Calling createFunction for:', canvasId);
                if (debugElement) debugElement.innerHTML += '<div>Calling createFunction for: ' + canvasId + '</div>';
                var chart = createFunction();
                // console.log('CreateFunction returned:', !!chart, 'for', canvasId);
                
                if (chart) {
                    this.createdCharts[canvasId] = chart;
                    // console.log('Chart successfully created and tracked:', canvasId);
                    if (debugElement) debugElement.innerHTML += '<div>SUCCESS: Chart created for: ' + canvasId + '</div>';
                } else {
                    console.warn('CreateFunction returned null/undefined for:', canvasId);
                    if (debugElement) debugElement.innerHTML += '<div>ERROR: CreateFunction returned null for: ' + canvasId + '</div>';
                }
                return chart;
            } catch (error) {
                console.error('Failed to create chart ' + canvasId + ':', error);
                return null;
            }
        },
        
        // Update existing chart with new data
        updateChart: function(canvasId, newData) {
            var chart = this.createdCharts[canvasId];
            if (!chart || !chart.update) return;
            
            try {
                if (newData.labels) {
                    chart.data.labels = newData.labels;
                }
                if (newData.datasets) {
                    chart.data.datasets = newData.datasets;
                }
                chart.update();
            } catch (error) {
                console.error('Failed to update chart ' + canvasId + ':', error);
            }
        },
        
        // Clear all charts (useful for cleanup)
        clearCharts: function() {
            // First destroy all tracked charts
            for (var canvasId in this.createdCharts) {
                var chart = this.createdCharts[canvasId];
                if (chart && chart.destroy) {
                    try {
                        chart.destroy();
                    } catch (error) {
                        console.warn('Error destroying chart ' + canvasId + ':', error);
                    }
                }
            }
            this.createdCharts = {};
            
            // Also check for any untracked Chart.js instances
            var allCanvases = document.querySelectorAll('canvas');
            allCanvases.forEach(function(canvas) {
                try {
                    var chart = canvas.chart;
                    if (chart && chart.destroy) {
                        chart.destroy();
                    }
                } catch (error) {
                    console.warn('Error destroying untracked chart:', error);
                }
            });
        },
        
        // Clear charts for specific page
        clearPageCharts: function(pageId) {
            var pageElement = document.getElementById('page-' + pageId);
            if (!pageElement) return;
            
            var canvases = pageElement.querySelectorAll('canvas');
            canvases.forEach(function(canvas) {
                var canvasId = canvas.id;
                
                // Remove from our tracking
                if (PageRenderers.createdCharts[canvasId]) {
                    var chart = PageRenderers.createdCharts[canvasId];
                    if (chart && chart.destroy) {
                        try {
                            chart.destroy();
                        } catch (error) {
                            console.warn('Error destroying tracked chart:', error);
                        }
                    }
                    delete PageRenderers.createdCharts[canvasId];
                }
                
                // Also check canvas.chart property
                try {
                    var chart = canvas.chart;
                    if (chart && chart.destroy) {
                        chart.destroy();
                    }
                } catch (error) {
                    console.warn('Error destroying chart from registry:', error);
                }
            });
        }
    };
    
    // Export to window
    window.PageRenderers = PageRenderers;
    
})();