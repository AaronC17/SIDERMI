Attribute VB_Name = "ModSincronizacion"
'==============================================================================
' MÓDULO: ModSincronizacion
' DESCRIPCIÓN: Motor de cruce de datos y sincronización entre SIGU y Manual
' PROYECTO: Automatizador_Matricula.xlsm
' VERSIÓN: 1.0
'==============================================================================
Option Explicit

Private Type RegistroEstudiante
    Cedula As String
    Carnet As String
    Nombre As String
    Apellido1 As String
    Apellido2 As String
    Correo As String
    Telefono As String
    Carrera As String
    Sede As String
    Estado As String
    Periodo As String
    FechaMatricula As String
    Documentos As String
    Observaciones As String
    FilaOrigen As Long
End Type

Private Type CambioDetectado
    Cedula As String
    Carnet As String
    NombreCompleto As String
    TipoCambio As String
    CampoAfectado As String
    ValorSIGU As String
    ValorManual As String
    FechaDeteccion As Date
End Type

' Contadores globales para reporte
Private gNuevos As Long
Private gCambiosEstado As Long
Private gCambiosSede As Long
Private gCambiosCarrera As Long
Private gInconsistentes As Long
Private gDocPendientes As Long
Private gDatosActualizados As Long
Private gTotalCambios As Long

' ============================================================
' PROCEDIMIENTO PRINCIPAL: IMPORTAR DATOS SIGU
' ============================================================

Public Sub ImportarDatosSIGU()
    Dim archivoSIGU As String
    Dim wbSIGU As Workbook
    Dim wsSIGU_origen As Worksheet
    Dim wsDestino As Worksheet
    Dim ultimaFila As Long
    Dim ultimaFilaOrigen As Long
    Dim i As Long
    
    On Error GoTo ErrorHandler
    
    MostrarProgreso "Buscando archivo SIGU más reciente..."
    
    archivoSIGU = ObtenerArchivoSIGUMasReciente()
    
    If archivoSIGU = "" Then
        MsgBox "No se encontró ningún archivo Excel en la carpeta SIGU." & vbCrLf & _
               "Ruta: " & ObtenerRutaSIGU(), vbExclamation, "Archivo no encontrado"
        GoTo Cleanup
    End If
    
    If MsgBox("Se importará el archivo:" & vbCrLf & archivoSIGU & vbCrLf & vbCrLf & _
              "¿Desea continuar?", vbYesNo + vbQuestion, "Confirmar Importación") = vbNo Then
        GoTo Cleanup
    End If
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    MostrarProgreso "Abriendo archivo SIGU...", 10
    
    Set wbSIGU = Workbooks.Open(archivoSIGU, ReadOnly:=True)
    Set wsSIGU_origen = wbSIGU.Sheets(1)
    Set wsDestino = ThisWorkbook.Sheets(HOJA_SIGU)
    
    ' Limpiar datos anteriores (preservar encabezados)
    LimpiarHoja wsDestino, True
    
    MostrarProgreso "Copiando datos SIGU...", 30
    
    ultimaFilaOrigen = wsSIGU_origen.Cells(wsSIGU_origen.Rows.Count, 1).End(xlUp).Row
    
    If ultimaFilaOrigen < 2 Then
        MsgBox "El archivo SIGU no contiene datos.", vbExclamation, "Sin datos"
        wbSIGU.Close SaveChanges:=False
        GoTo Cleanup
    End If
    
    ' Copiar datos normalizados
    Dim filaDest As Long
    filaDest = 2
    
    For i = 2 To ultimaFilaOrigen
        MostrarProgreso "Importando registro " & (i - 1) & " de " & (ultimaFilaOrigen - 1) & "...", _
                        CLng(30 + (60 * (i - 1) / (ultimaFilaOrigen - 1)))
        
        ' Normalizar y copiar cada campo
        wsDestino.Cells(filaDest, COL_SIGU_CEDULA).Value = LimpiarCedula(CStr(wsSIGU_origen.Cells(i, COL_SIGU_CEDULA).Value))
        wsDestino.Cells(filaDest, COL_SIGU_CARNET).Value = Trim(CStr(wsSIGU_origen.Cells(i, COL_SIGU_CARNET).Value))
        wsDestino.Cells(filaDest, COL_SIGU_NOMBRE).Value = NormalizarTexto(CStr(wsSIGU_origen.Cells(i, COL_SIGU_NOMBRE).Value))
        wsDestino.Cells(filaDest, COL_SIGU_APELLIDO1).Value = NormalizarTexto(CStr(wsSIGU_origen.Cells(i, COL_SIGU_APELLIDO1).Value))
        wsDestino.Cells(filaDest, COL_SIGU_APELLIDO2).Value = NormalizarTexto(CStr(wsSIGU_origen.Cells(i, COL_SIGU_APELLIDO2).Value))
        wsDestino.Cells(filaDest, COL_SIGU_CORREO).Value = NormalizarCorreo(CStr(wsSIGU_origen.Cells(i, COL_SIGU_CORREO).Value))
        wsDestino.Cells(filaDest, COL_SIGU_TELEFONO).Value = LimpiarTelefono(CStr(wsSIGU_origen.Cells(i, COL_SIGU_TELEFONO).Value))
        wsDestino.Cells(filaDest, COL_SIGU_CARRERA).Value = Trim(CStr(wsSIGU_origen.Cells(i, COL_SIGU_CARRERA).Value))
        wsDestino.Cells(filaDest, COL_SIGU_SEDE).Value = Trim(CStr(wsSIGU_origen.Cells(i, COL_SIGU_SEDE).Value))
        wsDestino.Cells(filaDest, COL_SIGU_ESTADO).Value = Trim(CStr(wsSIGU_origen.Cells(i, COL_SIGU_ESTADO).Value))
        wsDestino.Cells(filaDest, COL_SIGU_PERIODO).Value = Trim(CStr(wsSIGU_origen.Cells(i, COL_SIGU_PERIODO).Value))
        wsDestino.Cells(filaDest, COL_SIGU_FECHA_MATRICULA).Value = wsSIGU_origen.Cells(i, COL_SIGU_FECHA_MATRICULA).Value
        wsDestino.Cells(filaDest, COL_SIGU_DOCUMENTOS).Value = Trim(CStr(wsSIGU_origen.Cells(i, COL_SIGU_DOCUMENTOS).Value))
        wsDestino.Cells(filaDest, COL_SIGU_OBSERVACIONES).Value = Trim(CStr(wsSIGU_origen.Cells(i, COL_SIGU_OBSERVACIONES).Value))
        
        filaDest = filaDest + 1
    Next i
    
    MostrarProgreso "Cerrando archivo SIGU...", 95
    wbSIGU.Close SaveChanges:=False
    
    ' Aplicar formato
    AplicarFormatoTabla wsDestino
    
    ' Actualizar panel
    ActualizarContadorPanel "Registros SIGU:", ultimaFilaOrigen - 1
    
    ' Registrar en historial
    RegistrarHistorial "IMPORTAR_SIGU", "", _
        "Importados " & (ultimaFilaOrigen - 1) & " registros desde " & archivoSIGU, "ÉXITO"
    
    MostrarProgreso "Importación completada.", 100
    
    MsgBox "Importación exitosa." & vbCrLf & _
           "Registros importados: " & (ultimaFilaOrigen - 1) & vbCrLf & _
           "Archivo: " & archivoSIGU, vbInformation, "Importación SIGU"

