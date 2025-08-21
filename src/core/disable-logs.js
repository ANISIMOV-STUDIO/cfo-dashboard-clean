/**
 * Disable Logs Module
 * Отключает все консольные логи кроме критических ошибок
 */
(function() {
    'use strict';
    
    // Сохраняем оригинальные методы
    var originalConsole = {
        log: console.log,
        info: console.info,
        debug: console.debug,
        warn: console.warn,
        error: console.error
    };
    
    // Отключаем большинство логов, оставляем только критические ошибки
    console.log = function() {
        // Отключено для продакшена
    };
    
    console.info = function() {
        // Отключено для продакшена  
    };
    
    console.debug = function() {
        // Отключено для продакшена
    };
    
    console.warn = function() {
        // Оставляем предупреждения только для критических ошибок
        var message = Array.prototype.slice.call(arguments).join(' ');
        if (message.indexOf('Chart') !== -1 && message.indexOf('not found') !== -1) {
            // Показываем только критические ошибки графиков
            originalConsole.warn.apply(console, arguments);
        }
    };
    
    console.error = function() {
        // Оставляем все ошибки
        originalConsole.error.apply(console, arguments);
    };
    
    // Функция для включения логов в режиме разработки
    window.enableDebugLogs = function() {
        console.log = originalConsole.log;
        console.info = originalConsole.info;
        console.debug = originalConsole.debug;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        console.log('Debug logs enabled');
    };
    
    // Функция для полного отключения всех логов
    window.disableAllLogs = function() {
        console.log = function() {};
        console.info = function() {};
        console.debug = function() {};
        console.warn = function() {};
        console.error = function() {};
    };
    
})();