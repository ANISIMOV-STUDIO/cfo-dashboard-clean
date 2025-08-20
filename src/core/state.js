/**
 * State Management Module
 * Central state management for CFO Dashboard
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var DashboardState = {
        // Current page state
        currentPage: 'overview',
        
        // Filter state - расширенная модель
        filters: {
            periodPreset: 'month',    // 'month'|'quarter'|'year'
            dateFrom: null, 
            dateTo: null,
            companyId: 'progress',    // все|progress|другие
            divisionId: 'all',        // обособка/филиал
            managerId: 'all',         // менеджер
            counterpartyId: 'all',    // контрагент
            units: 'absolute',        // 'absolute'|'percentage'
            compareMode: 'none'       // 'none'|'prevYear'|'plan'
        },
        
        // Zoom state - per-chart zoom windows
        zoom: {},
        
        // UI state
        ui: {
            sidebarCollapsed: false,
            alertsVisible: true,
            recommendationsVisible: true,
            printMode: false
        },
        
        // Performance metrics
        performance: {
            lastRenderTime: null,
            chartRenderTimes: {},
            totalRenderTime: 0
        },
        
        // Change listeners
        listeners: {
            pageChange: [],
            filterChange: [],
            dataUpdate: []
        },
        
        // State management methods
        setState: function(newState) {
            var oldState = this.getState();
            
            // Deep merge state
            if (newState.filters) {
                Object.assign(this.filters, newState.filters);
            }
            if (newState.ui) {
                Object.assign(this.ui, newState.ui);
            }
            if (newState.currentPage && newState.currentPage !== this.currentPage) {
                this.setCurrentPage(newState.currentPage);
            }
            
            // Persist to localStorage
            this.persistState();
            
            // Trigger state change event
            this.triggerStateChange(oldState, this.getState());
        },
        
        getState: function() {
            return {
                currentPage: this.currentPage,
                filters: Object.assign({}, this.filters),
                ui: Object.assign({}, this.ui),
                performance: Object.assign({}, this.performance)
            };
        },
        
        // Page management
        setCurrentPage: function(pageId) {
            if (this.currentPage !== pageId) {
                var oldPage = this.currentPage;
                this.currentPage = pageId;
                
                // Trigger page change event
                this.triggerPageChange(oldPage, pageId);
                this.persistState();
            }
        },
        
        getCurrentPage: function() {
            return this.currentPage;
        },
        
        // Filter management
        setFilters: function(newFilters) {
            var oldFilters = Object.assign({}, this.filters);
            Object.assign(this.filters, newFilters);
            
            // Handle period preset changes
            if (newFilters.periodPreset) {
                this.applyPeriodPreset(newFilters.periodPreset);
            }
            
            this.triggerFilterChange(oldFilters, this.filters);
            this.persistState();
        },
        
        getFilters: function() {
            return Object.assign({}, this.filters);
        },
        
        applyPeriodPreset: function(preset) {
            var today = new Date();
            var dateFrom, dateTo;
            
            switch (preset) {
                case 'month':
                    dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
                    dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    break;
                case 'quarter':
                    var quarterStart = Math.floor(today.getMonth() / 3) * 3;
                    dateFrom = new Date(today.getFullYear(), quarterStart, 1);
                    dateTo = new Date(today.getFullYear(), quarterStart + 3, 0);
                    break;
                case 'year':
                    dateFrom = new Date(today.getFullYear(), 0, 1);
                    dateTo = new Date(today.getFullYear(), 11, 31);
                    break;
                default:
                    // Custom period - don't change dates
                    return;
            }
            
            this.filters.dateFrom = dateFrom.toISOString().split('T')[0];
            this.filters.dateTo = dateTo.toISOString().split('T')[0];
            this.filters.periodPreset = preset;
        },
        
        // Event system
        addEventListener: function(eventType, listener) {
            if (this.listeners[eventType]) {
                this.listeners[eventType].push(listener);
            }
        },
        
        removeEventListener: function(eventType, listener) {
            if (this.listeners[eventType]) {
                var index = this.listeners[eventType].indexOf(listener);
                if (index > -1) {
                    this.listeners[eventType].splice(index, 1);
                }
            }
        },
        
        triggerPageChange: function(oldPage, newPage) {
            this.listeners.pageChange.forEach(function(listener) {
                try {
                    listener({ oldPage: oldPage, newPage: newPage });
                } catch (e) {
                    console.error('Page change listener error:', e);
                }
            });
        },
        
        triggerFilterChange: function(oldFilters, newFilters) {
            this.listeners.filterChange.forEach(function(listener) {
                try {
                    listener({ oldFilters: oldFilters, newFilters: newFilters });
                } catch (e) {
                    console.error('Filter change listener error:', e);
                }
            });
        },
        
        triggerStateChange: function(oldState, newState) {
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent('stateChanged', true, true, {
                oldState: oldState,
                newState: newState
            });
            window.dispatchEvent(event);
        },
        
        // Persistence
        persistState: function() {
            try {
                var stateToSave = {
                    currentPage: this.currentPage,
                    filters: this.filters,
                    ui: this.ui
                };
                localStorage.setItem('cfo-dashboard-state', JSON.stringify(stateToSave));
            } catch (e) {
                console.warn('Failed to persist state:', e);
            }
        },
        
        loadState: function() {
            try {
                var saved = localStorage.getItem('cfo-dashboard-state');
                if (saved) {
                    var parsed = JSON.parse(saved);
                    if (parsed.currentPage) this.currentPage = parsed.currentPage;
                    if (parsed.filters) Object.assign(this.filters, parsed.filters);
                    if (parsed.ui) Object.assign(this.ui, parsed.ui);
                }
            } catch (e) {
                console.warn('Failed to load saved state:', e);
            }
        },
        
        // Performance tracking
        recordRenderTime: function(component, time) {
            this.performance.chartRenderTimes[component] = time;
            this.performance.lastRenderTime = Date.now();
        },
        
        getPerformanceMetrics: function() {
            return Object.assign({}, this.performance);
        },
        
        // Filter management - новые методы
        setFilter: function(key, value) {
            if (this.filters.hasOwnProperty(key)) {
                this.filters[key] = value;
                this.persistState();
                this.triggerEvent('filtersChanged', { key: key, value: value, filters: this.filters });
            }
        },
        
        getFilter: function(key) {
            return this.filters[key];
        },
        
        applyPeriodPreset: function(preset) {
            this.filters.periodPreset = preset;
            // сбрасываем зум при смене периода
            this.zoom = {};
            this.persistState();
            this.triggerEvent('filtersChanged', { key: 'periodPreset', value: preset, filters: this.filters });
        },
        
        // Zoom management
        setZoom: function(chartId, start, end) {
            this.zoom[chartId] = { start: start, end: end };
            this.triggerEvent('zoomChanged', { chartId: chartId, start: start, end: end });
        },
        
        clearZoom: function(chartId) {
            if (this.zoom[chartId]) {
                delete this.zoom[chartId];
                this.triggerEvent('zoomChanged', { chartId: chartId });
            }
        },
        
        getZoom: function(chartId) {
            return this.zoom[chartId] || null;
        },
        
        // Event system
        triggerEvent: function(eventName, data) {
            // Dispatch custom event
            var event;
            if (typeof CustomEvent === 'function') {
                event = new CustomEvent(eventName, { detail: data });
            } else {
                // ES5 fallback
                event = document.createEvent('CustomEvent');
                event.initCustomEvent(eventName, true, true, data);
            }
            window.dispatchEvent(event);
        },
        
        // Units mode management (для отображения в абсолютах vs процентах)
        toggleUnitsMode: function() {
            var newMode = this.filters.units === 'absolute' ? 'percentage' : 'absolute';
            this.setFilter('units', newMode);
        },
        
        // Initialize UI controls with current state
        initializeUI: function() {
            var self = this;
            
            // Wait for DOM and SelectLite to be ready
            setTimeout(function() {
                self.updateSelectsFromState();
                self.updatePresetsFromState();
            }, 100);
        },
        
        // Update all selects to match current state
        updateSelectsFromState: function() {
            var filters = this.filters;
            
            for (var filterId in filters) {
                if (filters.hasOwnProperty(filterId)) {
                    this.updateSelectUI(filterId, filters[filterId]);
                }
            }
        },
        
        // Update specific select UI
        updateSelectUI: function(selectId, value) {
            var selectEl = document.querySelector('.select[data-select-id="' + selectId + '"]');
            if (!selectEl) return;
            
            var option = selectEl.querySelector('.sel-item[data-value="' + value + '"]');
            var button = selectEl.querySelector('.sel-btn');
            
            if (option && button) {
                var text = option.textContent || option.innerText;
                button.innerHTML = text + '<span class="sel-arrow">▾</span>';
            }
        },
        
        // Update preset buttons to match current state
        updatePresetsFromState: function() {
            var activePreset = this.filters.periodPreset;
            var presetBtns = document.querySelectorAll('.preset-btn');
            
            presetBtns.forEach(function(btn) {
                btn.classList.remove('active');
                if (btn.getAttribute('data-preset') === activePreset) {
                    btn.classList.add('active');
                }
            });
        },
        
        // Debug function to log current state
        logCurrentState: function() {
            console.log('Current DashboardState:', {
                page: this.currentPage,
                filters: this.filters,
                ui: this.ui
            });
        }
    };
    
    // Initialize state on load
    DashboardState.loadState();
    
    // Initialize UI when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            DashboardState.initializeUI();
        });
    } else {
        DashboardState.initializeUI();
    }
    
    // Add debug listener for filter changes
    window.addEventListener('filtersChanged', function(event) {
        if (event.detail) {
            console.log('Filter changed:', event.detail.key + ' = ' + event.detail.value);
            console.log('All filters:', event.detail.filters);
        }
    });
    
    // Export to window for global access
    window.DashboardState = DashboardState;
    
    // Export commonly used functions
    window.getCurrentPage = function() {
        return DashboardState.getCurrentPage();
    };
    
    window.setCurrentPage = function(pageId) {
        return DashboardState.setCurrentPage(pageId);
    };
    
})();