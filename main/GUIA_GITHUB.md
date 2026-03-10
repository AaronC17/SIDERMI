# 📤 Guía para Subir el Proyecto a GitHub

## Método 1: Script Automático (Recomendado)

1. **Instale Git** (si no lo tiene):
   - Descargue desde: https://git-scm.com/download/win
   - Instale con las opciones por defecto
   - Reinicie PowerShell

2. **Ejecute el script**:
   ```powershell
   cd "C:\Users\LINC\Desktop\cda"
   powershell -ExecutionPolicy Bypass -File SUBIR_GITHUB.ps1
   ```

3. **Configure credenciales** si se solicitan

---

## Método 2: Comandos Manuales

### Paso 1: Abrir PowerShell en la carpeta del proyecto

```powershell
cd "C:\Users\LINC\Desktop\cda"
```

### Paso 2: Inicializar repositorio Git

```powershell
git init
```

### Paso 3: Configurar Git (primera vez)

```powershell
git config user.name "Aaron Chinchilla"
git config user.email "tu-email@ejemplo.com"
```

### Paso 4: Agregar todos los archivos

```powershell
git add .
```

### Paso 5: Crear commit inicial

```powershell
git commit -m "Initial commit: Automatizador de Matrícula v1.0"
```

### Paso 6: Configurar rama principal

```powershell
git branch -M main
```

### Paso 7: Agregar repositorio remoto

```powershell
git remote add origin https://github.com/AaronC17/Automatizarcm.git
```

### Paso 8: Subir al repositorio

```powershell
git push -u origin main
```

---

## Autenticación con GitHub

### Opción A: Personal Access Token (Recomendado)

1. Vaya a: https://github.com/settings/tokens
2. Click en **"Generate new token (classic)"**
3. Configure:
   - Note: `Automatizador Matrícula`
   - Expiration: `90 days` (o su preferencia)
   - Marque: ✅ **repo** (todos los permisos de repositorio)
4. Click en **"Generate token"**
5. **COPIE EL TOKEN** (no podrá verlo de nuevo)
6. Cuando ejecute `git push`, use:
   - Username: `AaronC17`
   - Password: `[pegue el token aquí]`

### Opción B: SSH (Avanzado)

Si prefiere SSH:

1. Genere una clave SSH:
   ```powershell
   ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
   ```

2. Agregue la clave a GitHub:
   - Copie el contenido de: `C:\Users\LINC\.ssh\id_ed25519.pub`
   - Vaya a: https://github.com/settings/keys
   - Click **"New SSH key"**
   - Pegue la clave pública

3. Cambie la URL del remote:
   ```powershell
   git remote set-url origin git@github.com:AaronC17/Automatizarcm.git
   ```

4. Push:
   ```powershell
   git push -u origin main
   ```

---

## Verificar que el Push fue Exitoso

1. Abra su navegador
2. Vaya a: https://github.com/AaronC17/Automatizarcm
3. Debería ver todos los archivos del proyecto

---

## Actualizar el Repositorio (después del primer push)

Cuando haga cambios al proyecto:

```powershell
cd "C:\Users\LINC\Desktop\cda"

# Ver qué archivos cambiaron
git status

# Agregar cambios
git add .

# Crear commit
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push
```

---

## Comandos Útiles de Git

```powershell
# Ver estado actual
git status

# Ver historial de commits
git log --oneline

# Ver diferencias
git diff

# Ver branches
git branch

# Ver remotes configurados
git remote -v

# Actualizar desde GitHub (si colabora con otros)
git pull
```

---

## Solución de Problemas

### Error: "Git no se reconoce como comando"
**Solución**: Instale Git desde https://git-scm.com/download/win y reinicie PowerShell

### Error: "Authentication failed"
**Solución**: Use un Personal Access Token en lugar de su contraseña

### Error: "remote origin already exists"
**Solución**: 
```powershell
git remote remove origin
git remote add origin https://github.com/AaronC17/Automatizarcm.git
```

### Error: "Updates were rejected"
**Solución**:
```powershell
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## Estructura que se Subirá a GitHub

```
Automatizarcm/
├── VBA_Modules/          ✓ Módulos de código fuente
├── PowerQuery/           ✓ Scripts Power Query
├── Plantillas_Correo/    ✓ Templates HTML
├── Datos_SIGU/          ✓ Carpeta (archivos excluidos por .gitignore)
├── Datos_Manual/        ✓ Carpeta (archivos excluidos por .gitignore)
├── Reportes/            ✓ Carpeta vacía
├── Historial/           ✓ Carpeta vacía
├── README.md            ✓ Documentación principal
├── INSTRUCCIONES.md     ✓ Guía de instalación
├── LICENSE              ✓ Licencia MIT
├── .gitignore           ✓ Archivos a ignorar
├── SETUP.ps1            ✓ Script de configuración
└── SUBIR_GITHUB.ps1     ✓ Este script
```

**NOTA**: Los archivos de datos personales (`.xlsx`) no se subirán por seguridad.

---

## ¿Necesita Ayuda?

- Documentación de Git: https://git-scm.com/doc
- Guía de GitHub: https://docs.github.com/es
- Issues del proyecto: https://github.com/AaronC17/Automatizarcm/issues

---

*Automatizador de Matrícula - Febrero 2026*
