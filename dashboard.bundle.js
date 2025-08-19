/*!
 * CFO Dashboard Bundle v3.0.0
 * Includes: Minimal Chart.js, custom plugins, polyfills
 * Compatible with V8WebKit 8.3.27+
 * Build date: 2024-11-30
 */
(function(window) {
    'use strict';

    // Polyfills for older V8WebKit
    if (!Object.assign) {
        Object.assign = function(target, varArgs) {
            if (target == null) throw new TypeError('Cannot convert undefined or null to object');
            var to = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];
                if (nextSource != null) {
                    for (var nextKey in nextSource) {
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        };
    }

    if (!Array.from) {
        Array.from = function(arrayLike, mapFn, thisArg) {
            var C = this, items = Object(arrayLike);
            var len = parseInt(items.length) || 0;
            var A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
            for (var i = 0; i < len; i++) {
                var value = mapFn ? mapFn.call(thisArg, items[i], i) : items[i];
                A[i] = value;
            }
            A.length = len;
            return A;
        };
    }

    if (!Promise) {
        // Простая реализация Promise для старых WebKit
        window.Promise = function(executor) {
            var self = this;
            self.state = 'pending';
            self.value = undefined;
            self.handlers = [];
            
            function resolve(result) {
                if (self.state === 'pending') {
                    self.state = 'fulfilled';
                    self.value = result;
                    self.handlers.forEach(handle);
                    self.handlers = null;
                }
            }
            
            function reject(error) {
                if (self.state === 'pending') {
                    self.state = 'rejected';
                    self.value = error;
                    self.handlers.forEach(handle);
                    self.handlers = null;
                }
            }
            
            function handle(handler) {
                if (self.state === 'pending') {
                    self.handlers.push(handler);
                } else {
                    if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
                        handler.onFulfilled(self.value);
                    }
                    if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
                        handler.onRejected(self.value);
                    }
                }
            }
            
            this.then = function(onFulfilled, onRejected) {
                return new Promise(function(resolve, reject) {
                    handle({
                        onFulfilled: function(result) {
                            try {
                                if (typeof onFulfilled === 'function') {
                                    resolve(onFulfilled(result));
                                } else {
                                    resolve(result);
                                }
                            } catch (ex) {
                                reject(ex);
                            }
                        },
                        onRejected: function(error) {
                            try {
                                if (typeof onRejected === 'function') {
                                    resolve(onRejected(error));
                                } else {
                                    reject(error);
                                }
                            } catch (ex) {
                                reject(ex);
                            }
                        }
                    });
                });
            };
            
            executor(resolve, reject);
        };
        
        Promise.all = function(promises) {
            return new Promise(function(resolve, reject) {
                if (!Array.isArray(promises)) {
                    return reject(new TypeError('Promise.all accepts an array'));
                }
                var results = new Array(promises.length);
                var remaining = promises.length;
                if (remaining === 0) return resolve(results);
                
                promises.forEach(function(promise, index) {
                    Promise.resolve(promise).then(function(value) {
                        results[index] = value;
                        remaining--;
                        if (remaining === 0) resolve(results);
                    }, reject);
                });
            });
        };
    }

    // Minimal Chart.js implementation focusing on line and bar charts
    function MiniChart(ctx, config) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.config = config;
        this.data = config.data || {};
        this.options = config.options || {};
        this.plugins = config.plugins || [];
        this.type = config.type || 'line';
        
        this._setupCanvas();
        this.draw();
    }

    MiniChart.prototype._setupCanvas = function() {
        var canvas = this.canvas;
        var dpr = window.devicePixelRatio || 1;
        var rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    };

    MiniChart.prototype.draw = function() {
        var ctx = this.ctx;
        var canvas = this.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Run plugins
        this._runPlugins('beforeDraw');
        
        if (this.type === 'line') {
            this._drawLineChart();
        } else if (this.type === 'bar') {
            this._drawBarChart();
        }
        
        this._runPlugins('afterDraw');
    };

    MiniChart.prototype._runPlugins = function(hook) {
        var self = this;
        this.plugins.forEach(function(plugin) {
            if (plugin[hook]) {
                plugin[hook](self);
            }
        });
    };

    MiniChart.prototype._drawLineChart = function() {
        var ctx = this.ctx;
        var data = this.data;
        var canvas = this.canvas;
        
        if (!data.datasets || data.datasets.length === 0) return;
        
        var padding = 40;
        var chartWidth = canvas.width / (window.devicePixelRatio || 1) - padding * 2;
        var chartHeight = canvas.height / (window.devicePixelRatio || 1) - padding * 2;
        
        // Find data bounds
        var allValues = [];
        data.datasets.forEach(function(dataset) {
            if (dataset.data) {
                allValues = allValues.concat(dataset.data.filter(function(v) { return v !== null; }));
            }
        });
        
        var minY = Math.min.apply(Math, allValues);
        var maxY = Math.max.apply(Math, allValues);
        var rangeY = maxY - minY || 1;
        
        // Draw datasets
        data.datasets.forEach(function(dataset) {
            if (!dataset.data) return;
            
            ctx.strokeStyle = dataset.borderColor || '#333';
            ctx.lineWidth = dataset.borderWidth || 2;
            ctx.fillStyle = dataset.backgroundColor || dataset.borderColor || '#333';
            
            if (dataset.borderDash) {
                ctx.setLineDash(dataset.borderDash);
            } else {
                ctx.setLineDash([]);
            }
            
            ctx.beginPath();
            var firstPoint = true;
            
            dataset.data.forEach(function(value, index) {
                if (value === null) return;
                
                var x = padding + (index / (dataset.data.length - 1)) * chartWidth;
                var y = padding + chartHeight - ((value - minY) / rangeY) * chartHeight;
                
                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        });
    };

    MiniChart.prototype._drawBarChart = function() {
        var ctx = this.ctx;
        var data = this.data;
        var canvas = this.canvas;
        
        if (!data.datasets || data.datasets.length === 0) return;
        
        var padding = 40;
        var chartWidth = canvas.width / (window.devicePixelRatio || 1) - padding * 2;
        var chartHeight = canvas.height / (window.devicePixelRatio || 1) - padding * 2;
        
        var dataset = data.datasets[0];
        if (!dataset.data) return;
        
        var maxValue = Math.max.apply(Math, dataset.data);
        var barWidth = chartWidth / dataset.data.length * 0.8;
        var barGap = chartWidth / dataset.data.length * 0.2;
        
        dataset.data.forEach(function(value, index) {
            var barHeight = (value / maxValue) * chartHeight;
            var x = padding + index * (barWidth + barGap);
            var y = padding + chartHeight - barHeight;
            
            ctx.fillStyle = Array.isArray(dataset.backgroundColor) ? 
                dataset.backgroundColor[index] : dataset.backgroundColor || '#007aff';
            
            if (this.options.indexAxis === 'y') {
                // Horizontal bars
                ctx.fillRect(padding, y, (value / maxValue) * chartWidth, barWidth);
            } else {
                // Vertical bars
                ctx.fillRect(x, y, barWidth, barHeight);
            }
        }.bind(this));
    };

    MiniChart.prototype.update = function(mode) {
        this.draw();
    };

    MiniChart.prototype.destroy = function() {
        // Cleanup if needed
    };

    // Crisp Plugin for pixel-perfect lines
    var CrispPlugin = {
        id: 'crisp',
        beforeDraw: function(chart) {
            var ctx = chart.ctx;
            ctx.save();
            ctx.translate(0.5, 0.5);
        },
        afterDraw: function(chart) {
            chart.ctx.restore();
        }
    };

    // Waterfall Plugin
    var WaterfallPlugin = {
        id: 'waterfall',
        beforeDraw: function(chart) {
            if (chart.config.type !== 'bar' || !chart.config.waterfall) return;
            
            var ctx = chart.ctx;
            ctx.save();
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            
            // Draw connecting lines between bars
            // Implementation would go here for waterfall connections
            
            ctx.restore();
        }
    };

    // Variance Plugin
    var VariancePlugin = {
        id: 'variance',
        beforeDraw: function(chart) {
            if (!chart.config.variance) return;
            
            // Draw variance connecting lines
            var ctx = chart.ctx;
            ctx.save();
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            
            // Implementation for variance connectors
            
            ctx.restore();
        }
    };

    // Sparkline helper function
    function drawSparkline(canvas, data, options) {
        if (!canvas || !data || data.length < 2) return;
        
        var ctx = canvas.getContext('2d');
        var width = canvas.width;
        var height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        var min = Math.min.apply(Math, data);
        var max = Math.max.apply(Math, data);
        var range = max - min || 1;
        
        ctx.strokeStyle = options && options.color || '#2c3e50';
        ctx.lineWidth = options && options.lineWidth || 1.5;
        ctx.beginPath();
        
        data.forEach(function(value, index) {
            var x = (index / (data.length - 1)) * width;
            var y = height - ((value - min) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw last point
        var lastValue = data[data.length - 1];
        var lastX = width;
        var lastY = height - ((lastValue - min) / range) * height;
        
        ctx.fillStyle = options && options.color || '#2c3e50';
        ctx.beginPath();
        ctx.arc(lastX - 2, lastY, 2, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Export Chart constructor and plugins
    window.Chart = function(ctx, config) {
        return new MiniChart(ctx, config);
    };

    // Register plugins
    window.Chart.register = function(plugin) {
        // Plugin registration logic
    };

    // Export plugins
    window.Chart.CrispPlugin = CrispPlugin;
    window.Chart.WaterfallPlugin = WaterfallPlugin;
    window.Chart.VariancePlugin = VariancePlugin;
    window.Chart.drawSparkline = drawSparkline;

    // Error boundary integration
    window.Chart.reportError = function(error, context) {
        if (window.errorBoundary && typeof window.errorBoundary.reportError === 'function') {
            window.errorBoundary.reportError(error, context);
        }
    };

    // ============================================================================
    // CFO Dashboard Utilities and Factories
    // ============================================================================

    window.CFODashboard = {
        // Formatters
        formatters: {
            millions: function(value) {
                if (typeof value !== 'number' || isNaN(value)) return '0.0';
                return (value / 1000000).toFixed(1);
            },
            
            percent: function(value) {
                if (typeof value !== 'number' || isNaN(value)) return '0.0%';
                return value.toFixed(1) + '%';
            },
            
            currency: function(value, currency) {
                currency = currency || '₽';
                if (typeof value !== 'number' || isNaN(value)) return '0 ' + currency;
                return value.toLocaleString('ru-RU') + ' ' + currency;
            }
        },

        // HiDPI helper
        ensureHiDPI: function(canvas) {
            var dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
            var rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            
            var ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            
            return ctx;
        },

        // Chart factories
        createLineChart: function(canvasId, data, formatter) {
            // B2: Performance measurement - chart creation
            var startTime = performance.now();
            
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;

            var ctx = this.ensureHiDPI(canvas);
            
            var chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.dates || [],
                    datasets: [{
                        label: 'Факт',
                        data: data.fact || [],
                        borderColor: '#1a1a1a',
                        backgroundColor: 'rgba(26, 26, 26, 0.1)',
                        borderWidth: 2,
                        fill: true
                    }, {
                        label: 'План',
                        data: data.plan || [],
                        borderColor: '#1a1a1a',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 1
                    }, {
                        label: 'Прошлый год',
                        data: data.prevYear || [],
                        borderColor: '#8e8e93',
                        backgroundColor: 'transparent',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        }
                    }
                },
                plugins: [CrispPlugin]
            });

            this.ensureHiDPI(ctx.canvas);
            
            // Performance measurement end
            var endTime = performance.now();
            var duration = endTime - startTime;
            
            if (window.CFODashboard && window.CFODashboard.log) {
                window.CFODashboard.log('perf', 'createLineChart', { 
                    canvasId: canvasId,
                    duration: duration.toFixed(2) + 'ms'
                });
            }
            
            return chart;
        },

        createWaterfallChart: function(canvasId, data, title) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;

            var ctx = this.ensureHiDPI(canvas);
            
            // Prepare waterfall data
            var labels = data.labels || [];
            var values = [data.opening].concat(data.ocf || [], data.icf || [], data.fcf || [], [data.closing]);
            
            var cumulative = [data.opening];
            for (var i = 1; i < values.length - 1; i++) {
                cumulative.push(cumulative[i-1] + values[i]);
            }
            cumulative.push(data.closing);

            var chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: title || 'Waterfall',
                        data: values.map(function(value, index) {
                            if (index === 0 || index === values.length - 1) {
                                return value;
                            }
                            return Math.abs(value);
                        }),
                        backgroundColor: values.map(function(value, index) {
                            if (index === 0 || index === values.length - 1) {
                                return '#34495e';
                            }
                            return value >= 0 ? '#27ae60' : '#e74c3c';
                        })
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                },
                plugins: [CrispPlugin]
            });

            chart._waterfallDebug = function() {
                return {
                    originalData: data,
                    processedValues: values,
                    cumulative: cumulative
                };
            };

            this.ensureHiDPI(ctx.canvas);
            return chart;
        },

        createHorizontalBarChart: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;

            var ctx = this.ensureHiDPI(canvas);
            
            // Sort data by revenue descending
            var sortedData = data.slice().sort(function(a, b) {
                return b.revenue - a.revenue;
            });

            var chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedData.map(function(item) { return item.name; }),
                    datasets: [{
                        label: 'Выручка',
                        data: sortedData.map(function(item) { return item.revenue; }),
                        backgroundColor: '#3498db'
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                },
                plugins: [CrispPlugin]
            });

            this.ensureHiDPI(ctx.canvas);
            return chart;
        },

        createVarianceChart: function(canvasId, data) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return null;

            var ctx = this.ensureHiDPI(canvas);
            
            var chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(function(item) { return item.driver; }),
                    datasets: [{
                        label: 'План vs Факт',
                        data: data.map(function(item) { return item.variance; }),
                        backgroundColor: data.map(function(item) {
                            return item.variance >= 0 ? '#27ae60' : '#e74c3c';
                        })
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                },
                plugins: [CrispPlugin]
            });

            chart._varianceCheck = function() {
                var totalVariance = data.reduce(function(sum, item) {
                    return sum + item.variance;
                }, 0);
                return {
                    data: data,
                    totalVariance: totalVariance,
                    balanced: Math.abs(totalVariance) < 0.01
                };
            };

            this.ensureHiDPI(ctx.canvas);
            return chart;
        },

        // Table creation utilities
        createDebtorsTable: function(debtors) {
            var container = document.getElementById('debtors-detailed-table');
            if (!container || !debtors) return;

            var table = document.createElement('table');
            table.className = 'debtors-table';
            
            var header = document.createElement('thead');
            header.innerHTML = '<tr><th>Контрагент</th><th>Сумма</th><th>Просрочка</th><th>Bucket</th><th>Менеджер</th></tr>';
            table.appendChild(header);

            var tbody = document.createElement('tbody');
            debtors.forEach(function(debtor) {
                var row = document.createElement('tr');
                row.innerHTML = '<td>' + debtor.name + '</td>' +
                    '<td>' + CFODashboard.formatters.currency(debtor.amount) + '</td>' +
                    '<td>' + (debtor.daysOverdue || 0) + ' дн.</td>' +
                    '<td><span class="bucket-' + debtor.bucket + '">' + debtor.bucket + '</span></td>' +
                    '<td>' + (debtor.manager || '') + '</td>';
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            container.innerHTML = '';
            container.appendChild(table);
        },

        createAccountsTable: function(accounts) {
            var container = document.getElementById('accounts-detailed-table');
            if (!container || !accounts) return;

            var table = document.createElement('table');
            table.className = 'accounts-table';
            
            var header = document.createElement('thead');
            header.innerHTML = '<tr><th>Банк</th><th>Доступно</th><th>Заблокировано</th><th>Концентрация</th></tr>';
            table.appendChild(header);

            var tbody = document.createElement('tbody');
            accounts.forEach(function(account) {
                var row = document.createElement('tr');
                row.innerHTML = '<td>' + account.bank + '</td>' +
                    '<td>' + CFODashboard.formatters.currency(account.available) + '</td>' +
                    '<td>' + CFODashboard.formatters.currency(account.blocked || 0) + '</td>' +
                    '<td>' + CFODashboard.formatters.percent(account.concentration) + '%</td>';
                tbody.appendChild(row);
            });
            table.appendChild(tbody);

            container.innerHTML = '';
            container.appendChild(table);
        },

        // Update utilities  
        updateWaterfallChart: function(chartInstance, data) {
            if (!chartInstance || !chartInstance.data) return false;
            
            var startTime = performance.now();
            
            // Пересчет данных
            var values = [data.opening].concat(data.ocf || [], data.icf || [], data.fcf || [], [data.closing]);
            var cumulative = [data.opening];
            
            for (var i = 1; i < values.length - 1; i++) {
                cumulative.push(cumulative[i-1] + values[i]);
            }
            cumulative.push(data.closing);
            
            // Обновляем данные без пересоздания
            chartInstance.data.labels = data.labels;
            chartInstance.data.datasets[0].data = values.map(function(value, index) {
                if (index === 0 || index === values.length - 1) {
                    return value;
                }
                return Math.abs(value);
            });
            chartInstance.update('none');
            
            var endTime = performance.now();
            return endTime - startTime < 50;
        }
    };

    // Debug and validation (A2: Mini-linter)
    window.__dbg = window.__dbg || {};
    window.__dbg.selfCheck = function() {
        var errors = [];
        var warnings = [];

        // Check if Chart is available
        if (typeof Chart === 'undefined') {
            errors.push('Chart.js is not loaded');
        }

        // Check if CFO Dashboard utilities are available
        if (!window.CFODashboard) {
            errors.push('CFODashboard utilities not loaded');
        }

        // Runtime code quality checks (scan for common patterns)
        var codePatterns = [
            { pattern: /\.newData\b/g, description: 'Usage of .newData instead of data' },
            { pattern: /Math\.max\.\(/g, description: 'Incorrect Math.max. syntax (should be Math.max())' },
            { pattern: /Math\.min\.\(/g, description: 'Incorrect Math.min. syntax (should be Math.min())' },
            { pattern: /\.active\b.*alerts-panel/g, description: 'alerts-panel should use .open class, not .active' }
        ];

        // Check source code for patterns (simplified check against stringified functions)
        try {
            var sourceToCheck = '';
            if (window.external1C) {
                sourceToCheck += Object.values(window.external1C).map(function(fn) { 
                    return typeof fn === 'function' ? fn.toString() : ''; 
                }).join('\n');
            }
            if (window.CFODashboard) {
                sourceToCheck += Object.values(window.CFODashboard).map(function(fn) {
                    return typeof fn === 'function' ? fn.toString() : '';
                }).join('\n');
            }

            codePatterns.forEach(function(check) {
                var matches = sourceToCheck.match(check.pattern);
                if (matches && matches.length > 0) {
                    errors.push(check.description + ' (' + matches.length + ' occurrences)');
                }
            });
        } catch (e) {
            warnings.push('Code pattern check failed: ' + e.message);
        }

        // Check for duplicate IDs in DOM
        try {
            var allIds = [];
            var elementsWithId = document.querySelectorAll('[id]');
            elementsWithId.forEach(function(el) {
                var id = el.id;
                if (allIds.indexOf(id) > -1) {
                    errors.push('Duplicate ID found: ' + id);
                } else {
                    allIds.push(id);
                }
            });
        } catch (e) {
            warnings.push('Duplicate ID check failed: ' + e.message);
        }
        
        // Check for duplicate key functions in window
        try {
            var keyFunctions = ['printCurrentPage', 'printAllPages', 'exportCurrentPage', 'exportAllPages', 'executeBatchExport'];
            keyFunctions.forEach(function(funcName) {
                var count = 0;
                if (typeof window[funcName] === 'function') count++;
                // Check if it exists in other global objects
                if (window.external1C && typeof window.external1C[funcName] === 'function') count++;
                
                if (count > 1) {
                    errors.push('Duplicate function detected: ' + funcName + ' (' + count + ' locations)');
                } else if (count === 0) {
                    warnings.push('Missing global function: ' + funcName);
                }
            });
        } catch (e) {
            warnings.push('Function duplication check failed: ' + e.message);
        }
        
        // Check for undefined globals
        var requiredGlobals = ['Chart', 'CFODashboard', 'external1C'];
        requiredGlobals.forEach(function(global) {
            if (typeof window[global] === 'undefined') {
                errors.push('Required global ' + global + ' is not defined');
            }
        });

        // Performance checks
        if (typeof performance !== 'undefined' && performance.now) {
            try {
                var perfStart = performance.now();
                // Simple performance test
                for (var i = 0; i < 1000; i++) {
                    var testDiv = document.createElement('div');
                    testDiv.innerHTML = 'test';
                }
                var perfEnd = performance.now();
                if (perfEnd - perfStart > 10) {
                    warnings.push('DOM manipulation performance may be slow (' + (perfEnd - perfStart).toFixed(2) + 'ms for 1000 operations)');
                }
            } catch (e) {
                warnings.push('Performance check failed: ' + e.message);
            }
        }

        return {
            errors: errors,
            warnings: warnings,
            passed: errors.length === 0,
            summary: errors.length + ' error(s), ' + warnings.length + ' warning(s)',
            timestamp: new Date().toISOString()
        };
    };

    // Error logging integration for 1C
    window.__1c_log = window.__1c_log || [];
    
    window.CFODashboard.log = function(level, event, data, context) {
        var logEntry = {
            timestamp: new Date().toISOString(),
            level: level || 'info',
            event: event,
            data: data,
            context: context,
            component: 'cfo-dashboard'
        };
        
        window.__1c_log.push(logEntry);
        
        // Console output в dev-режиме
        if (console && typeof console.log === 'function') {
            var msg = '[CFODashboard] ' + level.toUpperCase() + ': ' + event;
            if (data) msg += ' - ' + JSON.stringify(data);
            console.log(msg);
        }
        
        // Интеграция с external1C.log если доступен
        if (window.external1C && typeof window.external1C.log === 'function') {
            try {
                window.external1C.log(logEntry);
            } catch (e) {
                // Ignore if external1C.log is not working
            }
        }
        
        return logEntry;
    };

})(window);