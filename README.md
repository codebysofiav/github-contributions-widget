# GitHub Widget

Desktop widget built with Tauri to visualize GitHub contributions, switch themes, resize the widget, and keep the local user session.

## Preview
<p align="center">
  <img src="img/prueba.png" width="45%">
  <img src="img/vertical2.png" width="25%">
</p>

## Download

If you only want to use the app and do not need the source code, you can download the Windows installer or executable from the `Instalador/` folder in this repository.

## Features

- Local login with `GitHub username` and `Personal Access Token`
- Local persistence with `localStorage`
- Profile and contributions loaded from the GitHub API
- Dynamic avatar in the header
- Logout from the widget menu
- Horizontal and vertical layouts
- Multiple visual themes
- Adjustable widget size
- Frameless, draggable, minimizable, and closable desktop window

## Tech Stack

- HTML
- CSS
- JavaScript
- Tauri
- Rust

## Requirements

To run the app locally you need:

- Node.js
- Rust
- Cargo
- Visual Studio Build Tools with `Desktop development with C++` on Windows

You also need:

- GitHub username
- GitHub Personal Access Token

You can create a token here:
[https://github.com/settings/tokens](https://github.com/settings/tokens)

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app in development mode:

```bash
npx tauri dev
```

## Build for Windows

1. Install dependencies:

```bash
npm install
```

2. Generate the production build:

```bash
npx tauri build
```

The generated installer will be available in `src-tauri/target/release/bundle/`.

## How Login Works

The app stores these values in local Tauri `localStorage`:

- `github_user`
- `github_token`
- `theme`
- `widget_size`
- `widget_layout`

When the app opens again, it reuses `github_user` and `github_token` to reconnect automatically.

## Project Structure

- `index.html`: widget structure
- `script.js`: widget logic, login flow, menu actions, and GitHub requests
- `css/`: widget styles and themes
- `img/`: images used by the widget
- `scripts/prepare-tauri-assets.mjs`: prepares static frontend assets for Tauri build
- `src-tauri/`: native Tauri layer and app configuration
- `assets/icono.ico`: app icon source

## Tauri Notes

- The current frontend is plain HTML, CSS, and JavaScript without a framework.
- Tauri uses `index.html` as the entry point.
- The window is configured as frameless and transparent to preserve the widget look.
- Window controls and drag behavior are implemented through Tauri integration without rewriting the frontend.

## Themes

The widget supports multiple themes, including:

- Github
- Cream
- Lavander
- Matcha

More themes can be added easily in `css/styles_themes.css`.

<p align="center">
  <img src="img/theme1.png" width="45%">
  <img src="img/theme2.png" width="45%">
</p>

<p align="center">
  <img src="img/theme3.png" width="45%">
  <img src="img/theme4.png" width="45%">
</p>
