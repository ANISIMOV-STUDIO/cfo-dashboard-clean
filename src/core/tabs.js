/**
 * Tab Navigation Module
 * Handles tab switching and page visibility for CFO Dashboard
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var TabManager = {
        // Available pages
        pages: ['overview', 'sales', 'profit', 'cash', 'ar'],
        currentPage: 'overview',
        
        // Page titles
        pageTitles: {
            'overview': 'Обзор',
            'sales': 'Продажи',
            'profit': 'Прибыльность',
            'cash': 'ДДС и ликвидность',
            'ar': 'Дебиторка'
        },
        
        // Initialize tab navigation
        initialize: function() {
            // Determine active page from DOM state
            this.determineActivePage();
            this.createTabNavigation();
            this.bindTabEvents();
            this.showPage(this.currentPage);
        },
        
        // Determine which page should be active from DOM state
        determineActivePage: function() {
            // First check if there's an active tab button
            var activeTab = document.querySelector('.segment-tab.active, .nav-tab.active');
            if (activeTab) {
                var pageId = activeTab.getAttribute('data-page');
                if (pageId && this.pages.indexOf(pageId) > -1) {
                    this.currentPage = pageId;
                    return;
                }
            }
            
            // Then check which page content is visible
            for (var i = 0; i < this.pages.length; i++) {
                var pageId = this.pages[i];
                var pageElement = document.getElementById('page-' + pageId);
                if (pageElement && pageElement.classList.contains('active')) {
                    this.currentPage = pageId;
                    return;
                }
            }
            
            // Fallback to first page
            if (this.pages.length > 0) {
                this.currentPage = this.pages[0];
            }
        },
        
        // Create tab navigation if it doesn't exist
        createTabNavigation: function() {
            var existingNav = document.querySelector('.tab-navigation, .page-navigation');
            if (existingNav) return;
            
            var header = document.querySelector('.dashboard-header');
            if (!header) return;
            
            var nav = document.createElement('div');
            nav.className = 'tab-navigation';
            
            var tabList = document.createElement('div');
            tabList.className = 'nav-tabs';
            
            this.pages.forEach(function(pageId) {
                var tab = document.createElement('button');
                tab.className = 'nav-tab';
                tab.setAttribute('data-page', pageId);
                tab.textContent = TabManager.pageTitles[pageId] || pageId;
                
                if (pageId === TabManager.currentPage) {
                    tab.classList.add('active');
                }
                
                tabList.appendChild(tab);
            });
            
            nav.appendChild(tabList);
            header.appendChild(nav);
        },
        
        // Bind tab click events
        bindTabEvents: function() {
            var self = this;
            
            // Use event delegation for better performance - support both old and new navigation
            document.addEventListener('click', function(event) {
                var target = event.target;
                if (target.classList.contains('nav-tab') || target.classList.contains('segment-tab')) {
                    var pageId = target.getAttribute('data-page');
                    if (pageId && self.pages.indexOf(pageId) > -1) {
                        self.switchTab(pageId);
                    }
                }
            });
            
            // Keyboard navigation
            document.addEventListener('keydown', function(event) {
                if (event.ctrlKey || event.metaKey) {
                    var pageIndex = -1;
                    
                    switch (event.key) {
                        case '1': pageIndex = 0; break; // Overview
                        case '2': pageIndex = 1; break; // Sales
                        case '3': pageIndex = 2; break; // Profit
                        case '4': pageIndex = 3; break; // Cash
                        case '5': pageIndex = 4; break; // AR
                    }
                    
                    if (pageIndex >= 0 && pageIndex < self.pages.length) {
                        event.preventDefault();
                        self.switchTab(self.pages[pageIndex]);
                    }
                }
            });
        },
        
        // Switch to specific tab
        switchTab: function(pageId) {
            if (this.pages.indexOf(pageId) === -1) {
                return;
            }
            
            // If it's the same page, just refresh charts
            if (this.currentPage === pageId) {
                this.refreshPageCharts(pageId);
                return { success: true, page: pageId, duration: 0 };
            }
            
            var startTime = Date.now();
            var oldPage = this.currentPage;
            
            try {
                // Update visual state
                this.updateTabButtons(pageId);
                
                // Hide current page (this will cleanup charts)
                this.hidePage(oldPage);
                
                // Show new page
                this.showPage(pageId);
                
                // Update state
                this.currentPage = pageId;
                
                // Update global state
                if (window.DashboardState) {
                    window.DashboardState.setCurrentPage(pageId);
                }
                
                // Trigger page change event
                this.triggerPageChangeEvent(pageId);
                
                // Force chart re-rendering on new page
                this.refreshPageCharts(pageId);
                
                // Render charts for the new page
                if (window.PageRenderers && window.PageRenderers.currentData) {
                    window.PageRenderers.renderPageCharts(pageId, window.PageRenderers.currentData);
                }
                
                // Record performance
                var duration = Date.now() - startTime;
                if (window.PerformanceUtils) {
                    window.PerformanceUtils.recordRenderTime('tab-switch-' + pageId, duration);
                }
                
                return { success: true, page: pageId, duration: duration };
                
            } catch (error) {
                console.error('Tab switch error:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Update tab button states
        updateTabButtons: function(activePageId) {
            var tabs = document.querySelectorAll('.nav-tab, .segment-tab');
            tabs.forEach(function(tab) {
                var pageId = tab.getAttribute('data-page');
                if (pageId === activePageId) {
                    tab.classList.add('active');
                    tab.setAttribute('aria-selected', 'true');
                } else {
                    tab.classList.remove('active');
                    tab.setAttribute('aria-selected', 'false');
                }
            });
        },
        
        // Hide page content
        hidePage: function(pageId) {
            var pageElement = document.getElementById('page-' + pageId);
            if (pageElement) {
                // Clean up charts on the page being hidden
                this.cleanupPageCharts(pageElement);
                
                pageElement.style.display = 'none';
                pageElement.classList.add('page-hidden');
                pageElement.setAttribute('aria-hidden', 'true');
            }
        },
        
        // Clean up charts on a page
        cleanupPageCharts: function(pageElement) {
            if (window.PageRenderers && window.PageRenderers.clearPageCharts) {
                var pageId = pageElement.id.replace('page-', '');
                window.PageRenderers.clearPageCharts(pageId);
            } else {
                // Fallback cleanup
                var canvases = pageElement.querySelectorAll('canvas');
                canvases.forEach(function(canvas) {
                    try {
                        var chart = canvas.chart;
                        if (chart) {
                            chart.destroy();
                        }
                    } catch (error) {
                        console.warn('Error cleaning up chart:', error);
                    }
                });
            }
        },
        
        // Show page content
        showPage: function(pageId) {
            // First hide all pages
            this.hideAllPages();
            
            // Then show the requested page
            var pageElement = document.getElementById('page-' + pageId);
            if (pageElement) {
                pageElement.style.display = 'block';
                pageElement.classList.remove('page-hidden');
                pageElement.classList.add('active');
                pageElement.setAttribute('aria-hidden', 'false');
                
                // Update tab buttons
                this.updateTabButtons(pageId);
                
                // Render charts for this page if data is available
                if (window.PageRenderers && window.PageRenderers.currentData) {
                    setTimeout(function() {
                        window.PageRenderers.renderPageCharts(pageId, window.PageRenderers.currentData);
                    }, 50);
                }
                
                // Trigger custom show event for page-specific logic
                var showEvent = document.createEvent('CustomEvent');
                showEvent.initCustomEvent('pageShow', true, true, { pageId: pageId });
                pageElement.dispatchEvent(showEvent);
            } else {
                console.warn('Page element not found:', 'page-' + pageId);
            }
        },
        
        // Hide all pages
        hideAllPages: function() {
            var self = this;
            this.pages.forEach(function(pageId) {
                var pageElement = document.getElementById('page-' + pageId);
                if (pageElement) {
                    // Clean up charts on the page being hidden
                    if (pageElement.style.display !== 'none') {
                        self.cleanupPageCharts(pageElement);
                    }
                    
                    pageElement.style.display = 'none';
                    pageElement.classList.add('page-hidden');
                    pageElement.classList.remove('active');
                    pageElement.setAttribute('aria-hidden', 'true');
                }
            });
        },
        
        // Refresh charts on newly visible page
        refreshPageCharts: function(pageId) {
            var self = this;
            
            // Small delay to ensure DOM is updated
            setTimeout(function() {
                var pageElement = document.getElementById('page-' + pageId);
                if (!pageElement) return;
                
                var canvases = pageElement.querySelectorAll('canvas');
                canvases.forEach(function(canvas) {
                    try {
                        var chart = canvas.chart;
                        if (chart && chart.resize) {
                            // Resize chart to fit container
                            chart.resize();
                            
                            // Force update
                            chart.update('none'); // No animation for performance
                        }
                    } catch (error) {
                        console.warn('Chart refresh error:', error);
                    }
                });
                
                // Trigger chart refresh event for any custom handling
                var chartRefreshEvent = document.createEvent('CustomEvent');
                chartRefreshEvent.initCustomEvent('chartsRefresh', true, true, { pageId: pageId });
                window.dispatchEvent(chartRefreshEvent);
                
            }, 50);
        },
        
        // Trigger page change event
        triggerPageChangeEvent: function(pageId) {
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent('tabChanged', true, true, {
                pageId: pageId,
                previousPage: this.currentPage,
                timestamp: Date.now()
            });
            window.dispatchEvent(event);
        },
        
        // Get current page
        getCurrentPage: function() {
            return this.currentPage;
        },
        
        // Get all available pages
        getAvailablePages: function() {
            return this.pages.slice(); // Return copy
        },
        
        // Get current active page
        getCurrentPage: function() {
            return this.currentPage;
        },
        
        // Check if page exists
        pageExists: function(pageId) {
            return this.pages.indexOf(pageId) > -1;
        },
        
        // Preload all pages (make sure they exist in DOM)
        preloadPages: function() {
            var self = this;
            var dashboard = document.querySelector('.dashboard');
            if (!dashboard) return;
            
            this.pages.forEach(function(pageId) {
                var existingPage = document.getElementById('page-' + pageId);
                if (!existingPage) {
                    var pageElement = document.createElement('div');
                    pageElement.id = 'page-' + pageId;
                    pageElement.className = 'page-content';
                    pageElement.setAttribute('data-page', pageId);
                    pageElement.style.display = 'none';
                    
                    // Add loading placeholder
                    pageElement.innerHTML = 
                        '<div class="page-loading">' +
                            '<div class="loading-spinner"></div>' +
                            '<div class="loading-text">Загрузка страницы "' + 
                            self.pageTitles[pageId] + '"...</div>' +
                        '</div>';
                    
                    dashboard.appendChild(pageElement);
                }
            });
        },
        
        // Handle browser back/forward navigation
        handleBrowserNavigation: function() {
            var self = this;
            
            // Listen for popstate events
            window.addEventListener('popstate', function(event) {
                var state = event.state;
                if (state && state.page && self.pageExists(state.page)) {
                    self.switchTab(state.page);
                }
            });
            
            // Update browser history on tab changes
            window.addEventListener('tabChanged', function(event) {
                var pageId = event.detail.pageId;
                var url = window.location.pathname + '?page=' + pageId;
                var title = 'CFO Dashboard - ' + self.pageTitles[pageId];
                
                history.pushState({ page: pageId }, title, url);
                document.title = title;
            });
        },
        
        // Initialize from URL parameters
        initializeFromURL: function() {
            var params = new URLSearchParams(window.location.search);
            var pageParam = params.get('page');
            
            if (pageParam && this.pageExists(pageParam)) {
                this.currentPage = pageParam;
            }
        }
    };
    
    // Auto-initialize when DOM is ready
    function initializeTabs() {
        TabManager.initializeFromURL();
        TabManager.preloadPages();
        TabManager.initialize();
        TabManager.handleBrowserNavigation();
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTabs);
    } else {
        initializeTabs();
    }
    
    // Export to window for global access
    window.TabManager = TabManager;
    
    // Export commonly used functions
    window.switchTab = function(pageId) {
        return TabManager.switchTab(pageId);
    };
    
    window.getCurrentPage = function() {
        return TabManager.getCurrentPage();
    };
    
    window.setCurrentPage = function(pageId) {
        return TabManager.switchTab(pageId);
    };
    
})();