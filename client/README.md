# Client App

This is the frontend for the assignment project. It is built with Next.js and provides the chat, upload, workspace, and document management interface.

## Project Structure

- app/ - Main app routes and UI pages
  - app/page.tsx - Home page
  - app/layout.tsx - Root layout
  - app/globals.css - Global styles
  - app/components/ - Reusable UI components
    - chat-panel.tsx
    - dashboard.tsx
    - document-list.tsx
    - file-upload.tsx
    - tool-call-log.tsx
    - workspace-switcher.tsx
  - app/context/ - React context providers
- lib/ - Shared frontend utilities and API helpers
- public/ - Static assets
- package.json - Client dependencies and scripts

## Prerequisites

Make sure you have installed:
- Node.js 18 or newer
- pnpm

## Install Dependencies

From the client folder, run:

```bash
pnpm install
```

If you are using npm instead of pnpm, you can also run:

```bash
npm install
```

## Run the Client

Start the development server:

```bash
pnpm dev
```

Then open:

```text
http://localhost:3000
```

## Useful Scripts

- pnpm dev - Start the Next.js development server
- pnpm build - Create a production build
- pnpm start - Start the production build
- pnpm lint - Run ESLint checks

## Environment

The client uses environment variables from the .env file. Make sure the following values are present if required by your setup:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If you do not need a custom API URL, the app will usually work with the default local backend URL.

## Notes

- The client depends on the backend server being up and running.
- Upload and chat features require the server and worker to be running as well.
