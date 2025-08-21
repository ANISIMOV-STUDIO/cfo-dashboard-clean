/**
 * Performance Optimization and Mobile Adaptation Module (Fixed)
 * Optimizes dashboard performance and provides responsive mobile support
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var PerformanceOptimizer = {
        config: {
            lazyLoadThreshold: 200,
            debounceDelay: 300,
            maxCacheSize: 50,
            compressionEnabled: true,
            virtualScrollEnabled: false
        },
        
        cache: {},
        observers: {},
        isMobile: false,
        isTablet: false,
        
        // Initialize performance optimization
        initialize: function() {
            this.setupChartDefaults();
            this.detectDeviceType();
            this.setupLazyLoading();
            this.optimizeChartRendering();
            this.setupVirtualization();
            this.optimizeDataLoading();
            this.setupMobileAdaptations();
            this.addPerformanceMonitoring();
        },
        
        // Setup safe Chart.js defaults
        setupChartDefaults: function() {
            if (window.Chart && window.Chart.defaults) {
                try {
                    Chart.defaults.global.defaultFontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
                    Chart.defaults.global.defaultFontSize = 16;
                    Chart.defaults.global.defaultFontColor = '#374151';
                    Chart.defaults.global.defaultFontStyle = 'normal';
                    
                    // Disable problematic features
                    Chart.defaults.global.hover.intersect = false;
                    Chart.defaults.global.tooltips.intersect = false;
                    
                    console.log('Chart.js defaults configured safely');
                } catch (error) {
                    console.warn('Failed to set Chart.js defaults:', error);
                }
            }
        },
        
        // Detect device type and capabilities
        detectDeviceType: function() {
            var userAgent = navigator.userAgent || '';
            var screenWidth = window.innerWidth || document.documentElement.clientWidth;
            
            this.isMobile = screenWidth < 768;
            this.isTablet = screenWidth >= 768 && screenWidth < 1024;
            
            // Update body classes
            document.body.classList.toggle('mobile', this.isMobile);
            document.body.classList.toggle('tablet', this.isTablet);
            
            // Detect touch capability
            var hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            document.body.classList.toggle('touch', hasTouch);
            
            console.log('Device detected:', {
                mobile: this.isMobile,
                tablet: this.isTablet,
                touch: hasTouch,
                screenWidth: screenWidth
            });
        },
        
        // Setup lazy loading for charts and content
        setupLazyLoading: function() {
            if (!('IntersectionObserver' in window)) {
                // Fallback for older browsers
                this.setupScrollBasedLazyLoading();
                return;
            }
            
            var self = this;
            
            this.observers.lazyLoad = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var element = entry.target;
                        self.loadLazyElement(element);
                        self.observers.lazyLoad.unobserve(element);
                    }
                });
            }, {
                rootMargin: this.config.lazyLoadThreshold + 'px'
            });
            
            // Observe all lazy elements
            this.observeLazyElements();
        },
        
        // Setup scroll-based lazy loading fallback
        setupScrollBasedLazyLoading: function() {
            var self = this;
            var throttledCheck = this.throttle(function() {
                self.checkLazyElements();
            }, 100);
            
            window.addEventListener('scroll', throttledCheck);
            window.addEventListener('resize', throttledCheck);
            
            // Initial check
            setTimeout(function() {
                self.checkLazyElements();
            }, 100);
        },
        
        // Observe elements for lazy loading
        observeLazyElements: function() {
            var lazyElements = document.querySelectorAll('[data-lazy]');
            var self = this;
            
            lazyElements.forEach(function(element) {
                self.observers.lazyLoad.observe(element);
            });
        },
        
        // Check lazy elements in viewport (fallback)
        checkLazyElements: function() {
            var lazyElements = document.querySelectorAll('[data-lazy]');
            var self = this;
            
            lazyElements.forEach(function(element) {
                if (self.isElementInViewport(element)) {
                    self.loadLazyElement(element);
                }
            });
        },
        
        // Load lazy element
        loadLazyElement: function(element) {
            var lazyType = element.getAttribute('data-lazy');
            
            switch (lazyType) {
                case 'chart':
                    this.loadLazyChart(element);
                    break;
                case 'data':
                    this.loadLazyData(element);
                    break;
                default:
                    element.removeAttribute('data-lazy');
            }
        },
        
        // Load lazy chart
        loadLazyChart: function(canvas) {
            if (canvas.tagName !== 'CANVAS') return;
            
            var chartId = canvas.id;
            var page = canvas.closest('.page-content');
            
            if (page && window.PageRenderers) {
                var pageId = page.id.replace('page-', '');
                
                // Render charts for the entire page only if data is available
                setTimeout(function() {
                    // Try to get data from multiple sources
                    var data = window.PageRenderers && window.PageRenderers.currentData;
                    if (!data && window.DataManager) {
                        data = window.DataManager.currentData || window.DataManager.getFiltered();
                    }
                    
                    console.log('Checking data availability for', pageId + ':');
                    console.log('- PageRenderers.currentData:', !!(window.PageRenderers && window.PageRenderers.currentData));
                    console.log('- DataManager.currentData:', !!(window.DataManager && window.DataManager.currentData));
                    console.log('- Data found:', !!data);
                    
                    if (window.PageRenderers && window.PageRenderers.renderPageCharts && data) {
                        console.log('Rendering charts for', pageId, 'with data');
                        // Ensure PageRenderers has the data
                        window.PageRenderers.currentData = data;
                        window.PageRenderers.renderPageCharts(pageId, data);
                    } else {
                        console.log('Skipping chart render - no data available yet for', pageId);
                        
                        // Try to force data initialization
                        if (window.DataManager && window.DataManager.initializeDemoData) {
                            console.log('Attempting to initialize demo data...');
                            window.DataManager.initializeDemoData();
                            
                            // Retry after data initialization
                            setTimeout(function() {
                                var retryData = window.DataManager.currentData;
                                if (window.PageRenderers && retryData) {
                                    console.log('Retry: Rendering charts for', pageId);
                                    window.PageRenderers.currentData = retryData;
                                    window.PageRenderers.renderPageCharts(pageId, retryData);
                                }
                            }, 100);
                        }
                    }
                }, 50);
            }
            
            canvas.removeAttribute('data-lazy');
        },
        
        // Load lazy data
        loadLazyData: function(element) {
            // Implementation for lazy data loading
            element.removeAttribute('data-lazy');
        },
        
        // Check if element is in viewport
        isElementInViewport: function(element) {
            var rect = element.getBoundingClientRect();
            var threshold = this.config.lazyLoadThreshold;
            
            return (
                rect.bottom >= -threshold &&
                rect.right >= -threshold &&
                rect.top <= (window.innerHeight + threshold) &&
                rect.left <= (window.innerWidth + threshold)
            );
        },
        
        // Optimize chart rendering
        optimizeChartRendering: function() {
            var self = this;
            
            // Override Chart.js defaults for performance
            if (window.Chart && Chart.defaults) {
                Chart.defaults.animation = false; // Disable animations on mobile
                Chart.defaults.responsive = true;
                Chart.defaults.maintainAspectRatio = false;
                
                // Reduce quality on mobile devices
                if (this.isMobile) {
                    if (Chart.defaults.elements) {
                        if (Chart.defaults.elements.line) {
                            Chart.defaults.elements.line.tension = 0; // No curves
                        }
                        if (Chart.defaults.elements.point) {
                            Chart.defaults.elements.point.radius = 0; // No points
                        }
                    }
                }
                
                // Override update method for batching
                if (Chart.prototype) {
                    var originalUpdate = Chart.prototype.update;
                    Chart.prototype.update = function(mode, duration) {
                        // Safety check: ensure chart is still valid
                        if (!this || !this.chart || !this.chart.canvas) {
                            console.warn('Attempted to update invalid chart');
                            return;
                        }
                        
                        // Batch updates using requestAnimationFrame
                        if (!this._updateScheduled) {
                            this._updateScheduled = true;
                            var chart = this;
                            
                            requestAnimationFrame(function() {
                                try {
                                    // Double-check chart is still valid before update
                                    if (chart && chart.chart && chart.chart.canvas) {
                                        originalUpdate.call(chart, mode, duration);
                                    }
                                } catch (error) {
                                    console.warn('Chart update failed:', error);
                                } finally {
                                    chart._updateScheduled = false;
                                }
                            });
                        }
                    };
                }
            }
        },
        
        // Setup virtualization for large datasets
        setupVirtualization: function() {
            if (!this.config.virtualScrollEnabled) return;
            
            // Implement virtual scrolling for large lists
            var self = this;
            
            document.addEventListener('scroll', this.throttle(function(event) {
                if (event.target.classList.contains('virtual-list')) {
                    self.updateVirtualList(event.target);
                }
            }, 50));
        },
        
        // Update virtual list
        updateVirtualList: function(listElement) {
            // Virtual scrolling implementation would go here
            // For now, just a placeholder
        },
        
        // Optimize data loading
        optimizeDataLoading: function() {
            var self = this;
            
            // Cache data requests
            if (window.DataManager) {
                var originalLoadData = window.DataManager.loadData;
                window.DataManager.loadData = function(jsonData) {
                    var dataKey = self.generateDataKey(jsonData);
                    
                    // Check cache first
                    if (self.cache[dataKey]) {
                        return self.cache[dataKey];
                    }
                    
                    // Load and cache result
                    var result = originalLoadData.call(this, jsonData);
                    self.addToCache(dataKey, result);
                    
                    return result;
                };
            }
            
            // Compress data if possible
            if (this.config.compressionEnabled) {
                this.setupDataCompression();
            }
        },
        
        // Setup data compression
        setupDataCompression: function() {
            // Simple data compression using JSON with reduced precision
            var self = this;
            
            this.compressData = function(data) {
                if (typeof data !== 'object') return data;
                
                var compressed = {};
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        var value = data[key];
                        if (Array.isArray(value)) {
                            // Round numbers in arrays to reduce size
                            compressed[key] = value.map(function(item) {
                                return typeof item === 'number' ? 
                                    Math.round(item * 100) / 100 : item;
                            });
                        } else {
                            compressed[key] = value;
                        }
                    }
                }
                return compressed;
            };
        },
        
        // Generate cache key for data
        generateDataKey: function(data) {
            if (typeof data === 'string') {
                return 'str_' + data.substring(0, 100);
            }
            return 'obj_' + JSON.stringify(data).substring(0, 100);
        },
        
        // Add item to cache with size limit
        addToCache: function(key, value) {
            var keys = Object.keys(this.cache);
            if (keys.length >= this.config.maxCacheSize) {
                // Remove oldest entry
                delete this.cache[keys[0]];
            }
            
            this.cache[key] = value;
        },
        
        // Setup mobile adaptations
        setupMobileAdaptations: function() {
            if (!this.isMobile && !this.isTablet) return;
            
            this.adaptLayoutForMobile();
            this.optimizeTouchInteractions();
            this.adaptChartsForMobile();
            this.setupMobileNavigation();
        },
        
        // Adapt layout for mobile devices
        adaptLayoutForMobile: function() {
            var dashboard = document.querySelector('.dashboard');
            if (!dashboard) return;
            
            // Adjust minimum width
            dashboard.style.minWidth = 'auto';
            dashboard.style.padding = '0 12px 24px';
            
            // Stack KPI cards vertically on mobile
            if (this.isMobile) {
                var kpiCards = document.querySelector('.kpi-cards');
                if (kpiCards) {
                    kpiCards.style.flexDirection = 'column';
                    kpiCards.style.gap = '8px';
                }
            }
            
            // Adjust grid for mobile
            var grids = document.querySelectorAll('.grid');
            var self = this;
            grids.forEach(function(grid) {
                if (self.isMobile) {
                    grid.style.gridTemplateColumns = '1fr';
                    grid.style.gap = '12px';
                } else if (self.isTablet) {
                    grid.style.gridTemplateColumns = 'repeat(1, 1fr)';
                }
            });
        },
        
        // Optimize touch interactions
        optimizeTouchInteractions: function() {
            // Increase touch target sizes
            var buttons = document.querySelectorAll('button');
            buttons.forEach(function(button) {
                if (button.offsetHeight < 44) {
                    button.style.minHeight = '44px';
                    button.style.padding = '8px 12px';
                }
            });
            
            // Add touch-friendly hover effects
            var style = document.createElement('style');
            style.textContent = 
                '@media (hover: none) {' +
                '    .kpi-card:hover { transform: none; }' +
                '    button:hover { background: var(--panel) !important; }' +
                '}';
            document.head.appendChild(style);
        },
        
        // Adapt charts for mobile
        adaptChartsForMobile: function() {
            if (!window.Chart) return;
            
            // Mobile-specific chart options
            var mobileChartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: !this.isMobile, // Hide legend on mobile
                        position: this.isTablet ? 'bottom' : 'top'
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: false
                    }
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            maxTicksLimit: this.isMobile ? 4 : 8,
                            fontSize: this.isMobile ? 10 : 11
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            maxTicksLimit: 5,
                            fontSize: this.isMobile ? 10 : 11
                        }
                    }]
                }
            };
            
            // Apply to chart defaults
            if (Chart.defaults) {
                Chart.defaults = Object.assign({}, Chart.defaults, mobileChartOptions);
            }
        },
        
        // Setup mobile navigation
        setupMobileNavigation: function() {
            if (!this.isMobile) return;
            
            // Add mobile navigation toggle
            this.createMobileNavToggle();
            
            // Optimize tab navigation for mobile
            this.optimizeMobileTabs();
        },
        
        // Create mobile navigation toggle
        createMobileNavToggle: function() {
            var navToggle = document.createElement('button');
            navToggle.className = 'mobile-nav-toggle';
            navToggle.innerHTML = '☰';
            navToggle.title = 'Меню';
            
            var header = document.querySelector('.dashboard-header .header-left');
            if (header) {
                header.appendChild(navToggle);
            }
            
            // Toggle mobile menu
            navToggle.addEventListener('click', function() {
                document.body.classList.toggle('mobile-nav-open');
            });
        },
        
        // Optimize mobile tabs
        optimizeMobileTabs: function() {
            var tabContainer = document.querySelector('.segmented');
            if (!tabContainer) return;
            
            // Make tabs horizontally scrollable on mobile
            tabContainer.style.overflowX = 'auto';
            tabContainer.style.whiteSpace = 'nowrap';
            
            var tabs = tabContainer.querySelectorAll('.segment-tab');
            tabs.forEach(function(tab) {
                tab.style.flexShrink = '0';
                tab.style.minWidth = '80px';
            });
        },
        
        // Add performance monitoring
        addPerformanceMonitoring: function() {
            var self = this;
            
            // Monitor frame rate
            this.frameCount = 0;
            this.lastTime = performance.now();
            
            this.monitorFrameRate();
            
            // Monitor memory usage (if available)
            if (performance.memory) {
                setInterval(function() {
                    self.checkMemoryUsage();
                }, 10000); // Check every 10 seconds
            }
            
            // Monitor load times
            window.addEventListener('load', function() {
                self.reportLoadTimes();
            });
        },
        
        // Monitor frame rate
        monitorFrameRate: function() {
            var self = this;
            
            function calculateFPS() {
                var now = performance.now();
                self.frameCount++;
                
                if (now >= self.lastTime + 1000) {
                    var fps = Math.round((self.frameCount * 1000) / (now - self.lastTime));
                    
                    // Log low FPS
                    if (fps < 30) {
                        console.warn('Low FPS detected:', fps);
                    }
                    
                    self.frameCount = 0;
                    self.lastTime = now;
                }
                
                requestAnimationFrame(calculateFPS);
            }
            
            requestAnimationFrame(calculateFPS);
        },
        
        // Check memory usage
        checkMemoryUsage: function() {
            if (!performance.memory) return;
            
            var memory = performance.memory;
            var usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            var totalMB = Math.round(memory.totalJSHeapSize / 1048576);
            var limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
            
            // Warn if memory usage is high
            if (usedMB / limitMB > 0.8) {
                console.warn('High memory usage:', {
                    used: usedMB + 'MB',
                    total: totalMB + 'MB',
                    limit: limitMB + 'MB'
                });
                
                // Clear cache to free memory
                this.cache = {};
            }
        },
        
        // Report load times
        reportLoadTimes: function() {
            if (!performance.timing) return;
            
            var timing = performance.timing;
            var loadTime = timing.loadEventEnd - timing.navigationStart;
            var domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
            
            console.log('Performance metrics:', {
                'Total load time': loadTime + 'ms',
                'DOM ready': domReady + 'ms',
                'First paint': performance.getEntriesByType ? 
                    (performance.getEntriesByType('paint')[0] ? performance.getEntriesByType('paint')[0].startTime + 'ms' : 'N/A') : 'N/A'
            });
        },
        
        // Throttle function calls
        throttle: function(func, limit) {
            var inThrottle;
            return function() {
                var args = arguments;
                var context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(function() {
                        inThrottle = false;
                    }, limit);
                }
            };
        },
        
        // Debounce function calls
        debounce: function(func, delay) {
            var timeout;
            var self = this;
            return function() {
                var context = this;
                var args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, delay || self.config.debounceDelay);
            };
        },
        
        // Optimize image loading
        optimizeImages: function() {
            var images = document.querySelectorAll('img');
            var self = this;
            
            images.forEach(function(img) {
                // Add lazy loading attribute
                img.loading = 'lazy';
                
                // Add mobile-optimized sources
                if (self.isMobile && img.dataset.mobileSrc) {
                    img.src = img.dataset.mobileSrc;
                }
            });
        },
        
        // Clear all caches
        clearCaches: function() {
            this.cache = {};
            
            // Clear browser caches if possible
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    names.forEach(function(name) {
                        caches.delete(name);
                    });
                });
            }
        },
        
        // Get performance metrics
        getMetrics: function() {
            return {
                cacheSize: Object.keys(this.cache).length,
                isMobile: this.isMobile,
                isTablet: this.isTablet,
                memoryUsage: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576)
                } : null,
                loadTime: performance.timing ? 
                    performance.timing.loadEventEnd - performance.timing.navigationStart : null
            };
        }
    };
    
    // Add mobile-specific CSS
    var mobileStyles = document.createElement('style');
    mobileStyles.textContent = 
        '/* Mobile Adaptations */' +
        '@media (max-width: 767px) {' +
        '    .dashboard { min-width: auto !important; padding: 0 12px 24px !important; }' +
        '    .kpi-cards { flex-direction: column !important; gap: 8px !important; }' +
        '    .kpi-card { min-width: auto !important; }' +
        '    .controls { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }' +
        '    .grid { grid-template-columns: 1fr !important; gap: 12px !important; }' +
        '    .card { min-height: 200px !important; }' +
        '    .page-navigation { overflow-x: auto; }' +
        '    .segmented { overflow-x: auto; white-space: nowrap; }' +
        '    .segment-tab { flex-shrink: 0; min-width: 80px; }' +
        '    .mobile-nav-toggle { display: block; margin-left: 12px; border: none; background: none; font-size: 18px; cursor: pointer; }' +
        '}' +
        '/* Tablet Adaptations */' +
        '@media (min-width: 768px) and (max-width: 1023px) {' +
        '    .dashboard { max-width: 100% !important; margin: 12px !important; }' +
        '    .controls { grid-template-columns: repeat(3, 1fr) !important; }' +
        '    .grid { grid-template-columns: 1fr !important; }' +
        '}' +
        '/* Desktop optimizations */' +
        '@media (min-width: 1024px) {' +
        '    .mobile-nav-toggle { display: none; }' +
        '}' +
        '/* Touch device optimizations */' +
        '.touch button { min-height: 44px; }' +
        '.touch .kpi-card:hover { transform: none; }' +
        '/* High DPI screens */' +
        '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {' +
        '    .chart-body canvas { image-rendering: crisp-edges; }' +
        '}' +
        '/* Loading states */' +
        '.loading { pointer-events: none; opacity: 0.6; }' +
        '.loading::after {' +
        '    content: ""; position: absolute; top: 50%; left: 50%; width: 20px; height: 20px;' +
        '    margin: -10px; border: 2px solid #ccc; border-top-color: #007AFF;' +
        '    border-radius: 50%; animation: spin 1s linear infinite;' +
        '}' +
        '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(mobileStyles);
    
    // Export to window
    window.PerformanceOptimizer = PerformanceOptimizer;
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        PerformanceOptimizer.initialize();
    });
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            PerformanceOptimizer.detectDeviceType();
            PerformanceOptimizer.adaptLayoutForMobile();
        }, 100);
    });
    
    // Handle window resize
    window.addEventListener('resize', PerformanceOptimizer.debounce(function() {
        PerformanceOptimizer.detectDeviceType();
        PerformanceOptimizer.adaptLayoutForMobile();
    }, 250));
    
})();