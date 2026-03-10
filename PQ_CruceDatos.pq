// ==============================================================================
// POWER QUERY: Cruce de Datos SIGU vs Manual
// ARCHIVO: PQ_CruceDatos.pq
// DESCRIPCIÓN: Realiza el cruce entre los datos importados de SIGU 
//              y el archivo manual administrativo.
//
// INSTRUCCIONES:
// 1. Asegúrese de tener las consultas "Datos_SIGU" y "Datos_Manual" creadas
// 2. En el Editor de Power Query, cree una nueva consulta en blanco
// 3. Abra el Editor Avanzado y pegue este código
// ==============================================================================

let
    // ============================
    // PASO 1: Cargar tablas fuente
    // ============================
    DatosSIGU = Excel.CurrentWorkbook(){[Name="Datos_SIGU"]}[Content],
    DatosManual = Excel.CurrentWorkbook(){[Name="Datos_Manual"]}[Content],
    
    // Asegurar tipos
    SIGU = Table.TransformColumnTypes(DatosSIGU, {{"Cédula", type text}}),
    Manual = Table.TransformColumnTypes(DatosManual, {{"Cédula", type text}}),
    
    // ============================
    // PASO 2: LEFT JOIN - SIGU como base
    // ============================
    CruceIzquierdo = Table.NestedJoin(
        SIGU, {"Cédula"}, 
        Manual, {"Cédula"}, 
        "DatosManual", 
        JoinKind.LeftOuter
    ),
    
    // Expandir columnas del manual relevantes
    ExpandirManual = Table.ExpandTableColumn(CruceIzquierdo, "DatosManual", {
        "Estado", "Sede", "Carrera", "Correo Electrónico", "Teléfono",
        "Nombre", "Primer Apellido"
    }, {
        "Manual_Estado", "Manual_Sede", "Manual_Carrera", "Manual_Correo", "Manual_Telefono",
        "Manual_Nombre", "Manual_Apellido1"
    }),
    
    // ============================
    // PASO 3: Identificar tipo de cambio
    // ============================
    AgregarTipoCambio = Table.AddColumn(ExpandirManual, "Tipo_Cambio", each
        if [Manual_Estado] = null then "NUEVO"
        else if Text.Upper(Text.Trim([Estado] ?? "")) <> Text.Upper(Text.Trim([Manual_Estado] ?? "")) then "CAMBIO_ESTADO"
        else if Text.Upper(Text.Trim([Sede] ?? "")) <> Text.Upper(Text.Trim([Manual_Sede] ?? "")) then "CAMBIO_SEDE"
        else if Text.Upper(Text.Trim([Carrera] ?? "")) <> Text.Upper(Text.Trim([Manual_Carrera] ?? "")) then "CAMBIO_CARRERA"
        else if Text.Lower(Text.Trim([Correo Electrónico] ?? "")) <> Text.Lower(Text.Trim([Manual_Correo] ?? "")) then "DATO_ACTUALIZADO"
        else if Text.Upper(Text.Trim([Nombre] ?? "")) <> Text.Upper(Text.Trim([Manual_Nombre] ?? "")) then "INCONSISTENTE"
        else "SIN_CAMBIO",
        type text
    ),
    
    // ============================
    // PASO 4: Agregar detalles del cambio
    // ============================
    AgregarDetalle = Table.AddColumn(AgregarTipoCambio, "Detalle_Cambio", each
        if [Tipo_Cambio] = "NUEVO" then "Estudiante nuevo en SIGU"
        else if [Tipo_Cambio] = "CAMBIO_ESTADO" then "Estado: " & ([Manual_Estado] ?? "N/A") & " → " & ([Estado] ?? "N/A")
        else if [Tipo_Cambio] = "CAMBIO_SEDE" then "Sede: " & ([Manual_Sede] ?? "N/A") & " → " & ([Sede] ?? "N/A")
        else if [Tipo_Cambio] = "CAMBIO_CARRERA" then "Carrera: " & ([Manual_Carrera] ?? "N/A") & " → " & ([Carrera] ?? "N/A")
        else if [Tipo_Cambio] = "DATO_ACTUALIZADO" then "Correo u otro dato actualizado"
        else if [Tipo_Cambio] = "INCONSISTENTE" then "Nombre no coincide entre archivos"
        else "Sin cambios",
        type text
    ),
    
    // ============================
    // PASO 5: Filtrar solo registros con cambios
    // ============================
    FiltrarCambios = Table.SelectRows(AgregarDetalle, each [Tipo_Cambio] <> "SIN_CAMBIO"),
    
    // ============================
    // PASO 6: Seleccionar columnas finales
    // ============================
    SeleccionarColumnas = Table.SelectColumns(FiltrarCambios, {
        "Cédula", "Carnet", "Nombre", "Primer Apellido", "Segundo Apellido",
        "Correo Electrónico", "Sede", "Carrera", "Estado",
        "Tipo_Cambio", "Detalle_Cambio", "Documentos Entregados"
    }),
    
    // Agregar fecha de detección
    AgregarFecha = Table.AddColumn(SeleccionarColumnas, "Fecha_Deteccion", each 
        DateTime.LocalNow(), type datetime
    ),
    
    // Ordenar por tipo de cambio
    Resultado = Table.Sort(AgregarFecha, {
        {"Tipo_Cambio", Order.Ascending},
        {"Primer Apellido", Order.Ascending}
    })

in
    Resultado
