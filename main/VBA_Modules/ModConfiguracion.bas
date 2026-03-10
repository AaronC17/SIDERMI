Attribute VB_Name = "ModConfiguracion"
'==============================================================================
' MÓDULO: ModConfiguracion
' DESCRIPCIÓN: Configuración central del Automatizador de Matrícula
' PROYECTO: Automatizador_Matricula.xlsm
' VERSIÓN: 1.0
' FECHA: Febrero 2026
'==============================================================================
Option Explicit

' ============================================================
' RUTAS DE ARCHIVOS
' ============================================================
Public Const RUTA_BASE As String = "C:\Users\LINC\Desktop\cda\"
Public Const CARPETA_SIGU As String = "Datos_SIGU\"
Public Const CARPETA_MANUAL As String = "Datos_Manual\"
Public Const CARPETA_REPORTES As String = "Reportes\"
Public Const CARPETA_HISTORIAL As String = "Historial\"
Public Const CARPETA_PLANTILLAS As String = "Plantillas_Correo\"

' ============================================================
' NOMBRES DE HOJAS EN EL AUTOMATIZADOR
' ============================================================
Public Const HOJA_PANEL As String = "Panel"
Public Const HOJA_SIGU As String = "Datos_SIGU"
Public Const HOJA_MANUAL As String = "Datos_Manual"
Public Const HOJA_CRUCE As String = "Cruce_Datos"
Public Const HOJA_PENDIENTES As String = "Pendientes"
Public Const HOJA_HISTORIAL As String = "Historial"
Public Const HOJA_CONFIG As String = "Configuracion"
Public Const HOJA_LOG_CORREOS As String = "Log_Correos"

' ============================================================
' COLUMNAS CLAVE DEL ARCHIVO SIGU (ajustar según exportación real)
' ============================================================
Public Const COL_SIGU_CEDULA As Long = 1          ' A - Cédula
Public Const COL_SIGU_CARNET As Long = 2           ' B - Carnet
Public Const COL_SIGU_NOMBRE As Long = 3           ' C - Nombre
Public Const COL_SIGU_APELLIDO1 As Long = 4        ' D - Primer Apellido
Public Const COL_SIGU_APELLIDO2 As Long = 5        ' E - Segundo Apellido
Public Const COL_SIGU_CORREO As Long = 6           ' F - Correo Electrónico
Public Const COL_SIGU_TELEFONO As Long = 7         ' G - Teléfono
Public Const COL_SIGU_CARRERA As Long = 8          ' H - Carrera
Public Const COL_SIGU_SEDE As Long = 9             ' I - Sede
Public Const COL_SIGU_ESTADO As Long = 10          ' J - Estado
Public Const COL_SIGU_PERIODO As Long = 11         ' K - Período
Public Const COL_SIGU_FECHA_MATRICULA As Long = 12 ' L - Fecha Matrícula
Public Const COL_SIGU_DOCUMENTOS As Long = 13      ' M - Documentos Entregados
Public Const COL_SIGU_OBSERVACIONES As Long = 14   ' N - Observaciones

' ============================================================
' COLUMNAS DEL ARCHIVO MANUAL ADMINISTRATIVO
' ============================================================
Public Const COL_MAN_CEDULA As Long = 1
Public Const COL_MAN_CARNET As Long = 2
Public Const COL_MAN_NOMBRE As Long = 3
Public Const COL_MAN_APELLIDO1 As Long = 4
Public Const COL_MAN_APELLIDO2 As Long = 5
Public Const COL_MAN_CORREO As Long = 6
Public Const COL_MAN_TELEFONO As Long = 7
Public Const COL_MAN_CARRERA As Long = 8
Public Const COL_MAN_SEDE As Long = 9
Public Const COL_MAN_ESTADO As Long = 10
Public Const COL_MAN_PERIODO As Long = 11
Public Const COL_MAN_FECHA_MATRICULA As Long = 12
Public Const COL_MAN_DOCUMENTOS As Long = 13
Public Const COL_MAN_OBSERVACIONES As Long = 14
Public Const COL_MAN_ULTIMA_SYNC As Long = 15      ' O - Fecha última sincronización
Public Const COL_MAN_CORREO_ENVIADO As Long = 16   ' P - Correo de recordatorio enviado
Public Const COL_MAN_FECHA_CORREO As Long = 17     ' Q - Fecha de envío del correo

