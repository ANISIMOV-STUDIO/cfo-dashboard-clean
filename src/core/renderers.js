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
            // Clear any existing charts for this page first
            this.clearPageCharts(pageId);
            
            // Then render new charts
            switch (pageId) {
                case 'overview':
                    this.renderOverview(data);
                    break;
                case 'sales':
                    this.renderSales(data);
                    break;
                case 'profit':
                    this.renderProfitability(data);
                    break;
                case 'cash':
                    this.renderCashFlow(data);
                    break;
                case 'ar':
                    this.renderAccReceivable(data);
                    break;
            }
        },
        
        // Overview page charts
        renderOverview: function(data) {
            // Revenue trend chart using timeSeries.revenue data
            this.ensureChart('revenue-trend-chart', 'line', function() {
                if (!data.timeSeries || !data.timeSeries.revenue) return null;
                
                var revData = data.timeSeries.revenue;
                return window.ChartFactory.createLineChart('revenue-trend-chart', {
                    dates: revData.dates || [],
                    fact: revData.fact || [],
                    plan: revData.plan || [],
                    prevYear: revData.prevYear || [],
                    forecast: revData.forecast || [],
                    forecastDates: revData.forecast ? ['2024-12', '2025-01', '2025-02'] : []
                });
            });
            
            // Margins trend chart using timeSeries.margins data
            this.ensureChart('margins-trend-chart', 'line', function() {
                if (!data.timeSeries || !data.timeSeries.margins) return null;
                
                var marginsData = data.timeSeries.margins;
                var canvas = document.getElementById('margins-trend-chart');
                if (!canvas) return null;
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                var config = {
                    type: 'line',
                    data: {
                        labels: marginsData.dates || [],
                        datasets: [
                            {
                                label: 'Валовая маржа',
                                data: marginsData.gross || [],
                                borderColor: '#28a745',
                                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.1
                            },
                            {
                                label: 'EBITDA',
                                data: marginsData.ebitda || [],
                                borderColor: '#17a2b8',
                                backgroundColor: 'rgba(23, 162, 184, 0.1)',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.1
                            },
                            {
                                label: 'Чистая маржа',
                                data: marginsData.net || [],
                                borderColor: '#6f42c1',
                                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.1
                            }
                        ]
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
                                        return value + '%';
                                    }
                                }
                            }]
                        }
                    })
                };
                
                return new Chart(canvas, config);
            });
            
            // Cashflow waterfall chart using timeSeries.cashFlow data
            this.ensureChart('cashflow-chart', 'bar', function() {
                if (!data.timeSeries || !data.timeSeries.cashFlow) return null;
                
                var cashData = data.timeSeries.cashFlow;
                var canvas = document.getElementById('cashflow-chart');
                if (!canvas) return null;
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                // Prepare waterfall data: Opening → OCF → ICF → FCF → Closing
                var values = [
                    cashData.opening || 0,
                    (cashData.ocf && cashData.ocf[0]) || 0,
                    (cashData.icf && cashData.icf[0]) || 0,
                    (cashData.fcf && cashData.fcf[0]) || 0,
                    cashData.closing || 0
                ];
                
                var labels = cashData.labels || ['Opening', 'OCF', 'ICF', 'FCF', 'Closing'];
                
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
                    if (index === 0 || index === labels.length - 1) return '#34495e'; // Opening/Closing
                    var value = values[index];
                    return value >= 0 ? '#27ae60' : '#e74c3c'; // Positive/Negative
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
                            borderRadius: 4
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
                                        return window.formatMoney(value, 'RUB', 0);
                                    }
                                }
                            }]
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var index = context.dataIndex;
                                        var actualValue = values[index];
                                        var label = context.dataset.label;
                                        if (index === 0 || index === labels.length - 1) {
                                            return label + ': ' + window.formatMoney(actualValue, 'RUB', 0);
                                        } else {
                                            var prefix = actualValue >= 0 ? '+' : '';
                                            return label + ': ' + prefix + window.formatMoney(actualValue, 'RUB', 0);
                                        }
                                    }
                                }
                            }
                        }
                    })
                };
                
                return new Chart(canvas, config);
            });
            
            // Variance chart (Plan vs Fact waterfall) using planFactDrivers
            this.ensureChart('variance-chart', 'bar', function() {
                if (!data.planFactDrivers) return null;
                
                var canvas = document.getElementById('variance-chart');
                if (!canvas) return null;
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                var drivers = data.planFactDrivers;
                var labels = drivers.map(function(d) { return d.driver; });
                var variances = drivers.map(function(d) { return d.variance || 0; });
                
                // Create cumulative variance waterfall
                var cumulative = [];
                var running = 0;
                
                variances.forEach(function(variance) {
                    running += variance;
                    cumulative.push(running);
                });
                
                var colors = variances.map(function(variance) {
                    return variance >= 0 ? '#27ae60' : '#e74c3c';
                });
                
                var config = {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Отклонение от плана',
                            data: cumulative,
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1,
                            borderRadius: 4
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
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var index = context.dataIndex;
                                        var driver = drivers[index];
                                        var variance = driver.variance || 0;
                                        var prefix = variance >= 0 ? '+' : '';
                                        return driver.driver + ': ' + prefix + window.formatMoney(variance, 'RUB', 0) + 
                                               ' (' + prefix + (driver.variancePercent || 0).toFixed(1) + '%)';
                                    }
                                }
                            }
                        }
                    })
                };
                
                return new Chart(canvas, config);
            });
        },
        
        // Sales page charts
        renderSales: function(data) {
            // Branches sales chart with absolute/percentage mode support
            this.ensureChart('branches-sales-chart', 'bar', function() {
                if (!data.structures || !data.structures.byBranch) return null;
                
                var branches = data.structures.byBranch;
                var canvas = document.getElementById('branches-sales-chart');
                if (!canvas) return null;
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                // Check current mode from select
                var modeSelect = document.getElementById('mode-select');
                var isPercentage = modeSelect && modeSelect.value === 'percentage';
                
                var chartData, yAxisConfig;
                if (isPercentage) {
                    // Use share percentages
                    chartData = branches.map(function(b) { return b.share || 0; });
                    yAxisConfig = {
                        gridLines: { color: 'rgba(189, 195, 199, 0.2)' },
                        ticks: {
                            fontSize: 11,
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        max: 100
                    };
                } else {
                    // Use absolute revenue values
                    chartData = branches.map(function(b) { return b.revenue || 0; });
                    yAxisConfig = {
                        gridLines: { color: 'rgba(189, 195, 199, 0.2)' },
                        ticks: {
                            fontSize: 11,
                            callback: function(value) {
                                return window.formatMoney(value, 'RUB', 0);
                            }
                        }
                    };
                }
                
                var config = {
                    type: 'bar',
                    data: {
                        labels: branches.map(function(b) { return b.name || ''; }),
                        datasets: [{
                            label: isPercentage ? 'Доля %' : 'Выручка',
                            data: chartData,
                            backgroundColor: ['#007AFF', '#34C759', '#FF9500', '#FF6B6B', '#9B59B6'],
                            borderColor: ['#007AFF', '#34C759', '#FF9500', '#FF6B6B', '#9B59B6'],
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: Object.assign({}, window.ChartFactory.defaultOptions, {
                        indexAxis: 'y',
                        scales: {
                            x: yAxisConfig,
                            y: {
                                gridLines: { display: false },
                                ticks: { fontSize: 11 }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var branch = branches[context.dataIndex];
                                        if (isPercentage) {
                                            return branch.name + ': ' + branch.share + '%';
                                        } else {
                                            return branch.name + ': ' + window.formatMoney(branch.revenue, 'RUB', 0);
                                        }
                                    }
                                }
                            }
                        }
                    })
                };
                
                return new Chart(canvas, config);
            });
            
            // Average check sparkline (simplified)
            this.ensureChart('avg-check-chart', 'line', function() {
                // Generate sample average check trend data
                var avgCheckData = [12500, 13200, 12800, 13600, 14100, 13900, 14300];
                var labels = ['Мая', 'Июня', 'Июля', 'Авг', 'Сен', 'Окт', 'Ноя'];
                
                return window.ChartFactory.createSparkline('avg-check-chart', {
                    dates: labels,
                    fact: avgCheckData
                });
            });
        },
        
        // Profitability page charts
        renderProfitability: function(data) {
            // EBITDA Bridge chart using planFactDrivers for waterfall
            this.ensureChart('ebitda-bridge-chart', 'bar', function() {
                if (!data.planFactDrivers) return null;
                
                var canvas = document.getElementById('ebitda-bridge-chart');
                if (!canvas) return null;
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                var drivers = data.planFactDrivers;
                var labels = drivers.map(function(d) { return d.driver; });
                var plannedValues = drivers.map(function(d) { return d.plan || 0; });
                var actualValues = drivers.map(function(d) { return d.fact || 0; });
                
                var config = {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'План',
                                data: plannedValues,
                                backgroundColor: 'rgba(23, 162, 184, 0.7)',
                                borderColor: '#17a2b8',
                                borderWidth: 1,
                                borderRadius: 4
                            },
                            {
                                label: 'Факт',
                                data: actualValues,
                                backgroundColor: 'rgba(40, 167, 69, 0.7)',
                                borderColor: '#28a745',
                                borderWidth: 1,
                                borderRadius: 4
                            }
                        ]
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
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var driver = drivers[context.dataIndex];
                                        var label = context.dataset.label + ': ' + window.formatMoney(context.parsed.y, 'RUB', 0);
                                        if (context.dataset.label === 'Факт') {
                                            var variance = driver.variance || 0;
                                            var prefix = variance >= 0 ? '+' : '';
                                            label += ' (откл: ' + prefix + window.formatMoney(variance, 'RUB', 0) + ')';
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    })
                };
                
                return new Chart(canvas, config);
            });
            
            // Margin by branches chart
            this.ensureChart('margin-branches-chart', 'bar', function() {
                if (!data.structures || !data.structures.byBranch) return null;
                
                var branches = data.structures.byBranch;
                var canvas = document.getElementById('margin-branches-chart');
                if (!canvas) return null;
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
                var config = {
                    type: 'bar',
                    data: {
                        labels: branches.map(function(b) { return b.name || ''; }),
                        datasets: [{
                            label: 'Маржа по филиалам %',
                            data: branches.map(function(b) { return b.margin || 0; }),
                            backgroundColor: ['#34C759', '#007AFF', '#FF9500', '#FF6B6B'],
                            borderColor: ['#34C759', '#007AFF', '#FF9500', '#FF6B6B'],
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: Object.assign({}, window.ChartFactory.defaultOptions, {
                        indexAxis: 'y',
                        scales: {
                            xAxes: [{
                                gridLines: { color: 'rgba(189, 195, 199, 0.2)' },
                                ticks: {
                                    fontSize: 11,
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                },
                                max: Math.max.apply(Math, branches.map(function(b) { return b.margin || 0; })) + 5
                            },
                            y: {
                                gridLines: { display: false },
                                ticks: { fontSize: 11 }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var branch = branches[context.dataIndex];
                                        return branch.name + ': ' + branch.margin + '%';
                                    }
                                }
                            }
                        }
                    })
                };
                
                return new Chart(canvas, config);
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
                            borderRadius: 4
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
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var index = context.dataIndex;
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
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return 'Прогноз: ' + window.formatMoney(context.parsed.y, 'RUB', 0);
                                    }
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
                if (!data.arAging || !data.arAging.buckets) return null;
                
                var buckets = data.arAging.buckets;
                var canvas = document.getElementById('aging-analysis-chart');
                if (!canvas) return null;
                
                window.ChartFactory.ensureCanvasSize(canvas);
                
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
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Дебиторка по срокам',
                            data: values,
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: Object.assign({}, window.ChartFactory.defaultOptions, {
                        indexAxis: 'y',
                        scales: {
                            xAxes: [{
                                gridLines: { color: 'rgba(189, 195, 199, 0.2)' },
                                ticks: {
                                    fontSize: 11,
                                    callback: function(value) {
                                        return window.formatMoney(value, 'RUB', 0);
                                    }
                                }
                            },
                            y: {
                                gridLines: { display: false },
                                ticks: { fontSize: 11 }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var percentage = ((context.parsed.x / data.arAging.totalAR) * 100).toFixed(1);
                                        return context.label + ': ' + window.formatMoney(context.parsed.x, 'RUB', 0) + ' (' + percentage + '%)';
                                    }
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
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return 'DSO: ' + context.parsed.y + ' дней';
                                    }
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
            var canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn('Canvas not found:', canvasId);
                return null;
            }
            
            // Check if there's already a Chart.js instance on this canvas
            var existingChart = canvas.chart;
            if (existingChart && existingChart.destroy) {
                existingChart.destroy();
            }
            
            // Also clean up our tracking
            if (this.createdCharts[canvasId]) {
                delete this.createdCharts[canvasId];
            }
            
            try {
                var chart = createFunction();
                if (chart) {
                    this.createdCharts[canvasId] = chart;
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