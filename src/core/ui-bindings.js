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
            
            // Initialize SelectLite
            if (window.SelectLite) {
                window.SelectLite.initialize();
                console.log('SelectLite initialized');
            } else {
                console.warn('SelectLite not found');
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
            var refreshBtn = document.getElementById('refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function() {
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
        }
    };
    
    // Export to window
    window.UIBindings = UIBindings;
    
})();

// SelectLite Module - ES5 compatible custom selects
window.SelectLite = (function() {
    'use strict';
    
    function init(root) { 
        root = root || document; 
        var selects = root.querySelectorAll('.select .sel-btn');
        console.log('SelectLite found ' + selects.length + ' selects');
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
        var items = btn.parentNode.querySelectorAll('.sel-item');
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
                btn.parentNode.classList.remove('open');
                
                // Trigger change event
                var selectId = btn.parentNode.getAttribute('data-select-id');
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
                var event = new Event('selectchange', { bubbles: true });
                event.selectId = selectId;
                event.value = value;
                btn.parentNode.dispatchEvent(event);
                
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

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { 
        if (window.SelectLite) {
            window.SelectLite.initialize(); 
        }
    }, false);
} else if (window.SelectLite) {
    window.SelectLite.initialize();
}