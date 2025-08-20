/**
 * Utility Functions Module
 * Common formatting and helper functions for CFO Dashboard
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var FormatUtils = {
        // Number formatting
        formatMoney: function(amount, currency, precision) {
            currency = currency || 'RUB';
            precision = precision !== undefined ? precision : 0;
            
            if (!amount && amount !== 0) return '—';
            
            var formatted;
            var abs = Math.abs(amount);
            
            // Auto-scale large numbers
            if (abs >= 1000000000) {
                formatted = (amount / 1000000000).toFixed(precision) + ' млрд';
            } else if (abs >= 1000000) {
                formatted = (amount / 1000000).toFixed(precision) + ' млн';
            } else if (abs >= 1000) {
                formatted = (amount / 1000).toFixed(precision) + ' тыс';
            } else {
                formatted = amount.toFixed(precision);
            }
            
            // Add currency symbol
            switch (currency) {
                case 'RUB': return formatted + ' ₽';
                case 'USD': return '$' + formatted;
                case 'EUR': return '€' + formatted;
                default: return formatted + ' ' + currency;
            }
        },
        
        formatNumber: function(number, precision) {
            precision = precision !== undefined ? precision : 0;
            if (!number && number !== 0) return '—';
            
            var formatted = parseFloat(number).toFixed(precision);
            
            // Add thousands separators
            return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        },
        
        formatPercent: function(value, precision) {
            precision = precision !== undefined ? precision : 1;
            if (!value && value !== 0) return '—';
            
            return parseFloat(value).toFixed(precision) + '%';
        },
        
        formatChange: function(value, isPercent) {
            if (!value && value !== 0) return { text: '—', class: 'neutral' };
            
            var text = isPercent ? 
                this.formatPercent(Math.abs(value)) : 
                this.formatNumber(Math.abs(value), 1);
            
            var prefix = value > 0 ? '+' : '';
            var cssClass = value > 0 ? 'positive' : (value < 0 ? 'negative' : 'neutral');
            
            return {
                text: prefix + text,
                class: cssClass
            };
        },
        
        // Date formatting  
        formatDate: function(dateStr, format) {
            format = format || 'DD.MM.YYYY';
            
            if (!dateStr) return '—';
            
            var date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            
            var day = ('0' + date.getDate()).slice(-2);
            var month = ('0' + (date.getMonth() + 1)).slice(-2);
            var year = date.getFullYear();
            
            switch (format) {
                case 'DD.MM.YYYY': return day + '.' + month + '.' + year;
                case 'MM/YYYY': return month + '/' + year;
                case 'YYYY-MM': return year + '-' + month;
                default: return dateStr;
            }
        },
        
        formatPeriod: function(dateFrom, dateTo) {
            if (!dateFrom || !dateTo) return '—';
            
            var from = new Date(dateFrom);
            var to = new Date(dateTo);
            
            if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
                // Same month
                return this.formatDate(dateFrom, 'MM/YYYY');
            } else if (from.getFullYear() === to.getFullYear()) {
                // Same year
                return ('0' + (from.getMonth() + 1)).slice(-2) + '-' + 
                       ('0' + (to.getMonth() + 1)).slice(-2) + '/' + from.getFullYear();
            } else {
                // Different years
                return this.formatDate(dateFrom, 'MM/YYYY') + ' — ' + this.formatDate(dateTo, 'MM/YYYY');
            }
        },
        
        // Risk assessment
        assessRisk: function(value, thresholds) {
            if (!thresholds || (!value && value !== 0)) return 'unknown';
            
            if (value >= thresholds.critical) return 'critical';
            if (value >= thresholds.high) return 'high';
            if (value >= thresholds.medium) return 'medium';
            return 'low';
        },
        
        // Color utils for charts
        getColorByRisk: function(risk) {
            switch (risk) {
                case 'critical': return '#ff3b30';
                case 'high': return '#ff6347';
                case 'medium': return '#ff9500';
                case 'low': return '#34c759';
                default: return '#8e8e93';
            }
        },
        
        // Text truncation
        truncateText: function(text, maxLength) {
            if (!text || text.length <= maxLength) return text;
            return text.substring(0, maxLength - 3) + '...';
        },
        
        // Deep object cloning (ES5 compatible)
        deepClone: function(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(this.deepClone.bind(this));
            
            var cloned = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        },
        
        // Sparkline data generation
        generateSparklineData: function(values, length) {
            length = length || 7;
            if (!values || values.length === 0) {
                // Generate dummy data
                var dummy = [];
                var base = 100;
                for (var i = 0; i < length; i++) {
                    base += (Math.random() - 0.5) * 20;
                    dummy.push(Math.max(0, base));
                }
                return dummy;
            }
            
            // Take last N values or pad with zeros
            if (values.length >= length) {
                return values.slice(-length);
            } else {
                var padded = new Array(length - values.length).fill(0);
                return padded.concat(values);
            }
        }
    };
    
    var DOMUtils = {
        // DOM manipulation helpers (ES5 compatible)
        createElement: function(tag, className, innerHTML) {
            var el = document.createElement(tag);
            if (className) el.className = className;
            if (innerHTML) el.innerHTML = innerHTML;
            return el;
        },
        
        findElement: function(selector) {
            return document.querySelector(selector);
        },
        
        findElements: function(selector) {
            return document.querySelectorAll(selector);
        },
        
        addClass: function(element, className) {
            if (element && className) {
                var classes = element.className.split(' ');
                if (classes.indexOf(className) === -1) {
                    classes.push(className);
                    element.className = classes.join(' ').trim();
                }
            }
        },
        
        removeClass: function(element, className) {
            if (element && className) {
                var classes = element.className.split(' ');
                var index = classes.indexOf(className);
                if (index > -1) {
                    classes.splice(index, 1);
                    element.className = classes.join(' ').trim();
                }
            }
        },
        
        toggleClass: function(element, className) {
            if (!element || !className) return;
            
            var classes = element.className.split(' ');
            var index = classes.indexOf(className);
            if (index > -1) {
                classes.splice(index, 1);
            } else {
                classes.push(className);
            }
            element.className = classes.join(' ').trim();
        },
        
        hasClass: function(element, className) {
            if (!element || !className) return false;
            return element.className.split(' ').indexOf(className) > -1;
        },
        
        // Animation helpers (CSS-based for old WebKit)
        fadeIn: function(element, duration) {
            duration = duration || 300;
            element.style.opacity = '0';
            element.style.display = 'block';
            element.style.transition = 'opacity ' + duration + 'ms ease';
            
            setTimeout(function() {
                element.style.opacity = '1';
            }, 10);
        },
        
        fadeOut: function(element, duration, callback) {
            duration = duration || 300;
            element.style.transition = 'opacity ' + duration + 'ms ease';
            element.style.opacity = '0';
            
            setTimeout(function() {
                element.style.display = 'none';
                if (callback) callback();
            }, duration);
        }
    };
    
    var PerformanceUtils = {
        // Performance measurement
        mark: function(name) {
            if (window.performance && performance.mark) {
                performance.mark(name);
            } else {
                window._perfMarks = window._perfMarks || {};
                window._perfMarks[name] = Date.now();
            }
        },
        
        measure: function(name, startMark, endMark) {
            if (window.performance && performance.measure && performance.mark) {
                if (endMark) {
                    performance.mark(endMark);
                }
                performance.measure(name, startMark, endMark);
                var measures = performance.getEntriesByName(name);
                return measures.length > 0 ? measures[measures.length - 1].duration : 0;
            } else {
                // Fallback for old WebKit
                var marks = window._perfMarks || {};
                var start = marks[startMark] || 0;
                var end = endMark ? marks[endMark] : Date.now();
                return end - start;
            }
        },
        
        // Debounce function for performance
        debounce: function(func, delay) {
            var timeoutId;
            return function() {
                var context = this;
                var args = arguments;
                clearTimeout(timeoutId);
                timeoutId = setTimeout(function() {
                    func.apply(context, args);
                }, delay);
            };
        },
        
        // Throttle function
        throttle: function(func, delay) {
            var timeoutId;
            var lastExecTime = 0;
            return function() {
                var context = this;
                var args = arguments;
                var currentTime = Date.now();
                
                if (currentTime - lastExecTime > delay) {
                    func.apply(context, args);
                    lastExecTime = currentTime;
                } else {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(function() {
                        func.apply(context, args);
                        lastExecTime = Date.now();
                    }, delay - (currentTime - lastExecTime));
                }
            };
        },
        
        // Record render times for performance tracking
        recordRenderTime: function(component, time) {
            if (window.DashboardState && typeof window.DashboardState.recordRenderTime === 'function') {
                window.DashboardState.recordRenderTime(component, time);
            } else {
                // Fallback - just log to console in debug mode
                if (window.CFODashboard && window.CFODashboard.config && window.CFODashboard.config.enableDebugMode) {
                    console.log('Render time for ' + component + ': ' + time + 'ms');
                }
            }
        }
    };
    
    // Export utilities to window for global access
    window.FormatUtils = FormatUtils;
    window.DOMUtils = DOMUtils;
    window.PerformanceUtils = PerformanceUtils;
    
    // Export commonly used formatters
    window.formatMoney = FormatUtils.formatMoney;
    window.formatNumber = FormatUtils.formatNumber;
    window.formatPercent = FormatUtils.formatPercent;
    window.formatDate = FormatUtils.formatDate;
    
})();