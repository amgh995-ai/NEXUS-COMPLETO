# Nexus (navegación por botones)

Interfaz alternativa de Control 360: en vez de mostrar todos los módulos
apilados en una sola página, el usuario entra a un **menú de botones** y
cada botón abre un módulo a la vez. **Solo ve los botones de los módulos
permitidos para su rol.**

Este es un **proyecto frontend separado**. No se tocó el proyecto original
(`control-360-main/frontend`) ni la base de datos: ambos frontends hablan
con el **mismo backend Express** y la **misma base de datos en Railway**.
Puedes desplegar este como una segunda app en Vercel, o reemplazar al
original si te gusta más esta navegación.

## Cómo decide qué botones mostrar

Todo vive en `src/moduleRegistry.js`: una lista de módulos, cada uno con el
permiso que requiere. El componente `Dashboard.js` filtra esa lista contra
los permisos del usuario logueado (que vienen del backend en `GET /api/me`)
y solo renderiza los botones correspondientes.

Para agregar un módulo nuevo en el futuro: agrega una entrada en
`moduleRegistry.js` apuntando a tu componente y el permiso requerido — no
hay que tocar `App.js` ni `Dashboard.js`.

| Rol               | Botones que ve                                              |
|-------------------|---------------------------------------------------------------|
| admin             | Todos                                                          |
| vendedor          | Productos, Ventas, Historial de ventas, Sedes                |
| hornero           | Productos, Cuarto Frío, Horneo, Sedes                         |
| despacho          | Productos, Despacho, Reporte de movimientos, Sedes             |
| jefe_produccion   | Productos, Cuarto Frío, Horneo, Reporte de movimientos, Sedes  |

(Sedes es visible para todos los roles porque no requiere permiso especial
para *ver*; solo admin/users_create puede *crear* una sede nueva — eso lo
controla el propio componente.)

## Configuración

```bash
cp .env.example .env
# Edita REACT_APP_API_URL apuntando a tu backend ya desplegado en Vercel
# (el mismo de control-360-main/control-360/backend)

npm install
npm start
```

## Desplegar en Vercel

Igual que el frontend original:
1. Vercel → New Project → importa el repo.
2. Root Directory: `nexus-dashboard` (o donde lo subas).
3. Framework preset: Create React App.
4. Variable de entorno: `REACT_APP_API_URL` = URL de tu backend + `/api`.
5. Si despliegas ambos frontends (el original y este) en Vercel, recuerda
   agregar **ambos dominios** en `FRONTEND_URL` del backend, o ajustar el
   CORS en `control-360/backend/index.js` para aceptar una lista.
