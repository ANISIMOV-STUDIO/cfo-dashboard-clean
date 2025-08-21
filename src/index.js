/**
 * CFO Dashboard Main Module
 * Entry point and 1C external API
 * Compatible with V8WebKit 8.3.27
 */

// Scaler Module - ES5 compatible auto-scaling
(function() {
    'use strict';
    
    var DESIGN_W = 1360, DESIGN_H = 860, MIN = 0.6, MAX = 2.0;
    
    function throttle(fn, ms) {
        var t = 0;
        return function() {
            var now = Date.now();
            if (now - t > ms) {
                t = now;
                fn();
            }
        };
    }
    
    function applyScale() {
        var vw = window.innerWidth || document.documentElement.clientWidth;
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var s = Math.min(vw / DESIGN_W, vh / DESIGN_H);
        if (s > MAX) s = MAX;
        if (s < MIN) s = MIN;
        
        var canvas = document.getElementById('canvas');
        var wrapper = document.getElementById('app-scale');
        if (!canvas || !wrapper) return;
        
        canvas.style.transform = 'scale(' + s + ')';
        
        // Set physical size for proper click handling
        wrapper.style.setProperty('--w', Math.round(DESIGN_W * s) + 'px');
        wrapper.style.setProperty('--h', Math.round(DESIGN_H * s) + 'px');
        
        // Set scale factor as CSS variable for proportional scaling
        document.documentElement.style.setProperty('--scale-factor', s);
        
        // Apply responsive classes based on scale
        var body = document.body;
        body.classList.remove('scale-small', 'scale-medium', 'scale-large', 'scale-xlarge');
        
        if (s < 0.8) {
            body.classList.add('scale-small');
        } else if (s < 1.2) {
            body.classList.add('scale-medium');
        } else if (s < 1.6) {
            body.classList.add('scale-large');
        } else {
            body.classList.add('scale-xlarge');
        }
        
        // Debug log for development
        if (window.console && window.console.log) {
            console.log('Scale applied: ' + s.toFixed(3) + ', Screen: ' + vw + 'x' + vh + ', Class: scale-' + 
                (s < 0.8 ? 'small' : s < 1.2 ? 'medium' : s < 1.6 ? 'large' : 'xlarge'));
        }
    }
    
    // Initialize scaler
    function initScaler() {
        applyScale();
        var throttledScale = throttle(applyScale, 100);
        window.addEventListener('resize', throttledScale, false);
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScaler, false);
    } else {
        initScaler();
    }
    
    // Export for manual initialization
    window.Scaler = { initialize: initScaler, applyScale: applyScale };
})();

