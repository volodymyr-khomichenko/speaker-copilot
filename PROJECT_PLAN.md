# Speaker Copilot: стартовий план реалізації проєкту

## 1. Ідея проєкту

**Speaker Copilot** — це простий браузерний PWA-застосунок, який допомагає спікеру провести живий виступ без втрати структури та без перевищення таймінгу.

Це **НЕ телесуфлер**. Це **тайм-асистент для спікера**.

Перед виступом користувач створює виступ, задає загальний час, розбиває його на секції з тривалістю та короткими нотатками. Після натискання **Start Presentation** застосунок повністю автоматично веде виступ: сам перемикає секції за таймінгом, змінює нотатки й подає короткий сигнал (вібрація або звук).

Головна ідея: **спікер не взаємодіє із застосунком під час виступу — застосунок сам веде спікера.**

**Важливо про позиціонування:** таймінг — це перша, базова функція, а не суть продукту. Speaker Copilot — це копайлот спікера: основний застосунок, який має бути відкритий у кожного, хто виступає офлайн (а в майбутньому — і онлайн). Поверх таймінгу поступово додаватимуться інші функції копайлота.


---

## 2. Для кого цей продукт

Початкова аудиторія:

* спікери на конференціях;
* маркетологи й фаундери, які виступають публічно;
* викладачі, тренери, ведучі воркшопів;
* люди, які записують подкасти або вебінари з жорстким таймінгом;
* усі, хто готує пітчі з обмеженим часом (демо-дні, інвестиційні пітчі).

---

## 3. Проблема

Під час живого виступу спікер стикається з двома проблемами:

* **Втрата таймінгу** — легко "залипнути" на одній темі й не встигнути розповісти головне.
* **Втрата структури** — під стресом можна забути порядок тем або загубити думку.

Наявні рішення незручні:

* телесуфлери змушують читати текст і вбивають живу подачу;
* звичайний таймер показує лише загальний час, а не прогрес по секціях;
* ручне перемикання нотаток під час виступу — це зайве когнітивне навантаження;
* папірці й слайди зі speaker notes не сигналізують, коли час рухатися далі.

---

## 4. Рішення

Speaker Copilot автоматично веде спікера по структурі виступу:

* великий таймер і назва поточної секції завжди на екрані;
* секції змінюються самі, точно за таймінгом;
* при переході — коротка вібрація або звук, тому спікер орієнтується на слух;
* кнопка **SOS** відкриває "рятувальні" підказки, якщо загубив думку;
* після виступу — звіт: план vs факт по кожній секції.

---

## 5. Початковий MVP

Мета MVP — за один тиждень отримати простий інструмент, який реально допоможе провести перший живий виступ. Проєкт пушиться в GitHub і публікується через Vercel.

### MVP має включати:

1. **Екран Presentation List**

   * список збережених виступів;
   * створити / редагувати / видалити;
   * кнопка Start.

