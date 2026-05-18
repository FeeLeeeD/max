# MAX Knowledge Base Tool

A tool for preparing customer conversations, meeting transcripts, and
articles for our AI assistant's knowledge base. It anonymizes content
and structures it into a clean format.

## Getting started

### 1. First-time setup (one minute)

After unzipping this folder, you'll need to allow macOS to open the
launcher:

1. Right-click on `start.command`
2. Choose "Open"
3. macOS will ask: "are you sure you want to open this?" → click **Open**

You only need to do this once. After that, you can double-click
`start.command` normally.

### 2. Running the tool

Double-click `start.command`.

- A Terminal window will appear (this is normal — keep it open while
  you're using the tool)
- Your browser will open automatically to the tool
- If it doesn't open, manually visit: http://localhost:5173

### 3. When you're done

Close the Terminal window (Cmd+Q or click the red dot). This stops the
tool. Next time you want to use it, just double-click `start.command`
again.

## What's inside this folder

- `start.command` — double-click this to launch the tool
- `dist/` — the tool's files (do not modify)
- `README.md` — this file

## Settings

The first time you open the tool, it'll ask for a Portkey API key.
Get it from the team — it's stored only on your computer (in your browser).

## Troubleshooting

**"start.command can't be opened because it is from an unidentified
developer"** → Right-click → Open (see step 1 above).

**The Terminal window says "Could not find an available port"** → Other
apps are using local ports 5173-5180. Quit them or restart your Mac,
then try again.

**The browser doesn't open automatically** → Open http://localhost:5173
manually.

**The tool says I need a Chromium browser** → Open the URL in Chrome,
Edge, Brave, or Arc. Safari is not supported.

## Need help?

Reach out to the team.
