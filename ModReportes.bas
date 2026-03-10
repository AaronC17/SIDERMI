Attribute VB_Name = "ModReportes"
'==============================================================================
' MÓDULO: ModReportes
' DESCRIPCIÓN: Generación de reportes de cambios y control de comunicaciones
' PROYECTO: Automatizador_Matricula.xlsm
' VERSIÓN: 1.0
'==============================================================================
Option Explicit

' ============================================================
' GENERAR REPORTE COMPLETO DE CAMBIOS
' ============================================================

Public Sub GenerarReporteCambios()
    Dim wsCruce As Worksheet
    Dim wbReporte As Workbook
    Dim wsResumen As Worksheet
    Dim wsDetalle As Worksheet
    Dim wsPendDoc As Worksheet
    Dim ultimaFila As Long
    Dim rutaReporte As String
    Dim nombreReporte As String
    
    On Error GoTo ErrorHandler
    
    Set wsCruce = ThisWorkbook.Sheets(HOJA_CRUCE)
    ultimaFila = ObtenerUltimaFila(wsCruce)
    
    If ultimaFila < 2 Then
        MsgBox "No hay datos de cruce para generar reporte." & vbCrLf & _
               "Ejecute primero el cruce de datos.", vbExclamation, "Sin datos"
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    MostrarProgreso "Generando reporte de cambios...", 10
    
    ' Crear libro de reporte
    Set wbReporte = Workbooks.Add
    
    ' -------------------------------------------------------
    ' HOJA 1: RESUMEN EJECUTIVO
    ' -------------------------------------------------------
    Set wsResumen = wbReporte.Sheets(1)
    wsResumen.Name = "Resumen"
    
    MostrarProgreso "Generando resumen ejecutivo...", 20
    
    GenerarResumenEjecutivo wsResumen, wsCruce
    
    ' -------------------------------------------------------
    ' HOJA 2: DETALLE DE CAMBIOS
    ' -------------------------------------------------------
    Set wsDetalle = wbReporte.Sheets.Add(After:=wsResumen)
    wsDetalle.Name = "Detalle_Cambios"
    
    MostrarProgreso "Copiando detalle de cambios...", 40
    
    ' Copiar datos del cruce
    Dim ultimaCol As Long
    ultimaCol = ObtenerUltimaColumna(wsCruce)
    wsCruce.Range(wsCruce.Cells(1, 1), wsCruce.Cells(ultimaFila, ultimaCol)).Copy
    wsDetalle.Cells(1, 1).PasteSpecial xlPasteAll
    Application.CutCopyMode = False
    
    wsDetalle.Cells.EntireColumn.AutoFit
    
    ' -------------------------------------------------------
    ' HOJA 3: DOCUMENTOS PENDIENTES
    ' -------------------------------------------------------
    Set wsPendDoc = wbReporte.Sheets.Add(After:=wsDetalle)
    wsPendDoc.Name = "Documentos_Pendientes"
    
    MostrarProgreso "Generando lista de documentos pendientes...", 60
    
    GenerarSeccionPendientes wsPendDoc, wsCruce
    
    ' -------------------------------------------------------
    ' HOJA 4: ESTADÍSTICAS POR SEDE
    ' -------------------------------------------------------
    Dim wsEstadisticas As Worksheet
    Set wsEstadisticas = wbReporte.Sheets.Add(After:=wsPendDoc)
    wsEstadisticas.Name = "Estadisticas"
    
    MostrarProgreso "Generando estadísticas...", 80
    
    GenerarEstadisticas wsEstadisticas
    
    ' Guardar reporte
    MostrarProgreso "Guardando reporte...", 95
    
    Dim wsConfig As Worksheet
    Set wsConfig = ThisWorkbook.Sheets(HOJA_CONFIG)
    Dim rutaReportes As String
    rutaReportes = Trim(CStr(wsConfig.Range("B4").Value))
    If Right(rutaReportes, 1) <> "\" Then rutaReportes = rutaReportes & "\"
    
    CrearCarpetaSiNoExiste rutaReportes
    
    nombreReporte = "Reporte_Cambios_" & Format(Now, "yyyymmdd_HHmmss") & ".xlsx"
    rutaReporte = rutaReportes & nombreReporte
    
    wbReporte.SaveAs rutaReporte, xlOpenXMLWorkbook
    
    RegistrarHistorial "GENERAR_REPORTE", "", "Reporte generado: " & rutaReporte, "ÉXITO"
    
    Application.ScreenUpdating = True
    LimpiarProgreso
    
    MsgBox "Reporte generado exitosamente." & vbCrLf & _
           "Ubicación: " & rutaReporte, vbInformation, "Reporte Generado"
    
    Exit Sub