' ============================================================
' COLUMNAS DE LA HOJA DE CRUCE
' ============================================================
Public Const COL_CRUCE_CEDULA As Long = 1
Public Const COL_CRUCE_CARNET As Long = 2
Public Const COL_CRUCE_NOMBRE As Long = 3
Public Const COL_CRUCE_TIPO_CAMBIO As Long = 4     ' Nuevo / Cambio Estado / Cambio Sede / Inconsistente / Pendiente
Public Const COL_CRUCE_CAMPO As Long = 5            ' Campo que cambió
Public Const COL_CRUCE_VALOR_SIGU As Long = 6       ' Valor en SIGU
Public Const COL_CRUCE_VALOR_MANUAL As Long = 7     ' Valor en Manual
Public Const COL_CRUCE_FECHA As Long = 8             ' Fecha de detección
Public Const COL_CRUCE_APLICADO As Long = 9          ' ¿Se aplicó el cambio?

' ============================================================
' ESTADOS DE ESTUDIANTE
' ============================================================
Public Const ESTADO_ACTIVO As String = "Activo"
Public Const ESTADO_INACTIVO As String = "Inactivo"
Public Const ESTADO_RETIRADO As String = "Retirado"
Public Const ESTADO_GRADUADO As String = "Graduado"
Public Const ESTADO_PENDIENTE As String = "Pendiente"

' ============================================================
' TIPOS DE CAMBIO DETECTADOS
' ============================================================
Public Const TIPO_NUEVO As String = "NUEVO"
Public Const TIPO_CAMBIO_ESTADO As String = "CAMBIO_ESTADO"
Public Const TIPO_CAMBIO_SEDE As String = "CAMBIO_SEDE"
Public Const TIPO_CAMBIO_CARRERA As String = "CAMBIO_CARRERA"
Public Const TIPO_INCONSISTENTE As String = "INCONSISTENTE"
Public Const TIPO_DOC_PENDIENTE As String = "DOC_PENDIENTE"
Public Const TIPO_DATO_ACTUALIZADO As String = "DATO_ACTUALIZADO"

' ============================================================
' DOCUMENTOS REQUERIDOS (lista separada por comas)
' ============================================================
Public Const DOCUMENTOS_REQUERIDOS As String = "Cédula,Foto,Título Secundaria,Notas Secundaria,Constancia CCSS,Declaración Jurada"

' ============================================================
' CONFIGURACIÓN DE CORREOS
' ============================================================
Public Const CORREO_REMITENTE As String = "registro@universidad.ac.cr"
Public Const CORREO_FIRMA As String = "Departamento de Registro y Admisión"
Public Const CORREO_ASUNTO_RECORDATORIO As String = "Recordatorio: Documentos Pendientes para Matrícula"
Public Const CORREO_ASUNTO_BIENVENIDA As String = "Bienvenido(a) - Información de Matrícula"
Public Const DIAS_REENVIO_MINIMO As Long = 7   ' Días mínimos entre reenvíos

' ============================================================
' FUNCIONES DE CONFIGURACIÓN
' ============================================================

Public Function ObtenerRutaSIGU() As String
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(HOJA_CONFIG)
    On Error GoTo 0
    
    If Not ws Is Nothing Then
        If ws.Range("B2").Value <> "" Then
            ObtenerRutaSIGU = ws.Range("B2").Value
            Exit Function
        End If
    End If
    
    ObtenerRutaSIGU = RUTA_BASE & CARPETA_SIGU
End Function

Public Function ObtenerRutaManual() As String
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(HOJA_CONFIG)
    On Error GoTo 0
    
    If Not ws Is Nothing Then
        If ws.Range("B3").Value <> "" Then
            ObtenerRutaManual = ws.Range("B3").Value
            Exit Function
        End If
    End If
    
    ObtenerRutaManual = RUTA_BASE & CARPETA_MANUAL
End Function

