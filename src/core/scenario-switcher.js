/**
 * Scenario Switcher Module
 * Handles switching between different chart display scenarios
 * Compatible with Chart.js 2.x and ES5
 */
(function() {
    'use strict';
    
    var ScenarioSwitcher = {
        // Current active scenarios per chart
        activeScenarios: {},
        
        // Initialize scenario switcher
        initialize: function() {
            this.bindEvents();
            this.initializeDefaultScenarios();
        },
        
        // Bind event listeners to scenario buttons
        bindEvents: function() {
            var self = this;
            
            // Add click handlers to all scenario buttons
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('scenario-btn')) {
                    e.preventDefault();
                    self.handleScenarioClick(e.target);
                }
            });
        },
        
        // Initialize default scenarios for all charts
        initializeDefaultScenarios: function() {
            var scenarioControls = document.querySelectorAll('.scenario-controls');
            for (var i = 0; i < scenarioControls.length; i++) {
                var chartId = scenarioControls[i].getAttribute('data-chart-id');
                if (chartId) {
                    this.activeScenarios[chartId] = ['fact']; // Default to showing only fact
                }
            }
        },
        
        // Handle scenario button click
        handleScenarioClick: function(button) {
            var scenario = button.getAttribute('data-scenario');
            var scenarioControls = button.closest('.scenario-controls');
            var chartId = scenarioControls.getAttribute('data-chart-id');
            
            if (!chartId || !scenario) return;
            
            // Toggle scenario
            this.toggleScenario(chartId, scenario, button);
            
            // Update chart
            this.updateChart(chartId);
        },
        
        // Toggle scenario on/off
        toggleScenario: function(chartId, scenario, button) {
            if (!this.activeScenarios[chartId]) {
                this.activeScenarios[chartId] = [];
            }
            
            var isActive = button.classList.contains('active');
            
            if (isActive) {
                // Deactivate scenario
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
                
                // Remove from active scenarios
                var index = this.activeScenarios[chartId].indexOf(scenario);
                if (index > -1) {
                    this.activeScenarios[chartId].splice(index, 1);
                }
                
                // Ensure at least 'fact' is always active
                if (this.activeScenarios[chartId].length === 0) {
                    this.activeScenarios[chartId] = ['fact'];
                    this.setScenarioActive(chartId, 'fact', true);
                }
            } else {
                // Activate scenario
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                
                // Add to active scenarios if not already there
                if (this.activeScenarios[chartId].indexOf(scenario) === -1) {
                    this.activeScenarios[chartId].push(scenario);
                }
            }
        },
        
        // Set scenario button active/inactive
        setScenarioActive: function(chartId, scenario, active) {
            var scenarioControls = document.querySelector('[data-chart-id="' + chartId + '"]');
            if (!scenarioControls) return;
            
            var button = scenarioControls.querySelector('[data-scenario="' + scenario + '"]');
            if (!button) return;
            
            if (active) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            }
        },
        
        // Update chart based on active scenarios
        updateChart: function(chartId) {
            var canvas = document.getElementById(chartId);
            if (!canvas) return;
            
            var chart = canvas.chart;
            if (!chart || !chart.data) return;
            
            var activeScenarios = this.activeScenarios[chartId] || ['fact'];
            
            // Get original data from chart
            var originalData = chart.originalData || this.getOriginalChartData(chartId);
            if (!originalData) return;
            
            // Create new datasets based on active scenarios
            var newDatasets = this.createDatasetsFromScenarios(originalData, activeScenarios);
            
            // Update chart data
            chart.data.datasets = newDatasets;
            
            // Update chart with smooth transition
            chart.update('none'); // No animation for performance
        },
        
        // Get original chart data (fallback method)
        getOriginalChartData: function(chartId) {
            // Try to get data from global data manager or embedded data
            if (window.EMBEDDED_SAMPLE_DATA && window.EMBEDDED_SAMPLE_DATA.timeSeries) {
                var timeSeries = window.EMBEDDED_SAMPLE_DATA.timeSeries;
                
                if (chartId === 'revenue-trend-chart' && timeSeries.revenue) {
                    return {
                        labels: timeSeries.revenue.dates,
                        fact: timeSeries.revenue.fact,
                        plan: timeSeries.revenue.plan,
                        prevYear: timeSeries.revenue.prevYear,
                        forecast: timeSeries.revenue.forecast
                    };
                }
                
                if (chartId === 'margins-trend-chart' && timeSeries.margins) {
                    // For margins chart, it's a multi-dataset chart
                    return {
                        labels: timeSeries.margins.dates,
                        datasets: [
                            {
                                label: 'Валовая маржа',
                                data: timeSeries.margins.gross,
                                fact: timeSeries.margins.gross
                            },
                            {
                                label: 'EBITDA',
                                data: timeSeries.margins.ebitda,
                                fact: timeSeries.margins.ebitda
                            },
                            {
                                label: 'Чистая маржа',
                                data: timeSeries.margins.net,
                                fact: timeSeries.margins.net
                            }
                        ]
                    };
                }
            }
            
            return null;
        },
        
        // Create datasets from active scenarios
        createDatasetsFromScenarios: function(originalData, activeScenarios) {
            var datasets = [];
            var self = this;
            
            // Get color scheme from charts redesigned module
            var colors = window.ChartsRedesigned ? window.ChartsRedesigned.colors : {
                fact: '#1F2937',
                plan: '#0A84FF',
                forecast: '#9CA3AF',
                prevYear: '#9CA3AF'
            };
            
            // Handle multi-dataset charts (like margins)
            if (originalData.datasets) {
                // For multi-dataset charts, we only show/hide the entire chart
                return originalData.datasets.map(function(dataset, index) {
                    var colorKeys = ['fact', 'plan', 'forecast', 'prevYear'];
                    var colorKey = colorKeys[index % colorKeys.length];
                    
                    return {
                        label: dataset.label,
                        data: dataset.data,
                        borderColor: colors[colorKey],
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderCapStyle: 'round',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: colors[colorKey],
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointStyle: 'circle',
                        fill: false,
                        tension: 0.1
                    };
                });
            }
            
            // Handle single-dataset charts with scenarios
            activeScenarios.forEach(function(scenario) {
                switch (scenario) {
                    case 'fact':
                        if (originalData.fact) {
                            datasets.push({
                                label: 'Факт',
                                data: originalData.fact,
                                borderColor: colors.fact,
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                borderCapStyle: 'round',
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                pointBackgroundColor: colors.fact,
                                pointBorderColor: '#FFFFFF',
                                pointBorderWidth: 2,
                                pointStyle: 'circle',
                                fill: false,
                                tension: 0.1
                            });
                        }
                        break;
                        
                    case 'vs-plan':
                        if (originalData.fact) {
                            datasets.push({
                                label: 'Факт',
                                data: originalData.fact,
                                borderColor: colors.fact,
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                borderCapStyle: 'round',
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                pointBackgroundColor: colors.fact,
                                pointBorderColor: '#FFFFFF',
                                pointBorderWidth: 2,
                                pointStyle: 'circle',
                                fill: false,
                                tension: 0.1
                            });
                        }
                        if (originalData.plan) {
                            datasets.push({
                                label: 'План',
                                data: originalData.plan,
                                borderColor: colors.plan,
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                borderCapStyle: 'round',
                                borderDash: [5, 5],
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                pointBackgroundColor: colors.plan,
                                pointBorderColor: '#FFFFFF',
                                pointBorderWidth: 2,
                                pointStyle: 'circle',
                                fill: false,
                                tension: 0.1
                            });
                        }
                        break;
                        
                    case 'vs-pg':
                        if (originalData.fact) {
                            datasets.push({
                                label: 'Факт',
                                data: originalData.fact,
                                borderColor: colors.fact,
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                borderCapStyle: 'round',
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                pointBackgroundColor: colors.fact,
                                pointBorderColor: '#FFFFFF',
                                pointBorderWidth: 2,
                                pointStyle: 'circle',
                                fill: false,
                                tension: 0.1
                            });
                        }
                        if (originalData.prevYear) {
                            datasets.push({
                                label: 'Прошлый год',
                                data: originalData.prevYear,
                                borderColor: colors.prevYear,
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                borderCapStyle: 'round',
                                borderDash: [5, 3],
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                pointBackgroundColor: colors.prevYear,
                                pointBorderColor: '#FFFFFF',
                                pointBorderWidth: 2,
                                pointStyle: 'circle',
                                fill: false,
                                tension: 0.1
                            });
                        }
                        break;
                        
                    case 'forecast':
                        if (originalData.forecast) {
                            datasets.push({
                                label: 'Прогноз',
                                data: originalData.forecast,
                                borderColor: colors.forecast,
                                backgroundColor: 'transparent',
                                borderWidth: 2,
                                borderCapStyle: 'round',
                                borderDash: [3, 3],
                                pointRadius: 3,
                                pointHoverRadius: 5,
                                pointBackgroundColor: colors.forecast,
                                pointBorderColor: '#FFFFFF',
                                pointBorderWidth: 2,
                                pointStyle: 'circle',
                                fill: false,
                                tension: 0.1
                            });
                        }
                        break;
                }
            });
            
            return datasets;
        },
        
        // Get active scenarios for a chart
        getActiveScenarios: function(chartId) {
            return this.activeScenarios[chartId] || ['fact'];
        },
        
        // Set active scenarios for a chart
        setActiveScenarios: function(chartId, scenarios) {
            this.activeScenarios[chartId] = scenarios || ['fact'];
            
            // Update button states
            var scenarioControls = document.querySelector('[data-chart-id="' + chartId + '"]');
            if (scenarioControls) {
                var buttons = scenarioControls.querySelectorAll('.scenario-btn');
                for (var i = 0; i < buttons.length; i++) {
                    var button = buttons[i];
                    var scenario = button.getAttribute('data-scenario');
                    var isActive = scenarios.indexOf(scenario) > -1;
                    
                    if (isActive) {
                        button.classList.add('active');
                        button.setAttribute('aria-pressed', 'true');
                    } else {
                        button.classList.remove('active');
                        button.setAttribute('aria-pressed', 'false');
                    }
                }
            }
            
            // Update chart
            this.updateChart(chartId);
        }
    };
    
    // Export to global scope
    window.ScenarioSwitcher = ScenarioSwitcher;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ScenarioSwitcher.initialize();
        });
    } else {
        ScenarioSwitcher.initialize();
    }
    
})();