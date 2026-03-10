// ==============================================================================
// POWER QUERY: Identificar Documentos Pendientes
// ARCHIVO: PQ_DocumentosPendientes.pq
// DESCRIPCIÓN: Genera una lista de estudiantes con documentos faltantes,
//              comparando los documentos entregados contra los requeridos.
//
// INSTRUCCIONES:
// 1. Asegúrese de tener la consulta "Datos_SIGU" creada
// 2. En el Editor de Power Query, cree una nueva consulta en blanco
// 3. Abra el Editor Avanzado y pegue este código
// ==============================================================================

let
    // ============================
    // PASO 1: Cargar datos SIGU
    // ============================
    DatosSIGU = Excel.CurrentWorkbook(){[Name="Datos_SIGU"]}[Content],
    
    // Asegurar tipos
    SIGU = Table.TransformColumnTypes(DatosSIGU, {
        {"Cédula", type text},
        {"Documentos Entregados", type text},
        {"Correo Electrónico", type text}
    }),
    
    // ============================
    // PASO 2: Definir documentos requeridos
    // ============================
    DocumentosRequeridos = {"Cédula", "Foto", "Título Secundaria", "Notas Secundaria", "Constancia CCSS", "Declaración Jurada"},
    TotalRequeridos = List.Count(DocumentosRequeridos),
    
    // ============================
    // PASO 3: Calcular pendientes para cada estudiante
    // ============================
    AgregarPendientes = Table.AddColumn(SIGU, "Documentos_Pendientes", each
        let
            entregadosTexto = [Documentos Entregados] ?? "",
            entregados = if entregadosTexto = "" then {} 
                         else List.Transform(Text.Split(entregadosTexto, ","), each Text.Trim(_)),
            pendientes = List.RemoveMatchingItems(DocumentosRequeridos, entregados, Comparer.OrdinalIgnoreCase)
        in
            Text.Combine(pendientes, ", "),
        type text
    ),
    
    // Cantidad de documentos pendientes
    AgregarCantidad = Table.AddColumn(AgregarPendientes, "Cant_Pendientes", each
        let
            entregadosTexto = [Documentos Entregados] ?? "",
            entregados = if entregadosTexto = "" then {} 
                         else List.Transform(Text.Split(entregadosTexto, ","), each Text.Trim(_)),
            pendientes = List.RemoveMatchingItems(DocumentosRequeridos, entregados, Comparer.OrdinalIgnoreCase)
        in
            List.Count(pendientes),
        Int64.Type
    ),
    
    // Cantidad entregados
    AgregarEntregados = Table.AddColumn(AgregarCantidad, "Cant_Entregados", each
        TotalRequeridos - [Cant_Pendientes],
        Int64.Type
    ),
    
    // Porcentaje de completitud
    AgregarPorcentaje = Table.AddColumn(AgregarEntregados, "Porcentaje_Completo", each
        [Cant_Entregados] / TotalRequeridos,
        Percentage.Type
    ),
    
    // Estado de documentación
    AgregarEstadoDoc = Table.AddColumn(AgregarPorcentaje, "Estado_Documentacion", each
        if [Cant_Pendientes] = 0 then "COMPLETO"
        else if [Cant_Pendientes] <= 2 then "CASI COMPLETO"
        else if [Cant_Pendientes] <= 4 then "PARCIAL"
        else "INCOMPLETO",
        type text
    ),
    
    // ============================
    // PASO 4: Filtrar solo los que tienen pendientes
    // ============================
    FiltrarPendientes = Table.SelectRows(AgregarEstadoDoc, each [Cant_Pendientes] > 0),
    
    // ============================
    // PASO 5: Seleccionar y ordenar columnas
    // ============================
    Seleccionar = Table.SelectColumns(FiltrarPendientes, {
        "Cédula", "Carnet", "Nombre", "Primer Apellido", "Segundo Apellido",
        "Correo Electrónico", "Sede", "Carrera", "Estado",
        "Documentos Entregados", "Documentos_Pendientes", 
        "Cant_Pendientes", "Cant_Entregados", "Porcentaje_Completo", "Estado_Documentacion"
    }),
    
    // Ordenar por cantidad de pendientes (más urgentes primero)
    Resultado = Table.Sort(Seleccionar, {
        {"Cant_Pendientes", Order.Descending},
        {"Primer Apellido", Order.Ascending}
    })

in
    Resultado
