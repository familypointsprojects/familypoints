import { z } from 'zod';

import { isSupabaseConfigured, supabaseClient } from '@/shared/services/supabase/client';

export type QuestEpicLevel = 'easy' | 'epic' | 'maximum';

/** Конфиг уровней интенсивности квеста (метки для UI). */
export const questEpicLevelConfig: Record<QuestEpicLevel, { label: string; subtitle: string }> = {
  easy: { label: 'Легко', subtitle: 'спокойно' },
  epic: { label: 'Эпично', subtitle: 'миссия' },
  maximum: { label: 'Максимум', subtitle: 'с характером' },
};

export const QUEST_EPIC_LEVELS: QuestEpicLevel[] = ['easy', 'epic', 'maximum'];

export type QuestGender = 'male' | 'female';

/**
 * Пол ребёнка по выбранному аватару (см. shared/ui/AvatarHeads: 'boy' | 'girl' | 'skeleton').
 * Скелет и неизвестный аватар → undefined (текст остаётся гендер-нейтральным).
 */
export const genderFromAvatarId = (avatarId?: string): QuestGender | undefined =>
  avatarId === 'boy' ? 'male' : avatarId === 'girl' ? 'female' : undefined;

export type QuestifyInput = {
  title: string;
  description: string;
  epicLevel?: QuestEpicLevel;
  /** Имя ребёнка — иногда ненавязчиво используется в тексте */
  childName?: string;
  /** Ежедневная задача (true) или разовая (false) — влияет на подачу */
  isDaily?: boolean;
  /** Пол ребёнка (из аватара) — влияет на родовые формы в тексте */
  gender?: QuestGender;
};

export type QuestifyResult = {
  title: string;
  description: string;
  doneCriteria: string;
  /** true — текст пришёл от локального шаблона, не от AI */
  isMock?: boolean;
};

/** Схема ответа модели. */
const questResultSchema = z.object({
  title: z.string().min(1).max(45),
  description: z.string().min(1).max(180),
  doneCriteria: z.string().min(1).max(140),
});

/**
 * Превращает обычное задание в короткую миссию с сухим юмором.
 * Если Supabase настроен — зовёт Edge Function questify (OpenAI gpt-4o-mini).
 * Иначе откатывается на локальный словарь шаблонов, чтобы UI работал без сети.
 */