(function() {
    'use strict';
    
    // Global dashboard instance
    var CFODashboard = {
        version: '3.1.0',
        initialized: false,
        startTime: Date.now(),
        
        // Dashboard state
        config: {
            hideAnimations: true,
            enableDebugMode: false,
            targetRenderTime: 300, // ms
            enablePerformanceTracking: true
        },
        
        // Initialize dashboard
        initialize: function(options) {
            if (this.initialized) {
                // Already initialized
                return { success: false, error: 'Already initialized' };
            }
            
            var startTime = Date.now();
            
            try {
                // Merge config
                if (options) {
                    Object.assign(this.config, options);
                }
                
                // Initialize core modules
                this.initializeModules();
                
                // Load sample data if available
                this.loadInitialData();
                
                // Setup external API for 1C
                this.setupExternal1CAPI();
                
                // Setup performance monitoring
                if (this.config.enablePerformanceTracking) {
                    this.setupPerformanceMonitoring();
                }
                
                // Mark as initialized
                this.initialized = true;
                
                var duration = Date.now() - startTime;
                
                // Trigger initialization event
                this.triggerEvent('dashboardInitialized', {
                    version: this.version,
                    duration: duration,
                    config: this.config
                });
                
                return { success: true, duration: duration };
                
            } catch (error) {
                console.error('Dashboard initialization failed:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Initialize core modules
        initializeModules: function() {
            // Initialize TabManager
            if (window.TabManager) {
                window.TabManager.initialize();
            }
            
            // Initialize PageRenderers
            if (window.PageRenderers) {
                window.PageRenderers.initialize();
            }
            
            // Initialize UIBindings
            if (window.UIBindings) {
                window.UIBindings.initialize();
            }
            
            // Initialize AlertsEngine with existing UI elements
            if (window.AlertsEngine) {
                window.AlertsEngine.initialize(null, '#alerts-bell', '#alerts-panel', '#alerts-body');
                
                // Load alerts configuration if available
                this.loadAlertsConfig();
            }
            
            // Update dynamic header height
            this.updateHeaderHeight();
            
            // Initialize share mode based on localStorage
            var savedMode = localStorage.getItem('dash.mode.share') || 'absolute';
            this.applyShareMode(savedMode);
        },
        
        // Load alerts configuration
        loadAlertsConfig: function() {
            var self = this;
            try {
                // Use embedded config first if available
                if (window.EMBEDDED_ALERTS_CONFIG) {
                    window.AlertsEngine.loadConfig(window.EMBEDDED_ALERTS_CONFIG);
                    return;
                }
                
                // Fallback to XHR loading
                var xhr = new XMLHttpRequest();
                xhr.open('GET', './alerts-config.json', true);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            try {
                                var config = JSON.parse(xhr.responseText);
                                window.AlertsEngine.loadConfig(config);
                            } catch (parseError) {
                                console.error('Failed to parse alerts config:', parseError);
                            }
                        } else {
                            console.warn('Could not load alerts config:', xhr.status);
                        }
                    }
                };
                xhr.send();
            } catch (error) {
                console.error('Error loading alerts config:', error);
            }
        },
        
        // Load initial data
        loadInitialData: function() {
            // Clean up any existing charts before loading data
            if (window.PageRenderers && window.PageRenderers.clearCharts) {
                window.PageRenderers.clearCharts();
            }
            
            // Load sample data if available (check embedded data first)
            if (window.EMBEDDED_SAMPLE_DATA) {
                this.updateDashboard(window.EMBEDDED_SAMPLE_DATA);
            } else if (window.sampleData) {
                this.updateDashboard(window.sampleData);
            } else {
                // Try to fetch sample-data.json
                this.loadSampleDataFile();
            }
        },
        
        // Load sample data from file
        loadSampleDataFile: function() {
            var self = this;
            
            // Simple AJAX request for old WebKit compatibility
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'sample-data.json', true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            self.updateDashboard(data);
                        } catch (error) {
                            console.error('Failed to parse sample data:', error);
                        }
                    } else {
                        console.warn('Could not load sample-data.json:', xhr.status);
                    }
                }
            };
            xhr.send();
        },
        
        // Setup external 1C API
        setupExternal1CAPI: function() {
            var self = this;
            
            window.external1C = {
                // Update dashboard with new data
                updateDashboard: function(jsonData) {
                    try {
                        var result = self.updateDashboard(jsonData);
                        return result;
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                },
                
                // Get current dashboard state
                getDashboardState: function() {
                    try {
                        var state = window.DashboardState ? window.DashboardState.getState() : {};
                        var data = window.DataManager ? window.DataManager.getData() : null;
                        
                        return {
                            success: true,
                            state: state,
                            hasData: !!data,
                            alerts: window.AlertsEngine ? window.AlertsEngine.getActiveAlerts() : [],
                            version: self.version,
                            initialized: self.initialized
                        };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                },
                
                // Set filters
                setFilters: function(filtersJson) {
                    try {
                        var filters = typeof filtersJson === 'string' ? JSON.parse(filtersJson) : filtersJson;
                        
                        if (window.DashboardState) {
                            window.DashboardState.setFilters(filters);
                        }
                        
                        // Apply period preset if specified
                        if (filters.periodPreset) {
                            self.applyPeriodPreset(filters.periodPreset);
                        }
                        
                        // Apply share mode if specified
                        if (filters.hasOwnProperty('percentageMode')) {
                            self.applyShareMode(filters.percentageMode ? 'percentage' : 'absolute');
                        }
                        
                        return { success: true, filters: filters };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                },
                
                // Get current filters
                getFilters: function() {
                    try {
                        var filters = window.DashboardState ? window.DashboardState.getFilters() : {};
                        return { success: true, filters: filters };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                },
                
                // Export dashboard as PNG
                exportPNG: function() {
                    return new Promise(function(resolve, reject) {
                        if (window.exportCurrentPagePNG) {
                            window.exportCurrentPagePNG().then(resolve).catch(reject);
                        } else {
                            reject(new Error('Export function not available'));
                        }
                    });
                },
                
                // Print current page
                printCurrentPage: function() {
                    if (window.printCurrentPage) {
                        return window.printCurrentPage();
                    }
                    return { success: false, error: 'Print function not available' };
                },
                
                // Print all pages
                printAllPages: function() {
                    if (window.printAllPages) {
                        return window.printAllPages();
                    }
                    return { success: false, error: 'Print all pages function not available' };
                },
                
                // Get KPI snapshot
                getKPISnapshot: function() {
                    try {
                        var snapshot = window.DataManager ? window.DataManager.getKPISnapshot() : null;
                        if (snapshot) {
                            return Object.assign(snapshot, { success: true });
                        }
                        return { success: false, error: 'No data available' };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
            };
        },
        
        
        // Setup performance monitoring
        setupPerformanceMonitoring: function() {
            var self = this;
            
            // Monitor chart render times
            window.addEventListener('chartsRefresh', function(event) {
                var startTime = Date.now();
                setTimeout(function() {
                    var duration = Date.now() - startTime;
                    if (window.DashboardState) {
                        window.DashboardState.recordRenderTime(event.detail.pageId, duration);
                    }
                }, 0);
            });
            
            // Monitor tab switch performance
            window.addEventListener('tabChanged', function(event) {
                var duration = Date.now() - event.detail.timestamp;
                if (window.DashboardState) {
                    window.DashboardState.recordRenderTime('tab-switch', duration);
                }
            });
            
            // Log performance warnings
            setInterval(function() {
                var metrics = self.getPerformanceMetrics();
                if (metrics.lastRenderTime && metrics.lastRenderTime > self.config.targetRenderTime) {
                    console.warn('Slow render detected:', metrics.lastRenderTime + 'ms');
                }
            }, 10000); // Check every 10 seconds
        },
        
        // Main data update method
        updateDashboard: function(jsonData) {
            var startTime = Date.now();
            
            try {
                var data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
                
                // Load data through DataManager
                var result = window.DataManager ? window.DataManager.loadData(data) : 
                    { success: false, error: 'DataManager not available' };
                
                if (result.success) {
                    // Process alerts
                    if (window.AlertsEngine && this.config.enableAlerts !== false) {
                        window.AlertsEngine.processAlerts(result.data);
                    }
                    
                    // Render current page charts
                    if (window.PageRenderers && window.TabManager) {
                        var currentPage = window.TabManager.getCurrentPage ? window.TabManager.getCurrentPage() : 'overview';
                        window.PageRenderers.handleDataUpdate(result.data, currentPage);
                    }
                    
                    // Update page content based on current page
                    this.refreshCurrentPage();
                    
                    // Update header KPIs
                    this.updateHeaderKPIs(result.data);
                }
                
                var duration = Date.now() - startTime;
                result.updateDuration = duration;
                
                return result;
                
            } catch (error) {
                console.error('Dashboard update failed:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Refresh current page content
        refreshCurrentPage: function() {
            var currentPage = window.getCurrentPage ? window.getCurrentPage() : 'overview';
            
            // Trigger page refresh event
            this.triggerEvent('pageRefresh', { pageId: currentPage });
            
            // Refresh charts on current page
            setTimeout(function() {
                var pageElement = document.getElementById('page-' + currentPage);
                if (pageElement) {
                    var canvases = pageElement.querySelectorAll('canvas');
                    canvases.forEach(function(canvas) {
                        var chart = canvas.chart;
                        if (chart && chart.resize) {
                            chart.resize();
                            chart.update('none');
                        }
                    });
                }
            }, 50);
        },
        
        // Update header KPIs
        updateHeaderKPIs: function(data) {
            if (!data || !data.kpi) return;
            
            var kpiElements = {
                'revenue': data.kpi.revenue ? data.kpi.revenue.current : null,
                'ebitda': data.kpi.ebitda,
                'ocf': data.kpi.ocf,
                'cash': data.kpi.cashEnd,
                'runway': data.kpi.cashRunwayMonths
            };
            
            Object.keys(kpiElements).forEach(function(key) {
                var element = document.getElementById('kpi-' + key);
                if (element && kpiElements[key] !== null) {
                    var valueElement = element.querySelector('.kpi-value');
                    if (valueElement) {
                        if (key === 'runway') {
                            valueElement.textContent = kpiElements[key].toFixed(1) + ' мес';
                        } else {
                            valueElement.textContent = window.formatMoney ? 
                                window.formatMoney(kpiElements[key], data.meta.currency || 'RUB', 0) :
                                kpiElements[key];
                        }
                    }
                }
            });
        },
        
        // Apply period preset
        applyPeriodPreset: function(preset) {
            if (window.DashboardState) {
                window.DashboardState.applyPeriodPreset(preset);
                
                // Trigger data refresh with new period
                this.refreshCurrentPage();
            }
        },
        
        // Apply share mode (percentage vs absolute)
        applyShareMode: function(mode) {
            localStorage.setItem('dash.mode.share', mode);
            
            // Update all charts on current page
            var pageElement = document.getElementById('page-' + (window.getCurrentPage ? window.getCurrentPage() : 'overview'));
            if (pageElement) {
                var canvases = pageElement.querySelectorAll('canvas');
                canvases.forEach(function(canvas) {
                    var chart = canvas.chart;
                    if (chart && window.ChartFactory) {
                        window.ChartFactory.applyShareMode(chart, mode);
                    }
                });
            }
        },
        
        // Update dynamic header height
        updateHeaderHeight: function() {
            var header = document.querySelector('.dashboard-header');
            if (header) {
                var height = header.offsetHeight;
                document.documentElement.style.setProperty('--header-h', height + 'px');
            }
        },
        
        // Get chart performance metrics
        getChartPerformanceMetrics: function() {
            var metrics = {};
            var canvases = document.querySelectorAll('canvas');
            
            canvases.forEach(function(canvas, index) {
                var chart = canvas.chart;
                if (chart && chart.config) {
                    metrics['chart-' + index] = {
                        type: chart.config.type,
                        dataLength: chart.data.datasets ? chart.data.datasets.length : 0,
                        pointsCount: chart.data.datasets ? chart.data.datasets.reduce(function(sum, dataset) {
                            return sum + (dataset.data ? dataset.data.length : 0);
                        }, 0) : 0
                    };
                }
            });
            
            return metrics;
        },
        
        // Trigger custom event
        triggerEvent: function(eventName, data) {
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventName, true, true, data);
            window.dispatchEvent(event);
        },
        
        // Get performance metrics
        getPerformanceMetrics: function() {
            return window.__dbg ? window.__dbg.getPerformanceMetrics() : {};
        }
    };
    
    // Global share mode function
    window.applyShareMode = function(mode) {
        return CFODashboard.applyShareMode(mode);
    };
    
    // Auto-initialize when DOM is ready
    function initializeDashboard() {
        // Small delay to ensure all modules are loaded
        setTimeout(function() {
            // Initialize redesigned charts module first
            if (window.ChartsRedesigned) {
                // ChartsRedesigned module loaded successfully
                // Apply global Chart.js defaults from redesigned module
                if (window.Chart) {
                    Object.assign(Chart.defaults, window.ChartsRedesigned.getGlobalDefaults());
                }
            }
            
            // Initialize main dashboard
            CFODashboard.initialize();
        }, 100);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
    
    // Export main dashboard object
    window.CFODashboard = CFODashboard;
    
    // Export for 1C compatibility
    window.initializeCFODashboard = function(options) {
        return CFODashboard.initialize(options);
    };
    
})();