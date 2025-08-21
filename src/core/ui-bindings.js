/**
 * UI Bindings Module
 * Connects UI elements to dashboard logic
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var UIBindings = {
        // Initialize all UI bindings
        initialize: function() {
            this.bindPrintButtons();
            this.bindQuickDates();
            this.bindAlertsBell();
            this.bindModeToggles();
            this.bindExportButtons();
            this.bindModeSelector();
            this.bindAdvancedFilters();
            this.bindRefreshButton();
            this.bindResetButton();
            this.bindRealtimeControls();
            this.bindPresetButtons();
            this.bindFilterChangeHandler();
            this.bindZoomControls();
            this.bindComparisonControls();
            this.bindCascadingFilters();
            this.bindChartControlsFallback();
            
            // Initialize SelectLite with delay to ensure DOM is ready
            var self = this;
            setTimeout(function() {
                if (window.SelectLite) {
                    window.SelectLite.initialize();
                    
                    // Force re-bind if needed
                    var selects = document.querySelectorAll('.select .sel-btn');
                    if (selects.length > 0) {
                        self.forceBindSelects();
                    }
                    
                    // Initialize demo data and trigger chart rendering
                    self.initializeDashboardData();
                } else {
                    // Still initialize data even without SelectLite
                    self.initializeDashboardData();
                }
            }, 300);
        },
        
        // Initialize dashboard with demo data
        initializeDashboardData: function() {
            // Ensure DataManager has data
            if (window.DataManager) {
                window.DataManager.initializeDemoData();
                
                // Trigger chart rendering for current page
                var currentPage = window.DashboardState ? window.DashboardState.getCurrentPage() : 'overview';
                
                setTimeout(function() {
                    if (window.PageRenderers && window.DataManager.currentData) {
                        window.PageRenderers.currentData = window.DataManager.currentData;
                        window.PageRenderers.renderPageCharts(currentPage, window.DataManager.currentData);
                    } else {
                        // Try to force load data if PageRenderers exists but no data
                        if (window.PageRenderers && !window.DataManager.currentData) {
                            window.DataManager.initializeDemoData();
                            
                            setTimeout(function() {
                                if (window.DataManager.currentData) {
                                    window.PageRenderers.currentData = window.DataManager.currentData;
                                    window.PageRenderers.renderPageCharts(currentPage, window.DataManager.currentData);
                                }
                            }, 50);
                        }
                    }
                }, 100);
            }
        },
        
        // Bind print functionality to buttons
        bindPrintButtons: function() {
            var printPageBtn = document.getElementById('print-page-btn');
            var printAllBtn = document.getElementById('print-all-btn');
            
            if (printPageBtn && window.PrintManager) {
                printPageBtn.addEventListener('click', function() {
                    window.PrintManager.printCurrentPage();
                });
            }
            
            if (printAllBtn && window.PrintManager) {
                printAllBtn.addEventListener('click', function() {
                    window.PrintManager.printAllPages();
                });
            }
        },
        
        // Bind export functionality to buttons  
        bindExportButtons: function() {
            var exportPageBtn = document.getElementById('export-page-btn');
            var exportAllBtn = document.getElementById('export-all-btn');
            
            if (exportPageBtn && window.PrintManager) {
                exportPageBtn.addEventListener('click', function() {
                    window.PrintManager.exportCurrentPagePNG();
                });
            }
            
            if (exportAllBtn && window.PrintManager) {
                exportAllBtn.addEventListener('click', function() {
                    window.PrintManager.exportAllPagesPNG();
                });
            }
        },
        
        // Bind quick date presets
        bindQuickDates: function() {
            var self = this;
            
            // Use event delegation for preset buttons
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('preset-btn')) {
                    var preset = event.target.getAttribute('data-preset');
                    if (preset) {
                        self.handlePresetClick(preset, event.target);
                    }
                }
            });
        },
        
        // Handle preset button click
        handlePresetClick: function(preset, button) {
            try {
                // Update active state
                var presetBtns = document.querySelectorAll('.preset-btn');
                presetBtns.forEach(function(btn) {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Apply preset through DashboardState
                if (window.DashboardState && window.DashboardState.applyPeriodPreset) {
                    window.DashboardState.applyPeriodPreset(preset);
                    
                    // Trigger data update
                    this.refreshDashboardData();
                }
            } catch (error) {
                console.error('Error applying preset ' + preset + ':', error);
            }
        },
        
        // Refresh dashboard data after filter change
        refreshDashboardData: function() {
            if (window.DataManager && window.PageRenderers) {
                try {
                    // Get current data and page
                    var currentData = window.DataManager.getData();
                    var currentPage = window.DashboardState ? window.DashboardState.getCurrentPage() : 'overview';
                    
                    // Update renderers with current data
                    window.PageRenderers.handleDataUpdate(currentData, currentPage);
                } catch (error) {
                    console.error('Error refreshing dashboard data:', error);
                }
            }
        },
        
        // Apply filters to data (simple implementation)
        applyFiltersToData: function(data, filters) {
            // This is a simplified filter - in real implementation would be more complex
            if (!data || !filters) return data;
            
            var filtered = {};
            for (var key in data) {
                filtered[key] = data[key];
            }
            
            // Apply date filter if present
            if (filters.dateFrom && filters.dateTo) {
                // Filter data by date range - simplified
                console.log('Applying date filter:', filters.dateFrom, 'to', filters.dateTo);
            }
            
            return filtered;
        },
        
        // Bind alerts bell toggle
        bindAlertsBell: function() {
            var alertsBell = document.getElementById('alerts-bell');
            var alertsPanel = document.getElementById('alerts-panel');
            
            if (alertsBell && alertsPanel) {
                alertsBell.addEventListener('click', function() {
                    var isVisible = alertsPanel.style.display === 'block';
                    alertsPanel.style.display = isVisible ? 'none' : 'block';
                    
                    // Update bell icon state
                    alertsBell.classList.toggle('active', !isVisible);
                });
                
                // Close panel when clicking outside
                document.addEventListener('click', function(event) {
                    if (!alertsBell.contains(event.target) && !alertsPanel.contains(event.target)) {
                        alertsPanel.style.display = 'none';
                        alertsBell.classList.remove('active');
                    }
                });
            }
        },
        
        // Bind mode toggle buttons (values/shares)
        bindModeToggles: function() {
            var self = this;
            
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('mode-toggle')) {
                    var mode = event.target.getAttribute('data-mode');
                    if (mode) {
                        self.handleModeToggle(mode, event.target);
                    }
                }
            });
        },
        
        // Handle mode toggle (values vs percentages)
        handleModeToggle: function(mode, button) {
            try {
                // Update active state
                var modeToggles = button.closest('.mode-toggles');
                if (modeToggles) {
                    var toggles = modeToggles.querySelectorAll('.mode-toggle');
                    toggles.forEach(function(toggle) {
                        toggle.classList.remove('active');
                    });
                    button.classList.add('active');
                }
                
                // Apply mode through CFODashboard
                if (window.CFODashboard && window.CFODashboard.applyShareMode) {
                    window.CFODashboard.applyShareMode(mode === 'shares');
                }
            } catch (error) {
                console.error('Error applying mode ' + mode + ':', error);
            }
        },
        
        // Bind mode selector (absolute/percentage) 
        bindModeSelector: function() {
            var self = this;
            var modeSelect = document.getElementById('mode-select');
            
            if (modeSelect) {
                modeSelect.addEventListener('change', function() {
                    self.handleModeChange(this.value);
                });
            }
        },
        
        // Handle mode change (absolute vs percentage)
        handleModeChange: function(mode) {
            try {
                // Update dashboard state
                if (window.DashboardState) {
                    window.DashboardState.setFilters({
                        percentageMode: mode === 'percentage'
                    });
                }
                
                // Trigger data refresh to update charts
                this.refreshDashboardData();
                
            } catch (error) {
                console.error('Error handling mode change:', error);
            }
        },
        
        // Bind advanced filters
        bindAdvancedFilters: function() {
            var self = this;
            
            // Date filters
            var dateFrom = document.getElementById('date-from');
            var dateTo = document.getElementById('date-to');
            if (dateFrom && dateTo) {
                dateFrom.addEventListener('change', function() {
                    self.handleDateChange();
                });
                dateTo.addEventListener('change', function() {
                    self.handleDateChange();
                });
            }
            
            // Company filter
            var companySelect = document.getElementById('company-select');
            if (companySelect) {
                companySelect.addEventListener('change', function() {
                    self.handleCompanyChange(this.value);
                });
            }
            
            // Currency filter
            var currencySelect = document.getElementById('currency-select');
            if (currencySelect) {
                currencySelect.addEventListener('change', function() {
                    self.handleCurrencyChange(this.value);
                });
            }
            
            // Comparison filter
            var comparisonSelect = document.getElementById('comparison-select');
            if (comparisonSelect) {
                comparisonSelect.addEventListener('change', function() {
                    self.handleComparisonChange(this.value);
                });
            }
        },
        
        // Handle date range changes
        handleDateChange: function() {
            var dateFrom = document.getElementById('date-from');
            var dateTo = document.getElementById('date-to');
            
            if (dateFrom && dateTo && window.DashboardState) {
                window.DashboardState.setFilters({
                    dateFrom: dateFrom.value,
                    dateTo: dateTo.value,
                    periodPreset: 'custom'
                });
                
                this.refreshDashboardData();
            }
        },
        
        // Handle company filter changes
        handleCompanyChange: function(company) {
            if (window.DashboardState) {
                window.DashboardState.setFilters({
                    company: company
                });
                
                this.refreshDashboardData();
            }
        },
        
        // Handle currency changes
        handleCurrencyChange: function(currency) {
            if (window.DashboardState) {
                window.DashboardState.setFilters({
                    currency: currency
                });
                
                // Update formatting globally
                if (window.FormatUtils) {
                    window.FormatUtils.defaultCurrency = currency;
                }
                
                this.refreshDashboardData();
            }
        },
        
        // Handle comparison mode changes
        handleComparisonChange: function(comparison) {
            if (window.DashboardState) {
                window.DashboardState.setFilters({
                    comparisonMode: comparison
                });
                
                this.refreshDashboardData();
            }
        },
        
        // Bind refresh button
        bindRefreshButton: function() {
            var refreshBtn = document.getElementById('manual-refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function() {
                    console.log('Manual refresh button clicked');
                    UIBindings.handleRefresh();
                });
            }
            
            // Also bind the other refresh button
            var refreshBtn2 = document.getElementById('refresh-btn');
            if (refreshBtn2) {
                refreshBtn2.addEventListener('click', function() {
                    console.log('Refresh button clicked');
                    UIBindings.handleRefresh();
                });
            }
        },
        
        // Handle manual refresh
        handleRefresh: function() {
            try {
                // Show loading state
                var loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.textContent = 'Обновление...';
                }
                
                // Simulate data reload
                setTimeout(function() {
                    UIBindings.refreshDashboardData();
                    
                    if (loadingIndicator) {
                        loadingIndicator.textContent = 'ООО Прогресс • Декабрь 2024';
                    }
                    
                    // Animate KPI cards
                    if (window.KPICards) {
                        ['revenue', 'ebitda', 'cash', 'margin'].forEach(function(type) {
                            window.KPICards.animateCard(type);
                        });
                    }
                }, 500);
                
            } catch (error) {
                console.error('Error refreshing dashboard:', error);
            }
        },
        
        // Bind reset all button
        bindResetButton: function() {
            var resetBtn = document.getElementById('reset-all-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                    if (window.ChartInteractivity) {
                        window.ChartInteractivity.restoreAllCharts();
                    }
                });
            }
        },
        
        // Bind real-time control buttons
        bindRealtimeControls: function() {
            var toggleRealtimeBtn = document.getElementById('toggle-realtime-btn');
            var manualRefreshBtn = document.getElementById('manual-refresh-btn');
            
            if (toggleRealtimeBtn) {
                toggleRealtimeBtn.addEventListener('click', function() {
                    var isActive = this.classList.contains('active');
                    
                    if (window.RealtimeUpdates) {
                        window.RealtimeUpdates.toggleAutoRefresh(!isActive);
                    }
                    
                    this.classList.toggle('active');
                    this.title = isActive ? 'Включить авто-обновление' : 'Выключить авто-обновление';
                });
            }
            
            if (manualRefreshBtn) {
                manualRefreshBtn.addEventListener('click', function() {
                    if (window.RealtimeUpdates) {
                        window.RealtimeUpdates.triggerRefresh();
                    }
                });
            }
        },
        
        // Update UI state from dashboard state
        updateUIFromState: function(state) {
            if (!state) return;
            
            // Update preset buttons
            if (state.filters && state.filters.periodPreset) {
                var activeBtn = document.querySelector('.preset-btn[data-preset=\"' + state.filters.periodPreset + '\"]');
                if (activeBtn) {
                    var presetBtns = document.querySelectorAll('.preset-btn');
                    presetBtns.forEach(function(btn) {
                        btn.classList.remove('active');
                    });
                    activeBtn.classList.add('active');
                }
            }
            
            // Update mode selector
            if (state.filters && state.filters.hasOwnProperty('percentageMode')) {
                var modeSelect = document.getElementById('mode-select');
                if (modeSelect) {
                    modeSelect.value = state.filters.percentageMode ? 'percentage' : 'absolute';
                }
            }
            
            // Update mode toggles
            if (state.ui && state.ui.shareMode !== undefined) {
                var modeValue = state.ui.shareMode ? 'shares' : 'values';
                var activeToggle = document.querySelector('.mode-toggle[data-mode=\"' + modeValue + '\"]');
                if (activeToggle) {
                    var toggles = document.querySelectorAll('.mode-toggle');
                    toggles.forEach(function(toggle) {
                        toggle.classList.remove('active');
                    });
                    activeToggle.classList.add('active');
                }
            }
        },
        
        // Bind preset buttons for period selection
        bindPresetButtons: function() {
            var self = this;
            
            // Listen for preset button clicks
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('preset-btn')) {
                    var preset = event.target.getAttribute('data-preset');
                    if (preset && window.DashboardState) {
                        self.handlePresetSelection(preset, event.target);
                    }
                }
            });
        },
        
        // Handle preset selection
        handlePresetSelection: function(preset, button) {
            try {
                // Update active state
                var presetBtns = document.querySelectorAll('.preset-btn');
                presetBtns.forEach(function(btn) {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Apply preset through DashboardState
                if (window.DashboardState && window.DashboardState.applyPeriodPreset) {
                    window.DashboardState.applyPeriodPreset(preset);
                }
                
                // Trigger data refresh
                this.refreshDashboardData();
                
            } catch (error) {
                console.error('Error applying preset ' + preset + ':', error);
            }
        },
        
        // Bind filter change handler for all custom selects
        bindFilterChangeHandler: function() {
            var self = this;
            
            // Listen for custom select change events
            document.addEventListener('selectchange', function(event) {
                if (event.selectId && event.value) {
                    self.handleFilterChange(event.selectId, event.value);
                }
            });
            
            // Listen for state changes to update UI
            window.addEventListener('filtersChanged', function(event) {
                if (event.detail) {
                    self.updateFiltersUI(event.detail.filters);
                }
            });
        },
        
        // Handle filter changes from selects
        handleFilterChange: function(filterId, value) {
            try {
                // Update dashboard state
                if (window.DashboardState) {
                    window.DashboardState.setFilter(filterId, value);
                }
                
                // Trigger data refresh
                this.refreshDashboardData();
                
            } catch (error) {
                console.error('Error handling filter change:', error);
            }
        },
        
        // Update filters UI to match state
        updateFiltersUI: function(filters) {
            if (!filters) return;
            
            // Update all select controls to match state
            var selectElements = document.querySelectorAll('.select[data-select-id]');
            selectElements.forEach(function(selectEl) {
                var selectId = selectEl.getAttribute('data-select-id');
                var currentValue = filters[selectId];
                
                if (currentValue) {
                    // Find the corresponding option and update button text
                    var option = selectEl.querySelector('.sel-item[data-value="' + currentValue + '"]');
                    var button = selectEl.querySelector('.sel-btn');
                    
                    if (option && button) {
                        var text = option.textContent || option.innerText;
                        button.innerHTML = text + '<span class="sel-arrow">▾</span>';
                    }
                }
            });
            
            // Update preset buttons
            if (filters.periodPreset) {
                var activeBtn = document.querySelector('.preset-btn[data-preset="' + filters.periodPreset + '"]');
                if (activeBtn) {
                    var presetBtns = document.querySelectorAll('.preset-btn');
                    presetBtns.forEach(function(btn) {
                        btn.classList.remove('active');
                    });
                    activeBtn.classList.add('active');
                }
            }
        },
        
        // Bind zoom controls for charts
        bindZoomControls: function() {
            var self = this;
            
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('zoom-btn')) {
                    console.log('Zoom button clicked:', event.target.className);
                    
                    // Find chart ID from zoom controls container
                    var zoomControls = event.target.closest('.zoom-controls');
                    if (!zoomControls) {
                        console.warn('Zoom controls container not found');
                        return;
                    }
                    
                    var chartId = zoomControls.getAttribute('data-chart-id');
                    if (!chartId) {
                        console.warn('Chart ID not found in zoom controls');
                        return;
                    }
                    
                    var zoomType = '';
                    if (event.target.classList.contains('zoom-in')) zoomType = 'in';
                    else if (event.target.classList.contains('zoom-out')) zoomType = 'out';
                    else if (event.target.classList.contains('zoom-reset')) zoomType = 'reset';
                    
                    console.log('Zoom action:', zoomType, 'for chart:', chartId);
                    
                    if (chartId && zoomType) {
                        self.handleZoomAction(chartId, zoomType);
                    }
                }
            });
        },
        
        // Handle zoom actions
        handleZoomAction: function(chartId, action) {
            console.log('Handling zoom action:', action, 'for chart:', chartId);
            
            if (!window.ChartFactory || !window.DataManager) {
                console.warn('ChartFactory or DataManager not available');
                return;
            }
            
            var series = window.DataManager.getFilteredForChart(chartId);
            if (!series || !series.dates) {
                console.warn('No series data found for chart:', chartId);
                return;
            }
            
            console.log('Series data length:', series.dates.length);
            
            try {
                if (action === 'in') {
                    window.ChartFactory.zoomIn(chartId, series);
                } else if (action === 'out') {
                    window.ChartFactory.zoomOut(chartId, series);
                } else if (action === 'reset') {
                    window.ChartFactory.zoomReset(chartId);
                }
                
                // Refresh chart with new zoom
                this.refreshChart(chartId);
                console.log('Zoom action completed successfully');
            } catch (error) {
                console.error('Error in zoom action:', error);
            }
        },
        
        // Refresh specific chart
        refreshChart: function(chartId) {
            console.log('Refreshing chart:', chartId);
            
            try {
                var canvas = document.getElementById(chartId);
                if (!canvas) {
                    console.warn('Canvas not found:', chartId);
                    return;
                }
                
                // Get fresh data first
                var series = window.DataManager ? window.DataManager.getFilteredForChart(chartId) : null;
                if (!series || !series.dates) {
                    console.warn('No series data available for chart:', chartId);
                    return;
                }
                
                // Try to get the chart instance (Chart.js stores instance on canvas)
                var existingChart = canvas.chart;
                
                if (existingChart && existingChart.data) {
                    console.log('Found existing chart, updating data...');
                    
                    try {
                        // Update chart data
                        existingChart.data.labels = series.dates;
                        if (existingChart.data.datasets && existingChart.data.datasets[0]) {
                            existingChart.data.datasets[0].data = series.fact;
                        }
                        
                        // Update chart display
                        if (typeof existingChart.update === 'function') {
                            existingChart.update();
                        }
                        
                        console.log('Chart updated successfully');
                        return;
                        
                    } catch (updateError) {
                        console.warn('Error updating chart data:', updateError);
                        // Continue to recreation
                    }
                }
                
                // Recreate chart if update failed or no chart exists
                console.log('Recreating chart...');
                
                if (existingChart && typeof existingChart.destroy === 'function') {
                    existingChart.destroy();
                }
                canvas.chart = null;
                
                // Create new chart
                if (window.ChartFactory && typeof window.ChartFactory.createLineChart === 'function') {
                    window.ChartFactory.createLineChart(chartId, series);
                    console.log('New chart created successfully');
                } else {
                    console.warn('ChartFactory.createLineChart not available');
                }
                
            } catch (error) {
                console.error('Error refreshing chart:', error);
            }
        },
        
        // Bind comparison controls
        bindComparisonControls: function() {
            var self = this;
            
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('comp-btn')) {
                    console.log('Comparison button clicked:', event.target.textContent);
                    
                    // Find chart ID from comparison controls container
                    var comparisonControls = event.target.closest('.comparison-controls');
                    if (!comparisonControls) {
                        console.warn('Comparison controls container not found');
                        return;
                    }
                    
                    var chartId = comparisonControls.getAttribute('data-chart-id');
                    if (!chartId) {
                        console.warn('Chart ID not found in comparison controls');
                        return;
                    }
                    
                    var mode = event.target.getAttribute('data-mode');
                    
                    console.log('Comparison mode:', mode, 'for chart:', chartId);
                    
                    if (chartId && mode) {
                        self.handleComparisonChange(chartId, mode, event.target);
                    }
                }
            });
        },
        
        // Handle comparison mode changes
        handleComparisonChange: function(chartId, mode, button) {
            // Update button states
            var controls = button.closest('.comparison-controls');
            if (controls) {
                var buttons = controls.querySelectorAll('.comp-btn');
                buttons.forEach(function(btn) {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            }
            
            // Update global comparison mode
            if (window.DashboardState) {
                window.DashboardState.setFilter('compare', mode);
            }
            
            // Refresh specific chart
            this.refreshChart(chartId);
        },
        
        // Bind cascading filter functionality
        bindCascadingFilters: function() {
            var self = this;
            
            // Listen for company changes to update subordinate filters
            window.addEventListener('filtersChanged', function(event) {
                if (event.detail && event.detail.key === 'companyId') {
                    self.handleCompanyFilter(event.detail.value);
                }
            });
        },
        
        // Handle company filter changes and cascade to other filters
        handleCompanyFilter: function(companyId) {
            if (!window.DataManager || !window.SelectLite) return;
            
            var dims = window.DataManager.getDimensions(companyId);
            
            // Update division select
            this.updateSelectOptions('divisionId', dims.divisions);
            
            // Update manager select  
            this.updateSelectOptions('managerId', dims.managers);
            
            // Update counterparty select
            this.updateSelectOptions('counterpartyId', dims.counterparties);
            
            // Reset dependent filters to 'all'
            if (window.DashboardState) {
                window.DashboardState.setFilter('divisionId', 'all');
                window.DashboardState.setFilter('managerId', 'all');
                window.DashboardState.setFilter('counterpartyId', 'all');
            }
        },
        
        // Update select options dynamically
        updateSelectOptions: function(selectId, options) {
            var select = document.querySelector('.select[data-select-id="' + selectId + '"]');
            if (!select) return;
            
            var menu = select.querySelector('.sel-menu');
            if (!menu) return;
            
            // Clear existing options
            menu.innerHTML = '';
            
            // Add new options
            options.forEach(function(option) {
                var li = document.createElement('li');
                li.className = 'sel-item';
                li.setAttribute('data-value', option.value);
                li.textContent = option.text;
                menu.appendChild(li);
            });
            
            // Update button text to first option (usually "All")
            var button = select.querySelector('.sel-btn');
            if (button && options[0]) {
                button.innerHTML = options[0].text + '<span class="sel-arrow">▾</span>';
            }
            
            // Re-initialize SelectLite for this select
            if (window.SelectLite) {
                window.SelectLite.initialize(select);
            }
        },
        
        
        // Force bind select events as fallback
        forceBindSelects: function() {
            
            var selects = document.querySelectorAll('.select');
            selects.forEach(function(select) {
                var btn = select.querySelector('.sel-btn');
                var menu = select.querySelector('.sel-menu');
                var items = select.querySelectorAll('.sel-item');
                
                if (!btn) return;
                
                // Remove existing event listeners by cloning
                var newBtn = btn.cloneNode(true);
                if (btn.parentNode) {
                    btn.parentNode.replaceChild(newBtn, btn);
                    btn = newBtn;
                } else {
                    return;
                }
                
                // Add click event to button
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Handle select click
                    
                    var wrap = e.target.closest('.select');
                    if (!wrap) return;
                    
                    var opened = wrap.classList.contains('open');
                    
                    // Close all dropdowns
                    document.querySelectorAll('.select.open').forEach(function(openSelect) {
                        openSelect.classList.remove('open');
                    });
                    
                    // Open this one if it wasn't open
                    if (!opened) {
                        wrap.classList.add('open');
                        console.log('Opened select');
                    }
                }, false);
                
                // Add events to menu items
                var newItems = select.querySelectorAll('.sel-item');
                newItems.forEach(function(item) {
                    item.addEventListener('click', function(ev) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        
                        console.log('Selected item:', ev.target.textContent);
                        
                        // Check if button still exists
                        if (!btn || !document.contains(btn)) {
                            console.warn('Button no longer in DOM');
                            return;
                        }
                        
                        // Update button text
                        var text = ev.target.textContent || ev.target.innerText;
                        btn.innerHTML = text + '<span class="sel-arrow">▾</span>';
                        
                        // Close dropdown
                        select.classList.remove('open');
                        
                        // Trigger change event
                        var selectId = select.getAttribute('data-select-id');
                        var value = ev.target.getAttribute('data-value') || text;
                        
                        if (selectId && window.DashboardState) {
                            window.DashboardState.setFilter(selectId, value);
                        }
                        
                    }, false);
                });
            });
            
            // Close dropdowns when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.select')) {
                    document.querySelectorAll('.select.open').forEach(function(openSelect) {
                        openSelect.classList.remove('open');
                    });
                }
            }, false);
        },
        
        // Fallback binding for chart controls
        bindChartControlsFallback: function() {
            var self = this;
            console.log('Setting up chart controls fallback...');
            
            // Additional direct binding as fallback
            setTimeout(function() {
                // Bind zoom buttons directly
                var zoomButtons = document.querySelectorAll('.zoom-btn');
                console.log('Found zoom buttons:', zoomButtons.length);
                
                zoomButtons.forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('Direct zoom button click:', this.className);
                        
                        var zoomControls = this.closest('.zoom-controls');
                        if (!zoomControls) return;
                        
                        var chartId = zoomControls.getAttribute('data-chart-id');
                        if (!chartId) return;
                        
                        var action = '';
                        if (this.classList.contains('zoom-in')) action = 'in';
                        else if (this.classList.contains('zoom-out')) action = 'out';
                        else if (this.classList.contains('zoom-reset')) action = 'reset';
                        
                        if (action) {
                            console.log('Fallback zoom:', action, chartId);
                            self.handleZoomAction(chartId, action);
                        }
                    });
                });
                
                // Bind comparison buttons directly
                var compButtons = document.querySelectorAll('.comp-btn');
                console.log('Found comparison buttons:', compButtons.length);
                
                compButtons.forEach(function(btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('Direct comparison button click:', this.textContent);
                        
                        var compControls = this.closest('.comparison-controls');
                        if (!compControls) return;
                        
                        var chartId = compControls.getAttribute('data-chart-id');
                        if (!chartId) return;
                        
                        var mode = this.getAttribute('data-mode');
                        if (mode) {
                            console.log('Fallback comparison:', mode, chartId);
                            self.handleComparisonChange(chartId, mode, this);
                        }
                    });
                });
                
            }, 200);
        },
        
        // Test all chart control buttons
        testChartControls: function() {
            console.log('=== Testing Chart Controls ===');
            
            var zoomBtns = document.querySelectorAll('.zoom-btn');
            var compBtns = document.querySelectorAll('.comp-btn');
            var refreshBtns = document.querySelectorAll('.refresh-btn, #manual-refresh-btn, #refresh-btn');
            
            console.log('Zoom buttons found:', zoomBtns.length);
            console.log('Comparison buttons found:', compBtns.length);
            console.log('Refresh buttons found:', refreshBtns.length);
            
            // Test zoom buttons
            zoomBtns.forEach(function(btn, index) {
                var controls = btn.closest('.zoom-controls');
                var chartId = controls ? controls.getAttribute('data-chart-id') : 'unknown';
                console.log('Zoom button ' + index + ':', {
                    classes: btn.className,
                    chartId: chartId,
                    pointerEvents: window.getComputedStyle(btn).pointerEvents,
                    zIndex: window.getComputedStyle(btn).zIndex
                });
            });
            
            // Test comparison buttons
            compBtns.forEach(function(btn, index) {
                var controls = btn.closest('.comparison-controls');
                var chartId = controls ? controls.getAttribute('data-chart-id') : 'unknown';
                console.log('Comp button ' + index + ':', {
                    classes: btn.className,
                    mode: btn.getAttribute('data-mode'),
                    chartId: chartId,
                    pointerEvents: window.getComputedStyle(btn).pointerEvents
                });
            });
            
            // Check if all required functions exist
            console.log('Functions available:');
            console.log('- ChartFactory:', !!window.ChartFactory);
            console.log('- ChartFactory.zoomIn:', !!(window.ChartFactory && window.ChartFactory.zoomIn));
            console.log('- DataManager:', !!window.DataManager);
            console.log('- DataManager.getFilteredForChart:', !!(window.DataManager && window.DataManager.getFilteredForChart));
            console.log('- DashboardState:', !!window.DashboardState);
            console.log('- DashboardState.setZoom:', !!(window.DashboardState && window.DashboardState.setZoom));
        }
    };
    
    // Export to window
    window.UIBindings = UIBindings;
    
    // Export test function for manual debugging
    window.testChartControls = function() {
        UIBindings.testChartControls();
    };
    
    // Simple test function for zoom
    window.testZoom = function(chartId, action) {
        chartId = chartId || 'revenue-trend-chart';
        action = action || 'in';
        
        console.log('Testing zoom:', action, 'for chart:', chartId);
        
        if (UIBindings.handleZoomAction) {
            UIBindings.handleZoomAction(chartId, action);
        } else {
            console.error('UIBindings.handleZoomAction not found');
        }
    };
    
    // Force render all charts with demo data
    window.forceRenderCharts = function() {
        console.log('Force rendering charts...');
        
        if (window.DataManager) {
            window.DataManager.initializeDemoData();
            
            var currentPage = window.DashboardState ? window.DashboardState.getCurrentPage() : 'overview';
            
            console.log('Available modules:');
            console.log('- DataManager:', !!window.DataManager);
            console.log('- PageRenderers:', !!window.PageRenderers);
            console.log('- DataManager.currentData:', !!window.DataManager.currentData);
            console.log('- Current page:', currentPage);
            
            if (window.PageRenderers && window.DataManager.currentData) {
                window.PageRenderers.currentData = window.DataManager.currentData;
                window.PageRenderers.renderPageCharts(currentPage, window.DataManager.currentData);
                console.log('Charts rendered for page:', currentPage);
            } else {
                console.warn('PageRenderers or data not available');
                
                if (!window.PageRenderers) {
                    console.warn('PageRenderers module not loaded');
                }
                if (!window.DataManager.currentData) {
                    console.warn('No current data in DataManager');
                    console.log('DataManager state:', window.DataManager);
                }
            }
        }
    };
    
    // Initialize everything on window load as backup
    window.addEventListener('load', function() {
        setTimeout(function() {
            console.log('Window loaded, forcing chart render...');
            if (window.forceRenderCharts) {
                window.forceRenderCharts();
            }
        }, 500);
    });
    
    // Simple debug function for data inspection
    window.debugData = function() {
        console.log('=== Data Debug ===');
        console.log('DataManager:', window.DataManager);
        console.log('DataManager.currentData:', window.DataManager ? window.DataManager.currentData : 'Not available');
        console.log('PageRenderers:', window.PageRenderers);
        console.log('PageRenderers.currentData:', window.PageRenderers ? window.PageRenderers.currentData : 'Not available');
        
        if (window.DataManager && window.DataManager.currentData) {
            console.log('Data structure:');
            console.log('- Keys:', Object.keys(window.DataManager.currentData));
            if (window.DataManager.currentData.timeSeries) {
                console.log('- TimeSeries keys:', Object.keys(window.DataManager.currentData.timeSeries));
                if (window.DataManager.currentData.timeSeries.revenue) {
                    console.log('- Revenue data:', window.DataManager.currentData.timeSeries.revenue);
                }
            }
        }
    };
    
})();

// SelectLite Module - ES5 compatible custom selects
window.SelectLite = (function() {
    'use strict';
    
    function init(root) { 
        root = root || document; 
        var selects = root.querySelectorAll('.select .sel-btn');
        // Initialize selects
        for (var i = 0; i < selects.length; i++) { 
            bind(selects[i]); 
        }
        
        // Global click handler to close all dropdowns
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.select')) {
                closeAll();
            }
        }, false);
    }
    
    function bind(btn) {
        // Toggle dropdown on button click
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var wrap = e.target.closest('.select'); 
            if (!wrap) return;
            
            var opened = wrap.classList.contains('open'); 
            closeAll(); 
            
            if (!opened) {
                wrap.classList.add('open');
                adjustMenuPosition(wrap); // Ensure proper positioning
                setFocusedItem(wrap, 0); // Focus first item
            }
        }, false);
        
        // Keyboard navigation
        btn.addEventListener('keydown', function(e) {
            var wrap = e.target.closest('.select');
            if (!wrap) return;
            
            switch(e.key) {
                case 'ArrowDown':
                case 'ArrowUp':
                    e.preventDefault();
                    if (!wrap.classList.contains('open')) {
                        wrap.classList.add('open');
                        adjustMenuPosition(wrap); // Ensure proper positioning
                        setFocusedItem(wrap, 0);
                    } else {
                        var direction = e.key === 'ArrowDown' ? 1 : -1;
                        moveFocus(wrap, direction);
                    }
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (wrap.classList.contains('open')) {
                        var focusedItem = wrap.querySelector('.sel-item.focused');
                        if (focusedItem) {
                            focusedItem.click();
                        }
                    } else {
                        wrap.classList.add('open');
                        adjustMenuPosition(wrap); // Ensure proper positioning
                        setFocusedItem(wrap, 0);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    closeAll();
                    btn.focus();
                    break;
            }
        }, false);
        
        // Bind option clicks
        var selectContainer = btn.parentNode;
        if (!selectContainer) {
            console.warn('Button has no parent container');
            return;
        }
        var items = selectContainer.querySelectorAll('.sel-item');
        for (var j = 0; j < items.length; j++) {
            items[j].addEventListener('click', function(ev) {
                ev.preventDefault();
                ev.stopPropagation();
                
                // Update button text
                var text = ev.target.textContent || ev.target.innerText;
                var arrow = btn.querySelector('.sel-arrow');
                if (arrow) {
                    // Keep existing arrow, just update text before it
                    btn.innerHTML = text + '<span class="sel-arrow">▾</span>';
                } else {
                    // Fallback if no arrow found
                    btn.innerHTML = text + '<span class="sel-arrow">▾</span>';
                }
                
                // Close dropdown
                var selectContainer = btn.parentNode;
                if (selectContainer) {
                    selectContainer.classList.remove('open');
                }
                
                // Trigger change event
                var selectId = selectContainer ? selectContainer.getAttribute('data-select-id') : null;
                var value = ev.target.getAttribute('data-value') || text;
                
                if (selectId && window.DashboardState) {
                    var filter = {};
                    filter[selectId] = value;
                    window.DashboardState.setFilters(filter);
                }
                
                // Обновляем состояние через DashboardState
                if (selectId && window.DashboardState) {
                    window.DashboardState.setFilter(selectId, value);
                }
                
                // Dispatch custom event
                if (selectContainer) {
                    var event = new Event('selectchange', { bubbles: true });
                    event.selectId = selectId;
                    event.value = value;
                    selectContainer.dispatchEvent(event);
                }
                
            }, false);
        }
    }
    
    function closeAll() { 
        var opened = document.querySelectorAll('.select.open'); 
        for (var k = 0; k < opened.length; k++) {
            opened[k].classList.remove('open');
            // Clear focused state
            var focusedItems = opened[k].querySelectorAll('.sel-item.focused');
            for (var i = 0; i < focusedItems.length; i++) {
                focusedItems[i].classList.remove('focused');
            }
        }
    }
    
    // Set focused item by index
    function setFocusedItem(wrap, index) {
        var items = wrap.querySelectorAll('.sel-item');
        
        // Clear all focused states
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('focused');
        }
        
        // Set focused state
        if (items[index]) {
            items[index].classList.add('focused');
        }
    }
    
    // Move focus up or down
    function moveFocus(wrap, direction) {
        var items = wrap.querySelectorAll('.sel-item');
        var focusedItem = wrap.querySelector('.sel-item.focused');
        var currentIndex = -1;
        
        // Find current focused index
        for (var i = 0; i < items.length; i++) {
            if (items[i] === focusedItem) {
                currentIndex = i;
                break;
            }
        }
        
        // Calculate new index
        var newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        
        setFocusedItem(wrap, newIndex);
    }
    
    // Adjust menu position to handle scaled containers
    function adjustMenuPosition(wrap) {
        var menu = wrap.querySelector('.sel-menu');
        if (!menu) return;
        
        // Get the button and container rects
        var btn = wrap.querySelector('.sel-btn');
        var btnRect = btn.getBoundingClientRect();
        var wrapRect = wrap.getBoundingClientRect();
        
        // Check if we're inside a scaled container
        var scaledContainer = wrap.closest('[style*="transform"]') || wrap.closest('.main-content');
        
        // Calculate viewport boundaries
        var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        var menuHeight = 280; // max-height from CSS
        var spaceBelow = viewportHeight - btnRect.bottom;
        var spaceAbove = btnRect.top;
        
        // Reset menu positioning
        menu.style.top = '';
        menu.style.bottom = '';
        menu.style.maxHeight = '';
        
        // Position menu below button if there's enough space, otherwise above
        if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
            // Position below
            menu.style.top = '40px';
            if (spaceBelow < menuHeight) {
                menu.style.maxHeight = Math.max(120, spaceBelow - 20) + 'px';
            }
        } else {
            // Position above
            menu.style.bottom = '40px';
            menu.style.top = 'auto';
            if (spaceAbove < menuHeight) {
                menu.style.maxHeight = Math.max(120, spaceAbove - 20) + 'px';
            }
        }
        
        // Handle horizontal positioning for edge cases
        var spaceRight = window.innerWidth - btnRect.right;
        var menuWidth = 220; // min-width from CSS
        
        if (spaceRight < menuWidth) {
            menu.style.left = 'auto';
            menu.style.right = '0';
        } else {
            menu.style.left = '0';
            menu.style.right = 'auto';
        }
    }
    
    return { 
        initialize: init,
        closeAll: closeAll
    };
})();

// SelectLite will be initialized by UIBindings.initialize()
// No need for duplicate initialization here