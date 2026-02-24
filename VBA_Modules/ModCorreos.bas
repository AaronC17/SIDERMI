Attribute VB_Name = "ModCorreos"
'==============================================================================
' MÓDULO: ModCorreos
' DESCRIPCIÓN: Automatización de envío de correos electrónicos mediante Outlook
' PROYECTO: Automatizador_Matricula.xlsm
' VERSIÓN: 1.0
'==============================================================================
Option Explicit

' ============================================================
' PROCEDIMIENTO PRINCIPAL: ENVIAR CORREOS DE RECORDATORIO
' ============================================================

Public Sub EnviarCorreosRecordatorio()
    Dim wsPendientes As Worksheet
    Dim wsManual As Worksheet
    Dim ultimaFila As Long
    Dim i As Long
    Dim correoDestino As String
    Dim nombreEstudiante As String
    Dim docsPendientes As String
    Dim cedula As String
    Dim sede As String
    Dim carrera As String
    Dim totalEnviados As Long
    Dim totalOmitidos As Long
    Dim totalErrores As Long
    Dim ultimoEnvio As Date
    Dim diasDesdeUltimoEnvio As Long
    
    On Error GoTo ErrorHandler
    
    Set wsPendientes = ThisWorkbook.Sheets(HOJA_PENDIENTES)
    Set wsManual = ThisWorkbook.Sheets(HOJA_MANUAL)
    
    ultimaFila = ObtenerUltimaFila(wsPendientes)
    
    If ultimaFila < 2 Then
        MsgBox "No hay estudiantes con documentos pendientes." & vbCrLf & _
               "Ejecute primero el cruce de datos.", vbInformation, "Sin pendientes"
        Exit Sub
    End If
    
    ' Verificar Outlook disponible
    If Not OutlookDisponible() Then
        MsgBox "Microsoft Outlook no está disponible o no está instalado." & vbCrLf & _
               "Se requiere Outlook para el envío de correos.", vbCritical, "Outlook no disponible"
        Exit Sub
    End If
    
    Dim totalPendientes As Long
    totalPendientes = ultimaFila - 1
    
    If MsgBox("Se encontraron " & totalPendientes & " estudiantes con documentos pendientes." & vbCrLf & _
              "¿Desea enviar correos de recordatorio?", vbYesNo + vbQuestion, _
              "Confirmar Envío de Correos") = vbNo Then
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    
    totalEnviados = 0
    totalOmitidos = 0
    totalErrores = 0
    
    For i = 2 To ultimaFila
        MostrarProgreso "Enviando correo " & (i - 1) & " de " & totalPendientes & "...", _
                        CLng(100 * (i - 1) / totalPendientes)
        
        cedula = Trim(CStr(wsPendientes.Cells(i, 1).Value))
        nombreEstudiante = Trim(CStr(wsPendientes.Cells(i, 3).Value))
        correoDestino = Trim(CStr(wsPendientes.Cells(i, 4).Value))
        sede = Trim(CStr(wsPendientes.Cells(i, 5).Value))
        carrera = Trim(CStr(wsPendientes.Cells(i, 6).Value))
        docsPendientes = Trim(CStr(wsPendientes.Cells(i, 7).Value))
        
        ' Validar correo
        If Not ValidarCorreo(correoDestino) Then
            totalOmitidos = totalOmitidos + 1
            RegistrarLogCorreo cedula, nombreEstudiante, correoDestino, _
                CORREO_ASUNTO_RECORDATORIO, "RECORDATORIO", "OMITIDO", _
                docsPendientes, "Correo inválido"
            GoTo SiguienteCorreo
        End If
        
        ' Verificar si ya se envió recientemente
        Dim ultimoRecordatorio As String
        ultimoRecordatorio = Trim(CStr(wsPendientes.Cells(i, 8).Value))
        
        If ultimoRecordatorio <> "" Then
            On Error Resume Next
            ultimoEnvio = CDate(ultimoRecordatorio)
            On Error GoTo ErrorHandler
            
            diasDesdeUltimoEnvio = DateDiff("d", ultimoEnvio, Now)
            
            If diasDesdeUltimoEnvio < DIAS_REENVIO_MINIMO Then
                totalOmitidos = totalOmitidos + 1
                RegistrarLogCorreo cedula, nombreEstudiante, correoDestino, _
                    CORREO_ASUNTO_RECORDATORIO, "RECORDATORIO", "OMITIDO", _
                    docsPendientes, "Enviado hace " & diasDesdeUltimoEnvio & " días (mín: " & DIAS_REENVIO_MINIMO & ")"
                GoTo SiguienteCorreo
            End If
        End If
        
        ' Generar y enviar correo
        Dim cuerpoCorreo As String
        cuerpoCorreo = GenerarCuerpoRecordatorio(nombreEstudiante, docsPendientes, sede, carrera)
        
        If EnviarCorreoOutlook(correoDestino, CORREO_ASUNTO_RECORDATORIO, cuerpoCorreo) Then
            totalEnviados = totalEnviados + 1
            
            ' Actualizar fecha de envío en pendientes
            wsPendientes.Cells(i, 8).Value = Now
            wsPendientes.Cells(i, 8).NumberFormat = "dd/mm/yyyy hh:mm"
            wsPendientes.Cells(i, 9).Value = CLng(wsPendientes.Cells(i, 9).Value) + 1
            
            ' Actualizar en hoja manual también
            ActualizarEstadoCorreoManual wsManual, cedula
            
            RegistrarLogCorreo cedula, nombreEstudiante, correoDestino, _
                CORREO_ASUNTO_RECORDATORIO, "RECORDATORIO", "ENVIADO", _
                docsPendientes, ""
        Else
            totalErrores = totalErrores + 1
            RegistrarLogCorreo cedula, nombreEstudiante, correoDestino, _
                CORREO_ASUNTO_RECORDATORIO, "RECORDATORIO", "ERROR", _
                docsPendientes, "Error al enviar"
        End If
        
        ' Pequeña pausa para no saturar Outlook
        Application.Wait Now + TimeValue("00:00:01")
        