Cleanup:
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    LimpiarProgreso
    Exit Sub

ErrorHandler:
    MsgBox "Error al importar datos SIGU: " & Err.Description, vbCritical, "Error"
    RegistrarHistorial "IMPORTAR_SIGU", "", "Error: " & Err.Description, "ERROR"
    Resume Cleanup
End Sub

' ============================================================
' PROCEDIMIENTO PRINCIPAL: IMPORTAR DATOS MANUAL
' ============================================================

Public Sub ImportarDatosManual()
    Dim archivoManual As String
    Dim wbManual As Workbook
    Dim wsManual_origen As Worksheet
    Dim wsDestino As Worksheet
    Dim ultimaFilaOrigen As Long
    Dim i As Long
    
    On Error GoTo ErrorHandler
    
    MostrarProgreso "Buscando archivo manual..."
    
    archivoManual = ObtenerArchivoManual()
    
    If archivoManual = "" Then
        MsgBox "No se encontró el archivo Excel manual en la carpeta." & vbCrLf & _
               "Ruta: " & ObtenerRutaManual(), vbExclamation, "Archivo no encontrado"
        GoTo Cleanup
    End If
    
    If MsgBox("Se importará el archivo manual:" & vbCrLf & archivoManual & vbCrLf & vbCrLf & _
              "¿Desea continuar?", vbYesNo + vbQuestion, "Confirmar Importación") = vbNo Then
        GoTo Cleanup
    End If
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    MostrarProgreso "Abriendo archivo manual...", 10
    
    Set wbManual = Workbooks.Open(archivoManual, ReadOnly:=True)
    Set wsManual_origen = wbManual.Sheets(1)
    Set wsDestino = ThisWorkbook.Sheets(HOJA_MANUAL)
    
    LimpiarHoja wsDestino, True
    
    ultimaFilaOrigen = wsManual_origen.Cells(wsManual_origen.Rows.Count, 1).End(xlUp).Row
    
    If ultimaFilaOrigen < 2 Then
        MsgBox "El archivo manual no contiene datos.", vbExclamation, "Sin datos"
        wbManual.Close SaveChanges:=False
        GoTo Cleanup
    End If
    
    MostrarProgreso "Copiando datos del archivo manual...", 30
    
    ' Copiar todo el rango de datos
    Dim ultimaCol As Long
    ultimaCol = wsManual_origen.Cells(1, wsManual_origen.Columns.Count).End(xlToLeft).Column
    
    wsManual_origen.Range(wsManual_origen.Cells(2, 1), wsManual_origen.Cells(ultimaFilaOrigen, ultimaCol)).Copy
    wsDestino.Cells(2, 1).PasteSpecial xlPasteValues
    Application.CutCopyMode = False
    
    MostrarProgreso "Cerrando archivo manual...", 90
    wbManual.Close SaveChanges:=False
    
    AplicarFormatoTabla wsDestino
    
    ActualizarContadorPanel "Registros Manual:", ultimaFilaOrigen - 1
    
    RegistrarHistorial "IMPORTAR_MANUAL", "", _
        "Importados " & (ultimaFilaOrigen - 1) & " registros desde " & archivoManual, "ÉXITO"
    
    MsgBox "Importación del archivo manual exitosa." & vbCrLf & _
           "Registros: " & (ultimaFilaOrigen - 1), vbInformation, "Importación Manual"

