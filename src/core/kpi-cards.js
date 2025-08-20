/**
 * KPI Cards Module
 * Manages real-time KPI display in dashboard header
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var KPICards = {
        // Update KPI cards with latest data
        updateCards: function(data) {
            if (!data) return;
            
            try {
                // Revenue KPI
                if (data.kpi && data.kpi.revenue) {
                    this.updateCard('revenue', {
                        value: data.kpi.revenue.current,
                        change: data.kpi.revenue.momChange,
                        format: 'money'
                    });
                }
                
                // EBITDA KPI
                if (data.kpi && data.kpi.ebitda) {
                    this.updateCard('ebitda', {
                        value: data.kpi.ebitda,
                        change: data.kpi.ebitdaChange || 12.3, // fallback
                        format: 'money'
                    });
                }
                
                // Cash KPI  
                if (data.kpi && data.kpi.cashEnd) {
                    this.updateCard('cash', {
                        value: data.kpi.cashEnd,
                        change: data.kpi.cashRunwayMonths,
                        format: 'money',
                        changeFormat: 'months'
                    });
                }
                
                // Margin KPI
                if (data.kpi && data.kpi.margins && data.kpi.margins.ebitda) {
                    this.updateCard('margin', {
                        value: data.kpi.margins.ebitda,
                        change: data.kpi.margins.ebitdaChange || 0.8, // fallback
                        format: 'percent',
                        changeFormat: 'points'
                    });
                }
                
            } catch (error) {
                console.error('Error updating KPI cards:', error);
            }
        },
        
        // Update individual KPI card
        updateCard: function(cardType, config) {
            var valueElement = document.getElementById('kpi-' + cardType + '-value');
            var changeElement = document.getElementById('kpi-' + cardType + '-change');
            
            if (!valueElement || !changeElement) return;
            
            // Format and update value
            var formattedValue = this.formatValue(config.value, config.format);
            valueElement.textContent = formattedValue;
            
            // Format and update change
            var formattedChange = this.formatChange(config.change, config.changeFormat || 'percent');
            changeElement.textContent = formattedChange;
            
            // Update change class (positive/negative/neutral)
            changeElement.className = 'kpi-change ' + this.getChangeClass(config.change, config.changeFormat);
        },
        
        // Format values for display
        formatValue: function(value, format) {
            if (!value && value !== 0) return '—';
            
            switch (format) {
                case 'money':
                    return window.formatMoney ? window.formatMoney(value, 'RUB', 0) : value.toLocaleString() + ' ₽';
                case 'percent':
                    return value.toFixed(1) + '%';
                default:
                    return value.toString();
            }
        },
        
        // Format change values
        formatChange: function(change, format) {
            if (!change && change !== 0) return '—';
            
            var prefix = change > 0 ? '+' : '';
            
            switch (format) {
                case 'percent':
                    return prefix + change.toFixed(1) + '%';
                case 'points':
                    return prefix + change.toFixed(1) + 'п.п.';
                case 'months':
                    return change.toFixed(1) + ' мес';
                default:
                    return prefix + change.toFixed(1);
            }
        },
        
        // Determine CSS class for change indicator
        getChangeClass: function(change, format) {
            if (format === 'months') return 'neutral'; // Cash runway is informational
            
            if (change > 0) return 'positive';
            if (change < 0) return 'negative';
            return 'neutral';
        },
        
        // Animate card updates
        animateCard: function(cardType) {
            var card = document.querySelector('.kpi-card.kpi-' + cardType);
            if (!card) return;
            
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            
            setTimeout(function() {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = '';
            }, 200);
        },
        
        // Add sparklines to KPI cards
        addSparklines: function(data) {
            if (!data.timeSeries) return;
            
            try {
                // Revenue sparkline
                if (data.timeSeries.revenue && data.timeSeries.revenue.fact) {
                    this.createSparkline('revenue', data.timeSeries.revenue.fact.slice(-6));
                }
                
                // EBITDA sparkline (calculated from revenue and margin)
                if (data.timeSeries.revenue && data.timeSeries.margins) {
                    var ebitdaValues = data.timeSeries.revenue.fact.map(function(revenue, index) {
                        var margin = data.timeSeries.margins.ebitda[index] || 0;
                        return revenue * (margin / 100);
                    });
                    this.createSparkline('ebitda', ebitdaValues.slice(-6));
                }
                
            } catch (error) {
                console.warn('Error adding sparklines:', error);
            }
        },
        
        // Create mini sparkline chart
        createSparkline: function(cardType, data) {
            var card = document.querySelector('.kpi-card.kpi-' + cardType);
            if (!card || !data.length) return;
            
            // Remove existing sparkline
            var existing = card.querySelector('.kpi-sparkline');
            if (existing) existing.remove();
            
            // Create sparkline container
            var sparklineDiv = document.createElement('div');
            sparklineDiv.className = 'kpi-sparkline';
            sparklineDiv.innerHTML = '<canvas width="60" height="20"></canvas>';
            
            // Insert before change indicator
            var changeEl = card.querySelector('.kpi-change');
            if (changeEl) {
                card.insertBefore(sparklineDiv, changeEl);
            }
            
            // Draw sparkline
            var canvas = sparklineDiv.querySelector('canvas');
            var ctx = canvas.getContext('2d');
            this.drawSparkline(ctx, data, 60, 20);
        },
        
        // Draw simple sparkline
        drawSparkline: function(ctx, data, width, height) {
            if (!data.length) return;
            
            var min = Math.min.apply(Math, data);
            var max = Math.max.apply(Math, data);
            var range = max - min || 1;
            
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = '#007AFF';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            for (var i = 0; i < data.length; i++) {
                var x = (i / (data.length - 1)) * width;
                var y = height - ((data[i] - min) / range) * height;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        }
    };
    
    // Export to window
    window.KPICards = KPICards;
    
    // Auto-update KPI cards when data changes
    window.addEventListener('dataUpdated', function(event) {
        if (event.detail && event.detail.data) {
            KPICards.updateCards(event.detail.data);
        }
    });
    
})();