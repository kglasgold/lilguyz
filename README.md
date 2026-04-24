# assistant-bot

A local desktop tool with tiny 8-bit agents that help you track work. Talk to the boss — it routes your request to the right agent.

**Agents:**
- **Jared** — generic reminders and timers
- **PM-Bot** — creates Linear tickets, shows your assigned issues by status
- **PR Shepherd** — lists your open GitHub PRs with review + CI status
- **Notes Scout** — (coming soon)

## Setup

```bash
git clone https://github.com/yourname/assistant-bot.git
cd assistant-bot
npm install
```

### Configure

Copy the example env file and add your Linear API key (get one at https://linear.app/settings/api):

```bash
cp .env.example .env
```

PR Shepherd needs the GitHub CLI authenticated:

```bash
brew install gh
gh auth login
```

### Run (web)

```bash
npm run dev
```

Opens at http://127.0.0.1:5183

### Run (desktop app)

```bash
npm run electron
```

### Package as macOS app

```bash
npm run electron:build
```

Outputs to `dist-electron/mac-arm64/assistant-bot.app`

## Easter eggs

Type these into the input:
- `dance party`
- `bohemian grove`
- `murder scene`

## Tech

- React 19 + Vite
- Express 5 API
- Linear SDK for issue management
- GitHub CLI (`gh`) for PR data
- Electron for desktop packaging
- Pure CSS pixel art sprites — no image assets
