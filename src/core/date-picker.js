/**
 * Custom Date Picker Module
 * ES5 compatible custom date picker with validation
 * macOS-style design, native calendar functionality
 */
(function() {
    'use strict';
    
    var DatePicker = {
        currentTarget: null,
        currentDate: new Date(),
        selectedDate: null,
        monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        
        // Initialize date picker functionality
        initialize: function() {
            this.bindEvents();
            this.setupValidation();
        },
        
        // Bind all event listeners
        bindEvents: function() {
            var self = this;
            
            // Calendar button clicks
            var calendarButtons = document.querySelectorAll('.date-calendar-btn');
            for (var i = 0; i < calendarButtons.length; i++) {
                calendarButtons[i].addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var target = this.getAttribute('data-target');
                    self.showCalendar(target);
                });
            }
            
            // Calendar navigation
            var prevBtn = document.querySelector('.calendar-nav.prev');
            var nextBtn = document.querySelector('.calendar-nav.next');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.previousMonth();
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.nextMonth();
                });
            }
            
            // Close calendar on outside click
            document.addEventListener('click', function(e) {
                var calendar = document.getElementById('custom-calendar');
                if (calendar && !calendar.contains(e.target) && !e.target.classList.contains('date-calendar-btn')) {
                    self.hideCalendar();
                }
            });
            
            // ESC key to close calendar
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    self.hideCalendar();
                }
            });
        },
        
        // Setup input validation
        setupValidation: function() {
            var self = this;
            var dateInputs = document.querySelectorAll('.date-input');
            
            for (var i = 0; i < dateInputs.length; i++) {
                var input = dateInputs[i];
                
                // Format input as user types
                input.addEventListener('input', function(e) {
                    self.formatDateInput(e.target);
                });
                
                // Validate on blur
                input.addEventListener('blur', function(e) {
                    self.validateDateInput(e.target);
                    // Clear preset selection when custom date is entered
                    if (e.target.value) {
                        self.clearPresetSelection();
                    }
                });
                
                // Handle Enter key
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        self.validateDateInput(e.target);
                    }
                });
            }
        },
        
        // Format date input with dots as user types
        formatDateInput: function(input) {
            var value = input.value.replace(/\D/g, ''); // Remove non-digits
            var formatted = '';
            
            if (value.length > 0) {
                formatted = value.substring(0, 2);
            }
            if (value.length > 2) {
                formatted += '.' + value.substring(2, 4);
            }
            if (value.length > 4) {
                formatted += '.' + value.substring(4, 8);
            }
            
            input.value = formatted;
        },
        
        // Validate date input
        validateDateInput: function(input) {
            var value = input.value.trim();
            var regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
            
            input.classList.remove('error');
            
            if (!value) return true; // Empty is valid
            
            var match = value.match(regex);
            if (!match) {
                this.showInputError(input, 'Формат: ДД.ММ.ГГГГ');
                return false;
            }
            
            var day = parseInt(match[1], 10);
            var month = parseInt(match[2], 10);
            var year = parseInt(match[3], 10);
            
            // Validate date components
            if (month < 1 || month > 12) {
                this.showInputError(input, 'Месяц должен быть от 01 до 12');
                return false;
            }
            
            if (day < 1 || day > 31) {
                this.showInputError(input, 'День должен быть от 01 до 31');
                return false;
            }
            
            // Check if date actually exists
            var date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                this.showInputError(input, 'Неверная дата');
                return false;
            }
            
            // Validate date range (not too far in past or future)
            var currentYear = new Date().getFullYear();
            if (year < currentYear - 10 || year > currentYear + 10) {
                this.showInputError(input, 'Год должен быть от ' + (currentYear - 10) + ' до ' + (currentYear + 10));
                return false;
            }
            
            return true;
        },
        
        // Show input error
        showInputError: function(input, message) {
            input.classList.add('error');
            
            // Show tooltip or alert (simple version)
            var existingTooltip = document.querySelector('.date-error-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }
            
            var tooltip = document.createElement('div');
            tooltip.className = 'date-error-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.top = (input.offsetTop + input.offsetHeight + 5) + 'px';
            tooltip.style.left = input.offsetLeft + 'px';
            tooltip.style.background = '#DC2626';
            tooltip.style.color = 'white';
            tooltip.style.padding = '4px 8px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '12px';
            tooltip.style.zIndex = '1001';
            tooltip.textContent = message;
            
            input.parentElement.style.position = 'relative';
            input.parentElement.appendChild(tooltip);
            
            setTimeout(function() {
                if (tooltip.parentElement) {
                    tooltip.remove();
                }
            }, 3000);
        },
        
        // Clear preset button selection
        clearPresetSelection: function() {
            var presetButtons = document.querySelectorAll('.preset-btn');
            for (var i = 0; i < presetButtons.length; i++) {
                presetButtons[i].classList.remove('active');
            }
        },
        
        // Show calendar popup
        showCalendar: function(targetInputId) {
            this.currentTarget = targetInputId;
            var input = document.getElementById(targetInputId);
            var calendar = document.getElementById('custom-calendar');
            
            if (!calendar) return;
            
            // Position calendar relative to input
            var rect = input.getBoundingClientRect();
            var container = input.closest('.date-picker-group');
            if (container) {
                calendar.style.left = '0px';
                calendar.style.top = '45px';
            }
            
            // Set current date from input or today
            var inputValue = input.value.trim();
            if (inputValue && this.validateDateInput(input)) {
                var parts = inputValue.split('.');
                this.currentDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                this.selectedDate = new Date(this.currentDate);
            } else {
                this.currentDate = new Date();
                this.selectedDate = null;
            }
            
            this.renderCalendar();
            calendar.style.display = 'block';
            
            // Smooth show animation
            setTimeout(function() {
                calendar.classList.add('show');
            }, 10);
        },
        
        // Hide calendar popup
        hideCalendar: function() {
            var calendar = document.getElementById('custom-calendar');
            if (!calendar) return;
            
            calendar.classList.remove('show');
            setTimeout(function() {
                calendar.style.display = 'none';
            }, 300);
            
            this.currentTarget = null;
        },
        
        // Render calendar content
        renderCalendar: function() {
            var monthYear = document.querySelector('.calendar-month-year');
            var daysContainer = document.querySelector('.calendar-days');
            
            if (!monthYear || !daysContainer) return;
            
            // Set month/year header
            monthYear.textContent = this.monthNames[this.currentDate.getMonth()] + ' ' + this.currentDate.getFullYear();
            
            // Clear previous days
            daysContainer.innerHTML = '';
            
            // Get first day of month and number of days
            var firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            var lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            
            // Monday = 0, Sunday = 6 (adjust for Russian week starting Monday)
            var startDate = new Date(firstDay);
            var dayOfWeek = firstDay.getDay();
            dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday(0) to 6, others -1
            startDate.setDate(startDate.getDate() - dayOfWeek);
            
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Render 6 weeks (42 days)
            for (var i = 0; i < 42; i++) {
                var currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                var dayButton = document.createElement('button');
                dayButton.className = 'calendar-day';
                dayButton.textContent = currentDate.getDate();
                dayButton.setAttribute('data-date', this.formatDateForInput(currentDate));
                
                // Add classes
                if (currentDate.getMonth() !== this.currentDate.getMonth()) {
                    dayButton.classList.add('other-month');
                }
                
                if (currentDate.getTime() === today.getTime()) {
                    dayButton.classList.add('today');
                }
                
                if (this.selectedDate && currentDate.getTime() === this.selectedDate.getTime()) {
                    dayButton.classList.add('selected');
                }
                
                // Add click handler
                var self = this;
                dayButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    var dateStr = this.getAttribute('data-date');
                    self.selectDate(dateStr);
                });
                
                daysContainer.appendChild(dayButton);
            }
        },
        
        // Format date for input (DD.MM.YYYY)
        formatDateForInput: function(date) {
            var day = String(date.getDate()).padStart(2, '0');
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var year = date.getFullYear();
            return day + '.' + month + '.' + year;
        },
        
        // Select date from calendar
        selectDate: function(dateStr) {
            if (!this.currentTarget) return;
            
            var input = document.getElementById(this.currentTarget);
            if (input) {
                input.value = dateStr;
                input.classList.remove('error');
                this.clearPresetSelection();
            }
            
            this.hideCalendar();
        },
        
        // Navigate to previous month
        previousMonth: function() {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        },
        
        // Navigate to next month
        nextMonth: function() {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        },
        
        // Get current date range
        getDateRange: function() {
            var fromInput = document.getElementById('date-from');
            var toInput = document.getElementById('date-to');
            
            var fromValid = fromInput && this.validateDateInput(fromInput);
            var toValid = toInput && this.validateDateInput(toInput);
            
            if (!fromValid || !toValid) return null;
            
            var fromValue = fromInput.value.trim();
            var toValue = toInput.value.trim();
            
            if (!fromValue || !toValue) return null;
            
            return {
                from: fromValue,
                to: toValue
            };
        },
        
        // Set date range programmatically
        setDateRange: function(fromDate, toDate) {
            var fromInput = document.getElementById('date-from');
            var toInput = document.getElementById('date-to');
            
            if (fromInput) {
                fromInput.value = fromDate || '';
                this.validateDateInput(fromInput);
            }
            
            if (toInput) {
                toInput.value = toDate || '';
                this.validateDateInput(toInput);
            }
            
            if ((fromDate && fromDate.trim()) || (toDate && toDate.trim())) {
                this.clearPresetSelection();
            }
        }
    };
    
    // Export to global scope
    window.DatePicker = DatePicker;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            DatePicker.initialize();
        });
    } else {
        DatePicker.initialize();
    }
    
})();