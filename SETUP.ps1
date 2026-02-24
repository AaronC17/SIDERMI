# ==============================================================================
# SETUP.ps1 - Script de Configuración del Automatizador de Matrícula
# Ejecute este script para crear el archivo .xlsm con todos los módulos importados
#
# USO: Clic derecho → "Ejecutar con PowerShell"
#   o  desde terminal: powershell -ExecutionPolicy Bypass -File SETUP.ps1
# ==============================================================================

$ErrorActionPreference = "Stop"
$basePath = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " AUTOMATIZADOR DE MATRÍCULA - SETUP" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Excel está instalado
Write-Host "[1/6] Verificando Microsoft Excel..." -ForegroundColor Yellow
try {
    $excel = New-Object -ComObject Excel.Application
    Write-Host "  Excel encontrado: $($excel.Version)" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Microsoft Excel no está instalado o no se puede iniciar." -ForegroundColor Red
    Write-Host "  Instale Excel y vuelva a ejecutar este script." -ForegroundColor Red
    Read-Host "Presione Enter para salir"
    exit 1
}

# Crear carpetas si no existen
Write-Host "[2/6] Verificando estructura de carpetas..." -ForegroundColor Yellow
$carpetas = @("Datos_SIGU", "Datos_Manual", "Reportes", "Plantillas_Correo", "Historial")
foreach ($carpeta in $carpetas) {
    $rutaCompleta = Join-Path $basePath $carpeta
    if (-not (Test-Path $rutaCompleta)) {
        New-Item -ItemType Directory -Path $rutaCompleta -Force | Out-Null
        Write-Host "  Creada: $carpeta" -ForegroundColor Gray
    } else {
        Write-Host "  Existe: $carpeta" -ForegroundColor Gray
    }
}

# Crear el libro .xlsm
Write-Host "[3/6] Creando Automatizador_Matricula.xlsm..." -ForegroundColor Yellow
$xlsmPath = Join-Path $basePath "Automatizador_Matricula.xlsm"

$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Add()

# Importar módulos VBA
Write-Host "[4/6] Importando módulos VBA..." -ForegroundColor Yellow
$vbaModulesPath = Join-Path $basePath "VBA_Modules"
$modulosImportados = 0

$archivosVBA = @(
    "ModConfiguracion.bas",
    "ModUtilidades.bas",
    "ModSincronizacion.bas",
    "ModCorreos.bas",
    "ModReportes.bas",
    "ModPanelControl.bas"
)

foreach ($archivo in $archivosVBA) {
    $rutaModulo = Join-Path $vbaModulesPath $archivo
    if (Test-Path $rutaModulo) {
        try {
            $workbook.VBProject.VBComponents.Import($rutaModulo) | Out-Null
            Write-Host "  Importado: $archivo" -ForegroundColor Green
            $modulosImportados++
        } catch {
            Write-Host "  ERROR importando $archivo : $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "" -ForegroundColor Red
            Write-Host "  NOTA: Si obtiene este error, debe habilitar el acceso al modelo de objetos VBA:" -ForegroundColor Yellow
            Write-Host "    1. Abra Excel" -ForegroundColor Yellow
            Write-Host "    2. Archivo > Opciones > Centro de confianza > Configuración del centro de confianza" -ForegroundColor Yellow
            Write-Host "    3. Configuración de macros" -ForegroundColor Yellow
            Write-Host "    4. Marque: 'Confiar en el acceso al modelo de objetos de proyectos de VBA'" -ForegroundColor Yellow
            Write-Host "    5. Acepte y vuelva a ejecutar este script" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  No encontrado: $archivo" -ForegroundColor Red
    }
}

# Configurar ThisWorkbook
Write-Host "[5/6] Configurando eventos ThisWorkbook..." -ForegroundColor Yellow
$thisWbPath = Join-Path $vbaModulesPath "ThisWorkbook.cls"
if (Test-Path $thisWbPath) {
    try {
        $contenido = Get-Content $thisWbPath -Raw -Encoding UTF8
        # Remover líneas de Attribute que no corresponden al pegar en ThisWorkbook
        $contenido = $contenido -replace "(?m)^Attribute VB_Name.*\r?\n", ""
        
        $thisWbComponent = $workbook.VBProject.VBComponents.Item("ThisWorkbook")
        $thisWbComponent.CodeModule.AddFromString($contenido)
        Write-Host "  ThisWorkbook configurado" -ForegroundColor Green
    } catch {
        Write-Host "  Advertencia: No se pudo configurar ThisWorkbook automáticamente." -ForegroundColor Yellow
        Write-Host "  Configure manualmente siguiendo las instrucciones." -ForegroundColor Yellow
    }
} else {
    Write-Host "  Archivo ThisWorkbook.cls no encontrado" -ForegroundColor Yellow
}

# Guardar como .xlsm
Write-Host "[6/6] Guardando archivo..." -ForegroundColor Yellow
try {
    # xlOpenXMLWorkbookMacroEnabled = 52
    $workbook.SaveAs($xlsmPath, 52)
    Write-Host "  Guardado: $xlsmPath" -ForegroundColor Green
} catch {
    Write-Host "  Error al guardar: $($_.Exception.Message)" -ForegroundColor Red
    # Intentar guardar en otra ubicación
    $xlsmPathAlt = Join-Path ([Environment]::GetFolderPath("Desktop")) "Automatizador_Matricula.xlsm"
    try {
        $workbook.SaveAs($xlsmPathAlt, 52)
        Write-Host "  Guardado en ubicación alternativa: $xlsmPathAlt" -ForegroundColor Yellow
    } catch {
        Write-Host "  No se pudo guardar. Guarde manualmente." -ForegroundColor Red
    }
}

$workbook.Close($true)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " SETUP COMPLETADO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Módulos VBA importados: $modulosImportados de $($archivosVBA.Count)" -ForegroundColor White
Write-Host ""
Write-Host "PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "  1. Abra el archivo: Automatizador_Matricula.xlsm" -ForegroundColor White
Write-Host "  2. Habilite macros cuando Excel lo solicite" -ForegroundColor White
Write-Host "  3. Si es primera vez, ejecute Alt+F8 > Btn_InicializarSistema" -ForegroundColor White
Write-Host "  4. Luego ejecute Alt+F8 > CrearBotonesPanel" -ForegroundColor White
Write-Host "  5. Configure las rutas en la hoja 'Configuracion'" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Configure las referencias VBA:" -ForegroundColor Yellow
Write-Host "  Alt+F11 > Herramientas > Referencias:" -ForegroundColor White
Write-Host "  - Microsoft Outlook Object Library" -ForegroundColor White
Write-Host "  - Microsoft Scripting Runtime" -ForegroundColor White
Write-Host ""

Read-Host "Presione Enter para finalizar"