Cleanup:
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    LimpiarProgreso
    Exit Sub

ErrorHandler:
    MsgBox "Error al importar archivo manual: " & Err.Description, vbCritical, "Error"
    RegistrarHistorial "IMPORTAR_MANUAL", "", "Error: " & Err.Description, "ERROR"
    Resume Cleanup
End Sub

' ============================================================
' PROCEDIMIENTO PRINCIPAL: CRUCE DE DATOS
' ============================================================

Public Sub EjecutarCruceDeDatos()
    Dim wsSIGU As Worksheet
    Dim wsManual As Worksheet
    Dim wsCruce As Worksheet
    Dim wsPendientes As Worksheet
    Dim dictManual As Object
    Dim dictSIGU As Object
    Dim colClave As Long
    Dim ultimaFilaSIGU As Long
    Dim ultimaFilaManual As Long
    Dim i As Long
    Dim filaCruce As Long
    Dim filaPend As Long
    Dim clave As String
    Dim filaManual As Long
    
    On Error GoTo ErrorHandler
    
    ' Validar que hay datos
    Set wsSIGU = ThisWorkbook.Sheets(HOJA_SIGU)
    Set wsManual = ThisWorkbook.Sheets(HOJA_MANUAL)
    Set wsCruce = ThisWorkbook.Sheets(HOJA_CRUCE)
    Set wsPendientes = ThisWorkbook.Sheets(HOJA_PENDIENTES)
    
    ultimaFilaSIGU = ObtenerUltimaFila(wsSIGU)
    ultimaFilaManual = ObtenerUltimaFila(wsManual)
    
    If ultimaFilaSIGU < 2 Then
        MsgBox "No hay datos SIGU importados. Ejecute primero la importación.", vbExclamation, "Sin datos SIGU"
        Exit Sub
    End If
    
    If ultimaFilaManual < 2 Then
        MsgBox "No hay datos del archivo manual importados. Ejecute primero la importación.", vbExclamation, "Sin datos Manual"
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    ' Inicializar contadores
    gNuevos = 0
    gCambiosEstado = 0
    gCambiosSede = 0
    gCambiosCarrera = 0
    gInconsistentes = 0
    gDocPendientes = 0
    gDatosActualizados = 0
    gTotalCambios = 0
    
    ' Limpiar hojas de resultados
    LimpiarHoja wsCruce, True
    LimpiarHoja wsPendientes, True
    
    ' Determinar columna de clave primaria
    If ObtenerClavePrimaria() = "CARNET" Then
        colClave = COL_SIGU_CARNET
    Else
        colClave = COL_SIGU_CEDULA
    End If
    
    MostrarProgreso "Construyendo índice del archivo manual...", 10
    
    ' Crear diccionario del archivo manual para búsqueda rápida
    Set dictManual = BuscarFilaPorClaveDiccionario(wsManual, colClave)
    
    MostrarProgreso "Iniciando cruce de datos...", 20
    
    filaCruce = 2
    filaPend = 2
    
    ' -------------------------------------------------------
    ' PASO 1: Recorrer cada registro SIGU y comparar con Manual
    ' -------------------------------------------------------
    For i = 2 To ultimaFilaSIGU
        MostrarProgreso "Cruzando registro " & (i - 1) & " de " & (ultimaFilaSIGU - 1) & "...", _
                        CLng(20 + (60 * (i - 1) / (ultimaFilaSIGU - 1)))
        
        clave = Trim(CStr(wsSIGU.Cells(i, colClave).Value))
        
        If clave = "" Then GoTo SiguienteRegistro
        
        If dictManual.Exists(clave) Then
            ' El estudiante existe en ambos archivos -> comparar campos
            filaManual = dictManual(clave)
            
            ' Comparar Estado
            If UCase(Trim(CStr(wsSIGU.Cells(i, COL_SIGU_ESTADO).Value))) <> _
               UCase(Trim(CStr(wsManual.Cells(filaManual, COL_MAN_ESTADO).Value))) Then
                
                RegistrarCambioCruce wsCruce, filaCruce, wsSIGU, i, TIPO_CAMBIO_ESTADO, "Estado", _
                    CStr(wsSIGU.Cells(i, COL_SIGU_ESTADO).Value), _
                    CStr(wsManual.Cells(filaManual, COL_MAN_ESTADO).Value)
                filaCruce = filaCruce + 1
                gCambiosEstado = gCambiosEstado + 1
            End If
            
            ' Comparar Sede
            If UCase(Trim(CStr(wsSIGU.Cells(i, COL_SIGU_SEDE).Value))) <> _
               UCase(Trim(CStr(wsManual.Cells(filaManual, COL_MAN_SEDE).Value))) Then
                
                RegistrarCambioCruce wsCruce, filaCruce, wsSIGU, i, TIPO_CAMBIO_SEDE, "Sede", _
                    CStr(wsSIGU.Cells(i, COL_SIGU_SEDE).Value), _
                    CStr(wsManual.Cells(filaManual, COL_MAN_SEDE).Value)
                filaCruce = filaCruce + 1
                gCambiosSede = gCambiosSede + 1
            End If
            
            ' Comparar Carrera
            If UCase(Trim(CStr(wsSIGU.Cells(i, COL_SIGU_CARRERA).Value))) <> _
               UCase(Trim(CStr(wsManual.Cells(filaManual, COL_MAN_CARRERA).Value))) Then
                
                RegistrarCambioCruce wsCruce, filaCruce, wsSIGU, i, TIPO_CAMBIO_CARRERA, "Carrera", _
                    CStr(wsSIGU.Cells(i, COL_SIGU_CARRERA).Value), _
                    CStr(wsManual.Cells(filaManual, COL_MAN_CARRERA).Value)
                filaCruce = filaCruce + 1
                gCambiosCarrera = gCambiosCarrera + 1
            End If
            
            ' Comparar Correo
            If NormalizarCorreo(CStr(wsSIGU.Cells(i, COL_SIGU_CORREO).Value)) <> _
               NormalizarCorreo(CStr(wsManual.Cells(filaManual, COL_MAN_CORREO).Value)) Then
                
                RegistrarCambioCruce wsCruce, filaCruce, wsSIGU, i, TIPO_DATO_ACTUALIZADO, "Correo", _
                    CStr(wsSIGU.Cells(i, COL_SIGU_CORREO).Value), _
                    CStr(wsManual.Cells(filaManual, COL_MAN_CORREO).Value)
                filaCruce = filaCruce + 1
                gDatosActualizados = gDatosActualizados + 1
            End If
            
            ' Comparar Teléfono
            If LimpiarTelefono(CStr(wsSIGU.Cells(i, COL_SIGU_TELEFONO).Value)) <> _
               LimpiarTelefono(CStr(wsManual.Cells(filaManual, COL_MAN_TELEFONO).Value)) Then
                
                RegistrarCambioCruce wsCruce, filaCruce, wsSIGU, i, TIPO_DATO_ACTUALIZADO, "Teléfono", _
                    CStr(wsSIGU.Cells(i, COL_SIGU_TELEFONO).Value), _
                    CStr(wsManual.Cells(filaManual, COL_MAN_TELEFONO).Value)
                filaCruce = filaCruce + 1
                gDatosActualizados = gDatosActualizados + 1
            End If
            
            ' Verificar inconsistencias de nombre
            If UCase(Trim(CStr(wsSIGU.Cells(i, COL_SIGU_NOMBRE).Value))) <> _
               UCase(Trim(CStr(wsManual.Cells(filaManual, COL_MAN_NOMBRE).Value))) Then
                
                RegistrarCambioCruce wsCruce, filaCruce, wsSIGU, i, TIPO_INCONSISTENTE, "Nombre", _
                    CStr(wsSIGU.Cells(i, COL_SIGU_NOMBRE).Value), _
                    CStr(wsManual.Cells(filaManual, COL_MAN_NOMBRE).Value)
                filaCruce = filaCruce + 1
                gInconsistentes = gInconsistentes + 1
            End If
            
        Else
            ' Estudiante nuevo: no existe en el archivo manual
            RegistrarCambioCruce wsCruce, filaCruce, wsSIGU, i, TIPO_NUEVO, "Registro Completo", _
                "Nuevo en SIGU", "No existe"
            filaCruce = filaCruce + 1
            gNuevos = gNuevos + 1
        End If
        
        ' Verificar documentos pendientes
        Dim docsPendientes As String
        docsPendientes = ObtenerDocumentosPendientes(CStr(wsSIGU.Cells(i, COL_SIGU_DOCUMENTOS).Value))
        
        If docsPendientes <> "" Then
            ' Registrar en hoja de pendientes
            RegistrarPendiente wsPendientes, filaPend, wsSIGU, i, docsPendientes
            filaPend = filaPend + 1
            
            ' También registrar en cruce
            RegistrarCambioCruce wsCruce, filaCruce, wsSIGU, i, TIPO_DOC_PENDIENTE, _
                "Documentos", docsPendientes, CStr(wsSIGU.Cells(i, COL_SIGU_DOCUMENTOS).Value)
            filaCruce = filaCruce + 1
            gDocPendientes = gDocPendientes + 1
        End If
        
