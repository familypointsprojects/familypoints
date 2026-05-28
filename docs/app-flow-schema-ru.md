# easyQuest: схема логики приложения

## Общая Карта

```mermaid
flowchart TD
  App["Приложение easyQuest"]
  Parent["Родитель"]
  Child["Ребенок"]
  Family["Семья"]
  Tasks["Задачи"]
  Wishes["Желания"]
  Rewards["Награды"]
  Points["Баллы"]
  History["История"]

  App --> Parent
  App --> Child
  Parent --> Family
  Family --> Child

  Parent --> Tasks
  Parent --> Rewards
  Parent --> Wishes

  Child --> Tasks
  Child --> Wishes
  Child --> Rewards

  Tasks --> Points
  Rewards --> Points
  Wishes --> Rewards
  Points --> History
  Tasks --> History
  Rewards --> History
  Wishes --> History
```

## Что Происходит После Запуска

```mermaid
flowchart TD
  Start["Открываем приложение"]
  Session{"Есть сохраненная сессия?"}
  Role{"Какая роль?"}
  Welcome["Welcome / вход"]
  ParentLogin["Вход родителя"]
  ChildLogin["Вход ребенка по QR / коду"]
  ParentDashboard["Панель родителя"]
  ChildDashboard["Панель ребенка"]

  Start --> Session
  Session -- "Нет" --> Welcome
  Welcome --> ParentLogin
  Welcome --> ChildLogin
  ParentLogin -- "успешно" --> ParentDashboard
  ChildLogin -- "успешно" --> ChildDashboard

  Session -- "Да" --> Role
  Role -- "родитель" --> ParentDashboard
  Role -- "ребенок" --> ChildDashboard
```

Главное правило: если пользователь уже авторизован, экран входа больше не показываем.

## Логика Задач

```mermaid
sequenceDiagram
  participant P as Родитель
  participant B as Backend
  participant C as Ребенок

  P->>B: Создает задачу
  B-->>C: Задача появляется у ребенка
  C->>B: Нажимает "Я сделал"
  B-->>P: Появляется заявка на проверку
  P->>B: Одобряет выполнение
  B-->>C: Начисляются баллы
  B-->>C: Задача исчезает из доступных
  B-->>P: Задача остается в истории
  P->>B: Может повторить задачу
  B-->>C: Задача снова доступна
```

## Логика Желаний

```mermaid
sequenceDiagram
  participant C as Ребенок
  participant P as Родитель
  participant B as Backend

  C->>B: Добавляет желание
  B-->>P: Родитель видит запрос желания
  P->>B: Одобряет и назначает цену
  B-->>C: Желание становится одобренным
  B-->>C: Создается награда типа "желание"
  C->>B: Нажимает "Получить"
  B-->>P: Родитель видит запрос награды
  P->>B: Одобряет и выдает
  B-->>C: Желание уходит из активного списка
  B-->>C: Появляется в полученных желаниях и наградах
```

## Логика Наград

```mermaid
flowchart TD
  CreateReward["Родитель создает награду"]
  Available["Ребенок видит награду в доступных"]
  EnoughPoints{"Хватает баллов?"}
  Redeem["Ребенок нажимает Получить"]
  Wow["Показываем wow-эффект"]
  Spend["Баллы списываются"]
  ParentReview["Родитель получает запрос"]
  Approve{"Родитель одобрил?"}
  Reject["Отклонено, баллы возвращаются"]
  Fulfill["Родитель нажимает Выдать"]
  Received["Награда уходит в Полученные"]
  Inactive["Награда становится неактивной"]
  Repeat["Родитель может повторить награду"]

  CreateReward --> Available
  Available --> EnoughPoints
  EnoughPoints -- "Нет" --> Available
  EnoughPoints -- "Да" --> Redeem
  Redeem --> Wow
  Redeem --> Spend
  Spend --> ParentReview
  ParentReview --> Approve
  Approve -- "Нет" --> Reject
  Approve -- "Да" --> Fulfill
  Fulfill --> Received
  Fulfill --> Inactive
  Inactive --> Repeat
  Repeat --> Available
```

## Карта Экранов

```mermaid
flowchart LR
  Welcome["Главный экран"]
  Auth["Вход"]
  Parent["Панель родителя"]
  Child["Панель ребенка"]

  ParentTasks["Задачи родителя"]
  CreateTask["Создать задачу"]
  Submissions["Проверка задач"]
  ParentRewards["Награды родителя"]
  CreateReward["Создать награду"]
  Redemptions["Запросы наград"]
  WishRequests["Запросы желаний (редирект в Награды родителя)"]

  ChildTasks["Задачи ребенка"]
  TaskDetails["Детали задачи"]
  ChildRewards["Награды и желания ребенка"]
  ChildWishes["Желания ребенка (редирект в Награды)"]
  Balance["Баланс и история"]
  ChildHistory["История (редирект в Баланс)"]

  Welcome --> Auth
  Auth --> Parent
  Auth --> Child

  Parent --> ParentTasks
  Parent --> CreateTask
  Parent --> Submissions
  Parent --> ParentRewards
  Parent --> Redemptions
  Parent -. старый маршрут .-> WishRequests
  ParentRewards --> CreateReward

  Child --> ChildTasks
  ChildTasks --> TaskDetails
  Child --> ChildRewards
  Child -. старый маршрут .-> ChildWishes
  Child --> Balance
  Child -. старый маршрут .-> ChildHistory
```

Правила навигации:

- В нижнем меню используем объединенные страницы, а не старые redirect-маршруты.
- У ребенка награды, желания и полученное находятся на `/child/rewards`.
- У ребенка баланс и история задач находятся на `/child/balance`.
- У родителя каталог наград и запросы желаний находятся на `/parent/rewards`.

## Состояния После Действий

| Действие | Что происходит |
| --- | --- |
| Родитель создал задачу | Задача активна и видна ребенку. |
| Ребенок выполнил задачу | Создается заявка `pending`. |
| Родитель одобрил задачу | Баллы начислены, задача становится неактивной. |
| Родитель повторил задачу | Задача снова активна. |
| Ребенок создал желание | Желание ждет одобрения родителя. |
| Родитель одобрил желание | Желание превращается в награду типа `wish`. |
| Ребенок нажал получить | Баллы списаны, родитель видит запрос. |
| Родитель выдал награду | Награда/желание уходит в историю полученных. |
| Родитель отклонил награду | Баллы возвращаются ребенку. |
