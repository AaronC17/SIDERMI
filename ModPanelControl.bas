Attribute VB_Name = "ModPanelControl"
'==============================================================================
' MÓDULO: ModPanelControl
' DESCRIPCIÓN: Procedimientos principales del panel de control y orquestación
' PROYECTO: Automatizador_Matricula.xlsm
' VERSIÓN: 1.0
'==============================================================================
Option Explicit

' ============================================================
' MACRO PRINCIPAL: EJECUTAR PROCESO COMPLETO
' ============================================================

Public Sub EjecutarProcesoCompleto()
    '
    ' Ejecuta el flujo operativo completo:
    ' 1. Importar datos SIGU
    ' 2. Importar datos Manual
    ' 3. Cruce de datos
    ' 4. Sincronización
    ' 5. Envío de correos
    ' 6. Generación de reporte
    '
    Dim respuesta As VbMsgBoxResult
    
    respuesta = MsgBox("PROCESO COMPLETO DE AUTOMATIZACIÓN" & vbCrLf & vbCrLf & _
        "Este proceso ejecutará los siguientes pasos:" & vbCrLf & _
        "1. Importar datos del Excel SIGU" & vbCrLf & _
        "2. Importar datos del Excel Manual" & vbCrLf & _
        "3. Ejecutar cruce de datos" & vbCrLf & _
        "4. Sincronizar archivo manual" & vbCrLf & _
        "5. Enviar correos de recordatorio" & vbCrLf & _
        "6. Generar reporte de cambios" & vbCrLf & vbCrLf & _
        "¿Desea continuar?", vbYesNo + vbQuestion, "Proceso Completo")
    
    If respuesta = vbNo Then Exit Sub
    
    Dim tiempoInicio As Double
    tiempoInicio = Timer
    
    ' Paso 1: Importar SIGU
    ActualizarEstadoPanel "Importando datos SIGU..."
    ImportarDatosSIGU
    
    ' Paso 2: Importar Manual
    ActualizarEstadoPanel "Importando datos manual..."
    ImportarDatosManual
    
    ' Paso 3: Cruce de datos
    ActualizarEstadoPanel "Ejecutando cruce de datos..."
    EjecutarCruceDeDatos
    
    ' Paso 4: Sincronización
    ActualizarEstadoPanel "Sincronizando archivo manual..."
    SincronizarArchivoManual
    
    ' Paso 5: Correos
    ActualizarEstadoPanel "Enviando correos de recordatorio..."
    EnviarCorreosRecordatorio
    
    ' Paso 6: Reporte
    ActualizarEstadoPanel "Generando reporte..."
    GenerarReporteCambios
    
    Dim tiempoTotal As Double
    tiempoTotal = Timer - tiempoInicio
    
    ActualizarEstadoPanel "Proceso completo finalizado"
    
    RegistrarHistorial "PROCESO_COMPLETO", "", _
        "Tiempo total: " & Format(tiempoTotal / 60, "0.0") & " minutos", "ÉXITO"
    
    MsgBox "PROCESO COMPLETO FINALIZADO" & vbCrLf & vbCrLf & _
           "Tiempo total: " & Format(tiempoTotal / 60, "0.0") & " minutos" & vbCrLf & _
           "Revise la hoja 'Panel' para el resumen.", vbInformation, "Completado"
End Sub

' ============================================================
' MACROS INDIVIDUALES PARA EL PANEL
' ============================================================

Public Sub Btn_ImportarSIGU()
    ActualizarEstadoPanel "Importando SIGU..."
    ImportarDatosSIGU
    ActualizarEstadoPanel "Listo"
End Sub

Public Sub Btn_ImportarManual()
    ActualizarEstadoPanel "Importando Manual..."
    ImportarDatosManual
    ActualizarEstadoPanel "Listo"
End Sub

Public Sub Btn_CruceDatos()
    ActualizarEstadoPanel "Ejecutando cruce..."
    EjecutarCruceDeDatos
    ActualizarEstadoPanel "Listo"
End Sub