SiguienteCorreo:
    Next i
    
    ' Actualizar configuración
    Dim wsConfig As Worksheet
    Set wsConfig = ThisWorkbook.Sheets(HOJA_CONFIG)
    wsConfig.Range("B12").Value = Now
    
    ' Registrar en historial
    RegistrarHistorial "ENVIO_CORREOS", "", _
        "Enviados: " & totalEnviados & " | Omitidos: " & totalOmitidos & " | Errores: " & totalErrores, "ÉXITO"
    
    Application.ScreenUpdating = True
    LimpiarProgreso
    
    MsgBox "ENVÍO DE CORREOS COMPLETADO" & vbCrLf & vbCrLf & _
           "Correos enviados: " & totalEnviados & vbCrLf & _
           "Omitidos (enviados recientemente o correo inválido): " & totalOmitidos & vbCrLf & _
           "Errores: " & totalErrores, vbInformation, "Resultado de Envío"
    
    Exit Sub

ErrorHandler:
    MsgBox "Error en el envío de correos: " & Err.Description, vbCritical, "Error"
    RegistrarHistorial "ENVIO_CORREOS", "", "Error: " & Err.Description, "ERROR"
    Application.ScreenUpdating = True
    LimpiarProgreso
End Sub

' ============================================================
' ENVIAR CORREOS DE BIENVENIDA A NUEVOS
' ============================================================