SiguienteRegistro:
    Next i
    
    ' -------------------------------------------------------
    ' PASO 2: Buscar registros en Manual que no existen en SIGU (posibles retiros)
    ' -------------------------------------------------------
    MostrarProgreso "Verificando registros del archivo manual...", 85
    
    Set dictSIGU = BuscarFilaPorClaveDiccionario(wsSIGU, colClave)
    
    For i = 2 To ultimaFilaManual
        clave = Trim(CStr(wsManual.Cells(i, colClave).Value))
        
        If clave <> "" And Not dictSIGU.Exists(clave) Then
            ' Existe en manual pero no en SIGU -> posible inconsistencia
            wsCruce.Cells(filaCruce, COL_CRUCE_CEDULA).Value = wsManual.Cells(i, COL_MAN_CEDULA).Value
            wsCruce.Cells(filaCruce, COL_CRUCE_CARNET).Value = wsManual.Cells(i, COL_MAN_CARNET).Value
            wsCruce.Cells(filaCruce, COL_CRUCE_NOMBRE).Value = NombreCompleto( _
                CStr(wsManual.Cells(i, COL_MAN_NOMBRE).Value), _
                CStr(wsManual.Cells(i, COL_MAN_APELLIDO1).Value), _
                CStr(wsManual.Cells(i, COL_MAN_APELLIDO2).Value))
            wsCruce.Cells(filaCruce, COL_CRUCE_TIPO_CAMBIO).Value = TIPO_INCONSISTENTE
            wsCruce.Cells(filaCruce, COL_CRUCE_CAMPO).Value = "Registro Completo"
            wsCruce.Cells(filaCruce, COL_CRUCE_VALOR_SIGU).Value = "No existe en SIGU"
            wsCruce.Cells(filaCruce, COL_CRUCE_VALOR_MANUAL).Value = "Existe solo en Manual"
            wsCruce.Cells(filaCruce, COL_CRUCE_FECHA).Value = Now
            wsCruce.Cells(filaCruce, COL_CRUCE_APLICADO).Value = "NO"
            filaCruce = filaCruce + 1
            gInconsistentes = gInconsistentes + 1
        End If
    Next i
    
    ' Aplicar formato y colores por tipo
    AplicarFormatoCruce wsCruce
    AplicarFormatoTabla wsPendientes
    
    gTotalCambios = gNuevos + gCambiosEstado + gCambiosSede + gCambiosCarrera + _
                    gInconsistentes + gDocPendientes + gDatosActualizados
    
    ' Actualizar panel
    ActualizarContadorPanel "Nuevos Detectados:", gNuevos
    ActualizarContadorPanel "Cambios Detectados:", gCambiosEstado + gCambiosSede + gCambiosCarrera + gDatosActualizados
    ActualizarContadorPanel "Pendientes de Documentos:", gDocPendientes
    
    ' Actualizar configuración
    Dim wsConfig As Worksheet
    Set wsConfig = ThisWorkbook.Sheets(HOJA_CONFIG)
    wsConfig.Range("B11").Value = Now
    wsConfig.Range("B13").Value = ultimaFilaSIGU - 1
    wsConfig.Range("B14").Value = ultimaFilaManual - 1
    
    RegistrarHistorial "CRUCE_DATOS", "", _
        "Nuevos: " & gNuevos & " | Cambios Estado: " & gCambiosEstado & _
        " | Cambios Sede: " & gCambiosSede & " | Cambios Carrera: " & gCambiosCarrera & _
        " | Inconsistentes: " & gInconsistentes & " | Docs Pendientes: " & gDocPendientes & _
        " | Datos Actualizados: " & gDatosActualizados, "ÉXITO"
    
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    LimpiarProgreso
    
    ' Mostrar resumen
    MsgBox "CRUCE DE DATOS COMPLETADO" & vbCrLf & vbCrLf & _
           "Estudiantes nuevos: " & gNuevos & vbCrLf & _
           "Cambios de estado: " & gCambiosEstado & vbCrLf & _
           "Cambios de sede: " & gCambiosSede & vbCrLf & _
           "Cambios de carrera: " & gCambiosCarrera & vbCrLf & _
           "Datos actualizados: " & gDatosActualizados & vbCrLf & _
           "Registros inconsistentes: " & gInconsistentes & vbCrLf & _
           "Con documentos pendientes: " & gDocPendientes & vbCrLf & _
           vbCrLf & "Total cambios detectados: " & gTotalCambios, _
           vbInformation, "Resultado del Cruce"
    
    Exit Sub

