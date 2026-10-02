# React frontend

This file applies to `src/client`. Read the repository root `AGENTS.md` first; the tenant, financial, lifecycle, i18n, and verification rules there remain mandatory.

## Architecture

The client uses React 19, TypeScript 6, TanStack Router, Redux Toolkit, React Redux, React Bootstrap, React Hook Form, and JHipster UI/translation helpers. Vite builds the app and Vitest tests it.

```text
app/
├── config/                 # typed store, routes, constants, HTTP setup
├── entities/               # business CRUD screens and Redux modules
├── modules/                # account, authentication, admin, home
├── reports/                # cooperative reports and dashboards
├── shared/                 # models, layout, language, utilities, state
├── app.tsx                 # application shell
└── index.tsx               # browser bootstrap
```

## State and data flow

- Use the typed `useAppDispatch` and `useAppSelector` hooks from `app/config/store`.
- Follow the existing Redux Toolkit/JHipster reducer and async-action patterns in the feature being changed.
- Keep HTTP calls in the feature's state/action layer rather than scattering direct Axios calls through components.
- Represent API data with interfaces from `app/shared/model` or focused local types. Do not introduce `any` to bypass a contract problem.
- Use the `app/*` alias instead of deep relative imports where the surrounding code does so.
- Keep server state authoritative. Client totals and paid/stock state are previews only and must agree with the server response after persistence.

## Components and forms

- Prefer small functional components and explicit props.
- Use the established form abstraction for the feature: React Hook Form or JHipster `ValidatedForm`/`ValidatedField`. Do not mix form state models without a reason.
- Handle loading, empty, success, validation-error, authorization-error, and retry states deliberately.
- Prevent duplicate financial submissions while a request is in flight, but do not use client disabling as the server's only idempotency or validation control.
- Preserve values correctly across create and edit flows. An edit screen must render persisted server state rather than recomputing a different history.
- For delete/reversal actions, make the consequence visible and refresh every affected list, detail, balance, or report state.
- Follow existing React Bootstrap and stylesheet patterns. Do not reintroduce removed Material UI, PrimeReact, Reactstrap, or Enzyme dependencies.

## Financial workflows

- Treat prices, totals, discounts, stock availability, tenant ownership, and paid state returned by the server as authoritative.
- Distinguish cash, card/bank, and deferred-payment UI paths; do not collapse them into a flag that loses domain meaning.
- Preserve decimal precision for money and gram quantities. Avoid floating-point transformations that change submitted values.
- After create, update, payment, or delete, reconcile all affected Redux state rather than patching only the screen currently visible.
- Display server validation and conflict errors in actionable language; do not silently replace them with a generic success or empty state.

## Routing and entry points

- Check list, detail, create, edit, delete, report/dashboard, menu, and direct-URL entry points that expose the changed behavior.
- Keep route authorization aligned with server authorization, while remembering that client guards are not a security boundary.
- When an entity or action is renamed, update routes, menu entries, translation keys, reducer registration, tests, and deep links together.

## Internationalization

- Use `Translate` or `translate()` for user-visible application strings.
- Add or update both Turkish and English entries under `src/i18n`.
- Preserve Turkish business terminology used throughout the product.
- Test interpolation, validation messages, toasts, table headings, empty states, and confirmation dialogs—not only page titles.

## Performance and accessibility

- Large entity lists and reports must avoid unnecessary full-tree rerenders and repeated derived calculations.
- Do not add continuously repainting animation for ordinary status feedback.
- Preserve semantic controls, keyboard access, visible focus, labels, and meaningful loading/error announcements.
- Check production build output for substantial regressions; do not hide an unrelated failure by weakening checks.

## Testing

- Put focused Vitest coverage near the existing suite under `tests`.
- Prefer Testing Library behavior tests for new or substantially changed components. Existing shallow-style fixtures are migration debt, not a template for new tests.
- Reducer/action changes need request, success, failure, and state-reconciliation coverage.
- Important cross-layer journeys belong in `tests/browser`, especially sales, payment, authentication, and tenant-sensitive behavior.
- Assert what the user can observe and the state contract that matters; avoid snapshots for dynamic business behavior.

Focused checks:

```bash
bun run test -- tests/client.test.ts
bun run lint
bun run typecheck
```

Broader frontend verification:

```bash
bun run test
bun run build
bun run test:browser
```

## Review checklist

- Does the UI use typed state and established data-flow patterns?
- Does it preserve server authority instead of inventing financial truth?
- Are create, edit, delete/reversal, error, and loading states coherent?
- Were every applicable entry point and affected report/state slice updated?
- Are Turkish and English strings complete?
- Are money and quantity values preserved without floating-point drift?
- Is there focused interaction/state coverage and, where warranted, a Playwright journey?