Public Sub EnviarCorreosBienvenida()
    Dim wsCruce As Worksheet
    Dim wsSIGU As Worksheet
    Dim ultimaFila As Long
    Dim i As Long
    Dim totalEnviados As Long
    Dim totalErrores As Long
    Dim dictSIGU As Object
    Dim colClave As Long
    
    On Error GoTo ErrorHandler
    
    Set wsCruce = ThisWorkbook.Sheets(HOJA_CRUCE)
    Set wsSIGU = ThisWorkbook.Sheets(HOJA_SIGU)
    
    ultimaFila = ObtenerUltimaFila(wsCruce)
    
    If ultimaFila < 2 Then
        MsgBox "No hay datos de cruce. Ejecute primero el cruce de datos.", vbExclamation, "Sin datos"
        Exit Sub
    End If
    
    If Not OutlookDisponible() Then
        MsgBox "Microsoft Outlook no está disponible.", vbCritical, "Outlook no disponible"
        Exit Sub
    End If
    
    ' Contar nuevos
    Dim totalNuevos As Long
    totalNuevos = ContarPorTipoCambio(wsCruce, TIPO_NUEVO)
    
    If totalNuevos = 0 Then
        MsgBox "No se detectaron estudiantes nuevos.", vbInformation, "Sin nuevos"
        Exit Sub
    End If
    
    If MsgBox("Se encontraron " & totalNuevos & " estudiantes nuevos." & vbCrLf & _
              "¿Desea enviar correos de bienvenida?", vbYesNo + vbQuestion, _
              "Correos de Bienvenida") = vbNo Then
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    
    If ObtenerClavePrimaria() = "CARNET" Then
        colClave = COL_SIGU_CARNET
    Else
        colClave = COL_SIGU_CEDULA
    End If
    
    Set dictSIGU = BuscarFilaPorClaveDiccionario(wsSIGU, colClave)
    
    totalEnviados = 0
    totalErrores = 0
    
    For i = 2 To ultimaFila
        If UCase(Trim(CStr(wsCruce.Cells(i, COL_CRUCE_TIPO_CAMBIO).Value))) = UCase(TIPO_NUEVO) Then
            Dim cedula As String
            cedula = Trim(CStr(wsCruce.Cells(i, COL_CRUCE_CEDULA).Value))
            
            If dictSIGU.Exists(cedula) Then
                Dim filaSIGU As Long
                filaSIGU = dictSIGU(cedula)
                
                Dim correoDestino As String
                Dim nombreCompleto As String
                Dim sede As String
                Dim carrera As String
                
                correoDestino = NormalizarCorreo(CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_CORREO).Value))
                nombreCompleto = ModUtilidades.NombreCompleto( _
                    CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_NOMBRE).Value), _
                    CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO1).Value), _
                    CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_APELLIDO2).Value))
                sede = CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_SEDE).Value)
                carrera = CStr(wsSIGU.Cells(filaSIGU, COL_SIGU_CARRERA).Value)
                
                If ValidarCorreo(correoDestino) Then
                    Dim cuerpo As String
                    cuerpo = GenerarCuerpoBienvenida(nombreCompleto, sede, carrera)
                    
                    If EnviarCorreoOutlook(correoDestino, CORREO_ASUNTO_BIENVENIDA, cuerpo) Then
                        totalEnviados = totalEnviados + 1
                        RegistrarLogCorreo cedula, nombreCompleto, correoDestino, _
                            CORREO_ASUNTO_BIENVENIDA, "BIENVENIDA", "ENVIADO", "", ""
                    Else
                        totalErrores = totalErrores + 1
                    End If
                    
                    Application.Wait Now + TimeValue("00:00:01")
                End If
            End If
        End If
    Next i
    
    RegistrarHistorial "CORREOS_BIENVENIDA", "", _
        "Enviados: " & totalEnviados & " | Errores: " & totalErrores, "ÉXITO"
    
    Application.ScreenUpdating = True
    LimpiarProgreso
    
    MsgBox "Correos de bienvenida enviados: " & totalEnviados & vbCrLf & _
           "Errores: " & totalErrores, vbInformation, "Bienvenida"
    
    Exit Sub

ErrorHandler:
    MsgBox "Error: " & Err.Description, vbCritical, "Error"
    Application.ScreenUpdating = True
    LimpiarProgreso
End Sub