ErrorHandler:
    MsgBox "Error al generar reporte: " & Err.Description, vbCritical, "Error"
    RegistrarHistorial "GENERAR_REPORTE", "", "Error: " & Err.Description, "ERROR"
    Application.ScreenUpdating = True
    LimpiarProgreso
End Sub

' ============================================================
' GENERAR REPORTE DE CORREOS ENVIADOS
' ============================================================

Public Sub GenerarReporteCorreos()
    Dim wsLog As Worksheet
    Dim wbReporte As Workbook
    Dim wsReporte As Worksheet
    Dim ultimaFila As Long
    Dim rutaReporte As String
    
    On Error GoTo ErrorHandler
    
    Set wsLog = ThisWorkbook.Sheets(HOJA_LOG_CORREOS)
    ultimaFila = ObtenerUltimaFila(wsLog)
    
    If ultimaFila < 2 Then
        MsgBox "No hay registros de correos enviados.", vbInformation, "Sin datos"
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    
    Set wbReporte = Workbooks.Add
    Set wsReporte = wbReporte.Sheets(1)
    wsReporte.Name = "Log_Correos"
    
    ' Copiar log completo
    Dim ultimaCol As Long
    ultimaCol = ObtenerUltimaColumna(wsLog)
    wsLog.Range(wsLog.Cells(1, 1), wsLog.Cells(ultimaFila, ultimaCol)).Copy
    wsReporte.Cells(1, 1).PasteSpecial xlPasteAll
    Application.CutCopyMode = False
    
    ' Agregar resumen
    Dim wsResumen As Worksheet
    Set wsResumen = wbReporte.Sheets.Add(Before:=wsReporte)
    wsResumen.Name = "Resumen_Correos"
    
    wsResumen.Range("A1").Value = "REPORTE DE CORREOS ENVIADOS"
    wsResumen.Range("A1").Font.Bold = True
    wsResumen.Range("A1").Font.Size = 16
    wsResumen.Range("A1:D1").Interior.Color = RGB(153, 0, 0)
    wsResumen.Range("A1:D1").Font.Color = RGB(255, 255, 255)
    
    wsResumen.Range("A3").Value = "Fecha del reporte:"
    wsResumen.Range("B3").Value = Format(Now, "dd/mm/yyyy hh:mm")
    
    wsResumen.Range("A5").Value = "Total de registros:"
    wsResumen.Range("B5").Value = ultimaFila - 1
    
    ' Contar por estado
    Dim countEnviados As Long, countOmitidos As Long, countErrores As Long
    Dim i As Long
    
    For i = 2 To ultimaFila
        Select Case UCase(Trim(CStr(wsLog.Cells(i, 7).Value)))
            Case "ENVIADO": countEnviados = countEnviados + 1
            Case "OMITIDO": countOmitidos = countOmitidos + 1
            Case "ERROR": countErrores = countErrores + 1
        End Select
    Next i
    
    wsResumen.Range("A7").Value = "Enviados exitosamente:"
    wsResumen.Range("B7").Value = countEnviados
    wsResumen.Range("B7").Font.Color = RGB(0, 128, 0)
    
    wsResumen.Range("A8").Value = "Omitidos:"
    wsResumen.Range("B8").Value = countOmitidos
    wsResumen.Range("B8").Font.Color = RGB(180, 140, 0)
    
    wsResumen.Range("A9").Value = "Con errores:"
    wsResumen.Range("B9").Value = countErrores
    wsResumen.Range("B9").Font.Color = RGB(200, 0, 0)
    
    wsResumen.Columns("A:B").AutoFit
    
    ' Guardar
    Dim wsConfig As Worksheet
    Set wsConfig = ThisWorkbook.Sheets(HOJA_CONFIG)
    Dim rutaReportes As String
    rutaReportes = Trim(CStr(wsConfig.Range("B4").Value))
    If Right(rutaReportes, 1) <> "\" Then rutaReportes = rutaReportes & "\"
    
    CrearCarpetaSiNoExiste rutaReportes
    
    rutaReporte = rutaReportes & "Reporte_Correos_" & Format(Now, "yyyymmdd_HHmmss") & ".xlsx"
    wbReporte.SaveAs rutaReporte, xlOpenXMLWorkbook
    
    RegistrarHistorial "REPORTE_CORREOS", "", "Reporte generado: " & rutaReporte, "ÉXITO"
    
    Application.ScreenUpdating = True
    
    MsgBox "Reporte de correos generado: " & rutaReporte, vbInformation, "Reporte"
    
    Exit Sub

ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical, "Error"
    Application.ScreenUpdating = True
