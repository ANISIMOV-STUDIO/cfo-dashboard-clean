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
                
                // Validate data structure
                var validation = DataValidator.validateSchema(data);
                
                // Сохраняем исходные данные для фильтрации
                this._rawData = data;
                
                // Transform data
                this.currentData = DataValidator.transformData(data);
                this.lastUpdateTime = new Date();
                
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
            if (!this._rawData) {
                return this.currentData;
            }
            
            var filters = window.DashboardState ? window.DashboardState.getState().filters : {};
            return this._applyFilters(this._rawData, filters);
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
        }
    };
    
    // Export to window for global access
    window.DataManager = DataManager;
    window.DataValidator = DataValidator;
    
})();