# SIDERMI — Sistema Integrado de Datos y Requisitos de Matrícula de Ingreso

Aplicación web full-stack para la gestión de matrícula universitaria en la UTN.

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [MongoDB](https://www.mongodb.com/docs/manual/installation/) 6.0 o superior (corriendo localmente)
- npm 9 o superior

## Instalación rápida

```bash
# Instalar dependencias del servidor y del cliente
npm run install:all
```

## Configuración de entorno

1. Copie el archivo de ejemplo para el servidor:

   ```bash
   cp server/.env.example server/.env
   ```

2. Edite `server/.env` y configure al menos `JWT_SECRET` con un valor seguro y aleatorio.

   Las variables disponibles son:

   | Variable       | Descripción                               | Valor por defecto                                |
   |----------------|-------------------------------------------|--------------------------------------------------|
   | `PORT`         | Puerto del servidor Express               | `4000`                                           |
   | `MONGODB_URI`  | URI de conexión a MongoDB                 | `mongodb://127.0.0.1:27017/registro_utn`         |
   | `JWT_SECRET`   | Clave secreta para firmar tokens JWT      | *Debe cambiarse en producción*                   |
   | `NODE_ENV`     | Entorno (`development` / `production`)    | `development`                                    |

## Ejecutar en desarrollo

Abra **dos terminales** y ejecute cada uno:

```bash
# Terminal 1 — Servidor (Express + MongoDB, puerto 4000)
npm run dev:server

# Terminal 2 — Cliente (Vite dev server, puerto 5173)
npm run dev:client
```

Acceda a la aplicación en [http://localhost:5173](http://localhost:5173).

### Credenciales por defecto

| Usuario   | Contraseña    | Rol            |
|-----------|---------------|----------------|
| admin     | utn2026       | Administrador  |
| registro  | registro2026  | Registro       |

> **Nota**: El servidor crea estos usuarios automáticamente al iniciar si no existen.  
> ⚠️ **En producción, cambie estas contraseñas de inmediato** desde la sección de gestión de usuarios.

## Datos de prueba (seed)

Para insertar 35 estudiantes de ejemplo junto con historial de subidas:

```bash
npm run seed
```

## Build para producción

```bash
npm run build
```

El servidor en modo producción sirve el frontend compilado desde `client/dist/`.

## Estructura del proyecto

```
SIDERMI/
├── client/         # Frontend React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/         # Backend Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── .env.example
│   └── package.json
└── package.json    # Scripts raíz para facilitar el arranque
```
