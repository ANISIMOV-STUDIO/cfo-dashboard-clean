/**
 * Redesigned Charts Module
 * Полностью переработанный модуль для графиков с улучшенной читаемостью
 * Убраны все кнопки управления зумом, оптимизирована цветовая схема
 */
(function() {
    'use strict';
    
    var ChartsRedesigned = {
        // Цветовая схема согласно ТЗ для единого стиля
        colors: {
            // Основные цвета
            fact: '#1F2937',         // Тёмно-серый для факта
            plan: '#0A84FF',         // Синий для плана
            forecast: '#9CA3AF',     // Светло-серый для прогноза (пунктир)
            prevYear: '#9CA3AF',     // Тёмно-серый для прошлого года
            positive: '#16A34A',     // Зелёный для положительных значений
            negative: '#DC2626',     // Красный для отрицательных значений
            neutral: '#6B7280',      // Серый - нейтральные данные
            
            // Цвета интерфейса
            background: '#FFFFFF',
            surface: '#F8FAFC',
            text: {
                primary: '#1F2937',     // Тёмно-серый для осей
                secondary: '#6B7280',
                muted: '#A0AEC0'        // Светло-серый для подзаголовков
            },
            border: '#E5E7EB',
            grid: 'rgba(0,0,0,0.05)'    // Цвет сетки согласно ТЗ
        },
        
        // Настройки типографики согласно ТЗ
        typography: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            sizes: {
                title: 14,      // Заголовки графиков - жирный 14px
                subtitle: 12,   // Подзаголовок - 12px светло-серым
                axis: 14,       // Оси X и Y - 14px
                legend: 13,     // Легенда
                tooltip: 13,    // Тултипы
                label: 12       // Метки
            },
            weights: {
                normal: 400,
                medium: 500,
                semibold: 600,
                bold: 700
            }
        },
        
        // Глобальные настройки Chart.js
        getGlobalDefaults: function() {
            return {
                responsive: true,
                maintainAspectRatio: false,
                
                // ОТКЛЮЧАЕМ ВСЕ ВЗАИМОДЕЙСТВИЯ И ЗУМЫ
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                
                // Полностью отключаем зум и панорамирование
                plugins: {
                    zoom: false,
                    pan: false,
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                family: this.typography.fontFamily,
                                size: this.typography.sizes.legend,
                                weight: this.typography.weights.medium
                            },
                            color: this.colors.text.primary,
                            padding: 25,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 15,
                            boxHeight: 15
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF',
                        borderColor: this.colors.border,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        titleFont: {
                            family: this.typography.fontFamily,
                            size: this.typography.sizes.tooltip,
                            weight: this.typography.weights.semibold
                        },
                        bodyFont: {
                            family: this.typography.fontFamily,
                            size: this.typography.sizes.tooltip,
                            weight: this.typography.weights.normal
                        },
                        padding: 16,
                        caretPadding: 10,
                        boxPadding: 6,
                        filter: function(tooltipItem) {
                            // Показываем только значимые данные
                            return tooltipItem.parsed.y !== null && tooltipItem.parsed.y !== undefined;
                        }
                    }
                },
                
                // Настройки анимации - быстрые и плавные
                animation: {
                    duration: 750,
                    easing: 'easeOutQuart'
                },
                
                // Настройки осей согласно ТЗ
                layout: {
                    padding: {
                        top: 8,
                        bottom: 24,
                        left: 32,
                        right: 24
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: this.colors.grid,
                            borderColor: this.colors.grid,
                            lineWidth: 1
                        },
                        ticks: {
                            font: {
                                family: this.typography.fontFamily,
                                size: this.typography.sizes.axis,
                                weight: this.typography.weights.normal
                            },
                            color: this.colors.text.primary,
                            maxTicksLimit: 7,
                            autoSkip: true,
                            autoSkipPadding: 15,
                            padding: 8
                        }
                    },
                    y: {
                        grid: {
                            display: true,
                            color: this.colors.grid,
                            borderColor: this.colors.grid,
                            lineWidth: 1
                        },
                        ticks: {
                            font: {
                                family: this.typography.fontFamily,
                                size: this.typography.sizes.axis,
                                weight: this.typography.weights.normal
                            },
                            color: this.colors.text.primary,
                            maxTicksLimit: 6,
                            padding: 10,
                            callback: function(value) {
                                // Форматирование в коротком формате с "млн ₽"
                                if (Math.abs(value) >= 1000000) {
                                    return (value / 1000000).toFixed(1) + ' млн ₽';
                                }
                                if (Math.abs(value) >= 1000) {
                                    return (value / 1000).toFixed(0) + ' тыс ₽';
                                }
                                return value + ' ₽';
                            }
                        }
                    }
                }
            };
        },
        
        // Форматирование чисел для отображения
        formatNumber: function(value) {
            if (value === 0) return '0';
            if (Math.abs(value) >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
            }
            if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
            }
            return value.toFixed(0);
        },
        
        // Создание линейного графика с улучшенным дизайном
        createLineChart: function(canvasId, data, options) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn('Canvas not found:', canvasId);
                return null;
            }
            
            this.ensureCanvasSize(canvas);
            
            var config = {
                type: 'line',
                data: {
                    labels: data.labels || data.dates || [],
                    datasets: this.createLineDatasets(data)
                },
                options: this.mergeOptions(this.getGlobalDefaults(), options || {})
            };
            
            return new Chart(canvas, config);
        },
        
        // Создание датасетов для линейных графиков согласно ТЗ
        createLineDatasets: function(data) {
            var datasets = [];
            
            // Основные данные (факт) - тёмно-серый
            if (data.fact && Array.isArray(data.fact)) {
                datasets.push({
                    label: 'Факт',
                    data: data.fact,
                    borderColor: this.colors.fact,
                    backgroundColor: 'transparent', // Без заливки согласно ТЗ
                    borderWidth: 2,
                    borderCapStyle: 'round', // Скруглённые маркеры согласно ТЗ
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: this.colors.fact,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointStyle: 'circle',
                    fill: false,
                    tension: 0.1
                });
            }
            
            // План (если есть) - синий
            if (data.plan && Array.isArray(data.plan)) {
                datasets.push({
                    label: 'План',
                    data: data.plan,
                    borderColor: this.colors.plan,
                    backgroundColor: 'transparent', // Без заливки
                    borderWidth: 2,
                    borderCapStyle: 'round',
                    borderDash: [5, 5],
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: this.colors.plan,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointStyle: 'circle',
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Прогноз (если есть) - пунктирная линия светло-серого оттенка
            if (data.forecast && Array.isArray(data.forecast)) {
                datasets.push({
                    label: 'Прогноз',
                    data: data.forecast,
                    borderColor: this.colors.forecast,
                    backgroundColor: 'transparent', // Без заливки
                    borderWidth: 2,
                    borderCapStyle: 'round',
                    borderDash: [3, 3], // Пунктирная линия
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: this.colors.forecast,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointStyle: 'circle',
                    fill: false,
                    tension: 0.1
                });
            }
            
            // Прошлый год (если есть) - тёмно-серый
            if (data.prevYear && Array.isArray(data.prevYear)) {
                datasets.push({
                    label: 'Прошлый год',
                    data: data.prevYear,
                    borderColor: this.colors.prevYear,
                    backgroundColor: 'transparent', // Без заливки
                    borderWidth: 2,
                    borderCapStyle: 'round',
                    borderDash: [5, 3],
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: this.colors.prevYear,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointStyle: 'circle',
                    fill: false,
                    tension: 0.1
                });
            }
            
            return datasets;
        },
        
        // Создание столбчатого графика
        createBarChart: function(canvasId, data, options) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn('Canvas not found:', canvasId);
                return null;
            }
            
            this.ensureCanvasSize(canvas);
            
            var config = {
                type: data.horizontal ? 'bar' : 'bar',
                data: {
                    labels: data.labels || [],
                    datasets: this.createBarDatasets(data)
                },
                options: this.mergeOptions(this.getGlobalDefaults(), {
                    indexAxis: data.horizontal ? 'y' : 'x',
                    // Настройки толщины столбцов согласно ТЗ
                    barPercentage: 0.8,
                    categoryPercentage: 0.9,
                    scales: {
                        x: data.horizontal ? {
                            grid: {
                                display: true,
                                color: this.colors.grid
                            },
                            ticks: {
                                font: {
                                    family: this.typography.fontFamily,
                                    size: this.typography.sizes.axis
                                },
                                color: this.colors.text.secondary,
                                callback: function(value) {
                                    return ChartsRedesigned.formatNumber(value);
                                }
                            }
                        } : {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    family: this.typography.fontFamily,
                                    size: this.typography.sizes.axis
                                },
                                color: this.colors.text.secondary
                            }
                        },
                        y: data.horizontal ? {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    family: this.typography.fontFamily,
                                    size: this.typography.sizes.axis
                                },
                                color: this.colors.text.secondary
                            }
                        } : {
                            grid: {
                                display: true,
                                color: this.colors.grid
                            },
                            ticks: {
                                font: {
                                    family: this.typography.fontFamily,
                                    size: this.typography.sizes.axis
                                },
                                color: this.colors.text.secondary,
                                callback: function(value) {
                                    return ChartsRedesigned.formatNumber(value);
                                }
                            }
                        }
                    }
                }, options || {})
            };
            
            return new Chart(canvas, config);
        },
        
        // Создание датасетов для столбчатых графиков
        createBarDatasets: function(data) {
            var datasets = [];
            
            if (data.values || data.data) {
                var values = data.values || data.data;
                var colors = this.generateBarColors(values, data.colorScheme);
                
                datasets.push({
                    label: data.label || 'Данные',
                    data: values,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                });
            }
            
            // Поддержка множественных датасетов
            if (data.datasets && Array.isArray(data.datasets)) {
                data.datasets.forEach(function(dataset, index) {
                    var colorIndex = index % 4;
                    var colorKey = ['primary', 'secondary', 'accent', 'warning'][colorIndex];
                    
                    datasets.push({
                        label: dataset.label,
                        data: dataset.data,
                        backgroundColor: ChartsRedesigned.colors[colorKey] + '80',
                        borderColor: ChartsRedesigned.colors[colorKey],
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    });
                });
            }
            
            return datasets;
        },
        
        // Генерация цветов для столбцов на основе значений
        generateBarColors: function(values, colorScheme) {
            var self = this;
            colorScheme = colorScheme || 'auto';
            
            if (colorScheme === 'auto') {
                // Автоматическое определение цветов на основе значений
                var backgroundColors = values.map(function(value) {
                    if (value > 0) return self.colors.secondary + '80';
                    if (value < 0) return self.colors.accent + '80';
                    return self.colors.neutral + '80';
                });
                
                var borderColors = values.map(function(value) {
                    if (value > 0) return self.colors.secondary;
                    if (value < 0) return self.colors.accent;
                    return self.colors.neutral;
                });
                
                return {
                    background: backgroundColors,
                    border: borderColors
                };
            } else if (colorScheme === 'gradient') {
                // Градиентная схема
                var max = Math.max(...values.map(Math.abs));
                return {
                    background: values.map(function(value) {
                        var intensity = Math.abs(value) / max;
                        var alpha = Math.max(0.3, intensity);
                        return value >= 0 ? 
                            self.colors.secondary + Math.round(alpha * 255).toString(16) :
                            self.colors.accent + Math.round(alpha * 255).toString(16);
                    }),
                    border: values.map(function(value) {
                        return value >= 0 ? self.colors.secondary : self.colors.accent;
                    })
                };
            } else {
                // Единый цвет
                return {
                    background: this.colors.primary + '80',
                    border: this.colors.primary
                };
            }
        },
        
        // Создание круговой диаграммы
        createPieChart: function(canvasId, data, options) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn('Canvas not found:', canvasId);
                return null;
            }
            
            this.ensureCanvasSize(canvas);
            
            var colorPalette = [
                this.colors.primary,
                this.colors.secondary,
                this.colors.accent,
                this.colors.warning,
                this.colors.plan,
                this.colors.forecast,
                this.colors.prevYear,
                this.colors.neutral
            ];
            
            var config = {
                type: 'doughnut',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        data: data.values || data.data || [],
                        backgroundColor: colorPalette.map(function(color) { return color + '80'; }),
                        borderColor: colorPalette,
                        borderWidth: 2,
                        hoverBorderWidth: 3
                    }]
                },
                options: this.mergeOptions(this.getGlobalDefaults(), {
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: {
                                    family: this.typography.fontFamily,
                                    size: this.typography.sizes.legend
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var label = context.label || '';
                                    var value = context.parsed;
                                    var total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                                    var percentage = ((value / total) * 100).toFixed(1);
                                    
                                    return label + ': ' + 
                                           (window.formatMoney ? window.formatMoney(value, 'RUB', 0) : ChartsRedesigned.formatNumber(value)) + 
                                           ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }, options || {})
            };
            
            return new Chart(canvas, config);
        },
        
        // Создание waterfall графика
        createWaterfallChart: function(canvasId, data, options) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn('Canvas not found:', canvasId);
                return null;
            }
            
            this.ensureCanvasSize(canvas);
            
            // Расчет кумулятивных значений для waterfall
            var cumulative = [];
            var running = data.startValue || 0;
            
            data.values.forEach(function(value, index) {
                if (index === 0) {
                    cumulative.push(running);
                } else {
                    running += value;
                    cumulative.push(running);
                }
            });
            
            var config = {
                type: 'bar',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: data.label || 'Waterfall',
                        data: cumulative,
                        backgroundColor: data.values.map(function(value, index) {
                            if (index === 0 || index === data.values.length - 1) {
                                return ChartsRedesigned.colors.neutral + '80';
                            }
                            return value >= 0 ? 
                                ChartsRedesigned.colors.secondary + '80' : 
                                ChartsRedesigned.colors.accent + '80';
                        }),
                        borderColor: data.values.map(function(value, index) {
                            if (index === 0 || index === data.values.length - 1) {
                                return ChartsRedesigned.colors.neutral;
                            }
                            return value >= 0 ? 
                                ChartsRedesigned.colors.secondary : 
                                ChartsRedesigned.colors.accent;
                        }),
                        borderWidth: 2,
                        borderRadius: 4
                    }]
                },
                options: this.mergeOptions(this.getGlobalDefaults(), {
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var index = context.dataIndex;
                                    var actualValue = data.values[index];
                                    var label = context.dataset.label;
                                    
                                    if (index === 0 || index === data.values.length - 1) {
                                        return label + ': ' + ChartsRedesigned.formatNumber(actualValue);
                                    } else {
                                        var prefix = actualValue >= 0 ? '+' : '';
                                        return label + ': ' + prefix + ChartsRedesigned.formatNumber(actualValue);
                                    }
                                }
                            }
                        }
                    }
                }, options || {})
            };
            
            return new Chart(canvas, config);
        },
        
        // Обеспечение правильного размера canvas
        ensureCanvasSize: function(canvas) {
            var container = canvas.parentElement;
            if (!container) return;
            
            var containerWidth = container.clientWidth || 400;
            var containerHeight = container.clientHeight || 300;
            
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = containerHeight + 'px';
            
            var dpr = window.devicePixelRatio || 1;
            canvas.width = containerWidth * dpr;
            canvas.height = containerHeight * dpr;
            
            var ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        },
        
        // Объединение опций (ES5 совместимый способ)
        mergeOptions: function(target, source) {
            var result = {};
            var key;
            
            // Копируем target
            for (key in target) {
                if (target.hasOwnProperty(key)) {
                    if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
                        result[key] = this.mergeOptions(target[key], {});
                    } else {
                        result[key] = target[key];
                    }
                }
            }
            
            // Копируем source с перезаписью
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) &&
                        typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
                        result[key] = this.mergeOptions(result[key], source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
            
            return result;
        },
        
        // Очистка всех графиков
        destroyAllCharts: function() {
            if (window.Chart && Chart.instances && Array.isArray(Chart.instances)) {
                Chart.instances.slice().forEach(function(chart) {
                    try {
                        if (chart && chart.destroy) {
                            chart.destroy();
                        }
                    } catch (error) {
                        console.warn('Error destroying chart:', error);
                    }
                });
            }
        }
    };
    
    // Экспорт модуля
    window.ChartsRedesigned = ChartsRedesigned;
    
    // Установка глобальных настроек Chart.js при загрузке
    if (window.Chart) {
        // Отключаем все плагины зума и панорамирования глобально
        Chart.register = Chart.register || function() {};
        
        // Устанавливаем безопасные глобальные настройки для Chart.js 2.x
        if (Chart.defaults && Chart.defaults.global) {
            // Шрифт и цвет осей согласно ТЗ - 14px тёмно-серый #1F2937
            Chart.defaults.global.defaultFontFamily = ChartsRedesigned.typography.fontFamily;
            Chart.defaults.global.defaultFontSize = ChartsRedesigned.typography.sizes.axis;
            Chart.defaults.global.defaultFontColor = ChartsRedesigned.colors.text.primary;
            
            // Настройки сетки
            Chart.defaults.scale = Chart.defaults.scale || {};
            Chart.defaults.scale.gridLines = Chart.defaults.scale.gridLines || {};
            Chart.defaults.scale.gridLines.color = ChartsRedesigned.colors.grid;
        }
        
        // Применяем глобальные настройки для всех типов графиков
        Chart.defaults.font = Chart.defaults.font || {};
        Chart.defaults.font.size = ChartsRedesigned.typography.sizes.axis;
        Chart.defaults.color = ChartsRedesigned.colors.text.primary;
    }
    
})();