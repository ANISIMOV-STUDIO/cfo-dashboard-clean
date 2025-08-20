/**
 * Chart Interactivity Module
 * Adds drill-down, zoom, cross-filtering capabilities to charts
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var ChartInteractivity = {
        activeFilters: {},
        drillStack: [],
        zoomStates: {},
        
        // Initialize interactivity for all charts
        initialize: function() {
            this.bindGlobalEvents();
            this.setupChartClickHandlers();
            this.initializeZoomControls();
            this.bindAllZoomControls(); // Bind HTML-based zoom controls
        },
        
        // Bind global keyboard shortcuts and events
        bindGlobalEvents: function() {
            var self = this;
            
            // Escape key to reset drill-down
            document.addEventListener('keydown', function(event) {
                if (event.keyCode === 27) { // ESC
                    self.resetDrillDown();
                }
            });
            
            // Double-click to reset zoom
            document.addEventListener('dblclick', function(event) {
                if (event.target.tagName === 'CANVAS') {
                    var chartId = event.target.id;
                    self.resetZoom(chartId);
                }
            });
        },
        
        // Setup click handlers for all charts
        setupChartClickHandlers: function() {
            var self = this;
            
            // Wait for charts to be rendered
            setTimeout(function() {
                self.addClickHandler('revenue-trend-chart', 'timeseries');
                self.addClickHandler('margins-trend-chart', 'timeseries');
                self.addClickHandler('branches-sales-chart', 'categorical');
                self.addClickHandler('variance-chart', 'variance');
                self.addClickHandler('aging-analysis-chart', 'aging');
            }, 1000);
        },
        
        // Add click handler to specific chart
        addClickHandler: function(chartId, chartType) {
            var canvas = document.getElementById(chartId);
            if (!canvas) return;
            
            var chart = canvas.chart;
            if (!chart) return;
            
            var self = this;
            canvas.addEventListener('click', function(event) {
                var activePoints = chart.getElementsAtEvent(event);
                if (activePoints && activePoints.length > 0) {
                    self.handleChartClick(chartId, chartType, activePoints[0], chart);
                }
            });
            
            // Add hover effects
            canvas.addEventListener('mousemove', function(event) {
                var activePoints = chart.getElementsAtEvent(event);
                canvas.style.cursor = activePoints.length > 0 ? 'pointer' : 'default';
            });
        },
        
        // Handle chart click events
        handleChartClick: function(chartId, chartType, point, chart) {
            var clickData = this.extractClickData(point, chart);
            
            switch (chartType) {
                case 'timeseries':
                    this.handleTimeseriesClick(chartId, clickData, chart);
                    break;
                case 'categorical':
                    this.handleCategoricalClick(chartId, clickData, chart);
                    break;
                case 'variance':
                    this.handleVarianceClick(chartId, clickData, chart);
                    break;
                case 'aging':
                    this.handleAgingClick(chartId, clickData, chart);
                    break;
            }
        },
        
        // Extract relevant data from click point
        extractClickData: function(point, chart) {
            var dataset = chart.data.datasets[point._datasetIndex];
            var label = chart.data.labels[point._index];
            var value = dataset.data[point._index];
            
            return {
                label: label,
                value: value,
                datasetLabel: dataset.label,
                index: point._index,
                datasetIndex: point._datasetIndex
            };
        },
        
        // Handle timeseries chart clicks (drill-down to month/week/day)
        handleTimeseriesClick: function(chartId, clickData, chart) {
            if (this.drillStack.length >= 2) {
                this.showMessage('Максимальный уровень детализации');
                return;
            }
            
            // Store current state
            this.drillStack.push({
                chartId: chartId,
                level: this.getCurrentDrillLevel(),
                clickData: clickData
            });
            
            // Show drill-down indicator
            this.showDrillDownIndicator(chartId, clickData);
            
            // Apply cross-filtering
            this.applyCrossFilter('period', clickData.label);
            
            // Simulate drill-down data loading
            this.loadDrillDownData(chartId, clickData);
        },
        
        // Handle categorical chart clicks (filter by category)
        handleCategoricalClick: function(chartId, clickData, chart) {
            // Toggle filter for this category
            var filterKey = 'category_' + clickData.label;
            
            if (this.activeFilters[filterKey]) {
                delete this.activeFilters[filterKey];
                this.removeCategoryHighlight(chart, clickData.index);
            } else {
                this.activeFilters[filterKey] = clickData;
                this.highlightCategory(chart, clickData.index);
            }
            
            // Apply cross-filtering
            this.applyCrossFilter('category', clickData.label);
            
            // Update filter indicators
            this.updateFilterIndicators();
        },
        
        // Handle variance chart clicks (drill into cost components)
        handleVarianceClick: function(chartId, clickData, chart) {
            // Show variance breakdown
            this.showVarianceBreakdown(clickData);
            
            // Apply cross-filtering by metric
            this.applyCrossFilter('metric', clickData.datasetLabel);
        },
        
        // Handle aging analysis clicks (show customer details)
        handleAgingClick: function(chartId, clickData, chart) {
            // Show aging bucket details
            this.showAgingDetails(clickData);
        },
        
        // Show drill-down indicator
        showDrillDownIndicator: function(chartId, clickData) {
            var canvas = document.getElementById(chartId);
            var card = canvas.closest('.card');
            if (!card) return;
            
            // Remove existing indicator
            var existing = card.querySelector('.drill-indicator');
            if (existing) existing.remove();
            
            // Create drill indicator
            var indicator = document.createElement('div');
            indicator.className = 'drill-indicator';
            indicator.innerHTML = '📍 ' + clickData.label + ' <button class="drill-back">← Назад</button>';
            indicator.style.cssText = 'position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 10;';
            
            card.style.position = 'relative';
            card.appendChild(indicator);
            
            // Bind back button
            var backBtn = indicator.querySelector('.drill-back');
            if (backBtn) {
                backBtn.addEventListener('click', this.drillBack.bind(this));
            }
        },
        
        // Highlight selected category
        highlightCategory: function(chart, index) {
            // Modify chart options to highlight selected segment
            if (chart.data.datasets[0].backgroundColor) {
                var colors = chart.data.datasets[0].backgroundColor.slice();
                colors[index] = '#007AFF'; // Highlight color
                
                chart.data.datasets[0].backgroundColor = colors;
                chart.update();
            }
        },
        
        // Remove category highlight
        removeCategoryHighlight: function(chart, index) {
            // Reset to original colors
            this.resetChartColors(chart);
        },
        
        // Apply cross-filtering across all charts
        applyCrossFilter: function(filterType, filterValue) {
            console.log('Applying cross-filter:', filterType, filterValue);
            
            // Update filter state
            this.activeFilters[filterType] = filterValue;
            
            // Apply filter to all other charts
            this.updateAllCharts();
            
            // Show filter notification
            this.showMessage('Фильтр применен: ' + filterValue);
        },
        
        // Update all charts based on active filters
        updateAllCharts: function() {
            var self = this;
            var chartIds = [
                'revenue-trend-chart',
                'margins-trend-chart', 
                'branches-sales-chart',
                'variance-chart',
                'aging-analysis-chart'
            ];
            
            chartIds.forEach(function(chartId) {
                self.updateChartWithFilters(chartId);
            });
            
            // Update KPI cards
            if (window.KPICards) {
                window.KPICards.updateCards(this.getFilteredData());
            }
        },
        
        // Update specific chart with active filters
        updateChartWithFilters: function(chartId) {
            var canvas = document.getElementById(chartId);
            if (!canvas) return;
            
            var chart = canvas.chart;
            if (!chart) return;
            
            // Dim non-matching data points
            this.applyFilterVisualization(chart);
        },
        
        // Apply visual filtering to chart
        applyFilterVisualization: function(chart) {
            // Add transparency to filtered out data
            if (Object.keys(this.activeFilters).length > 0) {
                chart.data.datasets.forEach(function(dataset) {
                    if (dataset.backgroundColor) {
                        dataset.backgroundColor = dataset.backgroundColor.map(function(color) {
                            return typeof color === 'string' ? 
                                color.replace('rgb(', 'rgba(').replace(')', ', 0.3)') : color;
                        });
                    }
                });
                chart.update();
            }
        },
        
        // Get filtered data based on active filters
        getFilteredData: function() {
            if (!window.DataManager) return null;
            
            var data = window.DataManager.getData();
            // Apply filters to data (simplified)
            return data;
        },
        
        // Initialize zoom controls
        initializeZoomControls: function() {
            var self = this;
            
            // Add zoom controls to each chart
            setTimeout(function() {
                var chartIds = ['revenue-trend-chart', 'margins-trend-chart'];
                chartIds.forEach(function(chartId) {
                    self.addZoomControls(chartId);
                });
            }, 1000);
        },
        
        // Add zoom controls to chart
        addZoomControls: function(chartId) {
            var canvas = document.getElementById(chartId);
            var card = canvas.closest('.card');
            if (!card) return;
            
            var controls = document.createElement('div');
            controls.className = 'zoom-controls';
            controls.innerHTML = `
                <button class="zoom-in" data-chart="${chartId}">🔍+</button>
                <button class="zoom-out" data-chart="${chartId}">🔍-</button>
                <button class="zoom-reset" data-chart="${chartId}">↺</button>
            `;
            controls.style.cssText = 'position: absolute; bottom: 8px; right: 8px; display: flex; gap: 2px; z-index: 10;';
            
            card.style.position = 'relative';
            card.appendChild(controls);
            
            // Bind zoom events
            this.bindZoomControls(controls);
        },
        
        // Bind zoom control events
        bindZoomControls: function(controls) {
            var self = this;
            
            controls.addEventListener('click', function(event) {
                var target = event.target;
                var chartId = target.getAttribute('data-chart');
                if (!chartId) return;
                
                if (target.classList.contains('zoom-in')) {
                    self.zoomIn(chartId);
                } else if (target.classList.contains('zoom-out')) {
                    self.zoomOut(chartId);
                } else if (target.classList.contains('zoom-reset')) {
                    self.resetZoom(chartId);
                }
            });
        },
        
        // Bind zoom controls for HTML-based zoom buttons
        bindAllZoomControls: function() {
            var self = this;
            
            // Use event delegation to handle all zoom controls
            document.addEventListener('click', function(event) {
                var target = event.target;
                
                // Check if clicked element is a zoom button
                if (target.classList.contains('zoom-btn')) {
                    event.preventDefault();
                    
                    // Get chart ID from the parent zoom-controls container
                    var zoomControls = target.closest('.zoom-controls');
                    if (!zoomControls) return;
                    
                    var chartId = zoomControls.getAttribute('data-chart-id');
                    if (!chartId) return;
                    
                    // Handle different zoom actions
                    if (target.classList.contains('zoom-in')) {
                        self.zoomIn(chartId);
                    } else if (target.classList.contains('zoom-out')) {
                        self.zoomOut(chartId);
                    } else if (target.classList.contains('zoom-reset')) {
                        self.resetZoom(chartId);
                    }
                }
            });
        },
        
        // Get chart instance from canvas - Chart.js 2.9.4 compatibility
        getChartInstance: function(canvas) {
            // Try different ways to get chart instance
            if (canvas.chart) return canvas.chart;
            
            // Search in Chart.instances (Chart.js 2.9.4)
            if (typeof Chart !== 'undefined' && Chart.instances) {
                for (var i = 0; i < Chart.instances.length; i++) {
                    if (Chart.instances[i].canvas === canvas) {
                        return Chart.instances[i];
                    }
                }
            }
            
            return null;
        },
        
        // Zoom in on chart
        zoomIn: function(chartId) {
            var canvas = document.getElementById(chartId);
            if (!canvas) return;
            
            // Find chart instance - Chart.js 2.9.4 compatibility
            var chart = canvas.chart || this.getChartInstance(canvas);
            if (!chart) return;
            
            // Store zoom state
            if (!this.zoomStates[chartId]) {
                this.zoomStates[chartId] = { level: 1 };
            }
            
            this.zoomStates[chartId].level += 0.2;
            this.applyZoom(chart, this.zoomStates[chartId].level);
        },
        
        // Zoom out on chart
        zoomOut: function(chartId) {
            var canvas = document.getElementById(chartId);
            if (!canvas) return;
            
            var chart = canvas.chart || this.getChartInstance(canvas);
            if (!chart) return;
            
            if (!this.zoomStates[chartId]) return;
            
            this.zoomStates[chartId].level = Math.max(1, this.zoomStates[chartId].level - 0.2);
            this.applyZoom(chart, this.zoomStates[chartId].level);
        },
        
        // Reset zoom on chart
        resetZoom: function(chartId) {
            var canvas = document.getElementById(chartId);
            if (!canvas) return;
            
            var chart = canvas.chart || this.getChartInstance(canvas);
            if (!chart) return;
            
            delete this.zoomStates[chartId];
            this.applyZoom(chart, 1);
        },
        
        // Apply zoom level to chart
        applyZoom: function(chart, zoomLevel) {
            // Modify chart scales for zoom effect
            if (chart.options.scales && chart.options.scales.yAxes) {
                var yAxis = chart.options.scales.yAxes[0];
                if (yAxis.ticks) {
                    yAxis.ticks.max = yAxis.ticks.max / zoomLevel;
                    yAxis.ticks.min = yAxis.ticks.min / zoomLevel;
                }
            }
            
            chart.update();
        },
        
        // Load drill-down data (simulated)
        loadDrillDownData: function(chartId, clickData) {
            var self = this;
            
            setTimeout(function() {
                // Simulate data loading
                self.showMessage('Загружены детальные данные для ' + clickData.label);
                
                // Update chart with more granular data
                self.updateChartForDrillDown(chartId, clickData);
            }, 300);
        },
        
        // Update chart for drill-down view
        updateChartForDrillDown: function(chartId, clickData) {
            var canvas = document.getElementById(chartId);
            var chart = canvas.chart;
            if (!chart) return;
            
            // Generate more granular labels (e.g., weeks instead of months)
            var granularLabels = this.generateGranularLabels(clickData.label);
            var granularData = this.generateGranularData(clickData.value, granularLabels.length);
            
            chart.data.labels = granularLabels;
            chart.data.datasets[0].data = granularData;
            chart.update();
        },
        
        // Generate granular labels for drill-down
        generateGranularLabels: function(parentLabel) {
            // Simulate weekly breakdown for monthly data
            var weeks = [];
            for (var i = 1; i <= 4; i++) {
                weeks.push(parentLabel + ' нед.' + i);
            }
            return weeks;
        },
        
        // Generate granular data for drill-down
        generateGranularData: function(totalValue, count) {
            var baseValue = totalValue / count;
            var data = [];
            
            for (var i = 0; i < count; i++) {
                // Add some variance
                var variance = (Math.random() - 0.5) * 0.3;
                data.push(baseValue * (1 + variance));
            }
            
            return data;
        },
        
        // Drill back to previous level
        drillBack: function() {
            if (this.drillStack.length === 0) return;
            
            var previousState = this.drillStack.pop();
            
            // Remove drill indicator
            var indicator = document.querySelector('.drill-indicator');
            if (indicator) indicator.remove();
            
            // Restore chart data
            this.restoreChartData(previousState.chartId);
            
            this.showMessage('Возврат к предыдущему уровню');
        },
        
        // Reset all drill-down states
        resetDrillDown: function() {
            this.drillStack = [];
            
            // Remove all drill indicators
            var indicators = document.querySelectorAll('.drill-indicator');
            indicators.forEach(function(indicator) {
                indicator.remove();
            });
            
            // Restore all charts
            this.restoreAllCharts();
        },
        
        // Restore chart to original data
        restoreChartData: function(chartId) {
            // Re-render chart with original data
            if (window.PageRenderers && window.PageRenderers.currentData) {
                var currentPage = window.DashboardState ? 
                    window.DashboardState.getCurrentPage() : 'overview';
                window.PageRenderers.renderPageCharts(currentPage, window.PageRenderers.currentData);
            }
        },
        
        // Restore all charts to original state
        restoreAllCharts: function() {
            // Clear filters
            this.activeFilters = {};
            this.zoomStates = {};
            
            // Remove visual effects
            var indicators = document.querySelectorAll('.drill-indicator, .zoom-controls');
            indicators.forEach(function(indicator) {
                indicator.remove();
            });
            
            // Re-render all charts
            if (window.PageRenderers && window.PageRenderers.currentData) {
                var currentPage = window.DashboardState ? 
                    window.DashboardState.getCurrentPage() : 'overview';
                window.PageRenderers.renderPageCharts(currentPage, window.PageRenderers.currentData);
            }
            
            this.showMessage('Сброшены все фильтры и масштабирование');
        },
        
        // Reset chart colors to original
        resetChartColors: function(chart) {
            // Restore original colors (simplified)
            chart.data.datasets.forEach(function(dataset) {
                if (dataset.backgroundColor && Array.isArray(dataset.backgroundColor)) {
                    // Reset to default colors
                    dataset.backgroundColor = dataset.backgroundColor.map(function(color, index) {
                        return ChartInteractivity.getDefaultColor(index);
                    });
                }
            });
            chart.update();
        },
        
        // Get default color for chart element
        getDefaultColor: function(index) {
            var colors = [
                '#007AFF', '#FF9500', '#FF3B30', '#30D158', 
                '#5856D6', '#FF2D92', '#64D2FF', '#BF5AF2'
            ];
            return colors[index % colors.length];
        },
        
        // Get current drill level
        getCurrentDrillLevel: function() {
            return this.drillStack.length;
        },
        
        // Update filter indicators in UI
        updateFilterIndicators: function() {
            var filterCount = Object.keys(this.activeFilters).length;
            
            // Update filter indicator (if exists)
            var indicator = document.getElementById('filter-indicator');
            if (indicator) {
                indicator.textContent = filterCount > 0 ? 
                    'Активных фильтров: ' + filterCount : '';
            }
        },
        
        // Show variance breakdown popup
        showVarianceBreakdown: function(clickData) {
            var popup = this.createPopup('Анализ отклонений: ' + clickData.datasetLabel);
            popup.innerHTML += `
                <div style="padding: 12px;">
                    <div><strong>Значение:</strong> ${this.formatValue(clickData.value)}</div>
                    <div style="margin-top: 8px;"><strong>Компоненты:</strong></div>
                    <div style="margin-left: 16px; color: #666;">
                        • Объемный эффект: ${this.formatValue(clickData.value * 0.6)}<br>
                        • Ценовой эффект: ${this.formatValue(clickData.value * 0.3)}<br>
                        • Прочие факторы: ${this.formatValue(clickData.value * 0.1)}
                    </div>
                </div>
            `;
        },
        
        // Show aging details popup
        showAgingDetails: function(clickData) {
            var popup = this.createPopup('Детализация просрочки: ' + clickData.label);
            popup.innerHTML += `
                <div style="padding: 12px;">
                    <div><strong>Сумма:</strong> ${this.formatValue(clickData.value)}</div>
                    <div style="margin-top: 8px;"><strong>Крупные дебиторы:</strong></div>
                    <div style="margin-left: 16px; color: #666;">
                        • ООО "Партнер": ${this.formatValue(clickData.value * 0.4)}<br>
                        • АО "Клиент": ${this.formatValue(clickData.value * 0.3)}<br>
                        • ИП Иванов: ${this.formatValue(clickData.value * 0.2)}<br>
                        • Прочие: ${this.formatValue(clickData.value * 0.1)}
                    </div>
                </div>
            `;
        },
        
        // Create popup window
        createPopup: function(title) {
            // Remove existing popup
            var existing = document.getElementById('chart-popup');
            if (existing) existing.remove();
            
            var popup = document.createElement('div');
            popup.id = 'chart-popup';
            popup.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: white; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                z-index: 1000; min-width: 300px; max-width: 500px;
            `;
            
            popup.innerHTML = `
                <div style="padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 600;">${title}</div>
                    <button onclick="this.closest('#chart-popup').remove()" style="border: none; background: none; font-size: 18px; cursor: pointer;">×</button>
                </div>
            `;
            
            document.body.appendChild(popup);
            
            // Close on escape
            document.addEventListener('keydown', function(e) {
                if (e.keyCode === 27) popup.remove();
            });
            
            return popup;
        },
        
        // Format value for display
        formatValue: function(value) {
            if (typeof value === 'number') {
                return (value / 1000000).toFixed(1) + ' млн ₽';
            }
            return value;
        },
        
        // Show temporary message
        showMessage: function(text) {
            var existing = document.getElementById('interaction-message');
            if (existing) existing.remove();
            
            var message = document.createElement('div');
            message.id = 'interaction-message';
            message.textContent = text;
            message.style.cssText = `
                position: fixed; top: 80px; right: 24px; background: rgba(0,0,0,0.8);
                color: white; padding: 8px 16px; border-radius: 8px; z-index: 1000;
                font-size: 14px; animation: fadeInOut 2s ease;
            `;
            
            document.body.appendChild(message);
            
            setTimeout(function() {
                if (message.parentNode) {
                    message.remove();
                }
            }, 2000);
        }
    };
    
    // Add CSS animations
    var style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(20px); }
            20%, 80% { opacity: 1; transform: translateX(0); }
            100% { opacity: 0; transform: translateX(20px); }
        }
        .zoom-controls button {
            border: none; background: rgba(255,255,255,0.9); 
            padding: 4px 6px; border-radius: 4px; font-size: 12px;
            cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .zoom-controls button:hover {
            background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
    `;
    document.head.appendChild(style);
    
    // Export to window
    window.ChartInteractivity = ChartInteractivity;
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            ChartInteractivity.initialize();
        }, 2000);
    });
    
})();