End Sub

' ============================================================
' GENERAR REPORTE DE HISTORIAL
' ============================================================

Public Sub GenerarReporteHistorial()
    Dim wsHist As Worksheet
    Dim wbReporte As Workbook
    Dim wsReporte As Worksheet
    Dim ultimaFila As Long
    Dim rutaReporte As String
    
    On Error GoTo ErrorHandler
    
    Set wsHist = ThisWorkbook.Sheets(HOJA_HISTORIAL)
    ultimaFila = ObtenerUltimaFila(wsHist)
    
    If ultimaFila < 2 Then
        MsgBox "No hay historial de operaciones.", vbInformation, "Sin datos"
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    
    Set wbReporte = Workbooks.Add
    Set wsReporte = wbReporte.Sheets(1)
    wsReporte.Name = "Historial_Operaciones"
    
    Dim ultimaCol As Long
    ultimaCol = ObtenerUltimaColumna(wsHist)
    wsHist.Range(wsHist.Cells(1, 1), wsHist.Cells(ultimaFila, ultimaCol)).Copy
    wsReporte.Cells(1, 1).PasteSpecial xlPasteAll
    Application.CutCopyMode = False
    
    wsReporte.Cells.EntireColumn.AutoFit
    AplicarFormatoTabla wsReporte
    
    Dim wsConfig As Worksheet
    Set wsConfig = ThisWorkbook.Sheets(HOJA_CONFIG)
    Dim rutaReportes As String
    rutaReportes = Trim(CStr(wsConfig.Range("B4").Value))
    If Right(rutaReportes, 1) <> "\" Then rutaReportes = rutaReportes & "\"
    
    CrearCarpetaSiNoExiste rutaReportes
    
    rutaReporte = rutaReportes & "Historial_" & Format(Now, "yyyymmdd_HHmmss") & ".xlsx"
    wbReporte.SaveAs rutaReporte, xlOpenXMLWorkbook
    
    RegistrarHistorial "REPORTE_HISTORIAL", "", "Reporte generado: " & rutaReporte, "ÉXITO"
    
    Application.ScreenUpdating = True
    
    MsgBox "Reporte de historial generado: " & rutaReporte, vbInformation, "Reporte"
    
    Exit Sub

ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical, "Error"
    Application.ScreenUpdating = True
End Sub

' ============================================================
' FUNCIONES AUXILIARES DE REPORTES
' ============================================================