export const questifyTask = async (input: QuestifyInput): Promise<QuestifyResult> => {
  const title = input.title.trim();
  const description = input.description.trim();
  const epicLevel: QuestEpicLevel = input.epicLevel ?? 'epic';
  const childName = input.childName?.trim() || undefined;

  if (!title && !description) {
    throw new Error('Введите название или описание задания.');
  }

  if (isSupabaseConfigured && supabaseClient) {
    const { data, error } = await supabaseClient.functions.invoke('questify', {
      body: { title, description, epicLevel, childName, isDaily: input.isDaily === true, gender: input.gender },
    });

    if (error) {
      // Supabase прячет настоящую ошибку функции в error.context (Response).
      let detail = error.message || 'Не удалось превратить задание в квест.';
      const ctx = (error as { context?: unknown }).context;
      if (ctx && typeof (ctx as Response).json === 'function') {
        try {
          const body = await (ctx as Response).json();
          detail = body?.detail || body?.error || detail;
        } catch {
          // тело не JSON — оставляем общий текст
        }
      }
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    if (data?.error) {
      throw new Error(String(data.error));
    }

    const parsed = questResultSchema.safeParse(data);
    if (parsed.success) {
      return parsed.data;
    }
    // Ответ не прошёл валидацию — откатываемся на локальный шаблон ниже.
  }

  return localQuest(title, description);
};

// --- Локальный словарь шаблонов (офлайн-фолбэк) ------------------------------

const GENERIC_QUEST: QuestifyResult = {
  title: 'Миссия: Закрыть задачу',
  description: 'Задача появилась в списке — значит, её пора закрыть. Сделай аккуратно и отправь результат на проверку.',
  doneCriteria: 'Задание выполнено полностью и готово к проверке.',
  isMock: true,
};

type QuestTemplate = { keys: string[]; quest: Omit<QuestifyResult, 'isMock'> };

// Порядок важен: более специфичные совпадения («накрыть», «после еды») идут раньше общего «стол».
const QUEST_TEMPLATES: QuestTemplate[] = [
  {
    keys: ['комнат'],
    quest: {
      title: 'Миссия: Вернуть контроль',
      description: 'Комната ушла в режим «и так нормально». Проверь эту теорию: убери вещи, мусор и всё, что явно лежит не там.',
      doneCriteria: 'Вещи на местах, мусор убран, по комнате можно нормально пройти.',
    },
  },
  {
    keys: ['посуд'],
    quest: {
      title: 'Миссия: Разобрать очередь',
      description: 'Раковина снова стала местом массового собрания тарелок. Разбери очередь и верни кухне рабочее состояние.',
      doneCriteria: 'Вся посуда чистая, убрана или загружена в посудомойку.',
    },
  },
  {
    keys: ['мусор'],
    quest: {
      title: 'Миссия: Закрыть вопрос',
      description: 'Пакет уже явно задержался в доме дольше, чем планировалось. Вынеси его и поставь новый.',
      doneCriteria: 'Мусор вынесен, новый пакет установлен.',
    },
  },
  {
    keys: ['рюкзак', 'портфель'],
    quest: {
      title: 'Миссия: Утро без паники',
      description: 'Собери рюкзак заранее, чтобы завтра не проходить квест «где моя тетрадь» на максимальной сложности.',
      doneCriteria: 'Учебники, тетради, пенал и нужные вещи собраны.',
    },
  },
  {
    keys: ['домашк', 'домашн', 'уроки', 'урок'],
    quest: {
      title: 'Миссия: Закрыть учебный долг',
      description: 'Домашка сама себя не сделает. Да, несправедливо. Зато после выполнения этот вопрос можно официально закрыть.',
      doneCriteria: 'Домашнее задание сделано полностью и проверено.',
    },
  },
  {
    keys: ['кровать', 'постель', 'заправ'],
    quest: {
      title: 'Миссия: Быстрый порядок',
      description: 'Кровать выглядит как доказательство того, что утро было непростым. Исправь за две минуты.',
      doneCriteria: 'Одеяло и подушка лежат аккуратно.',
    },
  },
  {
    keys: ['пылесос'],
    quest: {
      title: 'Миссия: Чистый маршрут',
      description: 'На полу накопилось достаточно улик, чтобы пылесос не скучал. Пройди комнату и убери видимый мусор.',
      doneCriteria: 'Пол чистый, крошек и заметной пыли нет.',
    },
  },
  {
    keys: ['зуб'],
    quest: {
      title: 'Миссия: Базовая защита',
      description: 'Две минуты со щёткой сейчас — меньше вопросов от стоматолога потом. Сделка выглядит разумно.',
      doneCriteria: 'Зубы почищены минимум 2 минуты.',
    },
  },
  {
    keys: ['чита', 'книг', 'почита'],
    quest: {
      title: 'Миссия: 20 минут фокуса',
      description: 'Открой книгу и продержись 20 минут без побега в телефон. Звучит просто. Поэтому и проверим.',
      doneCriteria: 'Прочитано минимум 20 минут без постоянных отвлечений.',
    },
  },
  {
    keys: ['питом', 'корм', 'покорм'],
    quest: {
      title: 'Миссия: Ответственный за припасы',
      description: 'Питомец не умеет писать напоминания, но взгляд у него достаточно убедительный. Проверь корм и воду.',
      doneCriteria: 'Еда и свежая вода на месте.',
    },
  },
  {
    keys: ['накрыть'],
    quest: {
      title: 'Миссия: Подготовить стол',
      description: 'Стол сам себя не накроет, хотя было бы удобно. Разложи тарелки, приборы и всё нужное для еды.',
      doneCriteria: 'Стол готов, всем хватает тарелок и приборов.',
    },
  },
  {
    keys: ['после еды', 'со стола', 'убрать со стол'],
    quest: {
      title: 'Миссия: Финал без следов',
      description: 'Еда закончилась, а последствия почему-то остались. Убери тарелки, крошки и всё лишнее со стола.',
      doneCriteria: 'Стол чистый, посуда убрана, крошек нет.',
    },
  },
  {
    keys: ['разобрать стол', 'убрать стол', 'стол'],
    quest: {
      title: 'Миссия: Вернуть столу смысл',
      description: 'Стол постепенно стал архивом случайных вещей. Разбери лишнее и оставь только то, что реально нужно.',
      doneCriteria: 'Стол чистый, лишние вещи убраны.',
    },
  },
  {
    keys: ['покупк', 'продукт'],
    quest: {
      title: 'Миссия: Разобрать припасы',
      description: 'Пакеты прибыли. Остался финальный уровень: продукты — по местам, пустые пакеты — не на полу.',
      doneCriteria: 'Покупки разобраны, продукты убраны, пакеты не валяются.',
    },
  },
  {
    keys: ['одежд', 'гардероб'],
    quest: {
      title: 'Миссия: Разобрать гардероб',
      description: 'Одежда снова решила жить где угодно, кроме шкафа. Раздели чистое, грязное и «ещё можно надеть».',
      doneCriteria: 'Чистое убрано, грязное в корзине, лишнего на стуле нет.',
    },
  },
  {
    keys: ['полить', 'полей', 'цвет', 'растен'],
    quest: {
      title: 'Миссия: Водная проверка',
      description: 'Растения молчат, но по листьям видно: сервис воды сегодня был бы кстати. Полей их по списку.',
      doneCriteria: 'Все нужные растения политы, вода не разлита вокруг.',
    },
  },
];

const localQuest = (title: string, description: string): QuestifyResult => {
  const haystack = `${title} ${description}`.toLowerCase();
  const match = QUEST_TEMPLATES.find((template) => template.keys.some((key) => haystack.includes(key)));
  return match ? { ...match.quest, isMock: true } : GENERIC_QUEST;
};
