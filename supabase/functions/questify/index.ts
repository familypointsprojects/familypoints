// Supabase Edge Function: questify
// Превращает бытовое задание в приключенческий квест через OpenAI gpt-4o-mini.
//
// Деплой:
//   supabase functions deploy questify
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// Вызов из клиента:
//   supabase.functions.invoke('questify', { body: { title, description, epicLevel } })

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const MODEL = 'gpt-4o-mini';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type QuestEpicLevel = 'easy' | 'epic' | 'maximum';

// Уровень влияет только на количество сухого юмора, не на жанр.
const LEVEL_PROMPT: Record<QuestEpicLevel, string> = {
  easy: '«Легко»: максимально спокойно и просто, юмор минимальный — почти обычная формулировка, только чуть живее.',
  epic: '«Эпично»: основной стиль — ощущение миссии плюс лёгкий сухой юмор, как в примерах.',
  maximum:
    '«Максимум»: чуть больше остроумия и характера в наблюдении, но всё так же спокойно и по-взрослому. Без фэнтези и пафоса.',
};

// Эталонные примеры тона и формата (учат стилю, копировать дословно не нужно).
const EXAMPLES = [
  'Примеры нужного тона и формата:',
  '«Убрать комнату» → {"title":"Миссия: Вернуть контроль","description":"Комната ушла в режим «и так нормально». Проверь эту теорию: убери вещи, мусор и всё, что явно лежит не там.","doneCriteria":"Вещи на местах, мусор убран, по комнате можно нормально пройти."}',
  '«Помыть посуду» → {"title":"Миссия: Разобрать очередь","description":"Раковина снова стала местом массового собрания тарелок. Разбери очередь и верни кухне рабочее состояние.","doneCriteria":"Вся посуда чистая, убрана или загружена в посудомойку."}',
  '«Вынести мусор» → {"title":"Миссия: Закрыть вопрос","description":"Пакет уже явно задержался в доме дольше, чем планировалось. Вынеси его и поставь новый.","doneCriteria":"Мусор вынесен, новый пакет установлен."}',
  '«Собрать рюкзак» → {"title":"Миссия: Утро без паники","description":"Собери рюкзак заранее, чтобы завтра не проходить квест «где моя тетрадь» на максимальной сложности.","doneCriteria":"Учебники, тетради, пенал и нужные вещи собраны."}',
  '«Сделать домашку» → {"title":"Миссия: Закрыть учебный долг","description":"Домашка сама себя не сделает. Да, несправедливо. Зато после выполнения этот вопрос можно официально закрыть.","doneCriteria":"Домашнее задание сделано полностью и проверено."}',
  '«Разобрать стол» → {"title":"Миссия: Вернуть столу смысл","description":"Стол постепенно стал архивом случайных вещей. Разбери лишнее и оставь только то, что реально нужно.","doneCriteria":"Стол чистый, лишние вещи убраны."}',
  '«Прочитать 20 минут» → {"title":"Миссия: 20 минут фокуса","description":"Открой книгу и продержись 20 минут без побега в телефон. Звучит просто. Поэтому и проверим.","doneCriteria":"Прочитано минимум 20 минут без постоянных отвлечений."}',
  '«Покормить питомца» → {"title":"Миссия: Ответственный за припасы","description":"Питомец не умеет писать напоминания, но взгляд у него достаточно убедительный. Проверь корм и воду.","doneCriteria":"Еда и свежая вода на месте."}',
].join('\n');

