# ====================================================================
# AUTOMATIZADOR DE MATRÍCULA, ADMISIÓN Y COMUNICACIONES
# Guía Completa de Instalación y Uso
# Versión 1.0 - Febrero 2026
# ====================================================================

## 1. REQUISITOS PREVIOS

- **Microsoft Excel 2016** o superior (con soporte para macros .xlsm)
- **Microsoft Outlook** instalado y configurado (para envío de correos)
- **Windows 10/11**
- Macros habilitadas en Excel

---

## 2. ESTRUCTURA DE CARPETAS

```
C:\Users\LINC\Desktop\cda\
│
├── VBA_Modules\              ← Módulos VBA (código fuente)
│   ├── ModConfiguracion.bas  ← Configuración central
│   ├── ModUtilidades.bas     ← Funciones utilitarias
│   ├── ModSincronizacion.bas ← Motor de cruce y sincronización
│   ├── ModCorreos.bas        ← Automatización de correos Outlook
│   ├── ModReportes.bas       ← Generación de reportes
│   ├── ModPanelControl.bas   ← Panel de control y orquestación
│   └── ThisWorkbook.cls      ← Eventos del libro
│
├── PowerQuery\               ← Scripts de Power Query (M)
│   ├── PQ_ImportarSIGU.pq            ← Importar datos SIGU
│   ├── PQ_CruceDatos.pq              ← Cruce SIGU vs Manual
│   └── PQ_DocumentosPendientes.pq    ← Lista de pendientes
│
├── Datos_SIGU\               ← Colocar aquí archivos exportados de SIGU
├── Datos_Manual\             ← Colocar aquí el archivo manual administrativo
├── Reportes\                 ← Reportes generados automáticamente
├── Plantillas_Correo\        ← Plantillas de correo personalizables
├── Historial\                ← Archivos de historial exportados
│
├── Automatizador_Matricula.xlsm  ← ARCHIVO PRINCIPAL (se crea en paso 3)
├── SETUP.ps1                     ← Script de configuración automática
└── INSTRUCCIONES.md              ← Este archivo
```

---

## 3. INSTALACIÓN PASO A PASO

### Paso 3.1: Crear el archivo Automatizador_Matricula.xlsm

