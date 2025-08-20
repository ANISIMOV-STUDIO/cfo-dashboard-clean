/**
 * Real-time Updates and Animations Module (Fixed)
 * Handles live data updates, smooth transitions, and visual animations
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var RealtimeUpdates = {
        updateInterval: null,
        animationQueue: [],
        isAnimating: false,
        config: {
            updateFrequency: 30000, // 30 seconds
            animationDuration: 800,
            enableAutoRefresh: true,
            enableAnimations: true
        },
        
        // Initialize real-time updates
        initialize: function() {
            this.setupAutoRefresh();
            this.setupKPIAnimations();
            this.setupChartAnimations();
            this.bindVisibilityHandlers();
        },
        
        // Setup automatic data refresh
        setupAutoRefresh: function() {
            if (!this.config.enableAutoRefresh) return;
            
            var self = this;
            this.updateInterval = setInterval(function() {
                self.refreshAllData();
            }, this.config.updateFrequency);
            
            // Show auto-refresh indicator
            this.showAutoRefreshIndicator();
        },
        
        // Refresh all dashboard data
        refreshAllData: function() {
            if (!window.DataManager) return;
            
            var self = this;
            
            // Show loading state
            this.showLoadingState();
            
            // Simulate data fetch (in real app would be API call)
            setTimeout(function() {
                // Generate updated data with slight variations
                var updatedData = self.generateUpdatedData();
                
                // Load new data
                window.DataManager.loadData(updatedData);
                
                // Animate the updates
                self.animateDataUpdate();
                
                // Hide loading state
                self.hideLoadingState();
                
                // Show notification
                self.showUpdateNotification();
                
            }, 1000);
        },
        
        // Generate updated data with realistic variations
        generateUpdatedData: function() {
            var currentData = window.DataManager.getData();
            if (!currentData) return null;
            
            // Deep copy current data
            var updatedData = JSON.parse(JSON.stringify(currentData));
            
            // Add realistic variations to KPI values
            if (updatedData.kpi) {
                if (updatedData.kpi.revenue && updatedData.kpi.revenue.current) {
                    var revenueVariation = (Math.random() - 0.5) * 0.05; // ±2.5%
                    updatedData.kpi.revenue.current *= (1 + revenueVariation);
                }
                
                if (updatedData.kpi.ebitda) {
                    var ebitdaVariation = (Math.random() - 0.5) * 0.08; // ±4%
                    updatedData.kpi.ebitda *= (1 + ebitdaVariation);
                }
                
                if (updatedData.kpi.cashEnd) {
                    var cashVariation = (Math.random() - 0.5) * 0.03; // ±1.5%
                    updatedData.kpi.cashEnd *= (1 + cashVariation);
                }
            }
            
            // Update metadata
            updatedData.meta.lastUpdate = new Date().toISOString();
            
            return updatedData;
        },
        
        // Animate data update across all components
        animateDataUpdate: function() {
            if (!this.config.enableAnimations) return;
            
            // Queue animations for different components
            this.queueAnimation('kpi-cards', this.animateKPICards.bind(this));
            this.queueAnimation('charts', this.animateCharts.bind(this));
            
            // Execute animation queue
            this.executeAnimationQueue();
        },
        
        // Queue animation for execution
        queueAnimation: function(name, animationFunction) {
            this.animationQueue.push({
                name: name,
                execute: animationFunction,
                duration: this.config.animationDuration
            });
        },
        
        // Execute queued animations
        executeAnimationQueue: function() {
            if (this.isAnimating || this.animationQueue.length === 0) return;
            
            var self = this;
            this.isAnimating = true;
            
            var currentAnimation = this.animationQueue.shift();
            
            // Execute animation
            currentAnimation.execute();
            
            // Schedule next animation
            setTimeout(function() {
                self.isAnimating = false;
                self.executeAnimationQueue();
            }, currentAnimation.duration / 2); // Overlap animations slightly
        },
        
        // Setup KPI card animations
        setupKPIAnimations: function() {
            // Listen for data updates to trigger animations
            window.addEventListener('dataUpdated', function() {
                RealtimeUpdates.animateKPICards();
            });
        },
        
        // Animate KPI cards updates
        animateKPICards: function() {
            if (!window.KPICards) return;
            
            var cardTypes = ['revenue', 'ebitda', 'cash', 'margin'];
            var self = this;
            
            cardTypes.forEach(function(cardType, index) {
                setTimeout(function() {
                    // Pulse animation
                    self.pulseElement('.kpi-card.kpi-' + cardType);
                    
                    // Update with animation
                    if (window.KPICards.animateCard) {
                        window.KPICards.animateCard(cardType);
                    }
                }, index * 150); // Stagger animations
            });
        },
        
        // Setup chart animations
        setupChartAnimations: function() {
            // Enable Chart.js animations selectively
            var self = this;
            
            // Override chart update method to add custom animations
            if (window.Chart) {
                var originalUpdate = window.Chart.prototype.update;
                window.Chart.prototype.update = function(mode) {
                    if (self.config.enableAnimations && mode !== 'none') {
                        // Enable smooth transitions
                        this.options.animation = {
                            duration: self.config.animationDuration,
                            easing: 'easeOutQuart'
                        };
                    }
                    return originalUpdate.call(this, mode);
                };
            }
        },
        
        // Animate charts with data updates
        animateCharts: function() {
            var chartIds = [
                'revenue-trend-chart',
                'margins-trend-chart',
                'branches-sales-chart',
                'variance-chart'
            ];
            
            var self = this;
            
            chartIds.forEach(function(chartId, index) {
                setTimeout(function() {
                    var canvas = document.getElementById(chartId);
                    if (canvas) {
                        // Highlight chart briefly
                        self.highlightChart(chartId);
                        
                        // Get chart and update with animation
                        var chart = canvas.chart;
                        if (chart) {
                            chart.update('active');
                        }
                    }
                }, index * 200);
            });
        },
        
        // Pulse animation for elements
        pulseElement: function(selector) {
            var elements = document.querySelectorAll(selector);
            
            elements.forEach(function(element) {
                element.style.transition = 'transform 0.3s ease';
                element.style.transform = 'scale(1.02)';
                
                setTimeout(function() {
                    element.style.transform = 'scale(1)';
                    setTimeout(function() {
                        element.style.transition = '';
                    }, 300);
                }, 200);
            });
        },
        
        // Highlight chart with border animation
        highlightChart: function(chartId) {
            var canvas = document.getElementById(chartId);
            var card = canvas ? canvas.closest('.card') : null;
            if (!card) return;
            
            // Add highlight class
            card.classList.add('chart-highlight');
            
            // Remove after animation
            setTimeout(function() {
                card.classList.remove('chart-highlight');
            }, 1000);
        },
        
        // Show loading state during updates
        showLoadingState: function() {
            var indicator = document.getElementById('loading-indicator');
            if (indicator) {
                indicator.textContent = 'Обновление данных...';
                indicator.classList.add('updating');
            }
            
            // Disable interactions temporarily
            document.body.classList.add('updating');
        },
        
        // Hide loading state
        hideLoadingState: function() {
            var indicator = document.getElementById('loading-indicator');
            if (indicator) {
                indicator.textContent = 'ООО Прогресс • Декабрь 2024';
                indicator.classList.remove('updating');
            }
            
            // Re-enable interactions
            document.body.classList.remove('updating');
        },
        
        // Show auto-refresh indicator
        showAutoRefreshIndicator: function() {
            var indicator = document.createElement('div');
            indicator.id = 'auto-refresh-indicator';
            indicator.innerHTML = '🔄 Авто-обновление включено';
            indicator.style.cssText = 
                'position: fixed; bottom: 24px; left: 24px; background: rgba(0,122,255,0.9);' +
                'color: white; padding: 8px 12px; border-radius: 20px; font-size: 12px;' +
                'z-index: 100; animation: fadeInOut 3s ease;';
            
            document.body.appendChild(indicator);
            
            // Remove after showing
            setTimeout(function() {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 3000);
        },
        
        // Show update notification
        showUpdateNotification: function() {
            var notification = document.createElement('div');
            notification.className = 'update-notification';
            notification.innerHTML = '✨ Данные обновлены';
            notification.style.cssText = 
                'position: fixed; top: 100px; right: 24px; background: #27ae60;' +
                'color: white; padding: 12px 16px; border-radius: 8px; font-size: 14px;' +
                'z-index: 1000; animation: slideInRight 0.5s ease, fadeOut 0.5s ease 2s;' +
                'box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);';
            
            document.body.appendChild(notification);
            
            // Auto-remove
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        },
        
        // Bind page visibility handlers to pause/resume updates
        bindVisibilityHandlers: function() {
            var self = this;
            
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    self.pauseUpdates();
                } else {
                    self.resumeUpdates();
                }
            });
        },
        
        // Pause auto updates (when page is hidden)
        pauseUpdates: function() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        },
        
        // Resume auto updates
        resumeUpdates: function() {
            if (this.config.enableAutoRefresh && !this.updateInterval) {
                this.setupAutoRefresh();
            }
        },
        
        // Manually trigger data refresh
        triggerRefresh: function() {
            this.refreshAllData();
        },
        
        // Enable/disable auto refresh
        toggleAutoRefresh: function(enabled) {
            this.config.enableAutoRefresh = enabled;
            
            if (enabled) {
                this.resumeUpdates();
            } else {
                this.pauseUpdates();
            }
        },
        
        // Enable/disable animations
        toggleAnimations: function(enabled) {
            this.config.enableAnimations = enabled;
        },
        
        // Update refresh frequency
        setUpdateFrequency: function(seconds) {
            this.config.updateFrequency = seconds * 1000;
            
            // Restart with new frequency
            if (this.updateInterval) {
                this.pauseUpdates();
                this.resumeUpdates();
            }
        }
    };
    
    // Add CSS animations
    var style = document.createElement('style');
    style.textContent = 
        '@keyframes slideInRight {' +
        '    from { transform: translateX(100%); opacity: 0; }' +
        '    to { transform: translateX(0); opacity: 1; }' +
        '}' +
        '@keyframes fadeOut {' +
        '    to { opacity: 0; }' +
        '}' +
        '@keyframes fadeInOut {' +
        '    0% { opacity: 0; }' +
        '    20%, 80% { opacity: 1; }' +
        '    100% { opacity: 0; }' +
        '}' +
        '.chart-highlight {' +
        '    box-shadow: 0 0 0 2px #007AFF !important;' +
        '    transition: box-shadow 0.3s ease;' +
        '}' +
        '.updating {' +
        '    cursor: wait;' +
        '}' +
        '.updating * {' +
        '    pointer-events: none;' +
        '}' +
        '#loading-indicator.updating {' +
        '    color: #007AFF;' +
        '    font-weight: 600;' +
        '}';
    document.head.appendChild(style);
    
    // Export to window
    window.RealtimeUpdates = RealtimeUpdates;
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            RealtimeUpdates.initialize();
        }, 3000);
    });
    
})();