ErrorHandler:
    MsgBox "Error en el cruce de datos: " & Err.Description, vbCritical, "Error"
    RegistrarHistorial "CRUCE_DATOS", "", "Error: " & Err.Description, "ERROR"
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    LimpiarProgreso
End Sub

' ============================================================
' PROCEDIMIENTO PRINCIPAL: SINCRONIZAR ARCHIVO MANUAL
' ============================================================

Public Sub SincronizarArchivoManual()
    Dim wsSIGU As Worksheet
    Dim wsManual As Worksheet
    Dim wsCruce As Worksheet
    Dim dictManual As Object
    Dim colClave As Long
    Dim ultimaFilaSIGU As Long
    Dim ultimaFilaManual As Long
    Dim i As Long
    Dim clave As String
    Dim filaManual As Long
    Dim registrosSincronizados As Long
    Dim registrosInsertados As Long
    
    On Error GoTo ErrorHandler
    
    Set wsSIGU = ThisWorkbook.Sheets(HOJA_SIGU)
    Set wsManual = ThisWorkbook.Sheets(HOJA_MANUAL)
    Set wsCruce = ThisWorkbook.Sheets(HOJA_CRUCE)
    
    ultimaFilaSIGU = ObtenerUltimaFila(wsSIGU)
    
    If ultimaFilaSIGU < 2 Then
        MsgBox "No hay datos SIGU para sincronizar.", vbExclamation, "Sin datos"
        Exit Sub
    End If
    
    If MsgBox("Esta acción actualizará los datos del archivo manual con los datos de SIGU." & vbCrLf & _
              "Los cambios detectados en el cruce serán aplicados." & vbCrLf & vbCrLf & _
              "¿Desea continuar?", vbYesNo + vbQuestion, "Confirmar Sincronización") = vbNo Then
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    
    If ObtenerClavePrimaria() = "CARNET" Then
        colClave = COL_MAN_CARNET
    Else
        colClave = COL_MAN_CEDULA
    End If
    
    Set dictManual = BuscarFilaPorClaveDiccionario(wsManual, colClave)
    
    registrosSincronizados = 0
    registrosInsertados = 0
    
    For i = 2 To ultimaFilaSIGU
        MostrarProgreso "Sincronizando registro " & (i - 1) & " de " & (ultimaFilaSIGU - 1) & "...", _
                        CLng(100 * (i - 1) / (ultimaFilaSIGU - 1))
        
        If ObtenerClavePrimaria() = "CARNET" Then
            clave = Trim(CStr(wsSIGU.Cells(i, COL_SIGU_CARNET).Value))
        Else
            clave = Trim(CStr(wsSIGU.Cells(i, COL_SIGU_CEDULA).Value))
        End If
        
        If clave = "" Then GoTo SiguienteSync
        
        If dictManual.Exists(clave) Then
            ' Actualizar registro existente
            filaManual = dictManual(clave)
            ActualizarRegistroManual wsManual, filaManual, wsSIGU, i
            registrosSincronizados = registrosSincronizados + 1
        Else
            ' Insertar nuevo registro
            ultimaFilaManual = ObtenerUltimaFila(wsManual) + 1
            InsertarRegistroManual wsManual, ultimaFilaManual, wsSIGU, i
            dictManual.Add clave, ultimaFilaManual
            registrosInsertados = registrosInsertados + 1
        End If
        
