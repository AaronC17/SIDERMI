// ==============================================================================
// POWER QUERY: Importar y Limpiar Datos SIGU
// ARCHIVO: PQ_ImportarSIGU.pq
// DESCRIPCIÓN: Importa el archivo Excel más reciente de la carpeta SIGU,
//              limpia y normaliza los datos para el cruce.
//
// INSTRUCCIONES DE USO:
// 1. En Excel, vaya a Datos > Obtener Datos > Desde archivo > Desde carpeta
// 2. Seleccione la carpeta Datos_SIGU
// 3. En el Editor de Power Query, abra el Editor Avanzado
// 4. Pegue este código (adaptando la ruta si es necesario)
// ==============================================================================

let
    // ============================
    // PASO 1: Leer la carpeta SIGU
    // ============================
    RutaCarpeta = "C:\Users\LINC\Desktop\cda\Datos_SIGU\",
    
    ArchivosCarpeta = Folder.Files(RutaCarpeta),
    
    // Filtrar solo archivos .xlsx
    FiltrarExcel = Table.SelectRows(ArchivosCarpeta, each 
        Text.EndsWith([Name], ".xlsx") and not Text.StartsWith([Name], "~$")
    ),
    
    // Ordenar por fecha de modificación (más reciente primero)
    OrdenarPorFecha = Table.Sort(FiltrarExcel, {{"Date modified", Order.Descending}}),
    
    // Tomar el archivo más reciente
    ArchivoMasReciente = OrdenarPorFecha{0}[Content],
    
    // ============================
    // PASO 2: Leer el contenido del Excel
    // ============================
    LibroExcel = Excel.Workbook(ArchivoMasReciente, null, true),
    
    // Tomar la primera hoja
    PrimeraHoja = LibroExcel{0}[Data],
    
    // Promover la primera fila como encabezados
    Encabezados = Table.PromoteHeaders(PrimeraHoja, [PromoteAllScalars=true]),
    
    // ============================
    // PASO 3: Limpiar y normalizar datos
    // ============================
    
    // Eliminar filas completamente vacías
    EliminarVacias = Table.SelectRows(Encabezados, each not List.IsEmpty(
        List.RemoveMatchingItems(Record.FieldValues(_), {"", null})
    )),
    
    // Cambiar tipos de datos
    CambiarTipos = Table.TransformColumnTypes(EliminarVacias, {
        {"Cédula", type text},
        {"Carnet", type text},
        {"Nombre", type text},
        {"Primer Apellido", type text},
        {"Segundo Apellido", type text},
        {"Correo Electrónico", type text},
        {"Teléfono", type text},
        {"Carrera", type text},
        {"Sede", type text},
        {"Estado", type text},
        {"Período", type text},
        {"Fecha Matrícula", type date},
        {"Documentos Entregados", type text},
        {"Observaciones", type text}
    }),
    
    // ============================
    // PASO 4: Normalizar campos de texto
    // ============================
    
    // Limpiar Cédula (solo números)
    LimpiarCedula = Table.TransformColumns(CambiarTipos, {
        {"Cédula", each Text.Select(Text.From(_ ?? ""), {"0".."9"}), type text}
    }),
    
    // Normalizar textos (Trim + Proper Case)
    NormalizarNombres = Table.TransformColumns(LimpiarCedula, {
        {"Nombre", each Text.Proper(Text.Trim(_ ?? "")), type text},
        {"Primer Apellido", each Text.Proper(Text.Trim(_ ?? "")), type text},
        {"Segundo Apellido", each Text.Proper(Text.Trim(_ ?? "")), type text}
    }),
    
    // Normalizar correo (minúsculas, trim)
    NormalizarCorreo = Table.TransformColumns(NormalizarNombres, {
        {"Correo Electrónico", each Text.Lower(Text.Trim(_ ?? "")), type text}
    }),
    
    // Limpiar teléfono
    LimpiarTelefono = Table.TransformColumns(NormalizarCorreo, {
        {"Teléfono", each Text.Select(Text.From(_ ?? ""), {"0".."9", "-"}), type text}
    }),
    
    // Trim campos restantes
    LimpiarRestos = Table.TransformColumns(LimpiarTelefono, {
        {"Carrera", each Text.Trim(_ ?? ""), type text},
        {"Sede", each Text.Trim(_ ?? ""), type text},
        {"Estado", each Text.Trim(_ ?? ""), type text},
        {"Período", each Text.Trim(_ ?? ""), type text},
        {"Documentos Entregados", each Text.Trim(_ ?? ""), type text},
        {"Observaciones", each Text.Trim(_ ?? ""), type text}
    }),
    
    // ============================
    // PASO 5: Agregar columnas calculadas
    // ============================
    
    // Nombre completo
    AgregarNombreCompleto = Table.AddColumn(LimpiarRestos, "Nombre Completo", each 
        Text.Trim([Nombre] & " " & [Primer Apellido] & " " & [Segundo Apellido]),
        type text
    ),
    
    // Indicador de documentos completos
    AgregarDocCompletos = Table.AddColumn(AgregarNombreCompleto, "Docs Completos", each
        let
            requeridos = {"Cédula", "Foto", "Título Secundaria", "Notas Secundaria", "Constancia CCSS", "Declaración Jurada"},
            entregados = if [Documentos Entregados] = null or [Documentos Entregados] = "" then {} 
                         else List.Transform(Text.Split([Documentos Entregados], ","), each Text.Trim(_)),
            faltantes = List.RemoveMatchingItems(requeridos, entregados, Comparer.OrdinalIgnoreCase)
        in
            if List.Count(faltantes) = 0 then "SÍ" else "NO",
        type text
    ),
    
    // Documentos pendientes
    AgregarDocPendientes = Table.AddColumn(AgregarDocCompletos, "Documentos Pendientes", each
        let
            requeridos = {"Cédula", "Foto", "Título Secundaria", "Notas Secundaria", "Constancia CCSS", "Declaración Jurada"},
            entregados = if [Documentos Entregados] = null or [Documentos Entregados] = "" then {} 
                         else List.Transform(Text.Split([Documentos Entregados], ","), each Text.Trim(_)),
            faltantes = List.RemoveMatchingItems(requeridos, entregados, Comparer.OrdinalIgnoreCase)
        in
            Text.Combine(faltantes, ", "),
        type text
    ),
    
    // Fecha de importación
    AgregarFechaImport = Table.AddColumn(AgregarDocPendientes, "Fecha Importación", each 
        DateTime.LocalNow(),
        type datetime
    ),
    
    // ============================
    // PASO 6: Filtrar registros inválidos
    // ============================
    FiltrarValidos = Table.SelectRows(AgregarFechaImport, each 
        [Cédula] <> null and [Cédula] <> "" and Text.Length([Cédula]) >= 9
    ),
    
    // ============================
    // PASO 7: Ordenar resultado
    // ============================
    Resultado = Table.Sort(FiltrarValidos, {{"Primer Apellido", Order.Ascending}, {"Nombre", Order.Ascending}})

in
    Resultado
