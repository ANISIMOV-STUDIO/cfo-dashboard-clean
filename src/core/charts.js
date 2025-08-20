/**
 * Charts Factory Module
 * Unified Chart.js factory with IBCS styling for CFO Dashboard
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var ChartFactory = {
        // IBCS colors for macOS design
        colors: {
            fact: '#111827',
            plan: '#0A84FF',
            forecast: '#9CA3AF',
            prevYear: '#9CA3AF',
            positive: '#16A34A',
            negative: '#DC2626',
            neutral: '#6B7280',
            background: 'rgba(17,24,39,0.08)',
            gridLines: 'rgba(17,24,39,0.08)'
        },
        
        // Default chart options optimized for v8webkit
        defaultOptions: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 200 },
            elements: {
                point: { radius: 2, hitRadius: 6 },
                line: { tension: 0.25, borderWidth: 2 }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 12 },
                    bodyFont: { size: 11 },
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label || '';
                        },
                        label: function(context) {
                            var value = context.parsed.y || context.parsed;
                            return context.dataset.label + ': ' + window.formatMoney(value, 'RUB', 0);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(17,24,39,0.08)'
                    },
                    ticks: {
                        font: { size: 11 },
                        color: '#6B7280',
                        callback: function(value) {
                            return window.formatMoney ? window.formatMoney(value, 'RUB', 0) : value;
                        }
                    }
                }
            }
        },
        
        // Create horizontal bar chart - unified implementation
        createHorizontalBarChart: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            // Ensure canvas has proper size
            this.ensureCanvasSize(canvas);
            
            var config = {
                type: 'bar',
                data: {
                    labels: data.labels || [],
                    datasets: data.datasets || [{
                        label: data.label || 'Values',
                        data: data.values || data.data || [],
                        backgroundColor: data.colors || data.backgroundColor || this.colors.primary,
                        borderColor: data.borderColors || data.borderColor || this.colors.primary,
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: Object.assign({}, this.defaultOptions, {
                    indexAxis: 'y',
                    scales: {
                        x: Object.assign({}, this.defaultOptions.scales.y),
                        y: Object.assign({}, this.defaultOptions.scales.x)
                    }
                }, data.options || {})
            };
            
            return new Chart(canvas, config);
        },
        
        // Create line chart for time series
        createLineChart: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            this.ensureCanvasSize(canvas);
            
            var datasets = [];
            
            // Fact data
            if (data.fact) {
                datasets.push({
                    label: 'Факт',
                    data: data.fact,
                    borderColor: this.colors.fact,
                    backgroundColor: this.colors.fact + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Plan data
            if (data.plan) {
                datasets.push({
                    label: 'План',
                    data: data.plan,
                    borderColor: this.colors.plan,
                    backgroundColor: this.colors.plan + '20',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Previous year
            if (data.prevYear) {
                datasets.push({
                    label: 'Прошлый год',
                    data: data.prevYear,
                    borderColor: this.colors.secondary,
                    backgroundColor: this.colors.secondary + '20',
                    borderWidth: 1,
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Forecast
            if (data.forecast && data.forecastDates) {
                var forecastData = new Array(data.dates.length).fill(null);
                // Add forecast points starting from last actual date
                data.forecast.forEach(function(val, idx) {
                    if (idx < forecastData.length) {
                        forecastData[data.dates.length - 1 + idx] = val;
                    }
                });
                
                datasets.push({
                    label: 'Прогноз',
                    data: forecastData,
                    borderColor: this.colors.forecast,
                    backgroundColor: this.colors.forecast + '20',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    fill: false,
                    tension: 0.1
                });
            }
            
            var config = {
                type: 'line',
                data: {
                    labels: data.dates || data.labels || [],
                    datasets: datasets
                },
                options: Object.assign({}, this.defaultOptions, data.options || {})
            };
            
            return new Chart(canvas, config);
        },
        
        // Create waterfall chart (using bar chart)
        createWaterfallChart: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            this.ensureCanvasSize(canvas);
            
            // Calculate cumulative values for waterfall
            var cumulativeData = [];
            var runningTotal = data.opening || 0;
            
            data.values.forEach(function(value, index) {
                if (index === 0) {
                    cumulativeData.push(runningTotal);
                } else if (index === data.values.length - 1) {
                    // Closing balance
                    cumulativeData.push(data.closing || runningTotal);
                } else {
                    runningTotal += value;
                    cumulativeData.push(runningTotal);
                }
            });
            
            var config = {
                type: 'bar',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: data.label || 'Waterfall',
                        data: cumulativeData,
                        backgroundColor: data.values.map(function(val) {
                            return val > 0 ? ChartFactory.colors.positive : 
                                   val < 0 ? ChartFactory.colors.negative : 
                                   ChartFactory.colors.neutral;
                        }),
                        borderWidth: 1
                    }]
                },
                options: Object.assign({}, this.defaultOptions, data.options || {})
            };
            
            return new Chart(canvas, config);
        },
        
        // Create sparkline chart (minimal line chart)
        createSparkline: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            this.ensureCanvasSize(canvas);
            
            // Handle both old format (array) and new format (object)
            var values = Array.isArray(data) ? data : (data.fact || data.values || data.data || []);
            var labels = data.dates || data.labels || new Array(values.length).fill('');
            
            var config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primary + '20',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.2,
                        pointRadius: 2,
                        pointHoverRadius: 4
                    }]
                },
                options: Object.assign({}, this.defaultOptions, {
                    plugins: {
                        legend: { display: false },
                        tooltip: { 
                            enabled: true,
                            callbacks: {
                                label: function(context) {
                                    return window.formatMoney ? window.formatMoney(context.parsed.y, 'RUB', 0) : context.parsed.y;
                                }
                            }
                        }
                    }
                })
            };
            
            return new Chart(canvas, config);
        },
        
        // Ensure proper canvas sizing for HiDPI
        ensureCanvasSize: function(canvas) {
            var container = canvas.parentElement;
            var containerWidth = container.clientWidth || 400;
            var containerHeight = container.clientHeight || 300;
            
            // Set canvas size
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = containerHeight + 'px';
            
            // Handle device pixel ratio for sharp rendering
            var dpr = window.devicePixelRatio || 1;
            canvas.width = containerWidth * dpr;
            canvas.height = containerHeight * dpr;
            
            var ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        },
        
        // Destroy chart instance safely
        destroyChart: function(chartInstance) {
            if (chartInstance && typeof chartInstance.destroy === 'function') {
                chartInstance.destroy();
            }
        },
        
        // Update chart data
        updateChart: function(chartInstance, newData) {
            if (!chartInstance) return;
            
            if (newData.labels) {
                chartInstance.data.labels = newData.labels;
            }
            
            if (newData.datasets) {
                chartInstance.data.datasets = newData.datasets;
            } else if (newData.values && chartInstance.data.datasets.length > 0) {
                chartInstance.data.datasets[0].data = newData.values;
            }
            
            chartInstance.update('none'); // No animation for performance
        },
        
        // Get chart colors based on values (positive/negative)
        getValueColors: function(values) {
            var self = this;
            return values.map(function(value) {
                if (value > 0) return self.colors.positive;
                if (value < 0) return self.colors.negative;
                return self.colors.neutral;
            });
        },
        
        // Apply share mode (percentage vs absolute)
        applyShareMode: function(chartInstance, mode) {
            if (!chartInstance || !chartInstance.options.scales) return;
            
            var yScale = chartInstance.options.scales.y;
            if (yScale && yScale.ticks && yScale.ticks.callback) {
                if (mode === 'percentage') {
                    yScale.ticks.callback = function(value) {
                        return window.formatPercent(value);
                    };
                } else {
                    yScale.ticks.callback = function(value) {
                        return window.formatMoney(value, 'RUB', 0);
                    };
                }
                
                chartInstance.update('none');
            }
        }
    };
    
    // Global helper function that was missing
    window.ensureHiDPI = ChartFactory.ensureCanvasSize;
    
    // Export to window for global access
    window.ChartFactory = ChartFactory;
    
    // Only ChartFactory export - no global legacy functions to avoid conflicts
    
})();