SiguienteSync:
    Next i
    
    ' Marcar los cambios como aplicados en la hoja de cruce
    Dim ultimaFilaCruce As Long
    ultimaFilaCruce = ObtenerUltimaFila(wsCruce)
    For i = 2 To ultimaFilaCruce
        wsCruce.Cells(i, COL_CRUCE_APLICADO).Value = "SÍ"
    Next i
    
    AplicarFormatoTabla wsManual
    
    ' Registrar historial
    RegistrarHistorial "SINCRONIZAR", "", _
        "Actualizados: " & registrosSincronizados & " | Insertados: " & registrosInsertados, "ÉXITO"
    
    ' Actualizar panel
    ActualizarContadorPanel "Última Actualización:", Format(Now, "dd/mm/yyyy hh:mm")
    ActualizarContadorPanel "Registros Manual:", ObtenerUltimaFila(wsManual) - 1
    
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    LimpiarProgreso
    
    MsgBox "SINCRONIZACIÓN COMPLETADA" & vbCrLf & vbCrLf & _
           "Registros actualizados: " & registrosSincronizados & vbCrLf & _
           "Registros nuevos insertados: " & registrosInsertados, _
           vbInformation, "Sincronización"
    
    Exit Sub

ErrorHandler:
    MsgBox "Error en la sincronización: " & Err.Description, vbCritical, "Error"
    RegistrarHistorial "SINCRONIZAR", "", "Error: " & Err.Description, "ERROR"
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    LimpiarProgreso
End Sub

' ============================================================
' EXPORTAR ARCHIVO MANUAL SINCRONIZADO
' ============================================================

Public Sub ExportarArchivoManualSincronizado()
    Dim wsManual As Worksheet
    Dim wbExport As Workbook
    Dim wsExport As Worksheet
    Dim ultimaFila As Long
    Dim ultimaCol As Long
    Dim rutaSalida As String
    Dim nombreArchivo As String
    
    On Error GoTo ErrorHandler
    
    Set wsManual = ThisWorkbook.Sheets(HOJA_MANUAL)
    ultimaFila = ObtenerUltimaFila(wsManual)
    
    If ultimaFila < 2 Then
        MsgBox "No hay datos para exportar.", vbExclamation, "Sin datos"
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    
    nombreArchivo = "Manual_Sincronizado_" & Format(Now, "yyyymmdd_HHmmss") & ".xlsx"
    rutaSalida = ObtenerRutaManual() & nombreArchivo
    
    Set wbExport = Workbooks.Add
    Set wsExport = wbExport.Sheets(1)
    wsExport.Name = "Datos"
    
    ultimaCol = ObtenerUltimaColumna(wsManual)
    
    wsManual.Range(wsManual.Cells(1, 1), wsManual.Cells(ultimaFila, ultimaCol)).Copy
    wsExport.Cells(1, 1).PasteSpecial xlPasteAll
    Application.CutCopyMode = False
    
    wsExport.Cells.EntireColumn.AutoFit
    
    wbExport.SaveAs rutaSalida, xlOpenXMLWorkbook
    wbExport.Close SaveChanges:=False
    
    RegistrarHistorial "EXPORTAR_MANUAL", "", "Exportado a: " & rutaSalida, "ÉXITO"
    
    Application.ScreenUpdating = True
    
    MsgBox "Archivo manual exportado exitosamente." & vbCrLf & _
           "Ubicación: " & rutaSalida, vbInformation, "Exportación"
    
    Exit Sub

