Attribute VB_Name = "ModUtilidades"
'==============================================================================
' MÓDULO: ModUtilidades
' DESCRIPCIÓN: Funciones utilitarias para el Automatizador de Matrícula
' PROYECTO: Automatizador_Matricula.xlsm
' VERSIÓN: 1.0
'==============================================================================
Option Explicit

' ============================================================
' FUNCIONES DE LIMPIEZA Y NORMALIZACIÓN
' ============================================================

Public Function LimpiarCedula(ByVal valor As String) As String
    ' Limpia una cédula: elimina espacios, guiones, puntos
    Dim resultado As String
    Dim i As Long
    
    valor = Trim(valor)
    resultado = ""
    
    For i = 1 To Len(valor)
        If IsNumeric(Mid(valor, i, 1)) Then
            resultado = resultado & Mid(valor, i, 1)
        End If
    Next i
    
    LimpiarCedula = resultado
End Function

Public Function NormalizarTexto(ByVal texto As String) As String
    ' Normaliza texto: trim, una sola capitalización, sin espacios dobles
    texto = Trim(texto)
    texto = Application.WorksheetFunction.Proper(texto)
    
    ' Eliminar espacios dobles
    Do While InStr(texto, "  ") > 0
        texto = Replace(texto, "  ", " ")
    Loop
    
    NormalizarTexto = texto
End Function

Public Function NormalizarCorreo(ByVal correo As String) As String
    ' Normaliza correo: trim, minúsculas
    NormalizarCorreo = LCase(Trim(correo))
End Function

Public Function LimpiarTelefono(ByVal telefono As String) As String
    ' Limpia teléfono: solo dígitos y guiones formativos
    Dim resultado As String
    Dim i As Long
    Dim c As String
    
    telefono = Trim(telefono)
    resultado = ""
    
    For i = 1 To Len(telefono)
        c = Mid(telefono, i, 1)
        If IsNumeric(c) Then
            resultado = resultado & c
        End If
    Next i
    
    ' Formatear 8 dígitos como XXXX-XXXX
    If Len(resultado) = 8 Then
        resultado = Left(resultado, 4) & "-" & Right(resultado, 4)
    End If
    
    LimpiarTelefono = resultado
End Function

' ============================================================
' FUNCIONES DE BÚSQUEDA
' ============================================================

Public Function BuscarFilaPorClave(ws As Worksheet, clave As String, columna As Long) As Long
    ' Busca una fila por valor de clave en una columna específica
    ' Retorna 0 si no se encuentra
    Dim ultimaFila As Long
    Dim i As Long
    Dim valorCelda As String
    
    ultimaFila = ObtenerUltimaFila(ws)
    clave = Trim(UCase(clave))
    
    For i = 2 To ultimaFila
        valorCelda = Trim(UCase(CStr(ws.Cells(i, columna).Value)))
        If valorCelda = clave Then
            BuscarFilaPorClave = i
            Exit Function
        End If
    Next i
    
    BuscarFilaPorClave = 0
End Function

Public Function BuscarFilaPorClaveDiccionario(ws As Worksheet, columna As Long) As Object
    ' Crea un diccionario clave->fila para búsquedas rápidas
    Dim dict As Object
    Dim ultimaFila As Long
    Dim i As Long
    Dim clave As String
    
    Set dict = CreateObject("Scripting.Dictionary")
    dict.CompareMode = vbTextCompare
    
    ultimaFila = ObtenerUltimaFila(ws)
    
    For i = 2 To ultimaFila
        clave = Trim(CStr(ws.Cells(i, columna).Value))
        If clave <> "" And Not dict.Exists(clave) Then
            dict.Add clave, i
        End If
    Next i
    
    Set BuscarFilaPorClaveDiccionario = dict
End Function

' ============================================================
' FUNCIONES DE ARCHIVO
' ============================================================

Public Function ObtenerUltimaFila(ws As Worksheet) As Long
    If Application.WorksheetFunction.CountA(ws.Cells) = 0 Then
        ObtenerUltimaFila = 1
    Else
        ObtenerUltimaFila = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    End If
End Function

Public Function ObtenerUltimaColumna(ws As Worksheet) As Long
    If Application.WorksheetFunction.CountA(ws.Cells) = 0 Then
        ObtenerUltimaColumna = 1
    Else
        ObtenerUltimaColumna = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
    End If
End Function

