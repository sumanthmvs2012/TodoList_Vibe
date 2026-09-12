# React + Supabase To-Do App

## What it does

- Adds a task
- Marks a task complete/incomplete
- Deletes a task
- Stores tasks in one Supabase table: `tasks`

## 1. Create the Supabase table

1. Go to [Supabase](https://supabase.com/dashboard) and create a free project.
2. In the project, open **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` from this project, paste all of it, and click **Run**.

The table has these columns:

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | bigint | unique task ID |
| `title` | text | task description |
| `completed` | boolean | complete or not |
| `created_at` | timestamptz | creation time |

## 2. Connect the React app

1. In Supabase open **Project Settings** → **API**.
2. Copy the **Project URL** and the **anon public** key.
3. In this project, copy `.env.example` to a new file named `.env.local`.
4. Paste your values into `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Never put the Supabase `service_role` key in this frontend app.

## 3. Run it

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

## 4. Build a production version

```bash
npm run build
```

The finished static app will be in `dist/`. Set the same two `VITE_...` environment variables in your hosting platform before building.

## Important note about security

This starter is intentionally open so you can learn and test quickly. The SQL policy allows anonymous visitors to read and change every task. Before deploying for real users, add Supabase Auth, a `user_id` column, and policies that limit users to their own tasks.
