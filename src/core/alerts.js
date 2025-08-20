/**
 * Alerts Engine Module
 * Processes alerts based on data and alerts-config.json rules
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var AlertsEngine = {
        config: null,
        activeAlerts: [],
        alertContainer: null,
        
        // Initialize alerts engine
        initialize: function(alertsConfig, bellSelector, panelSelector, bodySelector) {
            this.config = alertsConfig || {};
            this.initializeWithExistingElements(bellSelector, panelSelector, bodySelector);
            this.bindAlertEvents();
        },
        
        // Initialize with existing UI elements
        initializeWithExistingElements: function(bellSelector, panelSelector, bodySelector) {
            this.alertBell = document.querySelector(bellSelector || '#alerts-bell');
            this.alertPanel = document.querySelector(panelSelector || '#alerts-panel');
            this.alertContainer = document.querySelector(bodySelector || '#alerts-body');
            
            // Fallback to creating container if not found
            if (!this.alertContainer) {
                this.createAlertContainer();
            }
        },
        
        // Load alerts configuration
        loadConfig: function(configData) {
            try {
                this.config = typeof configData === 'string' ? JSON.parse(configData) : configData;
                return { success: true };
            } catch (error) {
                console.error('Failed to load alerts config:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Process data against alert rules
        processAlerts: function(data) {
            var alerts = [];
            
            // Process alerts from data directly (if available)
            if (data && data.alerts && Array.isArray(data.alerts)) {
                alerts = data.alerts.map(function(alert) {
                    return {
                        id: alert.type || 'alert',
                        type: alert.type || 'warning',
                        severity: alert.severity || 'medium',
                        name: AlertsEngine.getSeverityLabel(alert.severity) + ' уведомление',
                        message: alert.message || 'Внимание требуется',
                        value: alert.value,
                        threshold: alert.threshold,
                        recommendations: [],
                        timestamp: new Date().toISOString()
                    };
                });
            }
            
            // Process configuration-based rules if config is available
            if (this.config && this.config.alertRules && data) {
                var rules = this.config.alertRules;
                var settings = this.config.alertSettings || {};
                var enabledAlerts = settings.enabledAlerts || Object.keys(rules);
                
                // Process each enabled alert rule
                enabledAlerts.forEach(function(ruleId) {
                    var rule = rules[ruleId];
                    if (!rule) return;
                    
                    var alert = AlertsEngine.evaluateRule(ruleId, rule, data);
                    if (alert) {
                        alerts.push(alert);
                    }
                });
            }
            
            // Sort by severity and limit count
            alerts.sort(function(a, b) {
                var severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
                return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
            });
            
            var maxAlerts = (this.config && this.config.alertSettings && this.config.alertSettings.maxAlertsDisplayed) || 5;
            alerts = alerts.slice(0, maxAlerts);
            
            this.activeAlerts = alerts;
            this.displayAlerts();
            
            return alerts;
        },
        
        // Evaluate single alert rule
        evaluateRule: function(ruleId, rule, data) {
            try {
                var value = this.getMetricValue(rule.metric, data);
                if (value === null || value === undefined) {
                    return null; // Skip if metric not available
                }
                
                var triggered = this.checkThreshold(value, rule.operator, rule.thresholds);
                if (!triggered.isTriggered) {
                    return null;
                }
                
                // Create alert object
                return {
                    id: ruleId,
                    type: ruleId,
                    severity: triggered.severity,
                    name: rule.name,
                    message: this.formatMessage(rule.message, value),
                    value: value,
                    threshold: triggered.threshold,
                    recommendations: rule.recommendations || [],
                    timestamp: new Date().toISOString(),
                    actions: this.config.alertActions ? this.config.alertActions[ruleId] : null
                };
                
            } catch (error) {
                console.error('Error evaluating rule', ruleId, ':', error);
                return null;
            }
        },
        
        // Get metric value from data using dot notation
        getMetricValue: function(metric, data) {
            var path = metric.split('.');
            var value = data;
            
            for (var i = 0; i < path.length; i++) {
                if (value === null || value === undefined) {
                    return null;
                }
                value = value[path[i]];
            }
            
            // Handle special calculated metrics
            if (metric === 'maxBankConcentration' && data.cashAccounts) {
                return this.calculateMaxBankConcentration(data.cashAccounts);
            }
            
            if (metric === 'marginVariance' && data.kpi && data.kpi.margins) {
                return this.calculateMarginVariance(data.kpi.margins);
            }
            
            if (metric === 'revenueVariancePercent' && data.kpi && data.kpi.revenue) {
                return this.calculateRevenueVariance(data.kpi.revenue);
            }
            
            return value;
        },
        
        // Check if value triggers alert threshold
        checkThreshold: function(value, operator, thresholds) {
            var severities = ['critical', 'high', 'medium', 'low'];
            
            for (var i = 0; i < severities.length; i++) {
                var severity = severities[i];
                var threshold = thresholds[severity];
                
                if (threshold === undefined) continue;
                
                var triggered = false;
                switch (operator) {
                    case 'greater_than':
                        triggered = value > threshold;
                        break;
                    case 'less_than':
                        triggered = value < threshold;
                        break;
                    case 'equals':
                        triggered = value === threshold;
                        break;
                    default:
                        triggered = value > threshold;
                }
                
                if (triggered) {
                    return {
                        isTriggered: true,
                        severity: severity,
                        threshold: threshold
                    };
                }
            }
            
            return { isTriggered: false };
        },
        
        // Format alert message with value substitution
        formatMessage: function(template, value) {
            if (typeof template !== 'string') return '';
            
            return template.replace(/\{value\}/g, this.formatValue(value));
        },
        
        // Format value for display
        formatValue: function(value) {
            if (typeof value === 'number') {
                if (Math.abs(value) >= 1000000) {
                    return (value / 1000000).toFixed(1);
                }
                return value.toFixed(1);
            }
            return String(value);
        },
        
        // Calculate special metrics
        calculateMaxBankConcentration: function(cashAccounts) {
            if (!Array.isArray(cashAccounts) || cashAccounts.length === 0) {
                return 0;
            }
            
            var maxConcentration = 0;
            cashAccounts.forEach(function(account) {
                if (account.concentration > maxConcentration) {
                    maxConcentration = account.concentration;
                }
            });
            
            return maxConcentration;
        },
        
        calculateMarginVariance: function(margins) {
            // Placeholder - would need plan data to calculate actual variance
            return 0;
        },
        
        calculateRevenueVariance: function(revenue) {
            if (revenue && revenue.momChange) {
                return revenue.momChange;
            }
            return 0;
        },
        
        // Create alerts display container
        createAlertContainer: function() {
            this.alertContainer = document.getElementById('alerts-container');
            if (!this.alertContainer) {
                this.alertContainer = document.createElement('div');
                this.alertContainer.id = 'alerts-container';
                this.alertContainer.className = 'alerts-container';
                
                // Insert after header
                var header = document.querySelector('.dashboard-header');
                if (header && header.nextSibling) {
                    header.parentNode.insertBefore(this.alertContainer, header.nextSibling);
                } else if (header) {
                    header.parentNode.appendChild(this.alertContainer);
                } else {
                    document.body.appendChild(this.alertContainer);
                }
            }
        },
        
        // Display alerts in UI
        displayAlerts: function() {
            if (!this.alertContainer) return;
            
            // Clear existing alerts
            this.alertContainer.innerHTML = '';
            
            if (this.activeAlerts.length === 0) {
                this.alertContainer.style.display = 'none';
                return;
            }
            
            this.alertContainer.style.display = 'block';
            
            // Create alert elements
            this.activeAlerts.forEach(function(alert, index) {
                var alertElement = AlertsEngine.createAlertElement(alert, index);
                AlertsEngine.alertContainer.appendChild(alertElement);
            });
        },
        
        // Create individual alert element
        createAlertElement: function(alert, index) {
            var colors = this.config.severityColors || {
                'critical': '#ff3b30',
                'high': '#ff6347',
                'medium': '#ff9500',
                'low': '#34c759'
            };
            
            var alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-' + alert.severity;
            alertDiv.setAttribute('data-alert-id', alert.id);
            alertDiv.style.borderLeftColor = colors[alert.severity];
            
            var content = 
                '<div class="alert-header">' +
                    '<div class="alert-icon alert-icon-' + alert.severity + '">⚠</div>' +
                    '<div class="alert-title">' + alert.name + '</div>' +
                    '<div class="alert-severity alert-severity-' + alert.severity + '">' + 
                        this.getSeverityLabel(alert.severity) + 
                    '</div>' +
                    '<button class="alert-dismiss" onclick="AlertsEngine.dismissAlert(\'' + alert.id + '\')">×</button>' +
                '</div>' +
                '<div class="alert-message">' + alert.message + '</div>';
            
            // Add recommendations if available
            if (alert.recommendations && alert.recommendations.length > 0) {
                content += '<div class="alert-recommendations">';
                content += '<div class="recommendations-title">Рекомендации:</div>';
                content += '<ul>';
                alert.recommendations.forEach(function(rec) {
                    content += '<li>' + rec + '</li>';
                });
                content += '</ul>';
                content += '</div>';
            }
            
            // Add action buttons if available
            if (alert.actions && alert.actions.buttons) {
                content += '<div class="alert-actions">';
                alert.actions.buttons.forEach(function(button) {
                    content += '<button class="alert-action-btn" onclick="AlertsEngine.handleAlertAction(\'' + 
                        button.action + '\', \'' + alert.id + '\')">' + button.label + '</button>';
                });
                content += '</div>';
            }
            
            alertDiv.innerHTML = content;
            
            return alertDiv;
        },
        
        // Get severity label
        getSeverityLabel: function(severity) {
            var labels = {
                'critical': 'Критично',
                'high': 'Высокий',
                'medium': 'Средний',
                'low': 'Низкий'
            };
            return labels[severity] || severity;
        },
        
        // Bind alert events
        bindAlertEvents: function() {
            // Auto-hide alerts after timeout
            if (this.config.alertSettings && this.config.alertSettings.autoHideAfterMinutes > 0) {
                var timeout = this.config.alertSettings.autoHideAfterMinutes * 60 * 1000;
                setTimeout(function() {
                    AlertsEngine.hideAllAlerts();
                }, timeout);
            }
        },
        
        // Dismiss specific alert
        dismissAlert: function(alertId) {
            var alertElement = document.querySelector('[data-alert-id="' + alertId + '"]');
            if (alertElement) {
                alertElement.style.opacity = '0';
                alertElement.style.transform = 'translateX(100%)';
                
                setTimeout(function() {
                    if (alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                    }
                }, 300);
                
                // Remove from active alerts
                this.activeAlerts = this.activeAlerts.filter(function(alert) {
                    return alert.id !== alertId;
                });
                
                // Hide container if no alerts left
                if (this.activeAlerts.length === 0) {
                    setTimeout(function() {
                        if (AlertsEngine.alertContainer) {
                            AlertsEngine.alertContainer.style.display = 'none';
                        }
                    }, 300);
                }
            }
        },
        
        // Handle alert action button clicks
        handleAlertAction: function(actionId, alertId) {
            console.log('Alert action triggered:', actionId, 'for alert:', alertId);
            
            // Trigger custom event for action handling
            var actionEvent = document.createEvent('CustomEvent');
            actionEvent.initCustomEvent('alertAction', true, true, {
                actionId: actionId,
                alertId: alertId
            });
            window.dispatchEvent(actionEvent);
        },
        
        // Hide all alerts
        hideAllAlerts: function() {
            if (this.alertContainer) {
                this.alertContainer.style.display = 'none';
            }
            this.activeAlerts = [];
        },
        
        // Show alerts
        showAlerts: function() {
            if (this.alertContainer && this.activeAlerts.length > 0) {
                this.alertContainer.style.display = 'block';
            }
        },
        
        // Get active alerts
        getActiveAlerts: function() {
            return this.activeAlerts.slice(); // Return copy
        }
    };
    
    // Auto-initialize alerts when config is loaded
    function initializeAlerts() {
        // Try to load alerts config
        if (window.alertsConfig) {
            AlertsEngine.loadConfig(window.alertsConfig);
        }
        
        AlertsEngine.initialize();
        
        // Listen for data updates to process alerts
        window.addEventListener('dataUpdated', function(event) {
            if (event.detail && event.detail.data) {
                AlertsEngine.processAlerts(event.detail.data);
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAlerts);
    } else {
        initializeAlerts();
    }
    
    // Export to window
    window.AlertsEngine = AlertsEngine;
    
    // Export commonly used functions
    window.dismissAlert = function(alertId) {
        return AlertsEngine.dismissAlert(alertId);
    };
    
    window.hideAllAlerts = function() {
        return AlertsEngine.hideAllAlerts();
    };
    
    window.showAlerts = function() {
        return AlertsEngine.showAlerts();
    };
    
})();