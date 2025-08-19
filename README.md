# CFO Dashboard - Clean Production Build

## Быстрый запуск

### Python сервер (рекомендуется)
```bash
python serve.py
```
Откроется браузер на http://localhost:8080

### Прямое открытие
Откройте `index.html` в браузере

## Файлы

- `index.html` — полный CFO дашборд (все стили и JS инлайн)
- `sample-data.json` — тестовые данные для демонстрации
- `data-schema.json` — JSON схема входных данных
- `alerts-config.json` — конфигурация алертов
- `integration-guide.md` — руководство по интеграции в 1С
- `acceptance-tests.md` — список тестов готовности

## API для 1С

```javascript
// Обновление данных
window.external1C.updateDashboard(jsonData);

// Проверка состояния
window.external1C.getDashboardState();

// Debug функции
window.__dbg.waterfallDebug();
window.__dbg.varianceDebug();
```

## Возможности

✅ **Waterfall ДДС** с линией остатка и соединителями  
✅ **Variance План vs Факт** с правильной IBCS визуализацией  
✅ **9 финансовых коэффициентов** с автоматическим CCC = DSO + DII - DPO  
✅ **Smart дебиторка** с автобакетизацией и DSO расчётом  
✅ **Переключатель Абсолют/100%** с сохранением в localStorage  
✅ **IBCS стандарты**: факт чёрный, план контур, ПГ серый, прогноз пунктир  
✅ **Производительность**: обновление ≤50ms, без анимаций, canvas reuse  
✅ **1С совместимость**: V8WebKit 8.3.27, IIFE, без модулей  

## Sprint 6.1 - Стабилизация (важно!)

### Что исправлено в S6.1:

🔧 **Убраны дубли кода:**
- Оставлена единая реализация `ensureHiDPI` (в dashboard.bundle.js)
- Удалены конфликты ReferenceError для печати/экспорта
- Исправлены синтаксические ошибки (`.newData`, `Math.max.`)

🏗️ **Фиксированная высота header:**
- CSS переменная `--header-h` автоматически рассчитывается
- Контент больше не уходит под фиксированную шапку
- Адаптивная высота для разных размеров экрана
- Высота шапки обновляется через `ResizeObserver`

⚙️ **Единая инициализация:**
- Все компоненты загружаются через один `DOMContentLoaded`
- Центральная функция `applyShareMode()` для переключателя "Абсолют/100%"
- Глобальные функции печати/экспорта доступны в `window`

🔍 **Улучшенный мини-линтер:**
- Проверка дублей ID в DOM на этапе выполнения
- Детекция конфликтов глобальных функций
- Поиск inline‑обработчиков и `transform: scale` на `<canvas>`
- `window.__dbg.selfCheck()` возвращает 0 ошибок на чистой сборке

### Глобальные функции (S6.1):

```javascript
// Печать
window.printCurrentPage()
window.printAllPages()

// Экспорт
window.exportCurrentPage()
window.exportAllPages()
window.executeBatchExport()

// Алерты
window.hideRecommendationBanner()
window.snoozeAlert()
window.dismissAlert()
```

### CSS переменная высоты header:

```css
:root {
    --header-h: 160px; /* Автоматически обновляется JS */
}

.dashboard {
    padding-top: var(--header-h);
}

.page-body {
    height: calc(100vh - var(--header-h));
}
```

### Быстрая диагностика:

```javascript
// Проверка стабилизации S6.1
window.__dbg.selfCheck()

// Результат должен быть:
// { errors: [], warnings: [], passed: true }
```

## Готово к продакшену! 🚀