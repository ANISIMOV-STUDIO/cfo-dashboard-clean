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
        }
    };
    
    // Export to window
    window.UIBindings = UIBindings;
    
})();