ErrorHandler:
    MsgBox "Error al exportar: " & Err.Description, vbCritical, "Error"
    Application.ScreenUpdating = True
End Sub

' ============================================================
' PROCEDIMIENTOS AUXILIARES
' ============================================================

Private Sub RegistrarCambioCruce(wsCruce As Worksheet, fila As Long, wsSIGU As Worksheet, _
                                  filaSIGU As Long, tipoCambio As String, campo As String, _
                                  valorSIGU As String, valorManual As String)
    
    wsCruce.Cells(fila, COL_CRUCE_CEDULA).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CEDULA).Value
    wsCruce.Cells(fila, COL_CRUCE_CARNET).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CARNET).Value
    wsCruce.Cells(fila, COL_CRUCE_NOMBRE).Value = NombreCompleto( _
        CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_NOMBRE).Value), _
        CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO1).Value), _
        CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO2).Value))
    wsCruce.Cells(fila, COL_CRUCE_TIPO_CAMBIO).Value = tipoCambio
    wsCruce.Cells(fila, COL_CRUCE_CAMPO).Value = campo
    wsCruce.Cells(fila, COL_CRUCE_VALOR_SIGU).Value = valorSIGU
    wsCruce.Cells(fila, COL_CRUCE_VALOR_MANUAL).Value = valorManual
    wsCruce.Cells(fila, COL_CRUCE_FECHA).Value = Now
    wsCruce.Cells(fila, COL_CRUCE_FECHA).NumberFormat = "dd/mm/yyyy hh:mm"
    wsCruce.Cells(fila, COL_CRUCE_APLICADO).Value = "NO"
End Sub

Private Sub RegistrarPendiente(wsPend As Worksheet, fila As Long, wsSIGU As Worksheet, _
                                filaSIGU As Long, docsPendientes As String)
    
    wsPend.Cells(fila, 1).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CEDULA).Value
    wsPend.Cells(fila, 2).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CARNET).Value
    wsPend.Cells(fila, 3).Value = NombreCompleto( _
        CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_NOMBRE).Value), _
        CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO1).Value), _
        CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO2).Value))
    wsPend.Cells(fila, 4).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CORREO).Value
    wsPend.Cells(fila, 5).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_SEDE).Value
    wsPend.Cells(fila, 6).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CARRERA).Value
    wsPend.Cells(fila, 7).Value = docsPendientes
    wsPend.Cells(fila, 8).Value = ""  ' Último recordatorio
    wsPend.Cells(fila, 9).Value = 0   ' Cantidad recordatorios
    wsPend.Cells(fila, 10).Value = "PENDIENTE"
End Sub

Private Sub ActualizarRegistroManual(wsManual As Worksheet, filaManual As Long, _
                                      wsSIGU As Worksheet, filaSIGU As Long)
    
    wsManual.Cells(filaManual, COL_MAN_NOMBRE).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_NOMBRE).Value
    wsManual.Cells(filaManual, COL_MAN_APELLIDO1).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO1).Value
    wsManual.Cells(filaManual, COL_MAN_APELLIDO2).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO2).Value
    wsManual.Cells(filaManual, COL_MAN_CORREO).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CORREO).Value
    wsManual.Cells(filaManual, COL_MAN_TELEFONO).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_TELEFONO).Value
    wsManual.Cells(filaManual, COL_MAN_CARRERA).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CARRERA).Value
    wsManual.Cells(filaManual, COL_MAN_SEDE).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_SEDE).Value
    wsManual.Cells(filaManual, COL_MAN_ESTADO).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_ESTADO).Value
    wsManual.Cells(filaManual, COL_MAN_PERIODO).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_PERIODO).Value
    wsManual.Cells(filaManual, COL_MAN_FECHA_MATRICULA).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_FECHA_MATRICULA).Value
    wsManual.Cells(filaManual, COL_MAN_DOCUMENTOS).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_DOCUMENTOS).Value
    wsManual.Cells(filaManual, COL_MAN_OBSERVACIONES).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_OBSERVACIONES).Value
    wsManual.Cells(filaManual, COL_MAN_ULTIMA_SYNC).Value = Now
    wsManual.Cells(filaManual, COL_MAN_ULTIMA_SYNC).NumberFormat = "dd/mm/yyyy hh:mm"