function buildPrompt(
  epicLevel: QuestEpicLevel,
  childName?: string,
  isDaily?: boolean,
  gender?: 'male' | 'female',
): string {
  const cadenceRule = isDaily
    ? 'Это ежедневная задача (повторяется). Допустим лёгкий намёк на регулярность («снова», «как обычно»), без драмы.'
    : 'Это разовая задача — подавай как отдельное дело сейчас, без намёков на «каждый день».';
  const nameRule = childName
    ? `Имя игрока: ${childName}. Можно изредка ненавязчиво обратиться по имени, но чаще без него и без панибратства. Имя не коверкай.`
    : 'Имя игрока неизвестно — по имени не обращайся.';
  const genderRule =
    gender === 'male'
      ? 'ПОЛ ИГРОКА: мальчик. Где в тексте всплывают родовые формы про него — используй мужской род («ты сделал», «будешь готов», «сам справишься»). Обращайся на «ты».'
      : gender === 'female'
        ? 'ПОЛ ИГРОКА: девочка. Где всплывают родовые формы про неё — используй женский род («ты сделала», «будешь готова», «сама справишься»). Обращайся на «ты».'
        : 'ПОЛ ИГРОКА неизвестен — держи гендер-нейтральность: только «ты» и повелительное наклонение («помой», «собери»), без глаголов прошедшего времени про игрока («ты сделал/сделала» выдают пол).';
  return [
    'Ты пишешь текст задания-миссии для приложения easyQuest. Аудитория — ребёнок 10–12 лет. Берёшь обычное бытовое дело от родителя и превращаешь его в короткую миссию.',
    '',
    'ТОН: взрослее, умнее и спокойнее, чем обычная детская игра. Лёгкий СУХОЙ юмор и ирония, ощущение миссии. Коротко и по делу. Обращайся как к смышлёному подростку, а не к малышу.',
    'ПРИЁМ ЮМОРА: спокойное ироничное наблюдение над ситуацией («комната ушла в режим «и так нормально»», «пакет задержался в доме дольше, чем планировалось», «стол стал архивом случайных вещей»). Сухо, с лёгкой усмешкой — НЕ громко и НЕ мультяшно. Смейся над ситуацией или предметом, а НЕ над игроком.',
    'Шутка должна быть КОНКРЕТНОЙ и понятной. Запрещены смутные абстракции вроде «стать частью драмы», «войти в историю», «начать новую жизнь», «устроить философский кризис» — они не складываются по смыслу. Если образ не ясен с первого прочтения — замени простым наблюдением.',
    '',
    'ЗАПРЕЩЕНО:',
    '- сюсюканье и детсадовские образы; слова «малыш», «зайчик», «помоги мамочке», «дружок», «герой»;',
    '- сказочные монстры, волшебство, эпичное фэнтези, «королевство», «замок», «трон»; пиратская/морская тема, «капитан», «палуба», «йо-хо-хо»;',
    '- стыд, давление, морализаторство («не ленись», «докажи, что молодец»), агрессивная мотивация;',
    '- шутки над самим ребёнком; длинный лор; пафос и выспренние обороты; emoji;',
    '- упоминание баллов/монет/награды внутри текста — награда показывается отдельно.',
    '',
    'СОХРАНЯЙ СМЫСЛ родительской задачи: из текста ясно, что именно нужно сделать, теми же простыми словами. Не добавляй новых обязательных действий. Не переименовывай предмет (посуда — это посуда, книга — это книга). Только реальные русские слова, только по-русски, без латиницы.',
    '',
    EXAMPLES,
    '',
    nameRule,
    cadenceRule,
    genderRule,
    `Уровень подачи: ${LEVEL_PROMPT[epicLevel]}`,
    '',
    'ПОЛЯ ОТВЕТА:',
    '- title: короткий, до 45 символов. Допустим префикс «Миссия: …».',
    '- description: 1–2 предложения, до 180 символов. Ироничное наблюдение + ясное действие.',
    '- doneCriteria: конкретный, проверяемый критерий готовности (что именно должно быть сделано). Буднично, по делу, без юмора, до 140 символов.',
    '',
    'Верни СТРОГО JSON {"title":"...","description":"...","doneCriteria":"..."} без markdown, без пояснений, без emoji.',
  ].join('\n');
}

function clip(s: unknown, max: number): string {
  return typeof s === 'string' ? s.slice(0, max) : '';
}

// Постобработка: trim, снять обрамляющие кавычки/markdown, ограничить длину БЕЗ обрывков слов.
function cleanField(s: unknown, max: number): string {
  let text = typeof s === 'string' ? s : '';
  text = text.trim().replace(/^["'`*»]+|["'`*«]+$/g, '').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  // Режем по последнему пробелу, чтобы не оборвать слово; чистим хвостовую пунктуацию.
  return (lastSpace > 10 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—-]+$/u, '').trim();
}

// Generic fallback для пустого/неизвестного результата.
const GENERIC_QUEST = {
  title: 'Миссия: Закрыть задачу',
  description: 'Задача появилась в списке — значит, её пора закрыть. Сделай аккуратно и отправь результат на проверку.',
  doneCriteria: 'Задание выполнено полностью и готово к проверке.',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY is not configured' }, 500);
  }

  let payload: {
    title?: string;
    description?: string;
    epicLevel?: QuestEpicLevel;
    childName?: string;
    isDaily?: boolean;
    gender?: 'male' | 'female';
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const title = clip(payload.title, 200).trim();
  const description = clip(payload.description, 600).trim();
  const epicLevel: QuestEpicLevel =
    payload.epicLevel === 'easy' || payload.epicLevel === 'maximum' ? payload.epicLevel : 'epic';
  const childName =
    typeof payload.childName === 'string' && /^[\p{L}\s'-]{1,30}$/u.test(payload.childName.trim())
      ? payload.childName.trim()
      : undefined;
  const isDaily = payload.isDaily === true;
  const gender = payload.gender === 'male' || payload.gender === 'female' ? payload.gender : undefined;

  if (!title && !description) {
    return json({ error: 'Нужен текст задания (title или description)' }, 400);
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 320,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildPrompt(epicLevel, childName, isDaily, gender) },
          {
            role: 'user',
            content: `Задание:\nНазвание: ${title || '(нет)'}\nОписание: ${description || '(нет)'}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: 'OpenAI error', detail }, 502);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';

    let parsed: { title?: string; description?: string; doneCriteria?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: 'Модель вернула не-JSON', raw }, 502);
    }

    return json({
      title: cleanField(parsed.title, 45) || GENERIC_QUEST.title,
      description: cleanField(parsed.description, 180) || GENERIC_QUEST.description,
      doneCriteria: cleanField(parsed.doneCriteria, 140) || GENERIC_QUEST.doneCriteria,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
