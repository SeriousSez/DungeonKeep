# DungeonKeep – Copilot Instructions

## Project Overview

---

### Components

- All components use `standalone: true` with explicit `imports: [...]`.
- Use `inject()` for dependency injection — never add constructor parameters.
- Use `DestroyRef` + `takeUntilDestroyed(destroyRef)` to clean up subscriptions.
- Always use `ChangeDetectorRef` and `this.cdr.detectChanges();` after async operations that update view state.
- Never use browser prompts (`alert`, `confirm`, `prompt`) — use the existing `SessionService.showNotice()`, existing modal components or create a custom modal component if needed.
- Import `CommonModule` when the template needs `*ngIf`, `*ngFor`, `| async`, etc.
- Use `ActivatedRoute` (not `Router.parseUrl`) to read route params and query strings.
- Use `queryParamMap` / `paramMap` observables with `takeUntilDestroyed` for param changes.
- Always use skeleton loaders for async content — never leave blank spaces or spinners.
- Try to reuse existing components and services from `core/` or `shared/` when possible — don't create new ones without checking first.
- Try to extract reusable scss variables, mixins, or components to the existing `core/` or `shared/` folders when you find yourself copying and pasting styles or markup.
- Try to extract reusable html markup to a new component when you find yourself copying and pasting the same block of HTML in multiple places.
- For new components, use the Angular CLI generator: `ng generate component my-component --standalone --skip-tests`.
- Use confirm modal for deletions and other destructive actions, with clear messaging about what will be deleted and any consequences.
- Translate all user-facing strings via the existing translation files in `public/i18n/` — never hard-code English strings in templates, components, services, notices, validation, placeholders, aria labels, modal copy, or runtime status/error messages.
- When adding or changing a translation key, update every supported locale file, not just English. Do not leave new keys in English in non-English locale files.
- If a feature uses runtime translation keys, verify the exact keys used in the component/template match the locale JSON entries before finishing.
- Treat localization as part of the feature work: anything you touch that is user-visible must be translated in every language file before the task is complete.
- Never use the native dropdown `<select>` element for multi-select filters — use the existing `MultiSelectDropdownComponent` for consistency and accessibility.

```ts
// Preferred DI pattern
private readonly session = inject(SessionService);
private readonly destroyRef = inject(DestroyRef);
```

### State & Cross-Component Communication

- Use RxJS `Subject` or `ReplaySubject` on a shared `@Injectable({ providedIn: 'root' })` service to pass data between unrelated components (e.g. `SessionService.openReelInModal$`).
- Expose `Subject` only as `Observable` to consumers (`.asObservable()`).
- Do not use `BehaviorSubject` for transient actions — use `Subject`.

### Templates

- Use `@if` / `@for` (new control flow) for new templates; use `*ngIf` / `*ngFor` only when touching existing code that already uses it.
- Avoid `*ngIf="flagOrValue as alias"` when `flag` can be truthy — the alias becomes `true` instead of the value. Use two separate `*ngIf` directives instead.

### SCSS / Styling

- Component SCSS is fully scoped. Use flat, readable class names (not strict BEM).
- Use CSS custom properties from `src/styles/_colors.scss` for all colors. Key tokens:
  - `--color-primary`, `--color-text`, `--color-border`, `--color-surface`, `--color-surface-alt`
  - `--gradient-primary`, `--gradient-surface`
- Do not hard-code neutral UI colors in component SCSS (`#fff`, `#f8fafc`, `#e2e8f0`, etc.) for cards, panels, inputs, text, borders, or chips — use the existing color tokens instead.
- If a literal color/gradient is required (for brand accents, media overlays, badges, etc.), add an explicit `:host-context(.theme-dark)` override so contrast remains correct in dark mode.
- Any new/updated web UI styles must be visually valid in both light and dark themes before finishing.
- Card / panel "resting" style: `background: #fff; border: 1px solid #dbe4f0; border-radius: 12px; padding: 12px;`
- Button default style comes from `src/styles/_buttons.scss` — don't duplicate it.
- Loading spinners: add class `is-loading` to the `<button>`.
- Dark mode: override tokens under `:root.theme-dark` in `_colors.scss`.
- Budget-sensitive file: `chat-page` component SCSS is near the Angular budget limit — avoid expanding it unnecessarily.

### Icons

- Use Font Awesome Duotone Thin icons: `<i class="fa-duotone fa-thin fa-<icon-name>"></i>`

# DungeonKeep Copilot Instructions

## Project Overview

DungeonKeep is an Angular 21 web app for managing D&D campaigns, party rosters, character notes, and session prep.

## Angular Rules

- Use standalone components with explicit `imports: [...]`.
- Prefer `signal`, `computed`, and `inject()` for component state and dependencies.
- Use `@if`, `@for`, and modern Angular template control flow in new templates.
- Import `CommonModule` for pipes and structural features.
- Import `FormsModule` when using `ngModel`.
- Keep state strongly typed. Define interfaces and unions instead of using `any`.
- Avoid adding services, routing complexity, or HTTP layers unless a feature actually requires them.

## Product Rules

- The app should feel like a purpose-built tabletop companion, not a generic admin dashboard.
- Focus on the core flows: campaign overview, party management, character tracking, and session planning.
- Seed the UI with believable sample data so the product looks usable immediately.
- Keep creation flows lightweight and fast.
- Show useful summaries, empty states, and clear hierarchy when presenting campaign data.

## Styling Rules

- Use SCSS only.
- Define reusable CSS custom properties for color, spacing, surfaces, borders, and shadows.
- Avoid Angular starter styles and placeholder content entirely.
- Use a warm parchment-and-ink fantasy palette with subtle atmospheric gradients and panel layering.
- Build responsive layouts that work well on desktop and mobile.
- Prefer expressive typography over default system styling.

## Data Rules

- Until a backend exists, keep data in local typed in-memory state.
- Separate campaign data, character data, and session prep data clearly in the model.
- Mutate state predictably through small component methods.

## Quality Rules

- Remove starter template code completely.
- Keep abstractions proportional to the app size.
- No `console.log` or dead code.
- Run `npm run build` after changes and fix any build errors before finishing.
- **No console.log / Debug.WriteLine** left in committed code.