Public Sub Btn_Sincronizar()
    ActualizarEstadoPanel "Sincronizando..."
    SincronizarArchivoManual
    ActualizarEstadoPanel "Listo"
End Sub

Public Sub Btn_EnviarCorreos()
    ActualizarEstadoPanel "Enviando correos..."
    EnviarCorreosRecordatorio
    ActualizarEstadoPanel "Listo"
End Sub

Public Sub Btn_CorreosBienvenida()
    ActualizarEstadoPanel "Enviando bienvenida..."
    EnviarCorreosBienvenida
    ActualizarEstadoPanel "Listo"
End Sub

Public Sub Btn_GenerarReporte()
    ActualizarEstadoPanel "Generando reporte..."
    GenerarReporteCambios
    ActualizarEstadoPanel "Listo"
End Sub

Public Sub Btn_ReporteCorreos()
    GenerarReporteCorreos
End Sub

Public Sub Btn_ReporteHistorial()
    GenerarReporteHistorial
End Sub

Public Sub Btn_ExportarManual()
    ExportarArchivoManualSincronizado
End Sub

Public Sub Btn_PrevisualizarCorreo()
    PrevisualizarCorreos
End Sub

Public Sub Btn_CorreoPrueba()
    EnviarCorreoPrueba
End Sub

Public Sub Btn_InicializarSistema()
    If MsgBox("¿Inicializar todas las hojas del sistema?" & vbCrLf & _
              "Esto creará las hojas necesarias con sus encabezados.", _
              vbYesNo + vbQuestion, "Inicializar") = vbYes Then
        InicializarHojasBase
        MsgBox "Sistema inicializado correctamente.", vbInformation, "Éxito"
    End If
End Sub

Public Sub Btn_LimpiarDatos()
    If MsgBox("¿Está seguro de que desea limpiar TODOS los datos de las hojas de trabajo?" & vbCrLf & _
              "Esta acción no se puede deshacer.", vbYesNo + vbExclamation, "Confirmar Limpieza") = vbYes Then
        
        Dim hojas As Variant
        hojas = Array(HOJA_SIGU, HOJA_MANUAL, HOJA_CRUCE, HOJA_PENDIENTES)
        
        Dim i As Long
        For i = LBound(hojas) To UBound(hojas)
            On Error Resume Next
            LimpiarHoja ThisWorkbook.Sheets(CStr(hojas(i))), True
            On Error GoTo 0
        Next i
        
        RegistrarHistorial "LIMPIAR_DATOS", "", "Datos limpiados de todas las hojas", "ÉXITO"
        MsgBox "Datos limpiados exitosamente.", vbInformation, "Limpieza"
    End If
End Sub

Public Sub Btn_AbrirCarpetaSIGU()
    Shell "explorer.exe " & ObtenerRutaSIGU(), vbNormalFocus
End Sub

Public Sub Btn_AbrirCarpetaManual()
    Shell "explorer.exe " & ObtenerRutaManual(), vbNormalFocus
End Sub

Public Sub Btn_AbrirCarpetaReportes()
    Dim wsConfig As Worksheet
    Set wsConfig = ThisWorkbook.Sheets(HOJA_CONFIG)
    Shell "explorer.exe " & Trim(CStr(wsConfig.Range("B4").Value)), vbNormalFocus
End Sub

' ============================================================
' CREAR BOTONES EN EL PANEL
' ============================================================