' ============================================================
' PREVISUALIZACIÓN DE CORREOS (SIN ENVIAR)
' ============================================================

Public Sub PrevisualizarCorreos()
    Dim wsPendientes As Worksheet
    Dim ultimaFila As Long
    
    Set wsPendientes = ThisWorkbook.Sheets(HOJA_PENDIENTES)
    ultimaFila = ObtenerUltimaFila(wsPendientes)
    
    If ultimaFila < 2 Then
        MsgBox "No hay pendientes para previsualizar.", vbInformation, "Sin pendientes"
        Exit Sub
    End If
    
    ' Mostrar el primer correo como ejemplo
    Dim nombre As String
    Dim docs As String
    Dim sede As String
    Dim carrera As String
    Dim correo As String
    
    nombre = CStr(wsPendientes.Cells(2, 3).Value)
    correo = CStr(wsPendientes.Cells(2, 4).Value)
    sede = CStr(wsPendientes.Cells(2, 5).Value)
    carrera = CStr(wsPendientes.Cells(2, 6).Value)
    docs = CStr(wsPendientes.Cells(2, 7).Value)
    
    Dim preview As String
    preview = "=== PREVISUALIZACIÓN DE CORREO ===" & vbCrLf & vbCrLf
    preview = preview & "Para: " & correo & vbCrLf
    preview = preview & "Asunto: " & CORREO_ASUNTO_RECORDATORIO & vbCrLf
    preview = preview & "---" & vbCrLf & vbCrLf
    preview = preview & GenerarCuerpoRecordatorioTextoPlano(nombre, docs, sede, carrera)
    preview = preview & vbCrLf & "---" & vbCrLf
    preview = preview & "Total de correos a enviar: " & (ultimaFila - 1)
    
    MsgBox preview, vbInformation, "Previsualización"
End Sub

' ============================================================
' FUNCIONES AUXILIARES DE CORREO
' ============================================================

Private Function OutlookDisponible() As Boolean
    Dim olApp As Object
    On Error Resume Next
    Set olApp = GetObject(, "Outlook.Application")
    If olApp Is Nothing Then
        Set olApp = CreateObject("Outlook.Application")
    End If
    OutlookDisponible = Not olApp Is Nothing
    Set olApp = Nothing
    On Error GoTo 0
End Function

Private Function EnviarCorreoOutlook(destinatario As String, asunto As String, cuerpoHTML As String) As Boolean
    Dim olApp As Object
    Dim olMail As Object
    
    On Error GoTo ErrorEnvio
    
    Set olApp = GetObject(, "Outlook.Application")
    If olApp Is Nothing Then
        Set olApp = CreateObject("Outlook.Application")
    End If
    
    Set olMail = olApp.CreateItem(0) ' olMailItem
    
    With olMail
        .To = destinatario
        .Subject = asunto
        .HTMLBody = cuerpoHTML
        .Importance = 1 ' Normal
        .Send
    End With
    
    EnviarCorreoOutlook = True
    
    Set olMail = Nothing
    Set olApp = Nothing
    Exit Function

ErrorEnvio:
    EnviarCorreoOutlook = False
    Set olMail = Nothing
    Set olApp = Nothing
End Function

