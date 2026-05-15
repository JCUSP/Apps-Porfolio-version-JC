# Oracle Apps Portfolio

Pequena app estatica para explorar el portfolio de Oracle Apps por familia, producto, siglas, descripcion y link oficial.

## Como publicarlo en GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube estos archivos a la raiz del repositorio:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `portfolio-data.js`
   - `oracle_apps_portfolio_es.md`
   - `.nojekyll`
3. En GitHub, entra en `Settings`.
4. Abre `Pages`.
5. En `Build and deployment`, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Guarda los cambios.

GitHub publicara la app en una URL parecida a:

```text
https://tu-usuario.github.io/nombre-del-repo/
```

## Archivos clave

- `index.html`: pantalla principal.
- `styles.css`: estilos visuales.
- `app.js`: buscador, filtros, vistas y exportaciones.
- `portfolio-data.js`: datos usados por la app.
- `oracle_apps_portfolio_es.md`: fuente editable del portfolio.
