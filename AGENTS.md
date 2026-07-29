# Repository Guidelines

## Project Structure & Module Organization
This repository combines a Spring Boot backend with an Angular frontend. Backend Java code lives under `src/main/java/com/audioplayer/project`, with controllers, JPA models, DTOs, and repositories split into package folders such as `model/` and `repo/`. Backend resources are in `src/main/resources`, including `application.properties`, Thymeleaf templates, and static assets. Backend tests live in `src/test/java/com/audioplayer/project`.

The Angular app is contained in `frontend/`. Its source starts at `frontend/src/main.ts`; components are under `frontend/src/app`, global styles are in `frontend/src/styles.css`, and images/assets are in `frontend/src/assets` and `frontend/src/public`.

## Build, Test, and Development Commands
- `./mvnw spring-boot:run`: start the Spring Boot application.
- `./mvnw test`: run backend JUnit/Spring tests.
- `./mvnw package`: compile, test, and package the backend.
- `cd frontend && npm install`: install Angular dependencies from `package-lock.json`.
- `cd frontend && npm start`: run the Angular development server.
- `cd frontend && npm run build`: create a production Angular build.
- `cd frontend && npm run watch`: rebuild the Angular app on file changes for development.

## Coding Style & Naming Conventions
Use standard Java package naming under `com.audioplayer.project`. Keep controllers, repositories, DTOs, and entities in focused classes with descriptive names such as `MusicController`, `SongsRepository`, and `SongsDTO`. Existing Java code uses two-space indentation and constructor injection for Spring dependencies.

Angular files use TypeScript with double-quoted imports and component-local templates/styles. Name components and services descriptively, for example `Tracks` in `tracks/tracks.ts` and `songservice.ts` for song API access. Keep CSS next to the component it styles when possible.

## Testing Guidelines
Backend tests use JUnit with Spring Boot test support, `MockMvc`, and `RestTestClient`. Place new tests in `src/test/java/com/audioplayer/project` and name them after the behavior or class under test, such as `MusicControllerTest` or `MusicControllerIntegrationTest`. Run `./mvnw test` before opening a PR.

There is currently no frontend test script in `frontend/package.json`; add one before introducing Angular unit-test requirements.

## Commit & Pull Request Guidelines
Recent commits use short, past-tense summaries, for example `Made a tracklist UI.` and `Added Angular frontend`. Keep commits focused and explain the main behavior change in one line.

Pull requests should include a concise description, testing notes, linked issues when applicable, and screenshots or short recordings for UI changes. Mention any database or configuration changes, especially updates affecting PostgreSQL settings in `src/main/resources/application.properties`.

## Security & Configuration Tips
Local database defaults are configured for PostgreSQL at `localhost:5432/audioplayer`. Do not commit real production credentials; use environment-specific configuration for secrets and deployment settings.

## Frontend Design System: Minimal Glass
All Angular UI generated for `frontend/` must use the Minimal Glass design language. The interface should feel clean, airy, calm, modern, lightweight, elegant, and soft rather than decorative. Use glassmorphism subtly; readability, accessibility, and practical interaction always come first.

Use a soft neutral base: warm white, very light gray, or subtle pastel gradients. Use dark charcoal or muted navy for primary text, soft gray for secondary text, and muted lavender, soft violet, pale blue, or dusty pink for accents. Avoid saturated colors, pure black backgrounds, harsh gradients, neon effects, and excessive contrast.

Glass surfaces such as cards, panels, sidebars, dropdowns, dialogs, and toolbars should use translucent white backgrounds, blur, subtle borders, and gentle shadows where appropriate:

```css
background: rgba(255, 255, 255, 0.6);
backdrop-filter: blur(18px);
-webkit-backdrop-filter: blur(18px);
border: 1px solid rgba(255, 255, 255, 0.65);
box-shadow: 0 12px 40px rgba(30, 41, 59, 0.08);
```

Use rounded corners from `14px` to `24px`, generous whitespace, padding from `16px` to `28px`, and consistent gaps such as `8px`, `12px`, `16px`, `24px`, and `32px`. Pill controls are only for compact actions, filters, toggles, and segmented controls. Avoid dense layouts unless the component is specifically a compact data view.

Use the font stack `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Keep titles clear but not oversized, use medium-weight section headings, muted metadata, and hierarchy through spacing and font weight instead of heavy borders.

Buttons, inputs, cards, lists, and tables must follow the Minimal Glass treatment: soft lavender/violet primary actions, translucent secondary controls, comfortable form padding, subtle focus rings, faint dividers, selected rows with soft lavender tint, and hover transitions between `150ms` and `250ms`. Use subtle motion only, respect `prefers-reduced-motion`, and avoid bouncing, flashing, large scaling, or looping decorative animation.

Use one consistent outline icon style, preferably Angular Material Symbols already present in the app unless another clean icon library is introduced deliberately. Keep icons thin and understated.

Angular implementation requirements:
- Use standalone components unless the project explicitly changes to NgModules.
- Use semantic HTML, accessible labels, ARIA attributes where needed, keyboard/focus behavior, and sufficient contrast on translucent surfaces.
- Use Angular signals when appropriate for local UI state.
- Keep TypeScript strongly typed with interfaces and no `any`.
- Keep templates readable and avoid unnecessary dependencies.
- Separate component logic, template, and styling unless an existing file uses inline structure.
- Do not redesign unrelated parts of the application.
- For every frontend UI request, determine the functional requirements, apply Minimal Glass, provide complete TypeScript, HTML, and SCSS, include needed interfaces or mock data, and briefly explain placement and usage.

When no existing theme tokens cover the need, define reusable CSS custom properties for glass backgrounds, text colors, accents, shadows, radii, and spacing before using one-off values.