Private Function GenerarCuerpoRecordatorio(nombre As String, docsPendientes As String, _
                                            sede As String, carrera As String) As String
    Dim html As String
    Dim docsList() As String
    Dim i As Long
    
    html = "<html><head><style>"
    html = html & "body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; }"
    html = html & ".header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }"
    html = html & ".content { padding: 25px; background-color: #f9f9f9; border: 1px solid #ddd; }"
    html = html & ".docs-list { background: white; padding: 15px; border-left: 4px solid #cc0000; margin: 15px 0; }"
    html = html & ".footer { background-color: #003366; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }"
    html = html & ".highlight { color: #cc0000; font-weight: bold; }"
    html = html & ".btn { display: inline-block; background-color: #003366; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }"
    html = html & "</style></head><body>"
    
    ' Header
    html = html & "<div class='header'>"
    html = html & "<h2>Departamento de Registro y Admisión</h2>"
    html = html & "</div>"
    
    ' Content
    html = html & "<div class='content'>"
    html = html & "<p>Estimado(a) <strong>" & nombre & "</strong>,</p>"
    html = html & "<p>Le informamos que su proceso de matrícula para la carrera de <strong>" & carrera & "</strong> "
    html = html & "en la sede <strong>" & sede & "</strong> presenta documentos pendientes de entrega.</p>"
    
    html = html & "<div class='docs-list'>"
    html = html & "<p class='highlight'>Documentos pendientes:</p><ul>"
    
    docsList = Split(docsPendientes, ",")
    For i = LBound(docsList) To UBound(docsList)
        html = html & "<li>" & Trim(docsList(i)) & "</li>"
    Next i
    
    html = html & "</ul></div>"
    
    html = html & "<p>Le solicitamos amablemente presentar los documentos indicados a la mayor brevedad posible "
    html = html & "para completar su proceso de matrícula.</p>"
    
    html = html & "<p><strong>Información importante:</strong></p>"
    html = html & "<ul>"
    html = html & "<li>Puede entregar los documentos en las oficinas de Registro de su sede.</li>"
    html = html & "<li>Los documentos deben ser originales o copias certificadas.</li>"
    html = html & "<li>El horario de atención es de lunes a viernes de 8:00 a.m. a 4:00 p.m.</li>"
    html = html & "</ul>"
    
    html = html & "<p>Si tiene alguna consulta, no dude en contactarnos.</p>"
    html = html & "<p>Atentamente,<br><strong>" & CORREO_FIRMA & "</strong></p>"
    html = html & "</div>"
    
    ' Footer
    html = html & "<div class='footer'>"
    html = html & "<p>Este es un correo automático del Sistema de Gestión de Matrícula.<br>"
    html = html & "Fecha de generación: " & Format(Now, "dd/mm/yyyy hh:mm") & "</p>"
    html = html & "</div>"
    
    html = html & "</body></html>"
    
    GenerarCuerpoRecordatorio = html
End Function

Private Function GenerarCuerpoRecordatorioTextoPlano(nombre As String, docsPendientes As String, _
                                                       sede As String, carrera As String) As String
    Dim texto As String
    Dim docsList() As String
    Dim i As Long
    
    texto = "Estimado(a) " & nombre & "," & vbCrLf & vbCrLf
    texto = texto & "Le informamos que su proceso de matrícula para la carrera de " & carrera
    texto = texto & " en la sede " & sede & " presenta documentos pendientes de entrega." & vbCrLf & vbCrLf
    
    texto = texto & "DOCUMENTOS PENDIENTES:" & vbCrLf
    
    docsList = Split(docsPendientes, ",")
    For i = LBound(docsList) To UBound(docsList)
        texto = texto & "  • " & Trim(docsList(i)) & vbCrLf
    Next i
    
    texto = texto & vbCrLf & "Le solicitamos presentar los documentos a la mayor brevedad." & vbCrLf & vbCrLf
    texto = texto & "Atentamente," & vbCrLf
    texto = texto & CORREO_FIRMA
    
    GenerarCuerpoRecordatorioTextoPlano = texto
End Function