Public Function ObtenerArchivoSIGUMasReciente() As String
    Dim rutaCarpeta As String
    Dim archivo As String
    Dim fechaMasReciente As Date
    Dim archivoMasReciente As String
    
    rutaCarpeta = ObtenerRutaSIGU()
    
    If Right(rutaCarpeta, 1) <> "\" Then rutaCarpeta = rutaCarpeta & "\"
    
    archivo = Dir(rutaCarpeta & "*.xlsx")
    
    fechaMasReciente = #1/1/1900#
    archivoMasReciente = ""
    
    Do While archivo <> ""
        If FileDateTime(rutaCarpeta & archivo) > fechaMasReciente Then
            fechaMasReciente = FileDateTime(rutaCarpeta & archivo)
            archivoMasReciente = rutaCarpeta & archivo
        End If
        archivo = Dir
    Loop
    
    ObtenerArchivoSIGUMasReciente = archivoMasReciente
End Function

Public Function ObtenerArchivoManual() As String
    Dim rutaCarpeta As String
    Dim archivo As String
    
    rutaCarpeta = ObtenerRutaManual()
    If Right(rutaCarpeta, 1) <> "\" Then rutaCarpeta = rutaCarpeta & "\"
    
    ' Buscar archivo manual (único esperado)
    archivo = Dir(rutaCarpeta & "*.xlsx")
    
    If archivo <> "" Then
        ObtenerArchivoManual = rutaCarpeta & archivo
    Else
        ObtenerArchivoManual = ""
    End If
End Function

Public Function ObtenerClavePrimaria() As String
    ' Devuelve el campo a usar como clave primaria: "CEDULA" o "CARNET"
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(HOJA_CONFIG)
    On Error GoTo 0
    
    If Not ws Is Nothing Then
        If UCase(Trim(ws.Range("B5").Value)) = "CARNET" Then
            ObtenerClavePrimaria = "CARNET"
            Exit Function
        End If
    End If
    
    ObtenerClavePrimaria = "CEDULA"
End Function

Public Sub InicializarHojasBase()
    ' Crea las hojas necesarias si no existen
    Dim nombresHojas As Variant
    Dim i As Long
    Dim ws As Worksheet
    
    nombresHojas = Array(HOJA_PANEL, HOJA_SIGU, HOJA_MANUAL, HOJA_CRUCE, _
                         HOJA_PENDIENTES, HOJA_HISTORIAL, HOJA_CONFIG, HOJA_LOG_CORREOS)
    
    Application.ScreenUpdating = False
    
    For i = LBound(nombresHojas) To UBound(nombresHojas)
        If Not HojaExiste(CStr(nombresHojas(i))) Then
            Set ws = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
            ws.Name = CStr(nombresHojas(i))
        End If
    Next i
    
    ' Configurar hoja de Configuración
    ConfigurarHojaConfig
    
    ' Configurar encabezados de hojas
    ConfigurarEncabezadosSIGU
    ConfigurarEncabezadosManual
    ConfigurarEncabezadosCruce
    ConfigurarEncabezadosHistorial
    ConfigurarEncabezadosLogCorreos
    ConfigurarEncabezadosPendientes
    ConfigurarHojaPanel
    
    Application.ScreenUpdating = True
End Sub

Private Function HojaExiste(nombreHoja As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(nombreHoja)
    On Error GoTo 0
    HojaExiste = Not ws Is Nothing
End Function

Private Sub ConfigurarHojaConfig()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_CONFIG)
    
    If ws.Range("A1").Value = "" Then
        ws.Range("A1").Value = "CONFIGURACIÓN DEL AUTOMATIZADOR"
        ws.Range("A1").Font.Bold = True
        ws.Range("A1").Font.Size = 14
        
        ws.Range("A2").Value = "Ruta Carpeta SIGU:"
        ws.Range("B2").Value = RUTA_BASE & CARPETA_SIGU
        
        ws.Range("A3").Value = "Ruta Carpeta Manual:"
        ws.Range("B3").Value = RUTA_BASE & CARPETA_MANUAL
        
        ws.Range("A4").Value = "Ruta Reportes:"
        ws.Range("B4").Value = RUTA_BASE & CARPETA_REPORTES
        
        ws.Range("A5").Value = "Clave Primaria:"
        ws.Range("B5").Value = "CEDULA"
        
        ws.Range("A6").Value = "Correo Remitente:"
        ws.Range("B6").Value = CORREO_REMITENTE
        
        ws.Range("A7").Value = "Firma Correo:"
        ws.Range("B7").Value = CORREO_FIRMA
        
        ws.Range("A8").Value = "Días Mínimos Reenvío:"
        ws.Range("B8").Value = DIAS_REENVIO_MINIMO
        
        ws.Range("A9").Value = "Documentos Requeridos:"
        ws.Range("B9").Value = DOCUMENTOS_REQUERIDOS
        
        ws.Range("A11").Value = "Última Sincronización:"
        ws.Range("A12").Value = "Último Envío de Correos:"
        ws.Range("A13").Value = "Total Registros SIGU:"
        ws.Range("A14").Value = "Total Registros Manual:"
        
        ws.Columns("A:A").ColumnWidth = 25
        ws.Columns("B:B").ColumnWidth = 60
        
        ws.Range("A1:B1").Interior.Color = RGB(0, 51, 102)
        ws.Range("A1:B1").Font.Color = RGB(255, 255, 255)
    End If
