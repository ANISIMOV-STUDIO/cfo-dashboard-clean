/**
 * Data Management Module
 * Handles data loading, validation and transformation for CFO Dashboard
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var DataValidator = {
        validateSchema: function(data, schema) {
            var errors = [];
            var warnings = [];
            
            // Basic meta validation
            if (!data.meta) {
                errors.push('Missing meta section');
            } else {
                if (!data.meta.company) warnings.push('Missing company name');
                if (!data.meta.period) warnings.push('Missing period');
                if (!data.meta.currency) warnings.push('Missing currency');
            }
            
            // KPI validation  
            if (!data.kpi) {
                errors.push('Missing KPI section');
            } else {
                if (typeof data.kpi.revenue !== 'object') {
                    warnings.push('Revenue should be an object with current/momChange/yoyChange');
                }
                if (typeof data.kpi.ebitda !== 'number') {
                    warnings.push('EBITDA should be a number');
                }
                if (typeof data.kpi.cashRunwayMonths !== 'number') {
                    warnings.push('Cash runway should be a number');
                }
            }
            
            // Time series validation
            if (!data.timeSeries) {
                errors.push('Missing timeSeries section');
            } else {
                if (data.timeSeries.revenue) {
                    var rev = data.timeSeries.revenue;
                    if (!rev.fact || !rev.dates) {
                        warnings.push('Revenue time series incomplete');
                    }
                    if (rev.fact && rev.dates && rev.fact.length !== rev.dates.length) {
                        warnings.push('Revenue fact/dates length mismatch');
                    }
                }
            }
            
            return {
                valid: errors.length === 0,
                errors: errors,
                warnings: warnings
            };
        },
        
        transformData: function(rawData) {
            // Transform data for dashboard consumption
            var transformed = Object.assign({}, rawData);
            
            // Ensure all required sections exist
            if (!transformed.meta) transformed.meta = {};
            if (!transformed.kpi) transformed.kpi = {};
            if (!transformed.timeSeries) transformed.timeSeries = {};
            if (!transformed.structures) transformed.structures = {};
            if (!transformed.alerts) transformed.alerts = [];
            
            // Calculate derived metrics
            if (transformed.kpi.revenue && transformed.kpi.revenue.current && transformed.kpi.ebitda) {
                transformed.kpi.ebitdaMargin = (transformed.kpi.ebitda / transformed.kpi.revenue.current * 100);
            }
            
            // Ensure sparklines exist
            if (transformed.structures.byOrganization) {
                transformed.structures.byOrganization.forEach(function(org) {
                    if (!org.sparkline) {
                        org.sparkline = [org.revenue * 0.9, org.revenue * 0.95, org.revenue];
                    }
                });
            }
            
            return transformed;
        }
    };
    
    var DataManager = {
        currentData: null,
        lastUpdateTime: null,
        _rawData: null, // для фильтрации
        
        loadData: function(jsonData) {
            try {
                var data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
                
                console.log('DataManager.loadData called with:', data);
                
                // Validate data structure
                var validation = DataValidator.validateSchema(data);
                console.log('Data validation result:', validation);
                
                // Сохраняем исходные данные для фильтрации
                this._rawData = data;
                
                // Transform data
                this.currentData = DataValidator.transformData(data);
                this.lastUpdateTime = new Date();
                
                console.log('Data loaded successfully. CurrentData keys:', Object.keys(this.currentData));
                console.log('CurrentData structure check:', {
                    hasTimeSeries: !!this.currentData.timeSeries,
                    hasRevenue: !!(this.currentData.timeSeries && this.currentData.timeSeries.revenue),
                    hasKPI: !!this.currentData.kpi
                });
                
                // Trigger data update event
                this.triggerDataUpdate();
                
                return {
                    success: true,
                    data: this.currentData,
                    validation: validation,
                    timestamp: this.lastUpdateTime
                };
                
            } catch (error) {
                return {
                    success: false,
                    error: 'Failed to load data: ' + error.message,
                    validation: { valid: false, errors: [error.message], warnings: [] }
                };
            }
        },
        
        getData: function() {
            return this.currentData;
        },
        
        getKPISnapshot: function() {
            if (!this.currentData) return null;
            
            return {
                period: this.currentData.meta.period,
                company: this.currentData.meta.company,
                currency: this.currentData.meta.currency,
                kpi: this.currentData.kpi,
                coefficients: this.currentData.coefficients || {},
                alerts: this.currentData.alerts || [],
                timestamp: this.lastUpdateTime
            };
        },
        
        triggerDataUpdate: function() {
            // Notify all components about data update
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent('dataUpdated', true, true, {
                data: this.currentData,
                timestamp: this.lastUpdateTime
            });
            window.dispatchEvent(event);
        },
        
        // Helper methods for accessing specific data
        getTimeSeriesData: function(metric) {
            return this.currentData && this.currentData.timeSeries ? 
                this.currentData.timeSeries[metric] : null;
        },
        
        getStructureData: function(type) {
            return this.currentData && this.currentData.structures ? 
                this.currentData.structures[type] : null;
        },
        
        getAlerts: function() {
            return this.currentData ? this.currentData.alerts || [] : [];
        },
        
        // Новый метод фильтрации данных
        getFiltered: function() {
            console.log('DataManager.getFiltered called');
            
            if (!this._rawData) {
                console.log('No raw data, using current data');
                return this.currentData;
            }
            
            var filters = window.DashboardState ? window.DashboardState.getState().filters : {};
            console.log('Current filters:', filters);
            
            var filtered = this._applyFilters(this._rawData, filters);
            console.log('Filtered data:', filtered);
            
            return filtered;
        },
        
        // Применение фильтров к исходным данным
        _applyFilters: function(rawData, filters) {
            var filtered = this._getFilteredData(rawData, filters);
            var preset = filters.periodPreset || 'month';
            
            return {
                revenue: this._sliceByPreset(filtered.revenue, preset),
                margins: this._sliceByPreset(filtered.margins, preset),
                cashFlow: this._sliceCashFlowByPreset(filtered.cashFlow, preset),
                meta: rawData.meta,
                kpi: this._calculateKPI(filtered),
                structures: this._filterStructures(rawData.structures, filters),
                alerts: rawData.alerts || []
            };
        },
        
        // Основная функция фильтрации
        _getFilteredData: function(rawData, filters) {
            var timeSeries = rawData.timeSeries || {};
            
            // Фильтрация временных рядов
            var revenue = this._buildTimeSeries(timeSeries.revenue, filters);
            var margins = this._buildTimeSeries(timeSeries.margins, filters); 
            var cashFlow = this._buildCashFlowSeries(timeSeries.cashFlow, filters);
            
            return {
                revenue: revenue,
                margins: margins,
                cashFlow: cashFlow
            };
        },
        
        // Построение временного ряда с учётом фильтров
        _buildTimeSeries: function(series, filters) {
            if (!series || !series.dates) return { dates: [], fact: [], plan: [], prevYear: [], forecast: [] };
            
            // Пока используем исходные данные (позже можно добавить реальную фильтрацию по компаниям/подразделениям)
            return {
                dates: series.dates || [],
                fact: series.fact || [],
                plan: series.plan || [],
                prevYear: series.prevYear || [],
                forecast: series.forecast || []
            };
        },
        
        // Построение cash flow с учётом фильтров  
        _buildCashFlowSeries: function(cashFlow, filters) {
            if (!cashFlow) return {};
            return cashFlow; // пока без изменений
        },
        
        // Срезка по периодным пресетам
        _sliceByPreset: function(series, preset) {
            if (!series || !series.dates) return series;
            
            var keep = preset === 'year' ? 12 : preset === 'quarter' ? 3 : 1;
            var n = series.dates.length;
            var from = Math.max(0, n - keep);
            
            function cut(arr) {
                return (arr || []).slice(from);
            }
            
            return {
                dates: cut(series.dates),
                fact: cut(series.fact),
                plan: cut(series.plan), 
                prevYear: cut(series.prevYear),
                forecast: cut(series.forecast)
            };
        },
        
        // Срезка cash flow по пресету
        _sliceCashFlowByPreset: function(cashFlow, preset) {
            if (!cashFlow || !cashFlow.monthly) return cashFlow;
            
            var keep = preset === 'year' ? 12 : preset === 'quarter' ? 3 : 1;
            var monthly = cashFlow.monthly;
            var n = (monthly.dates || []).length;
            var from = Math.max(0, n - keep);
            
            function cut(arr) {
                return (arr || []).slice(from);
            }
            
            return Object.assign({}, cashFlow, {
                monthly: {
                    dates: cut(monthly.dates),
                    ocf: cut(monthly.ocf),
                    icf: cut(monthly.icf),
                    fcf: cut(monthly.fcf)
                }
            });
        },
        
        // Пересчёт KPI для фильтрованных данных
        _calculateKPI: function(filtered) {
            if (!this._rawData || !this._rawData.kpi) return {};
            
            // Пока возвращаем исходные KPI, позже можно добавить пересчёт
            return this._rawData.kpi;
        },
        
        // Фильтрация структурных данных
        _filterStructures: function(structures, filters) {
            if (!structures) return {};
            // Пока без изменений, позже можно добавить фильтрацию по подразделениям
            return structures;
        },
        
        // Получить данные для конкретного графика с учётом зума
        getFilteredForChart: function(chartId) {
            console.log('Getting filtered data for chart:', chartId);
            
            var baseData = this.getFiltered();
            console.log('Base data:', baseData);
            
            if (!baseData || !baseData.revenue) {
                console.warn('No base data or revenue data available');
                // Return dummy data for testing
                return {
                    dates: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    fact: [100, 120, 150, 140, 160, 180],
                    plan: [110, 130, 140, 150, 170, 190],
                    prevYear: [90, 100, 120, 110, 130, 140],
                    forecast: [160, 170, 180, 190, 200, 210]
                };
            }
            
            var zoom = window.DashboardState ? window.DashboardState.getZoom(chartId) : null;
            console.log('Zoom for chart:', chartId, zoom);
            
            if (!zoom) {
                return baseData.revenue;
            }
            
            return this._applyZoomWindow(baseData.revenue, zoom);
        },
        
        // Применить окно зума к данным
        _applyZoomWindow: function(series, zoom) {
            if (!series || !series.dates) return series;
            
            var start = Math.max(0, zoom.start);
            var end = Math.min(series.dates.length - 1, zoom.end);
            
            function cut(arr) {
                return (arr || []).slice(start, end + 1);
            }
            
            return {
                dates: cut(series.dates),
                fact: cut(series.fact),
                plan: cut(series.plan),
                prevYear: cut(series.prevYear),
                forecast: cut(series.forecast)
            };
        },
        
        // Получить размеры данных для каскадной фильтрации
        getDimensions: function(companyId) {
            // Возвращаем статичные данные для демо
            var allDimensions = {
                divisions: [
                    { value: 'all', text: 'Все обособки' },
                    { value: 'center', text: 'Центр' },
                    { value: 'south', text: 'Юг' },
                    { value: 'north', text: 'Север' },
                    { value: 'east', text: 'Восток' }
                ],
                managers: [
                    { value: 'all', text: 'Все менеджеры' },
                    { value: 'ivanov', text: 'Иванов И.И.' },
                    { value: 'sidorov', text: 'Сидоров С.С.' },
                    { value: 'kozlov', text: 'Козлов К.К.' }
                ],
                counterparties: [
                    { value: 'all', text: 'Все контрагенты' },
                    { value: 'client1', text: 'Клиент А' },
                    { value: 'client2', text: 'Клиент Б' },
                    { value: 'client3', text: 'Клиент В' }
                ]
            };
            
            // В реальном приложении здесь была бы фильтрация по компании
            if (companyId === 'all') {
                return allDimensions;
            }
            
            return allDimensions;
        },
        
        // Initialize with demo data if no data is loaded
        initializeDemoData: function() {
            if (!this.currentData && !this._rawData) {
                console.log('Loading demo data...');
                var demoData = this.generateDemoData();
                this.loadData(demoData);
            }
        },
        
        // Generate comprehensive demo data
        generateDemoData: function() {
            var dates = [];
            var fact = [];
            var plan = [];
            var prevYear = [];
            var forecast = [];
            
            // Generate 12 months of data
            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            for (var i = 0; i < 12; i++) {
                dates.push(months[i]);
                
                // Generate realistic revenue data
                var baseFact = 10000000 + Math.sin(i * Math.PI / 6) * 2000000 + Math.random() * 1000000;
                var basePlan = baseFact * (1.1 + Math.random() * 0.1);
                var basePrevYear = baseFact * (0.85 + Math.random() * 0.2);
                
                fact.push(Math.round(baseFact));
                plan.push(Math.round(basePlan));
                prevYear.push(Math.round(basePrevYear));
                forecast.push(Math.round(baseFact * (1.05 + Math.random() * 0.1)));
            }
            
            return {
                meta: {
                    company: 'ООО Прогресс',
                    period: 'Декабрь 2024',
                    currency: 'RUB',
                    lastUpdate: new Date().toISOString()
                },
                kpi: {
                    revenue: {
                        current: fact[fact.length - 1],
                        momChange: ((fact[fact.length - 1] - fact[fact.length - 2]) / fact[fact.length - 2] * 100),
                        yoyChange: ((fact[fact.length - 1] - prevYear[prevYear.length - 1]) / prevYear[prevYear.length - 1] * 100)
                    },
                    ebitda: fact[fact.length - 1] * 0.15,
                    ebitdaMargin: 15,
                    cashEnd: 25000000,
                    cashRunwayMonths: 8.5,
                    margins: {
                        gross: 35,
                        ebitda: 15,
                        net: 8
                    }
                },
                timeSeries: {
                    revenue: {
                        dates: dates,
                        fact: fact,
                        plan: plan,
                        prevYear: prevYear,
                        forecast: forecast
                    },
                    margins: {
                        dates: dates,
                        gross: dates.map(function() { return 30 + Math.random() * 10; }),
                        ebitda: dates.map(function() { return 12 + Math.random() * 6; }),
                        net: dates.map(function() { return 5 + Math.random() * 6; })
                    },
                    cashFlow: {
                        monthly: {
                            dates: dates,
                            ocf: dates.map(function() { return 1000000 + Math.random() * 2000000; }),
                            icf: dates.map(function() { return -500000 + Math.random() * 1000000; }),
                            fcf: dates.map(function() { return 500000 + Math.random() * 1500000; })
                        }
                    }
                },
                structures: {
                    byOrganization: [
                        { name: 'Центр', revenue: 15000000, percentage: 45, sparkline: [14000000, 14500000, 15000000] },
                        { name: 'Юг', revenue: 8000000, percentage: 25, sparkline: [7500000, 7800000, 8000000] },
                        { name: 'Север', revenue: 6000000, percentage: 18, sparkline: [6200000, 5900000, 6000000] },
                        { name: 'Восток', revenue: 4000000, percentage: 12, sparkline: [3800000, 3900000, 4000000] }
                    ],
                    byProduct: [
                        { name: 'Продукт А', revenue: 12000000, percentage: 36 },
                        { name: 'Продукт Б', revenue: 10000000, percentage: 30 },
                        { name: 'Продукт В', revenue: 7000000, percentage: 21 },
                        { name: 'Прочие', revenue: 4000000, percentage: 13 }
                    ]
                },
                alerts: [
                    {
                        type: 'warning',
                        title: 'Снижение маржи',
                        description: 'EBITDA маржа снизилась на 2 п.п. по сравнению с планом',
                        severity: 'medium',
                        timestamp: new Date().toISOString()
                    },
                    {
                        type: 'info',
                        title: 'Превышение плана',
                        description: 'Выручка превысила план на 5%',
                        severity: 'low',
                        timestamp: new Date().toISOString()
                    }
                ]
            };
        }
    };
    
    // Export to window for global access
    window.DataManager = DataManager;
    window.DataValidator = DataValidator;
    
    // Auto-initialize demo data when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            DataManager.initializeDemoData();
        });
    } else {
        DataManager.initializeDemoData();
    }
    
})();