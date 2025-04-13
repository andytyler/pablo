# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Features

### Chat and Message Visibility

The application displays all messages in the chat interface, including:

- **User Messages**: Messages sent by users
- **Assistant Messages**: Responses from the AI
- **System Messages**: Status updates, errors, and raw API data

All messages are displayed in the main chat view with appropriate styling:
- User messages appear right-aligned with a primary color background
- Assistant messages appear left-aligned with a muted background
- System messages appear centered with a yellow/amber background

### Message Logging

The application has a built-in system for logging AI messages and responses. This is useful for debugging and understanding how the AI is responding to user inputs.

- **Console Logging**: All messages are logged to the browser console with color coding (blue for user, green for assistant, orange for system).
- **Storage Logging**: Messages can also be stored in localStorage for persistence across sessions.
- **LogViewer Component**: A floating UI component is available by clicking the log icon in the bottom-right corner of the screen, allowing you to view and manage logs.
- **Raw API Data**: The application logs and displays raw API request/response data for full transparency.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
