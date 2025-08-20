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
        
        loadData: function(jsonData) {
            try {
                var data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
                
                // Validate data structure
                var validation = DataValidator.validateSchema(data);
                
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
        }
    };
    
    // Export to window for global access
    window.DataManager = DataManager;
    window.DataValidator = DataValidator;
    
})();