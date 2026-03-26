# DungeonKeep Copilot Instructions

## Project Overview

DungeonKeep is an Angular 21 web app for managing D&D campaigns, party rosters, character notes, and session prep.

## Angular and Component Rules

- Use standalone components with explicit `imports: [...]`.
- Use `inject()` for dependency injection; never add constructor parameters.
- Use `DestroyRef` + `takeUntilDestroyed(destroyRef)` to clean up subscriptions.
- Always use `ChangeDetectorRef` and `this.cdr.detectChanges();` after async operations that update view state.
- Prefer `signal`, `computed`, and modern Angular patterns for local state and derivations.
- Use `@if` / `@for` in new templates; use `*ngIf` / `*ngFor` only when touching existing legacy patterns.
- Avoid `*ngIf="flagOrValue as alias"` when `flag` can be truthy; use separate guards.
- Import `CommonModule` when templates require `*ngIf`, `*ngFor`, pipes, or `| async`.
- Import `FormsModule` when using `ngModel`.
- Use `ActivatedRoute` (not `Router.parseUrl`) for params/query params.
- Subscribe to `queryParamMap` / `paramMap` with `takeUntilDestroyed` for param changes.
- Keep state strongly typed; avoid `any`.
- Avoid adding services, routing complexity, or HTTP layers unless required.
- For new components, use Angular CLI generator: `ng generate component my-component --standalone --skip-tests`.
- Reuse existing `core/` and `shared/` components/services before creating new ones.
- Extract repeated HTML, SCSS patterns, variables, and mixins into reusable components/shared styles.
- Create modal dialogs as separate components instead of inline page markup.
- Never use browser prompts (`alert`, `confirm`, `prompt`); use `SessionService.showNotice()`, existing modal components, or a custom modal component.
- Use confirm modals for deletions and destructive actions with clear consequence messaging.
- Always use skeleton loaders for async content; never leave blank spaces or generic spinners.
- Use `DropdownComponent` for all single-select UI in feature templates (including filter/sort controls); do not add native `<select>` directly in page/component templates.
- Never use native multi-select `<select>` for multi-select filters; use `MultiSelectDropdownComponent`.
- Native `<select>` is only allowed inside reusable dropdown component implementations (for example, `DropdownComponent`) and not for direct feature-level UI.

### Preferred DI Pattern

```ts
private readonly session = inject(SessionService);
private readonly destroyRef = inject(DestroyRef);
```

## State and Cross-Component Communication

- Use RxJS `Subject` or `ReplaySubject` in shared `@Injectable({ providedIn: 'root' })` services for unrelated component communication.
- Expose subjects as observables (`.asObservable()`) to consumers.
- Do not use `BehaviorSubject` for transient actions; use `Subject`.

## Styling and UI Rules

- Use SCSS only.
- Component SCSS is fully scoped; use flat, readable class names.
- Use CSS custom properties from `src/styles/_colors.scss` for UI colors.
- Key tokens: `--color-primary`, `--color-text`, `--color-border`, `--color-surface`, `--color-surface-alt`, `--gradient-primary`, `--gradient-surface`.
- Do not hard-code neutral UI colors (`#fff`, `#f8fafc`, `#e2e8f0`, etc.) for cards, panels, inputs, text, borders, or chips.
- If literal colors/gradients are required (brand accents, overlays, badges), add explicit `:host-context(.theme-dark)` overrides.
- Ensure all updated/new UI is valid in both light and dark themes.
- Card/panel resting style: `background: #fff; border: 1px solid #dbe4f0; border-radius: 12px; padding: 12px;`.
- Button default styles come from `src/styles/_buttons.scss`; do not duplicate.
- Loading spinner state on buttons uses `is-loading` class.
- Dark mode token overrides belong under `:root.theme-dark` in `_colors.scss`.
- `chat-page` SCSS is budget-sensitive; avoid unnecessary expansion.
- Use a warm parchment-and-ink fantasy palette with subtle atmospheric gradients and panel layering.
- Build responsive layouts for desktop and mobile.
- Feel free to restructure layout on mobile to prioritize key content and actions.
- Prefer expressive typography over default system styling.

## Product and Data Rules

- The app should feel like a purpose-built tabletop companion, not a generic admin dashboard.
- Focus on campaign overview, party management, character tracking, and session planning.
- Seed UI with believable sample data so features feel usable immediately.
- Keep creation flows lightweight and fast.
- Show clear hierarchy, empty states, and useful summaries.
- Until a backend exists, keep data in typed in-memory state.
- Separate campaign, character, and session prep data clearly in models.
- Mutate state predictably through small component methods.

## Localization Rules

- Translate all user-facing strings via `public/i18n/` files.
- Never hard-code English in templates, components, services, validation messages, placeholders, aria labels, modal copy, or runtime notices/errors.
- When adding/changing a translation key, update every supported locale file.
- If a feature uses runtime translation keys, verify exact key matches between template/component usage and locale JSON.
- Treat localization as required feature work for any user-visible change.

## D&D Research Rules

- For D&D rules, class features, backgrounds, species, feats, equipment, magic items, monsters, and glossary content, fetch current information from the internet instead of relying only on memory.
- Prefer these sources first:
  - `https://dnd5e.wikidot.com/`
  - `https://www.dndbeyond.com/classes`
  - `https://www.dndbeyond.com/backgrounds`
  - `https://www.dndbeyond.com/species`
  - `https://www.dndbeyond.com/feats`
  - `https://www.dndbeyond.com/equipment`
  - `https://www.dndbeyond.com/magic-items`
  - `https://www.dndbeyond.com/monsters`
  - `https://www.dndbeyond.com/sources/dnd/br-2024/rules-glossary`
  - `https://www.dndbeyond.com/sources/dnd/br-2024`
  - `https://roll20.net/compendium/dnd5e/BookIndex`
- Treat these websites as canonical references for in-app D&D data entry and updates, and cross-check details when sources differ.

## Quality Rules

- Remove starter template code completely.
- Keep abstractions proportional to the app size.
- No `console.log` or dead code.
- Run `npm run build` after changes and fix build errors before finishing.
- No `console.log` / `Debug.WriteLine` left in committed code.

## Icons

- Use Font Awesome Duotone Thin icons: `<i class="fa-duotone fa-thin fa-<icon-name>"></i>`
- Always load Font Awesome via the configured kit script in `src/index.html` (do not use CDN stylesheet links or package-based icon wrappers unless explicitly requested).
- Keep icon usage consistent with kit classes (`fa-duotone fa-thin`) across feature templates and components.
