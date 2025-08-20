/**
 * Advanced Analytics Module (Fixed)
 * Provides basic trend analysis and business insights
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var AdvancedAnalytics = {
        analysisCache: {},
        alertThresholds: {
            revenueDecline: 0.05, // 5% decline
            marginDrop: 0.02,     // 2% points
            cashLow: 30,          // 30 days runway
            arHigh: 45            // 45 days DSO
        },
        
        // Initialize analytics module
        initialize: function() {
            this.setupAnalyticsUI();
            this.bindAnalyticsEvents();
        },
        
        // Setup analytics UI elements
        setupAnalyticsUI: function() {
            this.createAnalyticsButton();
            this.createAnalyticsPanel();
        },
        
        // Create analytics button in toolbar
        createAnalyticsButton: function() {
            var button = document.createElement('button');
            button.id = 'analytics-btn';
            button.className = 'analytics-btn';
            button.innerHTML = '📊';
            button.title = 'Аналитика и прогнозы';
            
            var interactionStatus = document.querySelector('.interaction-status');
            if (interactionStatus && interactionStatus.children.length > 1) {
                interactionStatus.insertBefore(button, interactionStatus.children[2]);
            }
        },
        
        // Create analytics panel
        createAnalyticsPanel: function() {
            var panel = document.createElement('div');
            panel.id = 'analytics-panel';
            panel.className = 'analytics-panel';
            panel.style.display = 'none';
            
            panel.innerHTML = 
                '<div class="analytics-header">' +
                '<h3>Аналитика и прогнозы</h3>' +
                '<button class="close-btn" onclick="this.closest(\'#analytics-panel\').style.display=\'none\'">×</button>' +
                '</div>' +
                '<div class="analytics-content">' +
                '<div class="analytics-tabs">' +
                '<button class="analytics-tab active" data-tab="insights">Инсайты</button>' +
                '<button class="analytics-tab" data-tab="forecasts">Прогнозы</button>' +
                '</div>' +
                '<div class="analytics-tab-content">' +
                '<div id="insights-content" class="analytics-section active">' +
                '<div id="insights-list">Анализируем данные...</div>' +
                '</div>' +
                '<div id="forecasts-content" class="analytics-section">' +
                '<div id="forecasts-list">Строим прогнозы...</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            
            document.body.appendChild(panel);
        },
        
        // Bind analytics events
        bindAnalyticsEvents: function() {
            var self = this;
            
            // Analytics button click
            document.addEventListener('click', function(event) {
                if (event.target.id === 'analytics-btn') {
                    var panel = document.getElementById('analytics-panel');
                    if (panel.style.display === 'none') {
                        panel.style.display = 'block';
                        self.loadInsights();
                    } else {
                        panel.style.display = 'none';
                    }
                }
                
                // Analytics tabs
                if (event.target.classList.contains('analytics-tab')) {
                    self.switchAnalyticsTab(event.target.getAttribute('data-tab'));
                }
            });
        },
        
        // Switch analytics tab
        switchAnalyticsTab: function(tabName) {
            // Update tab buttons
            var tabs = document.querySelectorAll('.analytics-tab');
            tabs.forEach(function(tab) {
                tab.classList.remove('active');
            });
            document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
            
            // Update content
            var sections = document.querySelectorAll('.analytics-section');
            sections.forEach(function(section) {
                section.classList.remove('active');
            });
            document.getElementById(tabName + '-content').classList.add('active');
            
            // Load content for the tab
            switch (tabName) {
                case 'insights':
                    this.loadInsights();
                    break;
                case 'forecasts':
                    this.loadForecasts();
                    break;
            }
        },
        
        // Load business insights
        loadInsights: function() {
            var data = window.DataManager ? window.DataManager.getData() : null;
            if (!data) {
                document.getElementById('insights-list').innerHTML = 'Нет данных для анализа';
                return;
            }
            
            var insights = this.generateInsights(data);
            var container = document.getElementById('insights-list');
            
            if (insights.length === 0) {
                container.innerHTML = 'Все показатели в норме';
                return;
            }
            
            container.innerHTML = insights.map(function(insight) {
                var iconClass = insight.type === 'positive' ? '📈' : 
                               insight.type === 'negative' ? '📉' : '💡';
                               
                return '<div class="insight-item ' + insight.type + '">' +
                    '<div class="insight-icon">' + iconClass + '</div>' +
                    '<div class="insight-content">' +
                    '<div class="insight-title">' + insight.title + '</div>' +
                    '<div class="insight-description">' + insight.description + '</div>' +
                    '</div>' +
                    '</div>';
            }).join('');
        },
        
        // Generate business insights
        generateInsights: function(data) {
            var insights = [];
            
            if (data.kpi) {
                // Revenue insights
                if (data.kpi.revenue && data.kpi.revenue.momChange) {
                    var revenueChange = data.kpi.revenue.momChange;
                    if (revenueChange > 10) {
                        insights.push({
                            type: 'positive',
                            title: 'Ускорение роста выручки',
                            description: 'Выручка растёт на ' + revenueChange.toFixed(1) + '% м/м, что превышает плановые показатели.'
                        });
                    } else if (revenueChange < -5) {
                        insights.push({
                            type: 'negative',
                            title: 'Снижение выручки',
                            description: 'Выручка снизилась на ' + Math.abs(revenueChange).toFixed(1) + '% м/м. Необходимо проанализировать причины.'
                        });
                    }
                }
                
                // Margin insights
                if (data.kpi.margins && data.kpi.margins.ebitda) {
                    var margin = data.kpi.margins.ebitda;
                    if (margin > 25) {
                        insights.push({
                            type: 'positive',
                            title: 'Высокая маржинальность',
                            description: 'EBITDA маржа ' + margin.toFixed(1) + '% указывает на эффективное управление затратами.'
                        });
                    } else if (margin < 15) {
                        insights.push({
                            type: 'negative',
                            title: 'Низкая маржинальность',
                            description: 'EBITDA маржа ' + margin.toFixed(1) + '% ниже отраслевых стандартов.'
                        });
                    }
                }
            }
            
            return insights;
        },
        
        // Load forecasts
        loadForecasts: function() {
            var data = window.DataManager ? window.DataManager.getData() : null;
            if (!data) {
                document.getElementById('forecasts-list').innerHTML = 'Нет данных для прогнозов';
                return;
            }
            
            var forecasts = this.generateForecasts(data);
            var container = document.getElementById('forecasts-list');
            
            container.innerHTML = forecasts.map(function(forecast) {
                return '<div class="forecast-item">' +
                    '<div class="forecast-metric">' + forecast.metric + '</div>' +
                    '<div class="forecast-period">' + forecast.period + '</div>' +
                    '<div class="forecast-value">' + forecast.value + '</div>' +
                    '<div class="forecast-confidence">Точность: ' + forecast.confidence + '%</div>' +
                    '</div>';
            }).join('');
        },
        
        // Generate forecasts
        generateForecasts: function(data) {
            var forecasts = [];
            
            if (data.timeSeries && data.timeSeries.revenue && data.timeSeries.revenue.fact) {
                var revenue = data.timeSeries.revenue.fact;
                var trend = this.calculateLinearTrend(revenue);
                var nextMonthRevenue = revenue[revenue.length - 1] + trend;
                
                forecasts.push({
                    metric: 'Выручка',
                    period: 'Следующий месяц',
                    value: this.formatMoney(nextMonthRevenue),
                    confidence: this.calculateConfidence(revenue)
                });
            }
            
            return forecasts;
        },
        
        // Calculate linear trend
        calculateLinearTrend: function(data) {
            if (data.length < 2) return 0;
            
            var n = data.length;
            var sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            
            for (var i = 0; i < n; i++) {
                sumX += i;
                sumY += data[i];
                sumXY += i * data[i];
                sumXX += i * i;
            }
            
            var slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            return slope || 0;
        },
        
        // Calculate forecast confidence
        calculateConfidence: function(data) {
            if (data.length < 3) return 50;
            
            var variance = this.calculateVariance(data);
            var cv = Math.sqrt(variance) / this.average(data);
            
            // Lower coefficient of variation = higher confidence
            var confidence = Math.max(50, Math.min(95, 100 - cv * 100));
            return Math.round(confidence);
        },
        
        // Calculate variance
        calculateVariance: function(data) {
            var avg = this.average(data);
            var squaredDiffs = data.map(function(val) {
                return Math.pow(val - avg, 2);
            });
            return this.average(squaredDiffs);
        },
        
        // Calculate average
        average: function(data) {
            return data.reduce(function(a, b) { return a + b; }) / data.length;
        },
        
        // Format money values
        formatMoney: function(value) {
            return (value / 1000000).toFixed(1) + ' млн ₽';
        }
    };
    
    // Add CSS styles
    var style = document.createElement('style');
    style.textContent = 
        '.analytics-btn {' +
        '    border: none; background: var(--panel); padding: 6px 10px;' +
        '    border-radius: 8px; cursor: pointer; font-size: 12px;' +
        '    box-shadow: var(--shadow);' +
        '}' +
        '.analytics-btn:hover { background: #f0f0f0; }' +
        '.analytics-panel {' +
        '    position: fixed; top: 10%; right: 24px; width: 450px;' +
        '    max-height: 80vh; overflow-y: auto; background: white;' +
        '    border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);' +
        '    z-index: 1000;' +
        '}' +
        '.analytics-header {' +
        '    padding: 16px; border-bottom: 1px solid #eee;' +
        '    display: flex; justify-content: space-between; align-items: center;' +
        '}' +
        '.analytics-tabs {' +
        '    display: flex; border-bottom: 1px solid #eee;' +
        '}' +
        '.analytics-tab {' +
        '    flex: 1; padding: 12px 8px; border: none; background: none;' +
        '    cursor: pointer; font-size: 12px;' +
        '}' +
        '.analytics-tab.active {' +
        '    background: #007AFF; color: white;' +
        '}' +
        '.analytics-section {' +
        '    display: none; padding: 16px;' +
        '}' +
        '.analytics-section.active {' +
        '    display: block;' +
        '}' +
        '.insight-item, .forecast-item {' +
        '    padding: 12px; border-bottom: 1px solid #f0f0f0;' +
        '    display: flex; gap: 12px;' +
        '}' +
        '.insight-icon {' +
        '    font-size: 20px; flex-shrink: 0;' +
        '}' +
        '.insight-content {' +
        '    flex: 1;' +
        '}' +
        '.insight-title {' +
        '    font-weight: 600; margin-bottom: 4px;' +
        '}' +
        '.insight-description {' +
        '    font-size: 13px; color: #666;' +
        '}';
    document.head.appendChild(style);
    
    // Export to window
    window.AdvancedAnalytics = AdvancedAnalytics;
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            AdvancedAnalytics.initialize();
        }, 2000);
    });
    
})();