Public Sub CrearBotonesPanel()
    Dim ws As Worksheet
    Dim btn As Object ' Shape
    Dim topPos As Double
    
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(HOJA_PANEL)
    On Error GoTo 0
    
    If ws Is Nothing Then
        MsgBox "La hoja Panel no existe. Inicialice el sistema primero.", vbExclamation
        Exit Sub
    End If
    
    ' Eliminar botones existentes
    Dim shp As Shape
    For Each shp In ws.Shapes
        If shp.Type = msoFormControl Then shp.Delete
    Next shp
    
    topPos = 170 ' Empezar después de las instrucciones (~fila 24)
    Dim leftPos As Double
    leftPos = 10
    Dim btnWidth As Double
    btnWidth = 200
    Dim btnHeight As Double
    btnHeight = 32
    Dim spacing As Double
    spacing = 8
    
    ' === SECCIÓN: IMPORTACIÓN ===
    ws.Range("A25").Value = "IMPORTACIÓN DE DATOS"
    ws.Range("A25").Font.Bold = True
    ws.Range("A25").Font.Size = 12
    ws.Range("A25").Font.Color = RGB(0, 51, 102)
    topPos = ws.Range("A26").Top
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_ImportarSIGU"
    btn.Characters.Text = "1. Importar Datos SIGU"
    topPos = topPos + btnHeight + spacing
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_ImportarManual"
    btn.Characters.Text = "2. Importar Datos Manual"
    topPos = topPos + btnHeight + spacing
    
    ' === SECCIÓN: PROCESAMIENTO ===
    topPos = topPos + 15
    ws.Cells(ws.Range("A1").Row + CLng((topPos - ws.Range("A1").Top) / 15), 1).Value = "PROCESAMIENTO"
    
    Set btn = ws.Buttons.Add(leftPos, topPos + 20, btnWidth, btnHeight)
    btn.OnAction = "Btn_CruceDatos"
    btn.Characters.Text = "3. Ejecutar Cruce de Datos"
    topPos = topPos + 20 + btnHeight + spacing
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_Sincronizar"
    btn.Characters.Text = "4. Sincronizar Archivo Manual"
    topPos = topPos + btnHeight + spacing
    
    ' === SECCIÓN: CORREOS ===
    topPos = topPos + 15
    
    Set btn = ws.Buttons.Add(leftPos, topPos + 20, btnWidth, btnHeight)
    btn.OnAction = "Btn_EnviarCorreos"
    btn.Characters.Text = "5. Enviar Correos Recordatorio"
    topPos = topPos + 20 + btnHeight + spacing
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_CorreosBienvenida"
    btn.Characters.Text = "   Enviar Correos Bienvenida"
    topPos = topPos + btnHeight + spacing
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_PrevisualizarCorreo"
    btn.Characters.Text = "   Previsualizar Correo"
    topPos = topPos + btnHeight + spacing
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_CorreoPrueba"
    btn.Characters.Text = "   Enviar Correo de Prueba"
    topPos = topPos + btnHeight + spacing
    
    ' === SECCIÓN: REPORTES ===
    topPos = topPos + 15
    
    Set btn = ws.Buttons.Add(leftPos, topPos + 20, btnWidth, btnHeight)
    btn.OnAction = "Btn_GenerarReporte"
    btn.Characters.Text = "6. Generar Reporte de Cambios"
    topPos = topPos + 20 + btnHeight + spacing
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_ReporteCorreos"
    btn.Characters.Text = "   Reporte de Correos"
    topPos = topPos + btnHeight + spacing
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_ReporteHistorial"
    btn.Characters.Text = "   Reporte de Historial"
    topPos = topPos + btnHeight + spacing
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth, btnHeight)
    btn.OnAction = "Btn_ExportarManual"
    btn.Characters.Text = "   Exportar Manual Sincronizado"
    topPos = topPos + btnHeight + spacing
    
    ' === SECCIÓN: PROCESO COMPLETO ===
    topPos = topPos + 20
    
    Set btn = ws.Buttons.Add(leftPos, topPos, btnWidth + 50, btnHeight + 10)
    btn.OnAction = "EjecutarProcesoCompleto"
    btn.Characters.Text = "EJECUTAR PROCESO COMPLETO"
    topPos = topPos + btnHeight + 10 + spacing
    
    ' === SECCIÓN: UTILIDADES ===
    topPos = topPos + 20
    Dim leftCol2 As Double
    leftCol2 = 260
    
    Set btn = ws.Buttons.Add(leftCol2, ws.Range("A26").Top, 180, 28)
    btn.OnAction = "Btn_AbrirCarpetaSIGU"
    btn.Characters.Text = "Abrir Carpeta SIGU"
    
    Set btn = ws.Buttons.Add(leftCol2, ws.Range("A26").Top + 36, 180, 28)
    btn.OnAction = "Btn_AbrirCarpetaManual"
    btn.Characters.Text = "Abrir Carpeta Manual"
    
    Set btn = ws.Buttons.Add(leftCol2, ws.Range("A26").Top + 72, 180, 28)
    btn.OnAction = "Btn_AbrirCarpetaReportes"
    btn.Characters.Text = "Abrir Carpeta Reportes"
    
    Set btn = ws.Buttons.Add(leftCol2, ws.Range("A26").Top + 120, 180, 28)
    btn.OnAction = "Btn_LimpiarDatos"
    btn.Characters.Text = "Limpiar Todos los Datos"
    
    MsgBox "Botones del panel creados exitosamente.", vbInformation, "Panel"
