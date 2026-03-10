Attribute VB_Name = "ThisWorkbook"
'==============================================================================
' THISWORKBOOK: Eventos del libro de trabajo
' PROYECTO: Automatizador_Matricula.xlsm
' VERSIÓN: 1.0
'==============================================================================
Option Explicit

Private Sub Workbook_Open()
    ' Se ejecuta al abrir el archivo
    On Error Resume Next
    
    ' Inicializar hojas si es primera vez
    Dim ws As Worksheet
    Set ws = Nothing
    Set ws = ThisWorkbook.Sheets(HOJA_PANEL)
    
    If ws Is Nothing Then
        ' Primera ejecución: crear todas las hojas
        InicializarHojasBase
    End If
    
    ' Crear menú personalizado
    CrearMenuAutomatizador
    
    ' Ir a la hoja Panel
    If Not ws Is Nothing Then
        ws.Activate
        ws.Range("A1").Select
    End If
    
    ' Mostrar mensaje de bienvenida solo la primera vez del día
    Dim wsConfig As Worksheet
    Set wsConfig = Nothing
    Set wsConfig = ThisWorkbook.Sheets(HOJA_CONFIG)
    
    If Not wsConfig Is Nothing Then
        Dim ultimaApertura As String
        ultimaApertura = CStr(wsConfig.Range("B16").Value)
        
        If ultimaApertura <> Format(Date, "dd/mm/yyyy") Then
            wsConfig.Range("A16").Value = "Última apertura:"
            wsConfig.Range("B16").Value = Format(Date, "dd/mm/yyyy")
            
            MsgBox "Bienvenido al Automatizador de Matrícula y Admisión" & vbCrLf & vbCrLf & _
                   "Use el Panel de Control o el menú 'Automatizador' para:" & vbCrLf & _
                   "  • Importar datos de SIGU y del archivo manual" & vbCrLf & _
                   "  • Ejecutar el cruce de datos" & vbCrLf & _
                   "  • Sincronizar archivos" & vbCrLf & _
                   "  • Enviar correos de recordatorio" & vbCrLf & _
                   "  • Generar reportes", _
                   vbInformation, "Automatizador de Matrícula v1.0"
        End If
    End If
    
    On Error GoTo 0
End Sub

Private Sub Workbook_BeforeClose(Cancel As Boolean)
    ' Limpiar menú personalizado al cerrar
    On Error Resume Next
    EliminarMenuAutomatizador
    Application.StatusBar = False
    On Error GoTo 0
End Sub

Private Sub Workbook_SheetActivate(ByVal Sh As Object)
    ' Actualizar barra de estado según la hoja activa
    On Error Resume Next
    Select Case Sh.Name
        Case HOJA_PANEL
            Application.StatusBar = "Panel de Control - Use los botones o el menú Automatizador"
        Case HOJA_SIGU
            Application.StatusBar = "Datos SIGU - " & (ObtenerUltimaFila(Sh) - 1) & " registros"
        Case HOJA_MANUAL
            Application.StatusBar = "Datos Manual - " & (ObtenerUltimaFila(Sh) - 1) & " registros"
        Case HOJA_CRUCE
            Application.StatusBar = "Cruce de Datos - " & (ObtenerUltimaFila(Sh) - 1) & " cambios detectados"
        Case HOJA_PENDIENTES
            Application.StatusBar = "Pendientes - " & (ObtenerUltimaFila(Sh) - 1) & " estudiantes con documentos pendientes"
        Case HOJA_HISTORIAL
            Application.StatusBar = "Historial de Operaciones"
        Case HOJA_CONFIG
            Application.StatusBar = "Configuración del Sistema"
        Case HOJA_LOG_CORREOS
            Application.StatusBar = "Registro de Correos Enviados"
        Case Else
            Application.StatusBar = False
    End Select
    On Error GoTo 0
End Sub
