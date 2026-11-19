# SoundLab

A reusable Spotify project portfolio and progress workspace. Built with HTML, CSS and JavaScript. Includes project search, status/technology filters, project creation, milestones, presentation notes, GitHub links, ideas and embedded demos.

## Run locally

Open `index.html`, or use `python -m http.server 8000` inside this folder and open `http://localhost:8000`. No dependencies required. For publishing, follow the GitHub Pages guide in the bundle's `START-HERE.md` (deploy main branch root with the included `.nojekyll`).

## Private cloud backup (optional)

1. Create a free Supabase project at https://supabase.com/dashboard and wait for provisioning.
2. Open SQL Editor, paste the contents of `supabase/schema.sql` and execute them. It creates a workspace table with row-level security for the signed-in owner only.
3. Go to Authentication > Users, create your owner account with email/password and make sure the email is confirmed. Keep email/password sign-in enabled. You may disable new user registrations if this is a personal workspace.
4. In the project dashboard copy the project URL and **publishable** key (or legacy anon key). Never copy service-role or secret keys into a frontend or Git repository.
5. Open SoundLab > Backup & cloud sync. Enter those values and your own credentials, then sign in. If no cloud copy exists, choose Save to cloud. Otherwise load the existing copy first. Export JSON before replacing a local copy.
6. After editing projects, save to cloud. On another device enter the same project details and sign in, then load your cloud copy. Session tokens are in memory only, so sign in again after reloading. If a different device has saved a newer revision, SoundLab prevents overwriting it until you load the latest copy and reconcile your edits.

Local browser data is retained after sign-out. Use a private browser window or clear site data on shared devices. Visitors to a public GitHub Pages website see the built-in public portfolio; private sync is separate and requires your Supabase credentials. Do not place private notes in source code or commit workspace backups. No live cloud credentials are bundled and live sync cannot be tested until your project exists.

## Build roadmap

Add live Spotify authorization and data fetching to each standalone demo; keep demo datasets available for offline presentation. Track progress directly on the project pages. The repository contains only front-end prototypes, not a live Spotify integration.