End Sub

' ============================================================
' FUNCIONES AUXILIARES DEL PANEL
' ============================================================

Private Sub ActualizarEstadoPanel(estado As String)
    On Error Resume Next
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_PANEL)
    If Not ws Is Nothing Then
        ws.Range("B5").Value = estado
        If UCase(estado) = "LISTO" Then
            ws.Range("B5").Font.Color = RGB(0, 128, 0)
        Else
            ws.Range("B5").Font.Color = RGB(0, 0, 200)
        End If
    End If
    On Error GoTo 0
    DoEvents
End Sub

' ============================================================
' MENÚ CONTEXTUAL
' ============================================================

Public Sub CrearMenuAutomatizador()
    Dim menuBar As CommandBar
    Dim newMenu As CommandBarControl
    Dim menuItem As CommandBarControl
    
    On Error Resume Next
    ' Eliminar menú existente
    Application.CommandBars("Worksheet Menu Bar").Controls("Automatizador").Delete
    On Error GoTo 0
    
    Set menuBar = Application.CommandBars("Worksheet Menu Bar")
    Set newMenu = menuBar.Controls.Add(Type:=msoControlPopup, Temporary:=True)
    newMenu.Caption = "Automatizador"
    
    ' Importación
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.Caption = "Importar Datos SIGU"
    menuItem.OnAction = "Btn_ImportarSIGU"
    menuItem.FaceId = 270
    
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.Caption = "Importar Datos Manual"
    menuItem.OnAction = "Btn_ImportarManual"
    menuItem.FaceId = 271
    
    ' Separador
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.BeginGroup = True
    menuItem.Caption = "Ejecutar Cruce de Datos"
    menuItem.OnAction = "Btn_CruceDatos"
    menuItem.FaceId = 283
    
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.Caption = "Sincronizar Archivo Manual"
    menuItem.OnAction = "Btn_Sincronizar"
    menuItem.FaceId = 37
    
    ' Correos
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.BeginGroup = True
    menuItem.Caption = "Enviar Correos de Recordatorio"
    menuItem.OnAction = "Btn_EnviarCorreos"
    menuItem.FaceId = 4009
    
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.Caption = "Enviar Correos de Bienvenida"
    menuItem.OnAction = "Btn_CorreosBienvenida"
    menuItem.FaceId = 4009
    
    ' Reportes
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.BeginGroup = True
    menuItem.Caption = "Generar Reporte de Cambios"
    menuItem.OnAction = "Btn_GenerarReporte"
    menuItem.FaceId = 2530
    
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.Caption = "Exportar Manual Sincronizado"
    menuItem.OnAction = "Btn_ExportarManual"
    menuItem.FaceId = 3
    
    ' Proceso completo
    Set menuItem = newMenu.Controls.Add(Type:=msoControlButton)
    menuItem.BeginGroup = True
    menuItem.Caption = "EJECUTAR PROCESO COMPLETO"
    menuItem.OnAction = "EjecutarProcesoCompleto"
    menuItem.FaceId = 1087
End Sub

Public Sub EliminarMenuAutomatizador()
    On Error Resume Next
    Application.CommandBars("Worksheet Menu Bar").Controls("Automatizador").Delete
    On Error GoTo 0
End Sub