Private Sub GenerarResumenEjecutivo(wsResumen As Worksheet, wsCruce As Worksheet)
    Dim ultimaFila As Long
    ultimaFila = ObtenerUltimaFila(wsCruce)
    
    ' Título
    wsResumen.Range("A1").Value = "REPORTE DE CRUCE DE DATOS - MATRÍCULA"
    wsResumen.Range("A1:F1").Merge
    wsResumen.Range("A1").Font.Bold = True
    wsResumen.Range("A1").Font.Size = 18
    wsResumen.Range("A1").Font.Color = RGB(255, 255, 255)
    wsResumen.Range("A1:F1").Interior.Color = RGB(0, 51, 102)
    wsResumen.Range("A1").HorizontalAlignment = xlCenter
    wsResumen.Rows(1).RowHeight = 40
    
    ' Información general
    wsResumen.Range("A3").Value = "Fecha del reporte:"
    wsResumen.Range("B3").Value = Format(Now, "dd/mm/yyyy hh:mm:ss")
    wsResumen.Range("A3").Font.Bold = True
    
    wsResumen.Range("A4").Value = "Generado por:"
    wsResumen.Range("B4").Value = Environ("USERNAME")
    wsResumen.Range("A4").Font.Bold = True
    
    wsResumen.Range("A5").Value = "Clave primaria:"
    wsResumen.Range("B5").Value = ObtenerClavePrimaria()
    wsResumen.Range("A5").Font.Bold = True
    
    ' Registros base
    wsResumen.Range("A7").Value = "DATOS BASE"
    wsResumen.Range("A7").Font.Bold = True
    wsResumen.Range("A7").Font.Size = 13
    wsResumen.Range("A7:F7").Interior.Color = RGB(220, 220, 220)
    
    Dim wsSIGU As Worksheet, wsManual As Worksheet
    Set wsSIGU = ThisWorkbook.Sheets(HOJA_SIGU)
    Set wsManual = ThisWorkbook.Sheets(HOJA_MANUAL)
    
    wsResumen.Range("A8").Value = "Total registros SIGU:"
    wsResumen.Range("B8").Value = ObtenerUltimaFila(wsSIGU) - 1
    
    wsResumen.Range("A9").Value = "Total registros Manual:"
    wsResumen.Range("B9").Value = ObtenerUltimaFila(wsManual) - 1
    
    ' Resumen de cambios
    wsResumen.Range("A11").Value = "RESUMEN DE CAMBIOS DETECTADOS"
    wsResumen.Range("A11").Font.Bold = True
    wsResumen.Range("A11").Font.Size = 13
    wsResumen.Range("A11:F11").Interior.Color = RGB(220, 220, 220)
    
    Dim fila As Long
    fila = 12
    
    ' Tabla de resumen
    wsResumen.Range("A" & fila).Value = "Tipo de Cambio"
    wsResumen.Range("B" & fila).Value = "Cantidad"
    wsResumen.Range("C" & fila).Value = "Porcentaje"
    wsResumen.Range("A" & fila & ":C" & fila).Font.Bold = True
    wsResumen.Range("A" & fila & ":C" & fila).Interior.Color = RGB(0, 102, 153)
    wsResumen.Range("A" & fila & ":C" & fila).Font.Color = RGB(255, 255, 255)
    
    Dim totalCambios As Long
    totalCambios = ultimaFila - 1
    
    Dim tipos As Variant
    Dim colores As Variant
    tipos = Array(TIPO_NUEVO, TIPO_CAMBIO_ESTADO, TIPO_CAMBIO_SEDE, TIPO_CAMBIO_CARRERA, _
                  TIPO_INCONSISTENTE, TIPO_DOC_PENDIENTE, TIPO_DATO_ACTUALIZADO)
    
    Dim descripciones As Variant
    descripciones = Array("Estudiantes Nuevos", "Cambios de Estado", "Cambios de Sede", _
                          "Cambios de Carrera", "Registros Inconsistentes", _
                          "Documentos Pendientes", "Datos Actualizados")
    
    colores = Array(RGB(198, 239, 206), RGB(255, 235, 156), RGB(189, 215, 238), _
                    RGB(189, 215, 238), RGB(255, 199, 206), RGB(255, 220, 180), RGB(230, 230, 250))
    
    Dim j As Long
    Dim count As Long
    
    For j = LBound(tipos) To UBound(tipos)
        fila = fila + 1
        count = ContarPorTipoCambio(wsCruce, CStr(tipos(j)))
        
        wsResumen.Cells(fila, 1).Value = CStr(descripciones(j))
        wsResumen.Cells(fila, 2).Value = count
        
        If totalCambios > 0 Then
            wsResumen.Cells(fila, 3).Value = count / totalCambios
            wsResumen.Cells(fila, 3).NumberFormat = "0.0%"
        Else
            wsResumen.Cells(fila, 3).Value = 0
        End If
        
        wsResumen.Range(wsResumen.Cells(fila, 1), wsResumen.Cells(fila, 3)).Interior.Color = CLng(colores(j))
    Next j
    
    fila = fila + 1
    wsResumen.Cells(fila, 1).Value = "TOTAL"
    wsResumen.Cells(fila, 1).Font.Bold = True
    wsResumen.Cells(fila, 2).Value = totalCambios
    wsResumen.Cells(fila, 2).Font.Bold = True
    wsResumen.Cells(fila, 3).Value = 1
    wsResumen.Cells(fila, 3).NumberFormat = "0.0%"
    wsResumen.Range(wsResumen.Cells(fila, 1), wsResumen.Cells(fila, 3)).Interior.Color = RGB(0, 51, 102)
    wsResumen.Range(wsResumen.Cells(fila, 1), wsResumen.Cells(fila, 3)).Font.Color = RGB(255, 255, 255)
    
    ' Bordes
    With wsResumen.Range("A12:C" & fila).Borders
        .LineStyle = xlContinuous
        .Weight = xlThin
    End With
    
    ' Leyenda de colores
    fila = fila + 3
    wsResumen.Range("A" & fila).Value = "LEYENDA DE COLORES"
    wsResumen.Range("A" & fila).Font.Bold = True
    wsResumen.Range("A" & fila).Font.Size = 12
    
    fila = fila + 1
    For j = LBound(tipos) To UBound(tipos)
        wsResumen.Cells(fila, 1).Interior.Color = CLng(colores(j))
        wsResumen.Cells(fila, 1).Value = " "
        wsResumen.Cells(fila, 2).Value = CStr(descripciones(j))
        fila = fila + 1
    Next j
    
    wsResumen.Columns("A:F").AutoFit
    wsResumen.Columns("A").ColumnWidth = 30