End Sub

Private Sub InsertarRegistroManual(wsManual As Worksheet, filaManual As Long, _
                                    wsSIGU As Worksheet, filaSIGU As Long)
    
    wsManual.Cells(filaManual, COL_MAN_CEDULA).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CEDULA).Value
    wsManual.Cells(filaManual, COL_MAN_CARNET).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CARNET).Value
    wsManual.Cells(filaManual, COL_MAN_NOMBRE).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_NOMBRE).Value
    wsManual.Cells(filaManual, COL_MAN_APELLIDO1).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO1).Value
    wsManual.Cells(filaManual, COL_MAN_APELLIDO2).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO2).Value
    wsManual.Cells(filaManual, COL_MAN_CORREO).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CORREO).Value
    wsManual.Cells(filaManual, COL_MAN_TELEFONO).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_TELEFONO).Value
    wsManual.Cells(filaManual, COL_MAN_CARRERA).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_CARRERA).Value
    wsManual.Cells(filaManual, COL_MAN_SEDE).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_SEDE).Value
    wsManual.Cells(filaManual, COL_MAN_ESTADO).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_ESTADO).Value
    wsManual.Cells(filaManual, COL_MAN_PERIODO).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_PERIODO).Value
    wsManual.Cells(filaManual, COL_MAN_FECHA_MATRICULA).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_FECHA_MATRICULA).Value
    wsManual.Cells(filaManual, COL_MAN_DOCUMENTOS).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_DOCUMENTOS).Value
    wsManual.Cells(filaManual, COL_MAN_OBSERVACIONES).Value = wsSIGU.Cells(filaSIGU, COL_SIGU_OBSERVACIONES).Value
    wsManual.Cells(filaManual, COL_MAN_ULTIMA_SYNC).Value = Now
    wsManual.Cells(filaManual, COL_MAN_ULTIMA_SYNC).NumberFormat = "dd/mm/yyyy hh:mm"
    wsManual.Cells(filaManual, COL_MAN_CORREO_ENVIADO).Value = "NO"
    wsManual.Cells(filaManual, COL_MAN_FECHA_CORREO).Value = ""
End Sub

Private Sub AplicarFormatoCruce(wsCruce As Worksheet)
    Dim ultimaFila As Long
    Dim i As Long
    Dim tipoCambio As String
    
    ultimaFila = ObtenerUltimaFila(wsCruce)
    
    For i = 2 To ultimaFila
        tipoCambio = UCase(Trim(CStr(wsCruce.Cells(i, COL_CRUCE_TIPO_CAMBIO).Value)))
        
        Select Case tipoCambio
            Case UCase(TIPO_NUEVO)
                wsCruce.Range(wsCruce.Cells(i, 1), wsCruce.Cells(i, 9)).Interior.Color = RGB(198, 239, 206) ' Verde claro
            Case UCase(TIPO_CAMBIO_ESTADO)
                wsCruce.Range(wsCruce.Cells(i, 1), wsCruce.Cells(i, 9)).Interior.Color = RGB(255, 235, 156) ' Amarillo
            Case UCase(TIPO_CAMBIO_SEDE), UCase(TIPO_CAMBIO_CARRERA)
                wsCruce.Range(wsCruce.Cells(i, 1), wsCruce.Cells(i, 9)).Interior.Color = RGB(189, 215, 238) ' Azul claro
            Case UCase(TIPO_INCONSISTENTE)
                wsCruce.Range(wsCruce.Cells(i, 1), wsCruce.Cells(i, 9)).Interior.Color = RGB(255, 199, 206) ' Rojo claro
            Case UCase(TIPO_DOC_PENDIENTE)
                wsCruce.Range(wsCruce.Cells(i, 1), wsCruce.Cells(i, 9)).Interior.Color = RGB(255, 220, 180) ' Naranja claro
            Case UCase(TIPO_DATO_ACTUALIZADO)
                wsCruce.Range(wsCruce.Cells(i, 1), wsCruce.Cells(i, 9)).Interior.Color = RGB(230, 230, 250) ' Lavanda
        End Select
    Next i
    
    ' Bordes
    If ultimaFila >= 2 Then
        With wsCruce.Range(wsCruce.Cells(1, 1), wsCruce.Cells(ultimaFila, 9)).Borders
            .LineStyle = xlContinuous
            .Weight = xlThin
        End With
    End If
    
    wsCruce.Cells.EntireColumn.AutoFit
End Sub

Private Sub ActualizarContadorPanel(etiqueta As String, valor As Variant)
    Dim ws As Worksheet
    Dim ultimaFila As Long
    Dim i As Long
    
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(HOJA_PANEL)
    On Error GoTo 0
    
    If ws Is Nothing Then Exit Sub
    
    ultimaFila = 30  ' Buscar en primeras 30 filas del panel
    
    For i = 1 To ultimaFila
        If Trim(CStr(ws.Cells(i, 1).Value)) = etiqueta Then
            ws.Cells(i, 2).Value = valor
            ws.Cells(i, 2).Font.Bold = True
            Exit Sub
        End If
    Next i
End Sub
