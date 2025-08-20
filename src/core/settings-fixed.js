/**
 * User Settings and Favorites Module (Fixed)
 * Manages dashboard personalization, saved views, and user preferences
 * Compatible with V8WebKit 8.3.27
 */
(function() {
    'use strict';
    
    var UserSettings = {
        storageKey: 'cfo_dashboard_settings',
        favoritesKey: 'cfo_dashboard_favorites',
        viewsKey: 'cfo_dashboard_views',
        
        defaultSettings: {
            theme: 'light',
            autoRefresh: true,
            refreshInterval: 30,
            animations: true,
            currency: 'RUB',
            dateFormat: 'DD.MM.YYYY',
            defaultPage: 'overview',
            chartAnimations: true,
            soundNotifications: false,
            compactMode: false,
            language: 'ru'
        },
        
        currentSettings: {},
        favorites: [],
        savedViews: [],
        
        // Initialize settings system
        initialize: function() {
            this.loadSettings();
            this.loadFavorites();
            this.loadSavedViews();
            this.setupSettingsUI();
            this.bindSettingsEvents();
        },
        
        // Load settings from localStorage
        loadSettings: function() {
            try {
                var stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    this.currentSettings = Object.assign({}, this.defaultSettings, JSON.parse(stored));
                } else {
                    this.currentSettings = Object.assign({}, this.defaultSettings);
                }
                
                // Apply loaded settings
                this.applySettings();
            } catch (error) {
                console.error('Error loading settings:', error);
                this.currentSettings = Object.assign({}, this.defaultSettings);
            }
        },
        
        // Save settings to localStorage
        saveSettings: function() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
            } catch (error) {
                console.error('Error saving settings:', error);
            }
        },
        
        // Load favorites from localStorage
        loadFavorites: function() {
            try {
                var stored = localStorage.getItem(this.favoritesKey);
                this.favorites = stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.error('Error loading favorites:', error);
                this.favorites = [];
            }
        },
        
        // Save favorites to localStorage
        saveFavorites: function() {
            try {
                localStorage.setItem(this.favoritesKey, JSON.stringify(this.favorites));
            } catch (error) {
                console.error('Error saving favorites:', error);
            }
        },
        
        // Load saved views from localStorage
        loadSavedViews: function() {
            try {
                var stored = localStorage.getItem(this.viewsKey);
                this.savedViews = stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.error('Error loading saved views:', error);
                this.savedViews = [];
            }
        },
        
        // Save views to localStorage
        saveSavedViews: function() {
            try {
                localStorage.setItem(this.viewsKey, JSON.stringify(this.savedViews));
            } catch (error) {
                console.error('Error saving views:', error);
            }
        },
        
        // Apply current settings to dashboard
        applySettings: function() {
            // Apply theme
            if (this.currentSettings.theme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
            
            // Apply compact mode
            if (this.currentSettings.compactMode) {
                document.body.classList.add('compact-mode');
            } else {
                document.body.classList.remove('compact-mode');
            }
            
            // Apply auto-refresh settings
            if (window.RealtimeUpdates) {
                window.RealtimeUpdates.toggleAutoRefresh(this.currentSettings.autoRefresh);
                window.RealtimeUpdates.setUpdateFrequency(this.currentSettings.refreshInterval);
                window.RealtimeUpdates.toggleAnimations(this.currentSettings.animations);
            }
            
            // Apply currency setting
            if (window.FormatUtils) {
                window.FormatUtils.defaultCurrency = this.currentSettings.currency;
            }
            
            // Update currency selector
            var currencySelect = document.getElementById('currency-select');
            if (currencySelect) {
                currencySelect.value = this.currentSettings.currency;
            }
        },
        
        // Setup settings UI
        setupSettingsUI: function() {
            this.createSettingsButton();
            this.createSettingsPanel();
            this.createFavoritesPanel();
        },
        
        // Create settings button
        createSettingsButton: function() {
            var button = document.createElement('button');
            button.id = 'settings-btn';
            button.className = 'settings-btn';
            button.innerHTML = '⚙️';
            button.title = 'Настройки';
            
            // Add to interaction status area
            var interactionStatus = document.querySelector('.interaction-status');
            if (interactionStatus) {
                interactionStatus.insertBefore(button, interactionStatus.firstChild);
            }
        },
        
        // Create settings panel  
        createSettingsPanel: function() {
            var panel = document.createElement('div');
            panel.id = 'settings-panel';
            panel.className = 'settings-panel';
            panel.style.display = 'none';
            
            var html = '<div class="settings-header">' +
                '<h3>Настройки дашборда</h3>' +
                '<button class="close-btn" onclick="this.closest(\'#settings-panel\').style.display=\'none\'">×</button>' +
                '</div>' +
                '<div class="settings-content">' +
                '<div class="settings-section">' +
                '<h4>Внешний вид</h4>' +
                '<label><input type="radio" name="theme" value="light"' + (this.currentSettings.theme === 'light' ? ' checked' : '') + '>Светлая тема</label>' +
                '<label><input type="radio" name="theme" value="dark"' + (this.currentSettings.theme === 'dark' ? ' checked' : '') + '>Тёмная тема</label>' +
                '<label><input type="checkbox" name="compactMode"' + (this.currentSettings.compactMode ? ' checked' : '') + '>Компактный режим</label>' +
                '<label><input type="checkbox" name="animations"' + (this.currentSettings.animations ? ' checked' : '') + '>Анимации</label>' +
                '</div>' +
                '<div class="settings-section">' +
                '<h4>Обновление данных</h4>' +
                '<label><input type="checkbox" name="autoRefresh"' + (this.currentSettings.autoRefresh ? ' checked' : '') + '>Автоматическое обновление</label>' +
                '<label>Интервал обновления (сек): <input type="number" name="refreshInterval" value="' + this.currentSettings.refreshInterval + '" min="5" max="300"></label>' +
                '</div>' +
                '<div class="settings-actions">' +
                '<button onclick="UserSettings.resetToDefaults()">Сбросить</button>' +
                '<button onclick="UserSettings.saveCurrentSettings()">Сохранить</button>' +
                '</div>' +
                '</div>';
            
            panel.innerHTML = html;
            document.body.appendChild(panel);
        },
        
        // Bind settings events
        bindSettingsEvents: function() {
            var self = this;
            
            // Settings button
            document.addEventListener('click', function(event) {
                if (event.target.id === 'settings-btn') {
                    var panel = document.getElementById('settings-panel');
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            });
            
            // Settings form changes
            document.addEventListener('change', function(event) {
                if (event.target.closest('#settings-panel')) {
                    self.handleSettingChange(event.target);
                }
            });
        },
        
        // Handle individual setting change
        handleSettingChange: function(input) {
            var name = input.name;
            var value;
            
            if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'radio') {
                value = input.value;
            } else {
                value = input.value;
            }
            
            this.currentSettings[name] = value;
            this.applySettings();
        },
        
        // Save current settings
        saveCurrentSettings: function() {
            this.saveSettings();
            this.showMessage('Настройки сохранены');
        },
        
        // Reset to default settings
        resetToDefaults: function() {
            this.currentSettings = Object.assign({}, this.defaultSettings);
            this.applySettings();
            this.saveSettings();
            
            this.showMessage('Настройки сброшены');
        },
        
        // Show temporary message
        showMessage: function(text) {
            var message = document.createElement('div');
            message.className = 'settings-message';
            message.textContent = text;
            message.style.cssText = 
                'position: fixed; top: 100px; right: 24px; background: #007AFF;' +
                'color: white; padding: 12px 16px; border-radius: 8px; z-index: 1000;' +
                'animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.5s;';
            
            document.body.appendChild(message);
            
            setTimeout(function() {
                if (message.parentNode) {
                    message.remove();
                }
            }, 3000);
        },
        
        // Create favorites panel - simplified version
        createFavoritesPanel: function() {
            // Simplified - just create button for now
            var button = document.createElement('button');
            button.id = 'favorites-btn';
            button.className = 'favorites-btn';
            button.innerHTML = '⭐';
            button.title = 'Избранное';
            
            var interactionStatus = document.querySelector('.interaction-status');
            if (interactionStatus && interactionStatus.children.length > 0) {
                interactionStatus.insertBefore(button, interactionStatus.children[1]);
            }
        },
        
        // Get current settings
        getSettings: function() {
            return Object.assign({}, this.currentSettings);
        },
        
        // Update specific setting
        updateSetting: function(key, value) {
            this.currentSettings[key] = value;
            this.applySettings();
            this.saveSettings();
        }
    };
    
    // Add CSS styles for settings panels
    var style = document.createElement('style');
    style.textContent = 
        '.settings-btn, .favorites-btn {' +
        '    border: none; background: var(--panel); padding: 6px 10px;' +
        '    border-radius: 8px; cursor: pointer; font-size: 12px;' +
        '    box-shadow: var(--shadow);' +
        '}' +
        '.settings-btn:hover, .favorites-btn:hover {' +
        '    background: #f0f0f0;' +
        '}' +
        '.settings-panel {' +
        '    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);' +
        '    background: white; border-radius: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.3);' +
        '    z-index: 1000; width: 400px; max-height: 80vh; overflow-y: auto;' +
        '}' +
        '.settings-header {' +
        '    padding: 16px; border-bottom: 1px solid #eee;' +
        '    display: flex; justify-content: space-between; align-items: center;' +
        '}' +
        '.settings-header h3 {' +
        '    margin: 0; font-size: 16px;' +
        '}' +
        '.close-btn {' +
        '    border: none; background: none; font-size: 18px;' +
        '    cursor: pointer; padding: 0; width: 24px; height: 24px;' +
        '}' +
        '.settings-content {' +
        '    padding: 16px;' +
        '}' +
        '.settings-section {' +
        '    margin-bottom: 20px;' +
        '}' +
        '.settings-section h4 {' +
        '    margin: 0 0 12px 0; font-size: 14px; color: #666;' +
        '}' +
        '.settings-section label {' +
        '    display: block; margin-bottom: 8px; font-size: 13px;' +
        '}' +
        '.settings-actions {' +
        '    display: flex; gap: 12px; margin-top: 20px;' +
        '}' +
        '.settings-actions button {' +
        '    flex: 1; padding: 8px; border: 1px solid #ddd;' +
        '    border-radius: 6px; background: white; cursor: pointer;' +
        '}';
    document.head.appendChild(style);
    
    // Export to window
    window.UserSettings = UserSettings;
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            UserSettings.initialize();
        }, 1000);
    });
    
})();