Private Function GenerarCuerpoBienvenida(nombre As String, sede As String, carrera As String) As String
    Dim html As String
    
    html = "<html><head><style>"
    html = html & "body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; }"
    html = html & ".header { background-color: #006633; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }"
    html = html & ".content { padding: 25px; background-color: #f9f9f9; border: 1px solid #ddd; }"
    html = html & ".footer { background-color: #006633; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }"
    html = html & ".welcome-box { background: white; padding: 20px; border-left: 4px solid #006633; margin: 15px 0; }"
    html = html & "</style></head><body>"
    
    html = html & "<div class='header'>"
    html = html & "<h2>¡Bienvenido(a) a nuestra Institución!</h2>"
    html = html & "</div>"
    
    html = html & "<div class='content'>"
    html = html & "<p>Estimado(a) <strong>" & nombre & "</strong>,</p>"
    html = html & "<p>Le damos la más cordial bienvenida. Su matrícula ha sido registrada exitosamente.</p>"
    
    html = html & "<div class='welcome-box'>"
    html = html & "<p><strong>Datos de su matrícula:</strong></p>"
    html = html & "<ul>"
    html = html & "<li><strong>Carrera:</strong> " & carrera & "</li>"
    html = html & "<li><strong>Sede:</strong> " & sede & "</li>"
    html = html & "</ul>"
    html = html & "</div>"
    
    html = html & "<p>Le recordamos que es importante completar la entrega de todos los documentos requeridos "
    html = html & "para formalizar su proceso de matrícula.</p>"
    
    html = html & "<p><strong>Documentos requeridos:</strong></p><ul>"
    
    Dim docs() As String
    Dim i As Long
    docs = Split(DOCUMENTOS_REQUERIDOS, ",")
    For i = LBound(docs) To UBound(docs)
        html = html & "<li>" & Trim(docs(i)) & "</li>"
    Next i
    html = html & "</ul>"
    
    html = html & "<p>Para cualquier consulta, estamos a su disposición.</p>"
    html = html & "<p>Atentamente,<br><strong>" & CORREO_FIRMA & "</strong></p>"
    html = html & "</div>"
    
    html = html & "<div class='footer'>"
    html = html & "<p>Sistema de Gestión de Matrícula<br>"
    html = html & Format(Now, "dd/mm/yyyy") & "</p>"
    html = html & "</div></body></html>"
    
    GenerarCuerpoBienvenida = html
End Function

Private Sub ActualizarEstadoCorreoManual(wsManual As Worksheet, cedula As String)
    Dim fila As Long
    Dim colClave As Long
    
    If ObtenerClavePrimaria() = "CARNET" Then
        colClave = COL_MAN_CARNET
    Else
        colClave = COL_MAN_CEDULA
    End If
    
    fila = BuscarFilaPorClave(wsManual, cedula, colClave)
    
    If fila > 0 Then
        wsManual.Cells(fila, COL_MAN_CORREO_ENVIADO).Value = "SÍ"
        wsManual.Cells(fila, COL_MAN_FECHA_CORREO).Value = Now
        wsManual.Cells(fila, COL_MAN_FECHA_CORREO).NumberFormat = "dd/mm/yyyy hh:mm"
    End If
End Sub

' ============================================================
' ENVIAR CORREO INDIVIDUAL (para pruebas)
' ============================================================

Public Sub EnviarCorreoPrueba()
    Dim correoDestino As String
    
    correoDestino = InputBox("Ingrese el correo electrónico de prueba:", "Correo de Prueba")
    
    If correoDestino = "" Then Exit Sub
    
    If Not ValidarCorreo(correoDestino) Then
        MsgBox "El correo ingresado no es válido.", vbExclamation, "Correo inválido"
        Exit Sub
    End If
    
    If Not OutlookDisponible() Then
        MsgBox "Outlook no está disponible.", vbCritical, "Error"
        Exit Sub
    End If
    
    Dim cuerpo As String
    cuerpo = GenerarCuerpoRecordatorio("Estudiante de Prueba", _
        "Cédula, Foto, Título Secundaria", "Sede Central", "Ingeniería en Sistemas")
    
    If EnviarCorreoOutlook(correoDestino, "[PRUEBA] " & CORREO_ASUNTO_RECORDATORIO, cuerpo) Then
        MsgBox "Correo de prueba enviado exitosamente a " & correoDestino, vbInformation, "Éxito"
        RegistrarHistorial "CORREO_PRUEBA", "", "Enviado a: " & correoDestino, "ÉXITO"
    Else
        MsgBox "Error al enviar el correo de prueba.", vbCritical, "Error"
    End If
End Sub
