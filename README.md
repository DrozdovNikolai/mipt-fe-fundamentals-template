# GigaChat UI Shell

## Тесты

Запуск:

```bash
npm test
```

Тесты написаны на Vitest и React Testing Library. Сейчас покрыты ключевые части: reducer глобального chat-store, контролируемая форма `InputArea`, варианты отображения `Message`, поиск и подтверждение удаления в `Sidebar`, а также сохранение и восстановление данных через `localStorage`, включая битый JSON.
