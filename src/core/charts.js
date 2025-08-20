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
        
        // Unified readability settings for all charts
        readability: {
            // Font settings
            fontSize: {
                axis: 16,
                tooltip: {
                    title: 16,
                    body: 15
                },
                legend: 14,
                title: 18
            },
            fontColor: {
                primary: '#374151',
                secondary: '#6B7280',
                inverse: '#FFFFFF'
            },
            // Spacing and dimensions
            spacing: {
                tooltipPadding: { x: 12, y: 10 },
                chartPadding: 20,
                axisPadding: 10
            },
            // Animation settings
            animation: {
                duration: 200,
                easing: 'easeOutQuart'
            }
        },
        
        // Helper methods for applying unified settings
        applyReadabilityToAxis: function(axisConfig) {
            if (!axisConfig.ticks) axisConfig.ticks = {};
            axisConfig.ticks.fontSize = this.readability.fontSize.axis;
            axisConfig.ticks.fontColor = this.readability.fontColor.primary;
            return axisConfig;
        },
        
        applyReadabilityToTooltips: function(tooltipConfig) {
            tooltipConfig.titleFontSize = this.readability.fontSize.tooltip.title;
            tooltipConfig.bodyFontSize = this.readability.fontSize.tooltip.body;
            tooltipConfig.xPadding = this.readability.spacing.tooltipPadding.x;
            tooltipConfig.yPadding = this.readability.spacing.tooltipPadding.y;
            return tooltipConfig;
        },
        
        getReadabilitySettings: function() {
            return this.readability;
        },
        
        // Update readability settings - allows runtime configuration
        updateReadabilitySettings: function(newSettings) {
            if (!newSettings || typeof newSettings !== 'object') return;
            
            // Deep merge new settings with existing ones
            if (newSettings.fontSize) {
                Object.assign(this.readability.fontSize, newSettings.fontSize);
            }
            if (newSettings.fontColor) {
                Object.assign(this.readability.fontColor, newSettings.fontColor);
            }
            if (newSettings.spacing) {
                Object.assign(this.readability.spacing, newSettings.spacing);
            }
            if (newSettings.animation) {
                Object.assign(this.readability.animation, newSettings.animation);
            }
            
            // Trigger event for components to update
            if (window.DashboardState) {
                window.DashboardState.triggerEvent('readabilityChanged', this.readability);
            }
        },
        
        // Apply unified readability settings to chart configuration
        applyUnifiedReadability: function(config) {
            if (!config.options) config.options = {};
            
            // Apply animation settings
            if (!config.options.animation) config.options.animation = {};
            config.options.animation.duration = this.readability.animation.duration;
            config.options.animation.easing = this.readability.animation.easing;
            
            // Apply tooltip settings
            if (!config.options.tooltips) config.options.tooltips = {};
            config.options.tooltips.titleFontSize = this.readability.fontSize.tooltip.title;
            config.options.tooltips.bodyFontSize = this.readability.fontSize.tooltip.body;
            config.options.tooltips.xPadding = this.readability.spacing.tooltipPadding.x;
            config.options.tooltips.yPadding = this.readability.spacing.tooltipPadding.y;
            
            // Apply scale settings
            if (!config.options.scales) config.options.scales = {};
            
            // Apply to xAxes
            if (config.options.scales.xAxes) {
                for (var i = 0; i < config.options.scales.xAxes.length; i++) {
                    if (!config.options.scales.xAxes[i].ticks) config.options.scales.xAxes[i].ticks = {};
                    config.options.scales.xAxes[i].ticks.fontSize = this.readability.fontSize.axis;
                    config.options.scales.xAxes[i].ticks.fontColor = this.readability.fontColor.primary;
                }
            }
            
            // Apply to yAxes
            if (config.options.scales.yAxes) {
                for (var j = 0; j < config.options.scales.yAxes.length; j++) {
                    if (!config.options.scales.yAxes[j].ticks) config.options.scales.yAxes[j].ticks = {};
                    config.options.scales.yAxes[j].ticks.fontSize = this.readability.fontSize.axis;
                    config.options.scales.yAxes[j].ticks.fontColor = this.readability.fontColor.primary;
                }
            }
            
            return config;
        },
        
        // Enable and configure chart legend with readability settings
        enableLegend: function(config, position) {
            if (!config.options) config.options = {};
            
            position = position || 'bottom';
            
            config.options.legend = {
                display: true,
                position: position,
                labels: {
                    fontSize: this.readability.fontSize.legend,
                    fontColor: this.readability.fontColor.primary,
                    padding: 20,
                    usePointStyle: true,
                    pointStyleWidth: 18
                }
            };
            
            return config;
        },
        
        // Create datasets based on comparison mode and available data
        createDatasetsWithComparison: function(data, compareMode) {
            var datasets = [];
            compareMode = compareMode || 'none';
            
            // Always include fact data if available
            if (data.fact && Array.isArray(data.fact)) {
                datasets.push({
                    label: 'Факт',
                    data: data.fact.filter(function(v) { return v !== null && v !== undefined; }),
                    borderColor: this.colors.fact,
                    backgroundColor: this.colors.fact + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Add comparison datasets based on mode
            if (compareMode === 'prevYear' && data.prevYear && Array.isArray(data.prevYear)) {
                datasets.push({
                    label: 'Прошлый год',
                    data: data.prevYear.filter(function(v) { return v !== null && v !== undefined; }),
                    borderColor: this.colors.prevYear,
                    backgroundColor: this.colors.prevYear + '20',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1
                });
            } else if (compareMode === 'plan' && data.plan && Array.isArray(data.plan)) {
                datasets.push({
                    label: 'План',
                    data: data.plan.filter(function(v) { return v !== null && v !== undefined; }),
                    borderColor: this.colors.plan,
                    backgroundColor: this.colors.plan + '20',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Add forecast if available (independent of comparison mode)
            if (data.forecast && data.forecastDates) {
                var forecastData = new Array(data.dates ? data.dates.length : 0).fill(null);
                // Add forecast points starting from last actual date
                data.forecast.forEach(function(val, idx) {
                    if (idx < forecastData.length && data.dates) {
                        forecastData[data.dates.length - 1 + idx] = val;
                    }
                });
                
                datasets.push({
                    label: 'Прогноз',
                    data: forecastData,
                    borderColor: this.colors.forecast,
                    backgroundColor: this.colors.forecast + '20',
                    borderWidth: 2,
                    borderDash: [2, 2],
                    fill: false,
                    tension: 0.1
                });
            }
            
            return datasets;
        },
        
        // Update all charts when comparison mode changes
        updateChartsForComparison: function(compareMode) {
            // Get all chart instances
            if (typeof Chart !== 'undefined' && Chart.instances) {
                for (var i = 0; i < Chart.instances.length; i++) {
                    var chartInstance = Chart.instances[i];
                    var canvas = chartInstance.canvas;
                    var chartId = canvas.id;
                    
                    // Skip if this is not a line chart or doesn't support comparisons
                    if (chartInstance.config.type !== 'line') continue;
                    
                    // Get original data from canvas data attribute or global data store
                    var originalData = this.getOriginalDataForChart(chartId);
                    if (!originalData) continue;
                    
                    // Recreate datasets with new comparison mode
                    var newDatasets = this.createDatasetsWithComparison(originalData, compareMode);
                    
                    // Update chart data
                    chartInstance.data.datasets = newDatasets;
                    
                    // Update legend visibility
                    if (newDatasets.length > 1) {
                        chartInstance.options.legend = {
                            display: true,
                            position: 'bottom',
                            labels: {
                                fontSize: this.readability.fontSize.legend,
                                fontColor: this.readability.fontColor.primary,
                                padding: 20,
                                usePointStyle: true,
                                pointStyleWidth: 18
                            }
                        };
                    } else {
                        chartInstance.options.legend.display = false;
                    }
                    
                    // Update the chart
                    chartInstance.update();
                }
            }
        },
        
        // Get original data for a chart (placeholder - would need implementation)
        getOriginalDataForChart: function(chartId) {
            // This would need to be connected to your data management system
            // For now, return null - this would be implemented based on your data architecture
            return null;
        },
        
        // Default chart options optimized for v8webkit - ES5 compatible
        defaultOptions: {
            responsive: false,
            maintainAspectRatio: false,
            animation: { 
                duration: 200,  // Using readability.animation.duration
                easing: 'easeOutQuart'
            },
            legend: { display: false },
            
            // Disable ALL plugins and zoom/pan functionality
            plugins: {
                zoom: false,
                pan: false,
                legend: { display: false },
                datalabels: false
            },
            
            tooltips: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                titleFontSize: 16,  // readability.fontSize.tooltip.title
                bodyFontSize: 15,   // readability.fontSize.tooltip.body
                cornerRadius: 8,
                displayColors: true,
                xPadding: 12,       // readability.spacing.tooltipPadding.x
                yPadding: 10,       // readability.spacing.tooltipPadding.y
                callbacks: {
                    title: function(tooltipItem, data) {
                        return tooltipItem[0].label || '';
                    },
                    label: function(tooltipItem, data) {
                        var value = tooltipItem.yLabel || tooltipItem.value;
                        return data.datasets[tooltipItem.datasetIndex].label + ': ' + 
                               (window.formatMoney ? window.formatMoney(value, 'RUB', 0) : value);
                    }
                }
            },
            
            elements: {
                point: { radius: 2, hitRadius: 6 },
                line: { tension: 0.25, borderWidth: 2 }
            },
            
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                        drawOnChartArea: false
                    },
                    ticks: {
                        fontSize: 16,        // readability.fontSize.axis
                        fontColor: '#374151' // readability.fontColor.primary
                    }
                }],
                yAxes: [{
                    gridLines: {
                        color: 'rgba(17,24,39,0.08)',
                        zeroLineColor: 'rgba(17,24,39,0.2)',
                        drawBorder: false
                    },
                    ticks: {
                        fontSize: 16,        // readability.fontSize.axis
                        fontColor: '#374151', // readability.fontColor.primary
                        maxTicksLimit: 6,
                        callback: function(value) {
                            return window.formatMoney ? window.formatMoney(value, 'RUB', 0) : value;
                        }
                    }
                }]
            },
            
            // Disable interactions that could trigger zoom
            onHover: null,
            onClick: null
        },
        
        // Create horizontal bar chart - unified implementation
        createHorizontalBarChart: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            // Validate input data
            if (!data || typeof data !== 'object') {
                console.warn('Invalid data provided to createHorizontalBarChart for', canvasId);
                return null;
            }
            
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
                options: this.mergeOptions(this.defaultOptions, {
                    scales: {
                        xAxes: [{
                            gridLines: {
                                color: 'rgba(17,24,39,0.08)'
                            },
                            ticks: {
                                fontSize: 16,
                                fontColor: '#374151',
                                callback: function(value) {
                                    return window.formatMoney ? window.formatMoney(value, 'RUB', 0) : value;
                                }
                            }
                        }],
                        yAxes: [{
                            gridLines: {
                                display: false
                            },
                            ticks: {
                                fontSize: 16,
                                fontColor: '#374151'
                            }
                        }]
                    }
                }, data.options || {})
            };
            
            // Apply unified readability settings
            this.applyUnifiedReadability(config);
            
            return new Chart(canvas, config);
        },
        
        // Create line chart for time series
        createLineChart: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            // Validate input data
            if (!data || typeof data !== 'object') {
                console.warn('Invalid data provided to createLineChart for', canvasId);
                return null;
            }
            
            this.ensureCanvasSize(canvas);
            
            // Get current comparison mode from state
            var compareMode = 'none';
            if (window.DashboardState) {
                compareMode = window.DashboardState.getFilter('compareMode') || 'none';
            }
            
            // Create datasets using the unified comparison system
            var datasets = this.createDatasetsWithComparison(data, compareMode);
            
            // Ensure we have valid labels and datasets
            var labels = data.dates || data.labels || [];
            if (!Array.isArray(labels)) {
                labels = [];
            }
            
            // If no datasets were created, create an empty one to prevent errors
            if (datasets.length === 0) {
                datasets.push({
                    label: 'Нет данных',
                    data: [],
                    borderColor: this.colors.neutral,
                    backgroundColor: this.colors.neutral + '20',
                    borderWidth: 1,
                    fill: false
                });
            }
            
            var config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: this.mergeOptions(this.defaultOptions, data.options || {})
            };
            
            // Apply unified readability settings
            this.applyUnifiedReadability(config);
            
            // Enable legend if there are multiple datasets (comparison active)
            if (datasets.length > 1) {
                this.enableLegend(config, 'bottom');
            }
            
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
                options: this.mergeOptions(this.defaultOptions, data.options || {})
            };
            
            // Apply unified readability settings
            this.applyUnifiedReadability(config);
            
            return new Chart(canvas, config);
        },
        
        // Create sparkline chart (minimal line chart)
        createSparkline: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            this.ensureCanvasSize(canvas);
            
            // Handle both old format (array) and new format (object)
            var values = Array.isArray(data) ? data : (data && (data.fact || data.values || data.data)) || [];
            var labels = (data && (data.dates || data.labels)) || new Array(values.length).fill('');
            
            // Ensure values is an array and filter out invalid values
            if (!Array.isArray(values)) {
                values = [];
            }
            values = values.filter(function(v) { return v !== null && v !== undefined && !isNaN(v); });
            
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
                options: this.mergeOptions(this.defaultOptions, {
                    legend: { display: false },
                    tooltips: { 
                        enabled: true,
                        callbacks: {
                            label: function(tooltipItem, data) {
                                return window.formatMoney ? window.formatMoney(tooltipItem.yLabel, 'RUB', 0) : tooltipItem.yLabel;
                            }
                        }
                    }
                })
            };
            
            // Apply unified readability settings
            this.applyUnifiedReadability(config);
            
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
            
            var yScale = chartInstance.options.scales.yAxes && chartInstance.options.scales.yAxes[0];
            if (yScale && yScale.ticks) {
                if (mode === 'percentage') {
                    yScale.ticks.callback = function(value) {
                        return window.formatPercent ? window.formatPercent(value) : value + '%';
                    };
                } else {
                    yScale.ticks.callback = function(value) {
                        return window.formatMoney ? window.formatMoney(value, 'RUB', 0) : value;
                    };
                }
                
                chartInstance.update();
            }
        },
        
        // ES5-compatible merge function
        mergeOptions: function(target, source) {
            var result = {};
            var key;
            
            // Copy target properties
            for (key in target) {
                if (target.hasOwnProperty(key)) {
                    if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                        result[key] = this.mergeOptions(target[key], {});
                    } else {
                        result[key] = target[key];
                    }
                }
            }
            
            // Copy source properties, overriding target
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) &&
                        typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
                        result[key] = this.mergeOptions(result[key], source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
            
            return result;
        },
        
        // Force disable zoom/pan plugins globally
        disableZoomPan: function() {
            // Disable Chart.js zoom plugin if it exists
            if (window.Chart && window.Chart.plugins) {
                var plugins = window.Chart.plugins.getAll();
                for (var i = 0; i < plugins.length; i++) {
                    var plugin = plugins[i];
                    if (plugin.id === 'zoom' || plugin.id === 'pan') {
                        window.Chart.plugins.unregister(plugin);
                    }
                }
            }
            
            // Remove any zoom/pan related globals
            if (window.chartjs) {
                delete window.chartjs.zoom;
                delete window.chartjs.pan;
            }
        },
        
        // Manual zoom functionality without plugins
        zoomChart: function(chartInstance, chartId, direction) {
            if (!chartInstance || !chartInstance.data) return;
            
            var zoom = window.DashboardState ? window.DashboardState.getZoom(chartId) : null;
            var dataLength = chartInstance.data.labels.length;
            
            if (!zoom) {
                // Initialize zoom window
                zoom = { start: 0, end: dataLength - 1 };
            }
            
            var windowSize = zoom.end - zoom.start + 1;
            var step = Math.max(1, Math.floor(windowSize * 0.2)); // 20% step
            
            if (direction === 'in') {
                // Zoom in - reduce window size
                if (windowSize > 3) {
                    zoom.start = Math.min(zoom.start + step, zoom.end - 2);
                    zoom.end = Math.max(zoom.end - step, zoom.start + 2);
                }
            } else if (direction === 'out') {
                // Zoom out - increase window size
                zoom.start = Math.max(0, zoom.start - step);
                zoom.end = Math.min(dataLength - 1, zoom.end + step);
            } else if (direction === 'reset') {
                // Reset zoom
                zoom = { start: 0, end: dataLength - 1 };
            }
            
            // Apply zoom to chart
            this.applyZoomToChart(chartInstance, zoom);
            
            // Save zoom state
            if (window.DashboardState) {
                window.DashboardState.setZoom(chartId, zoom.start, zoom.end);
            }
        },
        
        // Apply zoom window to chart data
        applyZoomToChart: function(chartInstance, zoom) {
            if (!chartInstance || !chartInstance.data) return;
            
            var originalData = chartInstance.originalData || {
                labels: chartInstance.data.labels.slice(),
                datasets: chartInstance.data.datasets.map(function(dataset) {
                    return { data: dataset.data.slice(), label: dataset.label };
                })
            };
            
            // Store original data if not already stored
            if (!chartInstance.originalData) {
                chartInstance.originalData = originalData;
            }
            
            // Apply zoom window
            var start = Math.max(0, zoom.start);
            var end = Math.min(originalData.labels.length - 1, zoom.end);
            
            chartInstance.data.labels = originalData.labels.slice(start, end + 1);
            chartInstance.data.datasets.forEach(function(dataset, i) {
                if (originalData.datasets[i]) {
                    dataset.data = originalData.datasets[i].data.slice(start, end + 1);
                }
            });
            
            chartInstance.update('none'); // No animation for performance
        },
        
        // Reset chart zoom to original data
        resetChartZoom: function(chartInstance, chartId) {
            if (!chartInstance || !chartInstance.originalData) return;
            
            chartInstance.data.labels = chartInstance.originalData.labels.slice();
            chartInstance.data.datasets.forEach(function(dataset, i) {
                if (chartInstance.originalData.datasets[i]) {
                    dataset.data = chartInstance.originalData.datasets[i].data.slice();
                }
            });
            
            chartInstance.update('none');
            
            // Clear zoom state
            if (window.DashboardState) {
                window.DashboardState.clearZoom(chartId);
            }
        },
        
        // Get zoom controls HTML
        getZoomControlsHTML: function(chartId) {
            return '<div class="zoom-controls" data-chart-id="' + chartId + '">' +
                   '<button class="zoom-btn zoom-out" title="Уменьшить масштаб">−</button>' +
                   '<button class="zoom-btn zoom-in" title="Увеличить масштаб">+</button>' +
                   '<button class="zoom-btn zoom-reset" title="Сбросить масштаб">⟲</button>' +
                   '</div>';
        },
        
        // Bind zoom controls to chart
        bindZoomControls: function(chartInstance, chartId) {
            var self = this;
            var container = document.querySelector('[data-chart-id="' + chartId + '"]');
            
            if (container) {
                container.addEventListener('click', function(event) {
                    if (event.target.classList.contains('zoom-btn')) {
                        var action = '';
                        if (event.target.classList.contains('zoom-in')) action = 'in';
                        else if (event.target.classList.contains('zoom-out')) action = 'out';
                        else if (event.target.classList.contains('zoom-reset')) action = 'reset';
                        
                        if (action) {
                            self.zoomChart(chartInstance, chartId, action);
                        }
                    }
                });
            }
        },
        
        // Apply comparison mode to chart
        applyComparisonMode: function(chartInstance, mode, originalData) {
            if (!chartInstance || !chartInstance.data) return;
            
            // Store original data if not stored
            if (!chartInstance.originalData && originalData) {
                chartInstance.originalData = originalData;
            }
            
            var baseData = chartInstance.originalData || originalData;
            if (!baseData) return;
            
            // Clear existing datasets
            chartInstance.data.datasets = [];
            
            // Always show fact data
            if (baseData.fact) {
                chartInstance.data.datasets.push({
                    label: 'Факт',
                    data: baseData.fact,
                    borderColor: this.colors.fact,
                    backgroundColor: this.colors.fact + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Add comparison data based on mode
            if (mode === 'prevYear' && baseData.prevYear) {
                chartInstance.data.datasets.push({
                    label: 'Прошлый год',
                    data: baseData.prevYear,
                    borderColor: this.colors.prevYear,
                    backgroundColor: this.colors.prevYear + '20',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    fill: false,
                    tension: 0.1
                });
            } else if (mode === 'plan' && baseData.plan) {
                chartInstance.data.datasets.push({
                    label: 'План',
                    data: baseData.plan,
                    borderColor: this.colors.plan,
                    backgroundColor: this.colors.plan + '20',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Add forecast if available
            if (baseData.forecast) {
                chartInstance.data.datasets.push({
                    label: 'Прогноз',
                    data: baseData.forecast,
                    borderColor: this.colors.forecast,
                    backgroundColor: this.colors.forecast + '20',
                    borderWidth: 2,
                    borderDash: [2, 2],
                    fill: false,
                    tension: 0.1
                });
            }
            
            chartInstance.update('none');
        },
        
        // Switch between absolute and percentage mode
        applyDisplayMode: function(chartInstance, mode) {
            if (!chartInstance || !chartInstance.options.scales) return;
            
            var yScale = chartInstance.options.scales.yAxes && chartInstance.options.scales.yAxes[0];
            if (yScale && yScale.ticks) {
                if (mode === 'percentage') {
                    yScale.ticks.callback = function(value) {
                        return window.formatPercent ? window.formatPercent(value) : value + '%';
                    };
                    
                    // Convert data to percentages if original data exists
                    if (chartInstance.originalData && chartInstance.originalData.fact) {
                        var baseValues = chartInstance.originalData.fact;
                        chartInstance.data.datasets.forEach(function(dataset) {
                            if (dataset.label === 'Факт') return; // Keep fact as 100%
                            
                            dataset.data = dataset.data.map(function(value, i) {
                                var base = baseValues[i];
                                return base ? ((value / base) * 100) : 0;
                            });
                        });
                    }
                } else {
                    // Absolute mode
                    yScale.ticks.callback = function(value) {
                        return window.formatMoney ? window.formatMoney(value, 'RUB', 0) : value;
                    };
                    
                    // Restore original data
                    if (chartInstance.originalData) {
                        chartInstance.data.datasets.forEach(function(dataset, i) {
                            if (chartInstance.originalData.datasets && chartInstance.originalData.datasets[i]) {
                                dataset.data = chartInstance.originalData.datasets[i].data.slice();
                            }
                        });
                    }
                }
                
                chartInstance.update('none');
            }
        },
        
        // Get comparison controls HTML
        getComparisonControlsHTML: function(chartId) {
            return '<div class="comparison-controls" data-chart-id="' + chartId + '">' +
                   '<button class="comp-btn comp-none active" data-mode="none" title="Только факт">Факт</button>' +
                   '<button class="comp-btn comp-prev" data-mode="prevYear" title="Сравнение с прошлым годом">vs Прошлый год</button>' +
                   '<button class="comp-btn comp-plan" data-mode="plan" title="Сравнение с планом">vs План</button>' +
                   '</div>';
        },
        
        // Bind comparison controls
        bindComparisonControls: function(chartInstance, chartId) {
            var self = this;
            var container = document.querySelector('[data-chart-id="' + chartId + '"] .comparison-controls');
            
            if (container) {
                container.addEventListener('click', function(event) {
                    if (event.target.classList.contains('comp-btn')) {
                        var mode = event.target.getAttribute('data-mode');
                        
                        // Update active state
                        var buttons = container.querySelectorAll('.comp-btn');
                        buttons.forEach(function(btn) {
                            btn.classList.remove('active');
                        });
                        event.target.classList.add('active');
                        
                        // Apply comparison mode
                        self.applyComparisonMode(chartInstance, mode);
                        
                        // Update state
                        if (window.DashboardState) {
                            window.DashboardState.setFilter('compare', mode);
                        }
                    }
                });
            }
        },
        
        // Initialize comparison mode event listeners
        initializeComparisonListeners: function() {
            var self = this;
            
            // Listen for comparison mode changes from DashboardState
            window.addEventListener('filtersChanged', function(event) {
                if (event.detail && event.detail.key === 'compareMode') {
                    self.updateChartsForComparison(event.detail.value);
                }
            });
        }
    };
    
    // Global helper function that was missing
    window.ensureHiDPI = ChartFactory.ensureCanvasSize;
    
    // Disable zoom/pan plugins on initialization
    ChartFactory.disableZoomPan();
    
    // Initialize comparison mode listeners
    ChartFactory.initializeComparisonListeners();
    
    // Export to window for global access
    window.ChartFactory = ChartFactory;
    
    // Only ChartFactory export - no global legacy functions to avoid conflicts
    
})();