1. Abra **Microsoft Excel**
2. Cree un **nuevo libro en blanco**
3. Guárdelo como: `Automatizador_Matricula.xlsm`
   - Ubicación: `C:\Users\LINC\Desktop\cda\`
   - Tipo: **Libro de Excel habilitado para macros (.xlsm)**

### Paso 3.2: Abrir el Editor de Visual Basic

1. Presione **Alt + F11** para abrir el Editor VBA
2. O vaya a: **Programador > Visual Basic**

> Si no ve la pestaña Programador:
> - Archivo → Opciones → Personalizar cinta de opciones
> - Marque la casilla "Programador"

### Paso 3.3: Importar los módulos VBA

En el Editor VBA:

1. Haga clic derecho en **VBAProject (Automatizador_Matricula.xlsm)**
2. Seleccione **Importar archivo...**
3. Importe cada archivo `.bas` de la carpeta `VBA_Modules\`:
   - `ModConfiguracion.bas`
   - `ModUtilidades.bas`
   - `ModSincronizacion.bas`
   - `ModCorreos.bas`
   - `ModReportes.bas`
   - `ModPanelControl.bas`

### Paso 3.4: Configurar ThisWorkbook

1. En el Editor VBA, haga doble clic en **ThisWorkbook** (en el panel izquierdo)
2. Abra el archivo `VBA_Modules\ThisWorkbook.cls` con un editor de texto
3. **Copie todo el contenido** (desde `Option Explicit` en adelante)
4. **Pegue** en el editor de código de ThisWorkbook en VBA
   - ⚠️ NO incluya las líneas `Attribute VB_Name` al pegar

### Paso 3.5: Habilitar referencias necesarias

En el Editor VBA:
1. Vaya a **Herramientas → Referencias**
2. Marque las siguientes referencias:
   - ✅ Microsoft Outlook XX.0 Object Library
   - ✅ Microsoft Scripting Runtime
3. Haga clic en **Aceptar**

### Paso 3.6: Inicializar el sistema

1. Cierre el Editor VBA (Alt + Q)
2. Guarde el archivo (Ctrl + S)
3. Cierre y vuelva a abrir el archivo .xlsm
4. Si aparece advertencia de macros: **Habilitar contenido**
5. El sistema se inicializará automáticamente creando todas las hojas

**Alternativa manual:**
- Presione **Alt + F8**
- Seleccione `Btn_InicializarSistema`
- Ejecutar

### Paso 3.7: Crear botones del panel

1. Presione **Alt + F8**
2. Seleccione `CrearBotonesPanel`
3. Ejecutar
4. Los botones aparecerán en la hoja "Panel"

---

## 4. CONFIGURACIÓN

### Hoja "Configuracion"

Edite los valores en la columna B según su entorno:

| Campo | Descripción | Valor por defecto |
|-------|-------------|-------------------|
| Ruta Carpeta SIGU | Donde se colocan los archivos SIGU | `C:\Users\LINC\Desktop\cda\Datos_SIGU\` |
| Ruta Carpeta Manual | Donde está el archivo manual | `C:\Users\LINC\Desktop\cda\Datos_Manual\` |
| Ruta Reportes | Donde se guardan los reportes | `C:\Users\LINC\Desktop\cda\Reportes\` |
| Clave Primaria | CEDULA o CARNET | `CEDULA` |
| Correo Remitente | Dirección de envío | `registro@universidad.ac.cr` |
| Firma Correo | Firma institucional | `Departamento de Registro y Admisión` |
| Días Mínimos Reenvío | Entre recordatorios | `7` |
| Documentos Requeridos | Lista separada por comas | Ver lista completa |

---

## 5. USO OPERATIVO

### Flujo recomendado (diario/semanal):

```
PASO 1 → Descargar Excel desde SIGU
PASO 2 → Colocar en carpeta Datos_SIGU
PASO 3 → Abrir Automatizador_Matricula.xlsm
PASO 4 → Clic en "1. Importar Datos SIGU"
PASO 5 → Clic en "2. Importar Datos Manual"
PASO 6 → Clic en "3. Ejecutar Cruce de Datos"
PASO 7 → Revisar hoja "Cruce_Datos" (cambios detectados)
PASO 8 → Clic en "4. Sincronizar Archivo Manual"
PASO 9 → Clic en "5. Enviar Correos Recordatorio"
PASO 10 → Clic en "6. Generar Reporte de Cambios"
```

### Proceso automático completo:
- Use el botón **"EJECUTAR PROCESO COMPLETO"** para ejecutar todos los pasos secuencialmente.

---

## 6. DESCRIPCIÓN DE HOJAS

| Hoja | Función |
|------|---------|
| **Panel** | Panel de control con botones y resumen |
| **Datos_SIGU** | Datos importados del archivo SIGU |
| **Datos_Manual** | Datos importados del archivo manual |
| **Cruce_Datos** | Resultado del cruce (cambios detectados) |
| **Pendientes** | Estudiantes con documentos pendientes |
| **Historial** | Registro de todas las operaciones realizadas |
| **Configuracion** | Parámetros del sistema |
| **Log_Correos** | Registro de correos enviados |

---

## 7. CÓDIGO DE COLORES EN CRUCE_DATOS

| Color | Significado |
|-------|-------------|
| 🟢 Verde claro | Estudiante nuevo |
| 🟡 Amarillo | Cambio de estado |
| 🔵 Azul claro | Cambio de sede o carrera |
| 🔴 Rojo claro | Registro inconsistente |
| 🟠 Naranja | Documentos pendientes |
| 🟣 Lavanda | Dato actualizado (correo, teléfono) |

---

## 8. MACROS DISPONIBLES

### Importación:
- `Btn_ImportarSIGU` — Importa el archivo SIGU más reciente
- `Btn_ImportarManual` — Importa el archivo manual

### Procesamiento:
- `Btn_CruceDatos` — Ejecuta el cruce de datos
- `Btn_Sincronizar` — Sincroniza el archivo manual

### Correos:
- `Btn_EnviarCorreos` — Envía recordatorios de documentos pendientes
- `Btn_CorreosBienvenida` — Envía correos a estudiantes nuevos
- `Btn_PrevisualizarCorreo` — Previsualiza el correo sin enviar
- `Btn_CorreoPrueba` — Envía un correo de prueba

### Reportes:
- `Btn_GenerarReporte` — Genera reporte Excel de cambios
- `Btn_ReporteCorreos` — Genera reporte de correos enviados
- `Btn_ReporteHistorial` — Genera reporte del historial
- `Btn_ExportarManual` — Exporta el archivo manual sincronizado

### Sistema:
- `Btn_InicializarSistema` — Inicializa/reinicializa las hojas
- `CrearBotonesPanel` — Crea los botones en el panel
- `EjecutarProcesoCompleto` — Ejecuta todo el flujo

---

## 9. POWER QUERY (OPCIONAL)

Los scripts de Power Query en la carpeta `PowerQuery\` proporcionan una alternativa para:
- Importación automática desde carpeta
- Limpieza avanzada de datos
- Cruce de datos basado en consultas

### Para usar Power Query:
1. En Excel: **Datos → Obtener datos → Desde archivo**
2. Configure la consulta según el script `.pq`
3. Use el **Editor Avanzado** para pegar el código M

---

## 10. FORMATO DEL ARCHIVO SIGU

El archivo Excel exportado desde SIGU debe tener estas columnas (en orden):

| Col | Campo |
|-----|-------|
| A | Cédula |
| B | Carnet |
| C | Nombre |
| D | Primer Apellido |
| E | Segundo Apellido |
| F | Correo Electrónico |
| G | Teléfono |
| H | Carrera |
| I | Sede |
| J | Estado |
| K | Período |
| L | Fecha Matrícula |
| M | Documentos Entregados |
| N | Observaciones |

> ⚠️ Si el orden de columnas del archivo SIGU es diferente, ajuste las constantes
> `COL_SIGU_*` en el módulo `ModConfiguracion.bas`.

---

## 11. DOCUMENTOS REQUERIDOS (por defecto)

1. Cédula
2. Foto
3. Título Secundaria
4. Notas Secundaria
5. Constancia CCSS
6. Declaración Jurada

> Modifique la lista en la hoja Configuración o en la constante
> `DOCUMENTOS_REQUERIDOS` del módulo `ModConfiguracion.bas`.

---

## 12. SOLUCIÓN DE PROBLEMAS

| Problema | Solución |
|----------|----------|
| Las macros no se ejecutan | Habilite macros en: Archivo → Opciones → Centro de confianza |
| Error al enviar correos | Verifique que Outlook esté abierto y configurado |
| No encuentra archivos SIGU | Verifique la ruta en la hoja Configuración |
| Error de referencia | Verifique las referencias VBA (Herramientas → Referencias) |
| Columnas no coinciden | Ajuste las constantes COL_SIGU_* en ModConfiguracion |

---

## 13. SOPORTE Y MANTENIMIENTO

- Revise periódicamente la hoja **Historial** para monitorear operaciones
- Los **reportes** se generan automáticamente en la carpeta Reportes
- Realice **respaldos** del archivo .xlsm regularmente
- El **log de correos** permite auditar todas las comunicaciones enviadas

---

*Automatizador de Matrícula v1.0 - Febrero 2026*
