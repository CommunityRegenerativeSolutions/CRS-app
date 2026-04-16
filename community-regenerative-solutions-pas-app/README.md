# Community Regenerative Solutions PAS Employee Readiness App

This is a simple internal web app for tracking employee onboarding readiness.

## How to run

Open `index.html` in a web browser. No install step is required.

## Where the data is saved

Employee records are saved in the browser with `localStorage`. This keeps the first version simple, but it also means records stay on the same browser and computer unless the app is upgraded later.

## Where to edit checklist wording

Edit `src/checklist-data.js`.

Each checklist section has a title and item labels. Keep each `id` short and unique.

## Project structure

- `index.html` is the main app screen.
- `assets/styles.css` controls the layout, mobile view, and print styles.
- `src/checklist-data.js` contains the checklist sections and item wording.
- `src/storage.js` saves and loads employee records.
- `src/app.js` controls the dashboard, form, checklist, status, and progress logic.
- `src/forms/` holds placeholders for future forms.