End Sub

Private Sub GenerarSeccionPendientes(wsPend As Worksheet, wsCruce As Worksheet)
    Dim ultimaFila As Long
    Dim i As Long
    Dim filaPend As Long
    
    ultimaFila = ObtenerUltimaFila(wsCruce)
    
    ' Título
    wsPend.Range("A1").Value = "ESTUDIANTES CON DOCUMENTOS PENDIENTES"
    wsPend.Range("A1:G1").Merge
    wsPend.Range("A1").Font.Bold = True
    wsPend.Range("A1").Font.Size = 14
    wsPend.Range("A1:G1").Interior.Color = RGB(204, 0, 0)
    wsPend.Range("A1").Font.Color = RGB(255, 255, 255)
    wsPend.Range("A1").HorizontalAlignment = xlCenter
    
    ' Encabezados
    wsPend.Range("A3").Value = "Cédula"
    wsPend.Range("B3").Value = "Carnet"
    wsPend.Range("C3").Value = "Nombre"
    wsPend.Range("D3").Value = "Documentos Pendientes"
    wsPend.Range("E3").Value = "Documentos Entregados"
    wsPend.Range("F3").Value = "Fecha Detección"
    
    With wsPend.Range("A3:F3")
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = RGB(102, 0, 0)
    End With
    
    filaPend = 4
    
    For i = 2 To ultimaFila
        If UCase(Trim(CStr(wsCruce.Cells(i, COL_CRUCE_TIPO_CAMBIO).Value))) = UCase(TIPO_DOC_PENDIENTE) Then
            wsPend.Cells(filaPend, 1).Value = wsCruce.Cells(i, COL_CRUCE_CEDULA).Value
            wsPend.Cells(filaPend, 2).Value = wsCruce.Cells(i, COL_CRUCE_CARNET).Value
            wsPend.Cells(filaPend, 3).Value = wsCruce.Cells(i, COL_CRUCE_NOMBRE).Value
            wsPend.Cells(filaPend, 4).Value = wsCruce.Cells(i, COL_CRUCE_VALOR_SIGU).Value  ' Docs pendientes
            wsPend.Cells(filaPend, 5).Value = wsCruce.Cells(i, COL_CRUCE_VALOR_MANUAL).Value ' Docs entregados
            wsPend.Cells(filaPend, 6).Value = wsCruce.Cells(i, COL_CRUCE_FECHA).Value
            wsPend.Cells(filaPend, 6).NumberFormat = "dd/mm/yyyy"
            
            ' Color alternado
            If filaPend Mod 2 = 0 Then
                wsPend.Range(wsPend.Cells(filaPend, 1), wsPend.Cells(filaPend, 6)).Interior.Color = RGB(255, 240, 240)
            End If
            
            filaPend = filaPend + 1
        End If
    Next i
    
    ' Total
    wsPend.Cells(filaPend + 1, 1).Value = "Total con documentos pendientes:"
    wsPend.Cells(filaPend + 1, 1).Font.Bold = True
    wsPend.Cells(filaPend + 1, 2).Value = filaPend - 4
    wsPend.Cells(filaPend + 1, 2).Font.Bold = True
    
    wsPend.Columns("A:F").AutoFit
    
    If filaPend > 4 Then
        With wsPend.Range("A3:F" & filaPend - 1).Borders
            .LineStyle = xlContinuous
            .Weight = xlThin
        End With
    End If
End Sub