Public Function ArchivoExiste(rutaCompleta As String) As Boolean
    ArchivoExiste = (Dir(rutaCompleta) <> "")
End Function

Public Function CarpetaExiste(rutaCarpeta As String) As Boolean
    CarpetaExiste = (Dir(rutaCarpeta, vbDirectory) <> "")
End Function

Public Sub CrearCarpetaSiNoExiste(rutaCarpeta As String)
    If Not CarpetaExiste(rutaCarpeta) Then
        MkDir rutaCarpeta
    End If
End Sub

' ============================================================
' FUNCIONES DE LOG / HISTORIAL
' ============================================================

Public Sub RegistrarHistorial(accion As String, cedula As String, detalle As String, resultado As String)
    Dim ws As Worksheet
    Dim nuevaFila As Long
    
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(HOJA_HISTORIAL)
    On Error GoTo 0
    
    If ws Is Nothing Then Exit Sub
    
    nuevaFila = ObtenerUltimaFila(ws) + 1
    
    ws.Cells(nuevaFila, 1).Value = Now
    ws.Cells(nuevaFila, 1).NumberFormat = "dd/mm/yyyy hh:mm:ss"
    ws.Cells(nuevaFila, 2).Value = accion
    ws.Cells(nuevaFila, 3).Value = cedula
    ws.Cells(nuevaFila, 4).Value = detalle
    ws.Cells(nuevaFila, 5).Value = Environ("USERNAME")
    ws.Cells(nuevaFila, 6).Value = resultado
End Sub

Public Sub RegistrarLogCorreo(cedula As String, nombre As String, correoDestino As String, _
                               asunto As String, tipoCorreo As String, estadoEnvio As String, _
                               docsPendientes As String, observaciones As String)
    Dim ws As Worksheet
    Dim nuevaFila As Long
    
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(HOJA_LOG_CORREOS)
    On Error GoTo 0
    
    If ws Is Nothing Then Exit Sub
    
    nuevaFila = ObtenerUltimaFila(ws) + 1
    
    ws.Cells(nuevaFila, 1).Value = Now
    ws.Cells(nuevaFila, 1).NumberFormat = "dd/mm/yyyy hh:mm:ss"
    ws.Cells(nuevaFila, 2).Value = cedula
    ws.Cells(nuevaFila, 3).Value = nombre
    ws.Cells(nuevaFila, 4).Value = correoDestino
    ws.Cells(nuevaFila, 5).Value = asunto
    ws.Cells(nuevaFila, 6).Value = tipoCorreo
    ws.Cells(nuevaFila, 7).Value = estadoEnvio
    ws.Cells(nuevaFila, 8).Value = docsPendientes
    ws.Cells(nuevaFila, 9).Value = observaciones
End Sub

' ============================================================
' FUNCIONES DE DOCUMENTOS
' ============================================================

Public Function ObtenerDocumentosPendientes(documentosEntregados As String) As String
    ' Compara los documentos entregados contra los requeridos
    ' Retorna lista de documentos faltantes
    Dim requeridos() As String
    Dim entregados() As String
    Dim pendientes As String
    Dim i As Long
    Dim j As Long
    Dim encontrado As Boolean
    
    requeridos = Split(DOCUMENTOS_REQUERIDOS, ",")
    
    If Trim(documentosEntregados) = "" Then
        ObtenerDocumentosPendientes = DOCUMENTOS_REQUERIDOS
        Exit Function
    End If
    
    entregados = Split(documentosEntregados, ",")
    pendientes = ""
    
    For i = LBound(requeridos) To UBound(requeridos)
        encontrado = False
        For j = LBound(entregados) To UBound(entregados)
            If UCase(Trim(requeridos(i))) = UCase(Trim(entregados(j))) Then
                encontrado = True
                Exit For
            End If
        Next j
        
        If Not encontrado Then
            If pendientes <> "" Then pendientes = pendientes & ", "
            pendientes = pendientes & Trim(requeridos(i))
        End If
    Next i
    
    ObtenerDocumentosPendientes = pendientes
End Function

Public Function TieneDocumentosPendientes(documentosEntregados As String) As Boolean
    TieneDocumentosPendientes = (ObtenerDocumentosPendientes(documentosEntregados) <> "")
End Function

Public Function ContarDocumentosEntregados(documentosEntregados As String) As Long
    If Trim(documentosEntregados) = "" Then
        ContarDocumentosEntregados = 0
    Else
        Dim docs() As String
        docs = Split(documentosEntregados, ",")
        ContarDocumentosEntregados = UBound(docs) - LBound(docs) + 1
    End If
