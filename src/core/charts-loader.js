/**
 * Charts Loader - Ensures safe loading of chart modules
 * Проверяет и обеспечивает правильную загрузку модулей графиков
 */
(function() {
    'use strict';
    
    // Debug flag
    var DEBUG = false;
    
    function log(message) {
        if (DEBUG) {
            console.log('[ChartsLoader] ' + message);
        }
    }
    
    function warn(message) {
        console.warn('[ChartsLoader] ' + message);
    }
    
    function error(message) {
        console.error('[ChartsLoader] ' + message);
    }
    
    var ChartsLoader = {
        // Check module availability
        checkModules: function() {
            log('Checking chart modules availability...');
            
            var status = {
                chartjs: !!window.Chart,
                chartsRedesigned: !!window.ChartsRedesigned,
                chartFactory: !!window.ChartFactory,
                pageRenderers: !!window.PageRenderers
            };
            
            log('Module status: ' + JSON.stringify(status));
            
            // Check Chart.js
            if (!status.chartjs) {
                error('Chart.js not loaded!');
                return false;
            } else {
                log('Chart.js loaded successfully');
            }
            
            // Check ChartsRedesigned (optional but preferred)
            if (!status.chartsRedesigned) {
                warn('ChartsRedesigned module not loaded, will use fallbacks');
            } else {
                log('ChartsRedesigned module loaded successfully');
                // Test key methods
                if (typeof window.ChartsRedesigned.createLineChart === 'function') {
                    log('ChartsRedesigned.createLineChart is available');
                } else {
                    warn('ChartsRedesigned.createLineChart is not a function');
                }
            }
            
            // Check ChartFactory (fallback)
            if (!status.chartFactory) {
                warn('ChartFactory not available as fallback');
            } else {
                log('ChartFactory available as fallback');
            }
            
            // Check PageRenderers
            if (!status.pageRenderers) {
                error('PageRenderers not loaded!');
                return false;
            } else {
                log('PageRenderers loaded successfully');
                if (typeof window.PageRenderers.safeCreateChart === 'function') {
                    log('PageRenderers.safeCreateChart is available');
                } else {
                    error('PageRenderers.safeCreateChart is not available');
                }
            }
            
            return true;
        },
        
        // Initialize chart system
        initialize: function() {
            log('Initializing chart system...');
            
            if (!this.checkModules()) {
                error('Chart modules check failed');
                return false;
            }
            
            // Force larger fonts globally for Chart.js
            this.setupForcedFontSizes();
            
            // Set up global Chart.js defaults if ChartsRedesigned is available
            if (window.ChartsRedesigned && window.ChartsRedesigned.getGlobalDefaults) {
                try {
                    var defaults = window.ChartsRedesigned.getGlobalDefaults();
                    if (window.Chart && defaults) {
                        // Apply some safe defaults
                        if (Chart.defaults.global) {
                            Chart.defaults.global.defaultFontFamily = 
                                defaults.plugins.tooltip.titleFont.family || 
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                            Chart.defaults.global.defaultFontSize = 14;
                        }
                        log('Applied ChartsRedesigned defaults to Chart.js');
                    }
                } catch (error) {
                    warn('Failed to apply ChartsRedesigned defaults: ' + error.message);
                }
            }
            
            log('Chart system initialized successfully');
            return true;
        },
        
        // Setup forced font sizes globally
        setupForcedFontSizes: function() {
            if (!window.Chart) return;
            
            try {
                // Force global font settings for Chart.js 2.x
                if (Chart.defaults && Chart.defaults.global) {
                    Chart.defaults.global.defaultFontSize = 14;
                    Chart.defaults.global.defaultFontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
                    Chart.defaults.global.defaultFontColor = '#374151';
                    Chart.defaults.global.defaultFontStyle = '500';
                }
                
                // Override Chart.js prototype to force font sizes after chart creation
                if (Chart.prototype && Chart.prototype.update) {
                    var originalUpdate = Chart.prototype.update;
                    Chart.prototype.update = function(mode, duration) {
                        var result = originalUpdate.apply(this, arguments);
                        this.forceLargerFonts();
                        return result;
                    };
                    
                    // Add method to force larger fonts
                    Chart.prototype.forceLargerFonts = function() {
                        try {
                            if (this.options) {
                                // Force axis font sizes
                                if (this.options.scales) {
                                    if (this.options.scales.xAxes) {
                                        this.options.scales.xAxes.forEach(function(axis) {
                                            if (axis.ticks) {
                                                axis.ticks.fontSize = 14;
                                                axis.ticks.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
                                            }
                                        });
                                    }
                                    if (this.options.scales.yAxes) {
                                        this.options.scales.yAxes.forEach(function(axis) {
                                            if (axis.ticks) {
                                                axis.ticks.fontSize = 14;
                                                axis.ticks.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
                                            }
                                        });
                                    }
                                }
                                
                                // Force legend font sizes
                                if (this.options.legend && this.options.legend.labels) {
                                    this.options.legend.labels.fontSize = 13;
                                    this.options.legend.labels.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
                                }
                                
                                // Force tooltip font sizes
                                if (this.options.tooltips) {
                                    this.options.tooltips.titleFontSize = 14;
                                    this.options.tooltips.bodyFontSize = 14;
                                    this.options.tooltips.titleFontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
                                    this.options.tooltips.bodyFontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
                                }
                            }
                        } catch (e) {
                            // Ignore errors in font forcing
                        }
                    };
                }
                
                log('Forced font sizes setup completed');
            } catch (error) {
                warn('Failed to setup forced font sizes: ' + error.message);
            }
        },
        
        // Create a test chart to verify everything works
        testChart: function() {
            log('Testing chart creation...');
            
            // Create a temporary canvas for testing
            var testCanvas = document.createElement('canvas');
            testCanvas.id = 'test-chart-canvas';
            testCanvas.width = 100;
            testCanvas.height = 100;
            testCanvas.style.display = 'none';
            document.body.appendChild(testCanvas);
            
            try {
                // Test using PageRenderers.safeCreateChart
                if (window.PageRenderers && window.PageRenderers.safeCreateChart) {
                    var testChart = window.PageRenderers.safeCreateChart('line', 'test-chart-canvas', {
                        labels: ['A', 'B', 'C'],
                        fact: [1, 2, 3]
                    });
                    
                    if (testChart) {
                        log('Test chart created successfully');
                        // Clean up
                        if (testChart.destroy) {
                            testChart.destroy();
                        }
                        document.body.removeChild(testCanvas);
                        return true;
                    } else {
                        warn('Test chart creation returned null');
                    }
                } else {
                    error('PageRenderers.safeCreateChart not available');
                }
            } catch (error) {
                error('Test chart creation failed: ' + error.message);
            }
            
            // Clean up
            try {
                document.body.removeChild(testCanvas);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            return false;
        }
    };
    
    // Auto-initialize when DOM is ready
    function autoInitialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                    ChartsLoader.initialize();
                    if (DEBUG) {
                        ChartsLoader.testChart();
                    }
                }, 50);
            });
        } else {
            setTimeout(function() {
                ChartsLoader.initialize();
                if (DEBUG) {
                    ChartsLoader.testChart();
                }
            }, 50);
        }
    }
    
    // Start auto-initialization
    autoInitialize();
    
    // Export to window
    window.ChartsLoader = ChartsLoader;
    
})();