End Sub

Private Sub ConfigurarEncabezadosSIGU()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_SIGU)
    
    If ws.Range("A1").Value = "" Then
        ws.Range("A1").Value = "Cédula"
        ws.Range("B1").Value = "Carnet"
        ws.Range("C1").Value = "Nombre"
        ws.Range("D1").Value = "Primer Apellido"
        ws.Range("E1").Value = "Segundo Apellido"
        ws.Range("F1").Value = "Correo Electrónico"
        ws.Range("G1").Value = "Teléfono"
        ws.Range("H1").Value = "Carrera"
        ws.Range("I1").Value = "Sede"
        ws.Range("J1").Value = "Estado"
        ws.Range("K1").Value = "Período"
        ws.Range("L1").Value = "Fecha Matrícula"
        ws.Range("M1").Value = "Documentos Entregados"
        ws.Range("N1").Value = "Observaciones"
        
        FormatearEncabezados ws, "A1:N1", RGB(0, 102, 153)
    End If
End Sub

Private Sub ConfigurarEncabezadosManual()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_MANUAL)
    
    If ws.Range("A1").Value = "" Then
        ws.Range("A1").Value = "Cédula"
        ws.Range("B1").Value = "Carnet"
        ws.Range("C1").Value = "Nombre"
        ws.Range("D1").Value = "Primer Apellido"
        ws.Range("E1").Value = "Segundo Apellido"
        ws.Range("F1").Value = "Correo Electrónico"
        ws.Range("G1").Value = "Teléfono"
        ws.Range("H1").Value = "Carrera"
        ws.Range("I1").Value = "Sede"
        ws.Range("J1").Value = "Estado"
        ws.Range("K1").Value = "Período"
        ws.Range("L1").Value = "Fecha Matrícula"
        ws.Range("M1").Value = "Documentos Entregados"
        ws.Range("N1").Value = "Observaciones"
        ws.Range("O1").Value = "Última Sincronización"
        ws.Range("P1").Value = "Correo Enviado"
        ws.Range("Q1").Value = "Fecha Envío Correo"
        
        FormatearEncabezados ws, "A1:Q1", RGB(0, 128, 0)
    End If
End Sub

Private Sub ConfigurarEncabezadosCruce()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_CRUCE)
    
    If ws.Range("A1").Value = "" Then
        ws.Range("A1").Value = "Cédula"
        ws.Range("B1").Value = "Carnet"
        ws.Range("C1").Value = "Nombre Completo"
        ws.Range("D1").Value = "Tipo de Cambio"
        ws.Range("E1").Value = "Campo Afectado"
        ws.Range("F1").Value = "Valor SIGU"
        ws.Range("G1").Value = "Valor Manual"
        ws.Range("H1").Value = "Fecha Detección"
        ws.Range("I1").Value = "¿Aplicado?"
        
        FormatearEncabezados ws, "A1:I1", RGB(204, 102, 0)
    End If
End Sub

Private Sub ConfigurarEncabezadosHistorial()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_HISTORIAL)
    
    If ws.Range("A1").Value = "" Then
        ws.Range("A1").Value = "Fecha/Hora"
        ws.Range("B1").Value = "Acción"
        ws.Range("C1").Value = "Cédula"
        ws.Range("D1").Value = "Detalle"
        ws.Range("E1").Value = "Usuario"
        ws.Range("F1").Value = "Resultado"
        
        FormatearEncabezados ws, "A1:F1", RGB(102, 0, 102)
    End If
End Sub

