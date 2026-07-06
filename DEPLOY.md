# Guía de despliegue — Nexus
## Railway (MySQL propio) + Vercel (Backend + Frontend)

Nexus tiene su **propio backend y su propia base de datos**, completamente
independientes de Control 360. Ambos sistemas no comparten datos.

---

## PASO 1 — Crear la base de datos de Nexus en Railway

1. Entra a https://railway.app.
2. Clic en **"New Project"** → **"Provision MySQL"**.
   > Si ya tienes un proyecto Railway para Control 360, crea un proyecto
   > **nuevo y separado** — así los datos no se mezclan y cada sistema
   > tiene sus propias credenciales.
3. Cuando esté listo, ve a la pestaña **"Connect"** del servicio MySQL.
4. Copia la **MySQL URL** (formato `mysql://root:xxx@host.railway.app:port/railway`).

---

## PASO 2 — Ejecutar el schema de Nexus

1. En Railway → tu proyecto MySQL de Nexus → pestaña **"Query"**.
2. Pega el contenido de `database/schema.sql`.
3. Ejecuta. Crea todas las tablas y el primer admin:
   - Email: `admin@nexus.com`
   - Contraseña: `nexus1234`
   - **Cámbiala en cuanto entres.**

---

## PASO 3 — Desplegar el backend de Nexus en Vercel

1. Vercel → **"New Project"** → importa tu repositorio.
2. **Root Directory**: `backend`
3. Framework preset: **Other**.
4. Variables de entorno:

   | Variable        | Valor                                                   |
   |-----------------|---------------------------------------------------------|
   | `DATABASE_URL`  | La MySQL URL de Railway (la de Nexus, no la de C360)    |
   | `JWT_SECRET`    | String aleatorio de 64+ caracteres                      |
   | `JWT_EXPIRES_IN`| `8h`                                                    |
   | `FRONTEND_URL`  | Lo completas después de desplegar el frontend           |

   > Para generar JWT_SECRET:
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   > ```

5. **Deploy**. Copia la URL resultante (ej. `https://nexus-backend.vercel.app`).
6. Vuelve a Variables de entorno y agrega:

   | Variable       | Valor                                  |
   |----------------|----------------------------------------|
   | `FRONTEND_URL` | `https://nexus-frontend.vercel.app`    |

   Luego **Deployments → Redeploy**.

---

## PASO 4 — Desplegar el frontend de Nexus en Vercel

1. Vercel → **"New Project"** → mismo repositorio.
2. **Root Directory**: `frontend`
3. Framework preset: **Create React App**.
4. Variable de entorno:

   | Variable            | Valor                                        |
   |---------------------|----------------------------------------------|
   | `REACT_APP_API_URL` | `https://nexus-backend.vercel.app/api`       |

5. **Deploy**.

---

## PASO 5 — Verificar

1. Abre la URL del frontend.
2. Inicia sesión con `admin@nexus.com` / `nexus1234`.
3. Verás el menú de botones. Prueba el flujo completo:
   - Crear producto → Cuarto Frío → Hornear → Despachar a una sede →
     Venta en la sede → Reporte de movimientos.

---

## Desarrollo local

```bash
# Backend (puerto 4001 para no chocar con Control 360 en 4000)
cd backend
cp .env.example .env    # edita con tus credenciales locales
npm install
node index.js           # http://localhost:4001

# Frontend
cd frontend
cp .env.example .env    # REACT_APP_API_URL=http://localhost:4001/api
npm install
npm start               # http://localhost:3000
```

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `500` en todos los endpoints | `DATABASE_URL` incorrecta | Verifica en Railway → Connect |
| `401` en todas las rutas | `JWT_SECRET` vacío | Agrega la variable y redeploy |
| CORS error | `FRONTEND_URL` mal en el backend | Actualiza la variable y redeploy |
| Login OK pero app en blanco | `REACT_APP_API_URL` apunta a localhost | Corrige la variable del frontend |
| Error al ejecutar el schema | FK antes que la tabla padre | Ejecuta el schema completo de una sola vez |
