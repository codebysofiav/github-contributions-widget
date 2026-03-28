# GitHub Widget

Widget local de escritorio hecho con Electron para visualizar contribuciones de GitHub, cambiar tema, ajustar tamano del widget y guardar la sesion local del usuario.

## Caracteristicas

- Login local con `GitHub username` y `Personal access token`
- Persistencia local con `localStorage`
- Carga de perfil y contribuciones desde la API de GitHub
- Avatar dinamico en el header
- Logout desde el menu
- Cambio de tema
- Cambio de tamano del widget
- Ventana tipo widget movible, minimizable y cerrable

## Tecnologias

- HTML
- CSS
- JavaScript
- Electron

## Ejecutar en local

1. Instala dependencias:

```bash
npm install
```

2. Inicia la app:

```bash
npm start
```

## Como funciona el login

La app guarda estos datos en `localStorage` del entorno local de Electron:

- `github_user`
- `github_token`
- `theme`
- `widget_size`

Cuando la app vuelve a abrirse, reutiliza `github_user` y `github_token` para conectarse automaticamente.

## Nota de seguridad

Este proyecto esta pensado para uso local. El token se guarda localmente en `localStorage`, por lo que no es la mejor opcion para una app web publica. Para uso personal/local es una solucion practica.

Se recomienda:

- usar un token con permisos minimos
- no compartir el token
- no subir `.env` ni datos sensibles al repositorio

## Estructura principal

- `index.html`: estructura del widget
- `script.js`: logica del widget, login, menu y carga desde GitHub
- `main.js`: ventana principal de Electron
- `preload.js`: puente seguro entre Electron y el frontend
- `css/`: estilos del widget y temas
- `img/`: imagenes del widget
- `assets/icono.ico`: icono de la app

## Archivos legacy o de apoyo

Estos archivos ya no son necesarios para el flujo principal actual, pero quedaron como referencia:

- `data.json`
- `fetch_github_data.py`
- `otros/fetch-github-data.mjs`
- `.env`

La app actual no depende de `data.json`; ahora consulta GitHub directamente desde el widget.
