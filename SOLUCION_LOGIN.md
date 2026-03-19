# 🔥 SOLUCIÓN AL PROBLEMA DE LOGIN

## ⚡ SOLUCIÓN INMEDIATA (funciona ya):

### 1. Usa los usuarios POR DEFECTO:
```
Usuario: admin
Contraseña: utn2026

-- O --

Usuario: registro
Contraseña: registro2026
```

### 2. NO reinicies el servidor si creas usuarios nuevos
- Los usuarios nuevos se guardan temporalmente
- Si reinicias el servidor = se pierden
- Solo quedan admin y registro

---

## 🛠️ SOLUCIÓN PERMANENTE (para instalar después):

### Opción A: Instalar MongoDB manualmente
1. Ve a: https://www.mongodb.com/try/download/community
2. Descargar MongoDB Community Server para Windows
3. Instalar con configuración por defecto
4. MongoDB se instalará como servicio de Windows

### Opción B: Usar MongoDB Atlas (cloud - GRATIS)
1. Ve a: https://www.mongodb.com/atlas
2. Crear cuenta gratuita
3. Crear cluster gratuito
4. Obtener connection string
5. Actualizar MONGODB_URI en .env

### Opción C: Docker (si tienes Docker instalado)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## 📋 PASOS PARA AHORA:

1. **Reinicia el servidor backend** (Ctrl+C y `npm run dev`)
2. **Usa login con:** admin / utn2026
3. **Crea usuarios si necesitas** (pero no reinicies después)
4. **Para persistencia:** instala MongoDB después con Opción A

---

## 🔒 NOTA DE SEGURIDAD:
Las credenciales por defecto están en el código y son conocidas.
En producción, cambiar estas credenciales mediante variables de entorno.