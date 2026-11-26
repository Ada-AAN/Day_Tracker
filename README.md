# Day planner calendar

A browser-based monthly calendar that displays today's date, lets you navigate between months, and opens a daily log for a selected date. Daily logs are saved to MongoDB.

## Prerequisites

- Node.js 22 or newer and npm.
- To save daily logs, configure MongoDB Atlas with a connection string for the `day_tracker` database and read/write access to the `daily_info` collection.

## Run locally

1. Copy `.env.example` to `.env` (do not overwrite an existing file), set `MONGODB_URI` to your Atlas connection string for `day_tracker`, and set `MONGODB_COLLECTION=daily_info`. Do not commit or share credentials.
2. Run `npm install` and then `npm run dev`. The dev script runs the latest Netlify CLI through `npx`; the first run may ask to install it. Open the local URL printed by the CLI.
3. Use the arrow buttons to move between months, then select a date. Enter a log, optionally add notes and choose a mood, then select **Save**.

## API

Each file in `netlify/functions` defines a Netlify Function and its API path. The functions connect through `server/database.js` and use the `DailyInfo` model. The `daily_info` collection is selected by `MONGODB_COLLECTION`; no additional index is created.

- `GET /api/resume-items` returns the stored daily entries as an array.
- `POST /api/daily_info` accepts `date` (`YYYY-MM-DD`), `log`, and optional `notes` and `mood`, and returns the saved entry with HTTP 201.
- `PUT /api/daily_info?id=<id>` replaces an entry. Supply `date` and `log`; `notes` and `mood` are optional.
- `DELETE /api/daily_info?id=<id>` deletes an entry.

For PUT and DELETE, `id` is the MongoDB `_id` returned by GET or POST. Invalid JSON, IDs, or fields return HTTP 400; an ID that does not exist returns HTTP 404. Other failures return HTTP 500. The model requires a date string and log text, trims the text fields, and limits `log` to 1,000 characters and `notes` to 150. Mood, if supplied, must be `happy`, `sad`, `peaceful`, `angry`, or `stressed`.

Example request body:

```json
{
  "date": "2026-11-22",
  "log": "How the day went",
  "notes": "A quick note",
  "mood": "happy"
}
```

## Deploy on Netlify

Push the project to GitHub and connect the repository in the Netlify dashboard. The checked-in `netlify.toml` supplies the publish and function directories, and each function configures its own API path; no build command is needed. In Netlify's environment-variable settings, configure `MONGODB_URI` for the relevant deployment contexts with a scope available to Functions, then deploy. A local `.env` file is not deployed. Use a dedicated least-privileged database user, and ensure Atlas network access permits Netlify's function infrastructure. These endpoints have no login; do not store sensitive diary entries on a public deployment without adding authentication and access controls.

Automated tests are intentionally outside this demo's scope.