Private Sub GenerarEstadisticas(wsEst As Worksheet)
    Dim wsSIGU As Worksheet
    Dim ultimaFila As Long
    Dim i As Long
    Dim dictSedes As Object
    Dim dictCarreras As Object
    Dim dictEstados As Object
    
    Set wsSIGU = ThisWorkbook.Sheets(HOJA_SIGU)
    ultimaFila = ObtenerUltimaFila(wsSIGU)
    
    Set dictSedes = CreateObject("Scripting.Dictionary")
    Set dictCarreras = CreateObject("Scripting.Dictionary")
    Set dictEstados = CreateObject("Scripting.Dictionary")
    
    For i = 2 To ultimaFila
        Dim sede As String, carrera As String, estado As String
        sede = Trim(CStr(wsSIGU.Cells(i, COL_SIGU_SEDE).Value))
        carrera = Trim(CStr(wsSIGU.Cells(i, COL_SIGU_CARRERA).Value))
        estado = Trim(CStr(wsSIGU.Cells(i, COL_SIGU_ESTADO).Value))
        
        If sede <> "" Then
            If dictSedes.Exists(sede) Then
                dictSedes(sede) = dictSedes(sede) + 1
            Else
                dictSedes.Add sede, 1
            End If
        End If
        
        If carrera <> "" Then
            If dictCarreras.Exists(carrera) Then
                dictCarreras(carrera) = dictCarreras(carrera) + 1
            Else
                dictCarreras.Add carrera, 1
            End If
        End If
        
        If estado <> "" Then
            If dictEstados.Exists(estado) Then
                dictEstados(estado) = dictEstados(estado) + 1
            Else
                dictEstados.Add estado, 1
            End If
        End If
    Next i
    
    ' Título
    wsEst.Range("A1").Value = "ESTADÍSTICAS DE MATRÍCULA"
    wsEst.Range("A1:D1").Merge
    wsEst.Range("A1").Font.Bold = True
    wsEst.Range("A1").Font.Size = 16
    wsEst.Range("A1:D1").Interior.Color = RGB(0, 51, 102)
    wsEst.Range("A1").Font.Color = RGB(255, 255, 255)
    wsEst.Range("A1").HorizontalAlignment = xlCenter
    
    ' Estadísticas por Sede
    Dim fila As Long
    fila = 3
    
    wsEst.Range("A" & fila).Value = "DISTRIBUCIÓN POR SEDE"
    wsEst.Range("A" & fila).Font.Bold = True
    wsEst.Range("A" & fila).Font.Size = 12
    fila = fila + 1
    
    wsEst.Cells(fila, 1).Value = "Sede"
    wsEst.Cells(fila, 2).Value = "Cantidad"
    wsEst.Range("A" & fila & ":B" & fila).Font.Bold = True
    wsEst.Range("A" & fila & ":B" & fila).Interior.Color = RGB(0, 102, 153)
    wsEst.Range("A" & fila & ":B" & fila).Font.Color = RGB(255, 255, 255)
    
    Dim key As Variant
    For Each key In dictSedes.Keys
        fila = fila + 1
        wsEst.Cells(fila, 1).Value = key
        wsEst.Cells(fila, 2).Value = dictSedes(key)
    Next key
    
    ' Estadísticas por Carrera
    fila = fila + 3
    wsEst.Range("A" & fila).Value = "DISTRIBUCIÓN POR CARRERA"
    wsEst.Range("A" & fila).Font.Bold = True
    wsEst.Range("A" & fila).Font.Size = 12
    fila = fila + 1
    
    wsEst.Cells(fila, 1).Value = "Carrera"
    wsEst.Cells(fila, 2).Value = "Cantidad"
    wsEst.Range("A" & fila & ":B" & fila).Font.Bold = True
    wsEst.Range("A" & fila & ":B" & fila).Interior.Color = RGB(0, 102, 153)
    wsEst.Range("A" & fila & ":B" & fila).Font.Color = RGB(255, 255, 255)
    
    For Each key In dictCarreras.Keys
        fila = fila + 1
        wsEst.Cells(fila, 1).Value = key
        wsEst.Cells(fila, 2).Value = dictCarreras(key)
    Next key
    
    ' Estadísticas por Estado
    fila = fila + 3
    wsEst.Range("A" & fila).Value = "DISTRIBUCIÓN POR ESTADO"
    wsEst.Range("A" & fila).Font.Bold = True
    wsEst.Range("A" & fila).Font.Size = 12
    fila = fila + 1
    
    wsEst.Cells(fila, 1).Value = "Estado"
    wsEst.Cells(fila, 2).Value = "Cantidad"
    wsEst.Range("A" & fila & ":B" & fila).Font.Bold = True
    wsEst.Range("A" & fila & ":B" & fila).Interior.Color = RGB(0, 102, 153)
    wsEst.Range("A" & fila & ":B" & fila).Font.Color = RGB(255, 255, 255)
    
    For Each key In dictEstados.Keys
        fila = fila + 1
        wsEst.Cells(fila, 1).Value = key
        wsEst.Cells(fila, 2).Value = dictEstados(key)
    Next key
    
    wsEst.Columns("A:D").AutoFit
    wsEst.Columns("A").ColumnWidth = 40
End Sub