End Function

Public Function ContarDocumentosRequeridos() As Long
    Dim docs() As String
    docs = Split(DOCUMENTOS_REQUERIDOS, ",")
    ContarDocumentosRequeridos = UBound(docs) - LBound(docs) + 1
End Function

' ============================================================
' FUNCIONES DE VALIDACIÓN
' ============================================================

Public Function ValidarCorreo(correo As String) As Boolean
    ' Validación básica de formato de correo
    Dim patron As String
    correo = Trim(correo)
    
    If correo = "" Then
        ValidarCorreo = False
        Exit Function
    End If
    
    ' Verificación básica: contiene @ y al menos un punto después
    If InStr(correo, "@") > 1 And InStr(InStr(correo, "@"), correo, ".") > 0 Then
        ValidarCorreo = True
    Else
        ValidarCorreo = False
    End If
End Function

Public Function ValidarCedula(cedula As String) As Boolean
    ' Validación básica de cédula costarricense
    Dim limpia As String
    limpia = LimpiarCedula(cedula)
    
    ' Cédula nacional: 9 dígitos; DIMEX: 11-12 dígitos
    ValidarCedula = (Len(limpia) >= 9 And Len(limpia) <= 12 And IsNumeric(limpia))
End Function

' ============================================================
' FUNCIONES DE PRESENTACIÓN
' ============================================================

Public Function NombreCompleto(nombre As String, apellido1 As String, apellido2 As String) As String
    NombreCompleto = Trim(nombre) & " " & Trim(apellido1) & " " & Trim(apellido2)
    NombreCompleto = Trim(NombreCompleto)
End Function

Public Sub MostrarProgreso(mensaje As String, Optional porcentaje As Long = -1)
    If porcentaje >= 0 Then
        Application.StatusBar = mensaje & " (" & porcentaje & "%)"
    Else
        Application.StatusBar = mensaje
    End If
    DoEvents
End Sub

Public Sub LimpiarProgreso()
    Application.StatusBar = False
End Sub

' ============================================================
' FUNCIONES DE FORMATEO DE HOJAS
' ============================================================

Public Sub AplicarFormatoTabla(ws As Worksheet)
    Dim ultimaFila As Long
    Dim ultimaCol As Long
    Dim rng As Range
    
    ultimaFila = ObtenerUltimaFila(ws)
    ultimaCol = ObtenerUltimaColumna(ws)
    
    If ultimaFila < 2 Then Exit Sub
    
    Set rng = ws.Range(ws.Cells(1, 1), ws.Cells(ultimaFila, ultimaCol))
    
    ' Bordes
    With rng.Borders
        .LineStyle = xlContinuous
        .Weight = xlThin
        .Color = RGB(180, 180, 180)
    End With
    
    ' Autoajustar columnas
    rng.EntireColumn.AutoFit
    
    ' Alternar colores de filas
    Dim i As Long
    For i = 2 To ultimaFila
        If i Mod 2 = 0 Then
            ws.Range(ws.Cells(i, 1), ws.Cells(i, ultimaCol)).Interior.Color = RGB(240, 245, 250)
        Else
            ws.Range(ws.Cells(i, 1), ws.Cells(i, ultimaCol)).Interior.Color = RGB(255, 255, 255)
        End If
    Next i
End Sub

Public Sub LimpiarHoja(ws As Worksheet, Optional preservarEncabezados As Boolean = True)
    If preservarEncabezados Then
        Dim ultimaFila As Long
        ultimaFila = ObtenerUltimaFila(ws)
        If ultimaFila >= 2 Then
            ws.Rows("2:" & ultimaFila).Delete
        End If
    Else
        ws.Cells.Clear
    End If
End Sub

' ============================================================
' RESUMEN ESTADÍSTICO
' ============================================================

Public Function ContarPorTipoCambio(ws As Worksheet, tipoCambio As String) As Long
    Dim count As Long
    Dim ultimaFila As Long
    Dim i As Long
    
    count = 0
    ultimaFila = ObtenerUltimaFila(ws)
    
    For i = 2 To ultimaFila
        If UCase(Trim(CStr(ws.Cells(i, COL_CRUCE_TIPO_CAMBIO).Value))) = UCase(tipoCambio) Then
            count = count + 1
        End If
    Next i
    
    ContarPorTipoCambio = count
End Function
