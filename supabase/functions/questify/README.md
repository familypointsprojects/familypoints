# questify — Edge Function

Превращает обычное задание в приключенческий квест через OpenAI `gpt-4o-mini`.

## Что нужно один раз

1. Установить Supabase CLI (если ещё нет):

   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <твой-project-ref>
   ```

2. Положить ключ OpenAI в секреты функции (НЕ в .env приложения):

   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

3. Задеплоить функцию:

   ```bash
   supabase functions deploy questify
   ```

## Локальный запуск (по желанию)

```bash
supabase functions serve questify --env-file ./supabase/.env.local
# в ./supabase/.env.local: OPENAI_API_KEY=sk-...
```

## Контракт

Запрос (`POST`):

```json
{ "title": "Помыть посуду", "description": "Помыть свою посуду после еды", "epicLevel": "medium" }
```

`epicLevel`: `"light"` | `"medium"` | `"full"`.

Ответ:

```json
{ "title": "...", "description": "..." }
```

## Стоимость

~$0.00014 за вызов (gpt-4o-mini). $10 ≈ 70 000 квестов.

## Защита от абуза

Функция по умолчанию требует JWT (вызывается только из авторизованного приложения).
Рекомендуется добавить лимит вызовов на семью/пользователя (например, через таблицу-счётчик
или rate-limit в самой функции), чтобы кнопку нельзя было крутить бесконечно.

## Фолбэк

Если Supabase в приложении не настроен (`EXPO_PUBLIC_DATA_SOURCE=local` без URL/ключа),
клиент (`src/shared/services/questify.ts`) использует локальный шаблонный мок — кнопка
работает офлайн, но текст будет проще.
