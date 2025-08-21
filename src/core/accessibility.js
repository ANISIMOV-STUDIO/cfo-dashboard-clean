/**
 * Accessibility Module
 * Enhances keyboard navigation and accessibility features
 * ES5 compatible
 */
(function() {
    'use strict';
    
    var Accessibility = {
        // Initialize accessibility features
        initialize: function() {
            this.setupKeyboardNavigation();
            this.setupFocusManagement();
            this.setupAriaUpdates();
        },
        
        // Setup keyboard navigation
        setupKeyboardNavigation: function() {
            var self = this;
            
            // ESC key handler
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    self.handleEscapeKey();
                }
                
                // Tab trapping for modals/calendars
                if (e.key === 'Tab') {
                    self.handleTabNavigation(e);
                }
                
                // Arrow key navigation for button groups
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    self.handleArrowNavigation(e);
                }
                
                // Enter/Space for custom buttons
                if (e.key === 'Enter' || e.key === ' ') {
                    self.handleActivation(e);
                }
            });
        },
        
        // Handle Escape key press
        handleEscapeKey: function() {
            // Close calendar if open
            var calendar = document.getElementById('custom-calendar');
            if (calendar && calendar.style.display !== 'none') {
                if (window.DatePicker) {
                    window.DatePicker.hideCalendar();
                }
                return;
            }
            
            // Close dropdowns
            var openDropdowns = document.querySelectorAll('.sel-menu.show');
            for (var i = 0; i < openDropdowns.length; i++) {
                openDropdowns[i].classList.remove('show');
            }
            
            // Reset filters (same as reset button)
            var resetBtn = document.getElementById('reset-all-btn');
            if (resetBtn) {
                resetBtn.click();
            }
        },
        
        // Handle Tab navigation and focus trapping
        handleTabNavigation: function(e) {
            var calendar = document.getElementById('custom-calendar');
            if (calendar && calendar.style.display !== 'none') {
                this.trapFocusInElement(e, calendar);
            }
        },
        
        // Trap focus within an element
        trapFocusInElement: function(e, element) {
            var focusableElements = element.querySelectorAll(
                'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            var firstElement = focusableElements[0];
            var lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        },
        
        // Handle arrow key navigation in button groups
        handleArrowNavigation: function(e) {
            var activeElement = document.activeElement;
            var buttonGroups = [
                '.preset-group',
                '.scenario-controls',
                '.segmented'
            ];
            
            for (var i = 0; i < buttonGroups.length; i++) {
                var group = activeElement.closest(buttonGroups[i]);
                if (group) {
                    this.navigateButtonGroup(e, group);
                    break;
                }
            }
        },
        
        // Navigate within button group using arrow keys
        navigateButtonGroup: function(e, group) {
            var buttons = group.querySelectorAll('button:not([disabled])');
            var currentIndex = -1;
            
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i] === document.activeElement) {
                    currentIndex = i;
                    break;
                }
            }
            
            if (currentIndex === -1) return;
            
            var nextIndex;
            if (e.key === 'ArrowRight') {
                nextIndex = currentIndex === buttons.length - 1 ? 0 : currentIndex + 1;
            } else if (e.key === 'ArrowLeft') {
                nextIndex = currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
            }
            
            if (nextIndex !== undefined) {
                e.preventDefault();
                buttons[nextIndex].focus();
            }
        },
        
        // Handle Enter/Space activation
        handleActivation: function(e) {
            var target = e.target;
            
            // Skip if already handled by browser
            if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
                return;
            }
            
            // Handle custom clickable elements
            if (target.getAttribute('role') === 'button' || 
                target.classList.contains('clickable')) {
                e.preventDefault();
                target.click();
            }
        },
        
        // Setup focus management
        setupFocusManagement: function() {
            // Add focus indicators for mouse users
            document.addEventListener('mousedown', function() {
                document.body.classList.add('using-mouse');
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    document.body.classList.remove('using-mouse');
                }
            });
            
            // Manage focus for dynamic content
            this.manageDynamicFocus();
        },
        
        // Manage focus for dynamically added content
        manageDynamicFocus: function() {
            var self = this;
            
            // Observer for new interactive elements
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) { // Element node
                                self.enhanceElementAccessibility(node);
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        // Enhance accessibility of an element
        enhanceElementAccessibility: function(element) {
            // Add tabindex to clickable elements without it
            var clickableElements = element.querySelectorAll(
                '[onclick], .clickable, .btn, .comp-btn, .preset-btn'
            );
            
            for (var i = 0; i < clickableElements.length; i++) {
                var el = clickableElements[i];
                if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON' && el.tagName !== 'INPUT') {
                    el.setAttribute('tabindex', '0');
                }
                
                // Add role button if needed
                if (!el.hasAttribute('role') && el.tagName !== 'BUTTON') {
                    el.setAttribute('role', 'button');
                }
            }
        },
        
        // Setup ARIA updates
        setupAriaUpdates: function() {
            // Update aria-pressed for toggle buttons
            this.setupToggleButtonAria();
            
            // Update aria-expanded for dropdowns
            this.setupDropdownAria();
            
            // Live region updates
            this.setupLiveRegions();
        },
        
        // Setup toggle button ARIA attributes
        setupToggleButtonAria: function() {
            // Realtime button
            var realtimeBtn = document.getElementById('toggle-realtime-btn');
            if (realtimeBtn) {
                realtimeBtn.addEventListener('click', function() {
                    var isPressed = this.classList.contains('active');
                    this.setAttribute('aria-pressed', isPressed);
                });
            }
            
            // Scenario buttons - handled by scenario switcher
            // Preset buttons
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('preset-btn')) {
                    var presetButtons = document.querySelectorAll('.preset-btn');
                    for (var i = 0; i < presetButtons.length; i++) {
                        var isActive = presetButtons[i].classList.contains('active');
                        presetButtons[i].setAttribute('aria-pressed', isActive);
                    }
                }
            });
        },
        
        // Setup dropdown ARIA attributes
        setupDropdownAria: function() {
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('sel-btn')) {
                    var dropdown = e.target.nextElementSibling;
                    if (dropdown && dropdown.classList.contains('sel-menu')) {
                        var isExpanded = dropdown.style.display !== 'none';
                        e.target.setAttribute('aria-expanded', isExpanded);
                    }
                }
            });
        },
        
        // Setup live regions for status updates
        setupLiveRegions: function() {
            // Create a live region for status announcements
            var liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        },
        
        // Announce message to screen readers
        announceMessage: function(message) {
            var liveRegion = document.getElementById('aria-live-region');
            if (liveRegion) {
                liveRegion.textContent = message;
                
                // Clear after announcement
                setTimeout(function() {
                    liveRegion.textContent = '';
                }, 1000);
            }
        },
        
        // Validate color contrast (simplified check)
        validateContrast: function() {
            // This is a basic implementation
            // In a real application, you'd use a proper color contrast library
            var textElements = document.querySelectorAll('p, span, div, label, button');
            var issues = [];
            
            for (var i = 0; i < textElements.length; i++) {
                var element = textElements[i];
                var computedStyle = window.getComputedStyle(element);
                var color = computedStyle.color;
                var backgroundColor = computedStyle.backgroundColor;
                
                // Simple check - would need proper contrast calculation
                if (color === backgroundColor) {
                    issues.push({
                        element: element,
                        issue: 'Text and background colors are the same'
                    });
                }
            }
            
            return issues;
        }
    };
    
    // Export to global scope
    window.Accessibility = Accessibility;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            Accessibility.initialize();
        });
    } else {
        Accessibility.initialize();
    }
    
})();