2. **Екран Presentation Editor**

   * назва виступу;
   * загальний час;
   * список секцій, для кожної: назва, тривалість, короткі нотатки;
   * додавання, видалення, зміна порядку секцій;
   * окремий блок SOS-нотаток (не прив'язаний до секцій).

3. **Екран Presentation Mode**

   * великий таймер (загальний час + час секції);
   * назва поточної секції;
   * короткі нотатки секції;
   * **автоматичний перехід** між секціями за таймінгом;
   * при переході: коротка вібрація, короткий звуковий сигнал (опційно), візуальне повідомлення "Next section";
   * велика кнопка **SOS**;
   * жодного ручного перемикання секцій.

4. **SOS Mode**

   * відкривається одним натисканням, так само швидко закривається;
   * показує заздалегідь підготовлені підказки: фрази-переходи, фрази для виграшу часу, ключові цифри, основні повідомлення, FAQ.

5. **Екран Summary (після завершення)**

   * Planned time vs Actual time;
   * час по кожній секції;
   * де було перевищення або випередження.

6. **Дані зберігаються в LocalStorage**

   * без бекенду, без бази даних, без логіну;
   * усі виступи живуть на пристрої користувача.

7. **PWA**

   * manifest + іконка;
   * можливість додати на home screen;
   * працює офлайн (критично: на конференціях часто немає інтернету);
   * екран не засинає під час виступу (Wake Lock API).

8. **Публікація через Vercel**

   * проєкт лежить на GitHub;
   * Vercel автоматично оновлює сайт після кожного push.

---

## 6. Що НЕ входить у MVP

Щоб не ускладнювати першу версію, у MVP не потрібно робити:

* AI;
* імпорт презентацій;
* синхронізацію зі слайдами;
* Apple Watch;
* авторизацію;
* хмарне збереження;
* командну роботу;
* аналітику;
* сигнали лише в навушник (AirPods) — записано в backlog;
* будь-які функції, які не потрібні для тестування першого реального виступу.

Перша версія має бути простою: **один спікер, один телефон, один виступ.**

---

## 7. Рекомендований технічний стек

Для максимально простого старту:

* **React** — інтерфейс;
* **Vite** — збірка та dev-сервер;
* **Tailwind CSS** — стилізація;
* **LocalStorage** — збереження виступів;
* **vite-plugin-pwa** — manifest, service worker, офлайн;
* **Wake Lock API** — щоб екран не гаснув під час виступу;
* **Vibration API** — сигнали при зміні секцій;
* **Web Audio API** — короткий звуковий сигнал (опційно);
* **Vercel** — безкоштовний хостинг;
* **GitHub** — репозиторій і історія комітів.

Без бекенду. Без авторизації. Без бази даних.

---

## 8. Назва репозиторію

Можливі варіанти:

* `speaker-copilot`
* `speaker-timer-assistant`
* `talk-flow`
* `stage-timer`
* `speech-pacer`

Рекомендована назва: **`speaker-copilot`**

---

## 9. Структура першої версії

```text
speaker-copilot/
  README.md
  PROJECT_PLAN.md
  package.json
  vite.config.ts
  index.html
  public/
    icons/
  src/
    main.tsx
    App.tsx
    screens/
      PresentationList.tsx
      PresentationEditor.tsx
      PresentationMode.tsx
      SosOverlay.tsx
      Summary.tsx
    components/
      SectionCard.tsx
      BigTimer.tsx
      TransitionAlert.tsx
    hooks/
      usePresentationTimer.ts
      useWakeLock.ts
      useVibration.ts
    lib/
      storage.ts
      types.ts
```

---

## 10. Перший промпт для Claude Code

Використати цей промпт після створення папки проєкту:

```text
Create a simple mobile-first PWA called Speaker Copilot.

Use React, Vite, TypeScript, and Tailwind CSS. No backend, no auth, no database. All data lives in LocalStorage.

This is NOT a teleprompter. It is a timing assistant for live speakers.

Core concept: before a talk, the user creates a presentation with a total time, split into sections. Each section has a name, a duration, and short notes. After pressing "Start Presentation", the app runs the talk fully automatically. The speaker NEVER switches sections manually. When a section's time is up, the app automatically:
- moves to the next section
- shows the new section name and notes
- triggers a short vibration (Vibration API) and an optional short sound
- shows a brief "Next section" visual alert

Screens:

1. Presentation List — saved presentations, create/edit/delete, start button.

2. Presentation Editor — presentation name, total time, list of sections (name, duration, short notes), add/remove/reorder sections, and a separate SOS notes block.

3. Presentation Mode — big timer (overall + current section), current section name, section notes, auto-advancing sections, and a large SOS button. Use the Wake Lock API to keep the screen on.

4. SOS Mode — a full-screen overlay opened with one tap and closed with one tap. It shows pre-written rescue notes: transition phrases, time-buying phrases, key numbers, core messages, FAQ answers. Independent of the current section.

5. Summary — after the talk ends: planned vs actual time, time per section, where the speaker ran over or ahead.

Make it a PWA: manifest, app icon, installable on the home screen, works offline.

Do not add AI, slide sync, cloud storage, auth, analytics, or team features.

Keep the design clean, high-contrast, and readable at arm's length on stage. The timer and section name must be very large.

Also create a simple README.md with project description, features, tech stack, and roadmap.
```

---

## 11. Перший GitHub push

### Що має бути в першому коміті:

* базовий Vite + React проєкт;
* три основні екрани (List, Editor, Presentation Mode);
* автоматичне перемикання секцій;
* вібрація при переході;
* SOS-екран;
* Summary після завершення;
* збереження в LocalStorage;
* базовий PWA (manifest, іконка);
* README;
* PROJECT_PLAN.md.

### Назва першого коміту:

```text
Initial MVP for Speaker Copilot
```

---

## 12. README для першої версії

```text
# Speaker Copilot

A simple mobile-first timing assistant for live speakers. Not a teleprompter — a pacer.

## Problem

During a live talk it is easy to lose track of time or structure. Teleprompters kill live delivery, plain timers show only total time, and switching notes manually on stage is extra cognitive load.

## Solution

Speaker Copilot runs your talk for you. You define sections and their durations before the talk. On stage, the app auto-advances through sections, signals each transition with a short vibration, and shows your notes — hands-free.

## MVP Features

- Presentation list with create/edit/delete
- Sections with name, duration, and short notes
- Fully automatic section transitions
- Vibration + optional sound on each transition
- Big stage-readable timer
- One-tap SOS screen with rescue notes
- Post-talk summary: planned vs actual time per section
- Works offline (PWA)
- Screen stays awake during the talk
- LocalStorage only — no login, no backend, no cloud

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- PWA (vite-plugin-pwa)
- Vercel

## Roadmap

- Earbud-only audio cues (AirPods)
- Rehearsal mode with pace feedback
- Presentation templates
- Export/import presentations as JSON
- Dark stage theme
- Apple Watch companion (later)
```

---

## 13. План наступних комітів

### Commit 1 — Initial MVP

**Ціль:** зробити першу робочу версію за один тиждень.

* три екрани, автоматичні секції, вібрація, SOS, Summary, PWA, LocalStorage;
* публікація на Vercel.

```text
Initial MVP for Speaker Copilot
```

---

### Commit 2 — Improve stage readability

**Коли:** через кілька днів, після першого тестового прогону вдома.

* збільшити таймер і назву секції;
* високий контраст, читабельність на відстані витягнутої руки;
* прогрес-бар секції та всього виступу;
* кольорова індикація: зелений — у графіку, жовтий — останні 30 секунд секції, червоний — перевищення.

```text
Improve stage readability and section progress
```

---

### Commit 3 — Improve transition signals

**Коли:** через 1 тиждень.

* налаштування сигналів: тільки вібрація / вібрація + звук / без сигналів;
* попереджувальний сигнал за 30 секунд до кінця секції;
* різні патерни вібрації: "скоро перехід" vs "перехід".

```text
Add configurable transition signals
```

---

### Commit 4 — Add rehearsal mode

**Коли:** через 1–2 тижні.

* режим репетиції: той самий Presentation Mode, але результати позначаються як rehearsal;
* історія прогонів;
* порівняння: репетиція vs реальний виступ.

```text
Add rehearsal mode
```

---

### Commit 5 — Add export/import

**Коли:** через 2–3 тижні.

* експорт виступу в JSON-файл;
* імпорт із JSON;
* захист від втрати даних (LocalStorage можна випадково очистити).

```text
Add presentation export and import
```

---

### Commit 6 — Add pause and manual override

**Коли:** через 3–4 тижні.

* кнопка паузи (Q&A посеред виступу, технічні паузи);
* можливість вручну перескочити секцію в екстреному випадку — але це виняток, не основний сценарій;
* перерахунок таймінгу решти секцій після паузи (опційно).

```text
Add pause and emergency section skip
```

---

### Commit 7 — Add presentation templates

**Коли:** через 1–1.5 місяці.

* готові шаблони: "Конференційний виступ 20 хв", "Пітч 5 хв", "Воркшоп 60 хв";
* створення виступу з шаблону в один тап.

```text
Add presentation templates
```

---

### Commit 8 — Earbud-only cues (з backlog)

**Коли:** через 1.5–2 місяці або пізніше.

* сигнали лише в навушник, щоб аудиторія не чула звуків телефона;
* дослідити Web Audio API + вибір аудіовиходу;
* якщо технічно неможливо в браузері — задокументувати обмеження й альтернативи.

```text
Add earbud-only audio cues
```

---

## 14. Публічний запуск

Після MVP і першого реального виступу з застосунком можна зробити soft launch.

### Де опублікувати:

* LinkedIn;
* X/Twitter;
* Threads;
* GitHub profile README;
* особистий сайт;
* Product Hunt — пізніше, після 3–5 покращень і реальних кейсів.

### Перший пост може бути таким:

```text
I gave a talk last week and tested a small tool I built for myself.

It's not a teleprompter. It's a pacing assistant: you split your talk into timed sections, and on stage the app auto-advances through them — a short vibration tells you it's time to move on. No tapping, no reading, no losing track of time.

It also has an SOS button with pre-written rescue phrases for when you lose your train of thought.

Built with AI-assisted coding. Open source.

GitHub: [link]
Demo: [link]
```

Найсильніший запуск — **після реального виступу**, з фото зі сцени та реальним Summary-звітом (план vs факт).

---

## 15. Як позиціонувати цей проєкт

Не подавати як "я став розробником". Краще:

```text
A small AI-assisted side project built by a speaker to solve a real on-stage problem: keeping time without losing flow.
```

Або:

```text
A simple open-source pacing assistant for conference speakers. Not a teleprompter — a rhythm keeper.
```

Ключова відмінність від конкурентів у позиціонуванні: **застосунок сам веде спікера — жодної взаємодії під час виступу.**

---

## 16. Головний принцип реалізації

Не намагатися зробити ідеальний продукт одразу.

Перший етап — простий інструмент, з яким можна провести **один реальний виступ**. Це головний тест MVP.

Ціль першого місяця:

* створити GitHub-репозиторій;
* зробити перший MVP за тиждень;
* провести з ним хоча б одну репетицію і один реальний виступ;
* зробити 3–4 осмислені коміти на основі реального досвіду;
* показати проєкт у LinkedIn з реальним кейсом.

---

## 17. Мінімальний план дій

1. Створити GitHub repository: `speaker-copilot`.
2. Створити локальну папку проєкту.
3. Встановити Node.js, Git, VS Code.
4. Відкрити папку в Claude Code.
5. Додати цей документ як `PROJECT_PLAN.md`.
6. Попросити Claude Code створити MVP (промпт із розділу 10).
7. Перевірити локально: створити тестовий виступ на 3 секції по 1 хвилині.
8. Перевірити на телефоні: вібрацію, автоперехід, SOS, Wake Lock.
9. Зробити перший commit.
10. Запушити в GitHub.
11. Підключити репозиторій до Vercel.
12. Встановити PWA на home screen телефона.
13. Провести повну репетицію реального виступу.
14. Поступово робити наступні коміти за roadmap.

---

## 18. Критерій успіху MVP

MVP можна вважати успішним, якщо:

* виступ можна створити й відредагувати за 5–10 хвилин;
* Presentation Mode запускається одним тапом;
* секції перемикаються автоматично, точно за таймінгом;
* вібрація відчувається, коли телефон лежить на трибуні або в руці;
* SOS відкривається і закривається одним тапом;
* екран не гасне протягом усього виступу;
* застосунок працює без інтернету;
* Summary показує реальний план vs факт;
* проєкт є на GitHub, є live demo;
* **головний тест: з ним проведено один реальний виступ — і він допоміг.**

Цього достатньо для першої публічної версії.