Private Sub ConfigurarEncabezadosLogCorreos()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_LOG_CORREOS)
    
    If ws.Range("A1").Value = "" Then
        ws.Range("A1").Value = "Fecha Envío"
        ws.Range("B1").Value = "Cédula"
        ws.Range("C1").Value = "Nombre"
        ws.Range("D1").Value = "Correo Destino"
        ws.Range("E1").Value = "Asunto"
        ws.Range("F1").Value = "Tipo Correo"
        ws.Range("G1").Value = "Estado Envío"
        ws.Range("H1").Value = "Documentos Pendientes"
        ws.Range("I1").Value = "Observaciones"
        
        FormatearEncabezados ws, "A1:I1", RGB(153, 0, 0)
    End If
End Sub

Private Sub ConfigurarEncabezadosPendientes()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_PENDIENTES)
    
    If ws.Range("A1").Value = "" Then
        ws.Range("A1").Value = "Cédula"
        ws.Range("B1").Value = "Carnet"
        ws.Range("C1").Value = "Nombre Completo"
        ws.Range("D1").Value = "Correo"
        ws.Range("E1").Value = "Sede"
        ws.Range("F1").Value = "Carrera"
        ws.Range("G1").Value = "Documentos Pendientes"
        ws.Range("H1").Value = "Último Recordatorio"
        ws.Range("I1").Value = "Cantidad Recordatorios"
        ws.Range("J1").Value = "Estado"
        
        FormatearEncabezados ws, "A1:J1", RGB(204, 0, 0)
    End If
End Sub

Private Sub ConfigurarHojaPanel()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(HOJA_PANEL)
    
    If ws.Range("A1").Value = "" Then
        ws.Range("A1").Value = "AUTOMATIZADOR DE MATRÍCULA Y ADMISIÓN"
        ws.Range("A1:H1").Merge
        ws.Range("A1").Font.Bold = True
        ws.Range("A1").Font.Size = 18
        ws.Range("A1").Font.Color = RGB(255, 255, 255)
        ws.Range("A1:H1").Interior.Color = RGB(0, 51, 102)
        ws.Range("A1").HorizontalAlignment = xlCenter
        
        ws.Range("A3").Value = "PANEL DE CONTROL"
        ws.Range("A3").Font.Bold = True
        ws.Range("A3").Font.Size = 14
        
        ws.Range("A5").Value = "Estado del Sistema:"
        ws.Range("B5").Value = "Listo"
        ws.Range("B5").Font.Color = RGB(0, 128, 0)
        ws.Range("B5").Font.Bold = True
        
        ws.Range("A7").Value = "INSTRUCCIONES:"
        ws.Range("A7").Font.Bold = True
        ws.Range("A8").Value = "1. Coloque el archivo Excel exportado de SIGU en la carpeta Datos_SIGU"
        ws.Range("A9").Value = "2. Coloque el archivo Excel manual en la carpeta Datos_Manual"
        ws.Range("A10").Value = "3. Ejecute las macros desde los botones del panel o el menú de macros"
        ws.Range("A11").Value = "4. Revise la hoja 'Cruce_Datos' para ver los cambios detectados"
        ws.Range("A12").Value = "5. Ejecute la sincronización para actualizar el archivo manual"
        ws.Range("A13").Value = "6. Ejecute el envío de correos para notificar pendientes"
        
        ws.Range("A15").Value = "RESUMEN:"
        ws.Range("A15").Font.Bold = True
        ws.Range("A16").Value = "Registros SIGU:"
        ws.Range("A17").Value = "Registros Manual:"
        ws.Range("A18").Value = "Nuevos Detectados:"
        ws.Range("A19").Value = "Cambios Detectados:"
        ws.Range("A20").Value = "Pendientes de Documentos:"
        ws.Range("A21").Value = "Correos por Enviar:"
        ws.Range("A22").Value = "Última Actualización:"
        
        ws.Columns("A:A").ColumnWidth = 30
        ws.Columns("B:B").ColumnWidth = 25
    End If
End Sub

Private Sub FormatearEncabezados(ws As Worksheet, rango As String, colorFondo As Long)
    With ws.Range(rango)
        .Font.Bold = True
        .Font.Color = RGB(255, 255, 255)
        .Interior.Color = colorFondo
        .HorizontalAlignment = xlCenter
        .WrapText = True
    End With
    ws.Rows(1).RowHeight = 30
    ws.Range(rango).EntireColumn.AutoFit
End Sub
