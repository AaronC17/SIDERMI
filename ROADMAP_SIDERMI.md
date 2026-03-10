# Roadmap SIDERMI

## 1. Objetivo del roadmap

Este documento define la evolución de SIDERMI desde su estado actual como sistema operativo de registro y seguimiento documental hacia una plataforma más segura, trazable, automatizada y útil para la gestión institucional.

El roadmap no se enfoca solo en diseño visual. Prioriza funcionalidad, control operativo, reducción de trabajo manual, visibilidad del proceso y escalabilidad.

## 2. Estado actual del sistema

SIDERMI ya cubre una base funcional importante:

- Importación de archivos Excel de aspirantes, matrícula y Avatar.
- Cruce de estudiantes entre distintas fuentes.
- Edición manual de estudiantes.
- Revisión del estado documental.
- Carga de documentos por estudiante.
- Envío de notificaciones por correo.
- Dashboard y estadísticas operativas.
- Exportación ZIP de expedientes completos.
- Gestión básica de usuarios en frontend.

El sistema ya sirve para trabajar. Sin embargo, todavía tiene limitaciones importantes:

- La autenticación y los usuarios están resueltos solo en frontend.
- No existe una auditoría sólida de cambios.
- Faltan flujos formales de trabajo por bandejas.
- La importación sigue siendo principalmente de tipo cargar y procesar.
- No existe priorización, asignación ni seguimiento interno de casos.
- Los reportes están más orientados al conteo que a la gestión.
- Falta configuración por período, campaña o ciclo académico.

## 3. Visión objetivo

La meta es que SIDERMI evolucione hacia un sistema con estas características:

- Seguro: acceso controlado por backend, roles y permisos reales.
- Trazable: toda acción relevante queda registrada.
- Operativo: el sistema guía el trabajo diario, no solo almacena información.
- Automatizado: menos tareas repetitivas y menos errores manuales.
- Analítico: reportes útiles para coordinación, no solo estadísticas descriptivas.
- Escalable: preparado para más usuarios, más períodos y mayor volumen documental.

## 4. Principios de priorización

Las iniciativas de este roadmap se priorizan con estos criterios:

1. Riesgo operativo o institucional.
2. Impacto directo sobre productividad del equipo.
3. Reducción de errores manuales.
4. Mejora en control y trazabilidad.
5. Facilidad de implementación incremental.

## 5. Fases del roadmap

## Fase 1. Fortalecimiento base

Horizonte sugerido: 1 a 3 semanas.

Objetivo: corregir debilidades estructurales del sistema y preparar la base para crecer sin comprometer seguridad ni confiabilidad.

### 5.1. Autenticación y autorización reales

Problema actual:

- Los usuarios y contraseñas viven en frontend.
- No hay control real de acceso en backend.
- No existe expiración de sesión ni validación por endpoint.

Alcance:

- Backend de autenticación.
- Contraseñas almacenadas con hash.
- Inicio de sesión real contra base de datos.
- Middleware de autenticación para proteger rutas.
- Middleware de autorización por rol o permiso.
- Cierre de sesión y expiración de sesión.
- Restricción de acciones sensibles: importar, eliminar historial, editar usuarios, descargar ZIP, editar documentos.

Entregables:

- Modelo de usuario persistente en base de datos.
- Endpoints de login, logout, sesión actual y gestión de usuarios.
- Protección de rutas API.
- Pantalla de login conectada a backend.

Criterios de éxito:

- Ninguna ruta sensible responde sin autenticación válida.
- Las contraseñas no se almacenan en texto plano.
- Los usuarios ven únicamente lo que su rol permite.

### 5.2. Bitácora y auditoría del sistema

Problema actual:

- No queda evidencia completa de quién cambió qué.
- No existe trazabilidad confiable para revisión posterior.

Alcance:

- Registro de acciones críticas.
- Registro de cambios de estudiantes.
- Registro de cambios de estados documentales.
- Registro de importaciones, exportaciones y eliminaciones.
- Registro de usuario, fecha, acción, entidad afectada y detalle.

Entregables:

- Colección de auditoría.
- Servicio reutilizable para escribir eventos de auditoría.
- Timeline por estudiante.
- Vista de auditoría para administradores.

Criterios de éxito:

- Toda edición importante deja rastro.
- Se puede reconstruir el historial de un expediente.
- Se puede identificar al responsable de cada cambio.

### 5.3. Estándar de validación y errores

Problema actual:

- La API permite mucha lógica flexible sin validación uniforme.
- Los errores no siempre son consistentes o accionables.

Alcance:

- Validación de payloads de entrada.
- Normalización de respuestas de error.
- Mensajes más claros para frontend.
- Validación temprana de parámetros y archivos.

Entregables:

- Esquemas de validación por endpoint.
- Middleware de manejo centralizado de errores.
- Catálogo mínimo de errores funcionales.

Criterios de éxito:

- El frontend recibe respuestas predecibles.
- Los errores de usuario son entendibles y accionables.
- Se reduce el riesgo de inconsistencias de datos.

## Fase 2. Productividad operativa

Horizonte sugerido: 3 a 6 semanas.

Objetivo: transformar SIDERMI en una herramienta que dirija el trabajo diario y reduzca fricción operativa.

### 5.4. Bandejas de trabajo

Problema actual:

- Existen filtros y estados, pero no hay una organización clara de trabajo diario.

Alcance:

- Bandeja de expedientes pendientes de revisión.
- Bandeja de expedientes con observaciones.
- Bandeja de expedientes listos para notificar.
- Bandeja de expedientes completos listos para archivar.
- Orden por prioridad, antigüedad o fecha límite.

Entregables:

- Nuevas vistas operativas en frontend.
- Endpoints de consulta por cola de trabajo.
- Indicadores rápidos en cada bandeja.

Criterios de éxito:

- El equipo puede iniciar el día sabiendo qué atender primero.
- Se reduce el uso de filtros manuales repetitivos.

### 5.5. Acciones masivas

Problema actual:

- Muchas tareas deben repetirse estudiante por estudiante.

Alcance:

- Selección múltiple de estudiantes.
- Cambio masivo de estado.
- Notificación masiva filtrada.
- Exportación masiva por subconjunto.
- Asignación de responsables por lote.

Entregables:

- Tabla con selección múltiple.
- Endpoints batch controlados por permisos.
- Confirmaciones y resúmenes post acción.

Criterios de éxito:

- Disminuye el tiempo operativo en tareas repetitivas.
- Se reduce la intervención manual en lotes grandes.

### 5.6. Centro de alertas

Problema actual:

- El sistema muestra información, pero todavía no alerta con intención operativa.

Alcance:

- Alertas por documentos faltantes prolongados.
- Alertas por expedientes sin seguimiento.
- Alertas por importaciones con conflictos.
- Alertas por diferencias entre fuentes.
- Alertas por correos no enviados o fallidos.

Entregables:

- Panel de alertas priorizadas.
- Clasificación por severidad.
- Acciones rápidas desde la alerta.

Criterios de éxito:

- El sistema avisa riesgos antes de que el usuario los detecte manualmente.

### 5.7. Timeline por estudiante

Problema actual:

- La ficha del estudiante no comunica claramente la secuencia de eventos del expediente.

Alcance:

- Línea de tiempo cronológica del caso.
- Eventos de carga, edición, revisión, notificación y archivo.
- Identificación del usuario que ejecutó cada acción.

Entregables:

- Componente de timeline en la vista del estudiante.
- Integración con la bitácora de auditoría.

Criterios de éxito:

- En menos de un minuto se entiende el historial del expediente.

## Fase 3. Calidad de datos e importación inteligente

Horizonte sugerido: 4 a 8 semanas.

Objetivo: reducir errores en la entrada de datos y mejorar la conciliación entre fuentes.

### 5.8. Importación con vista previa

Problema actual:

- La carga procesa directamente el archivo y deja poca oportunidad de corregir antes de guardar.

Alcance:

- Vista previa de las filas detectadas.
- Resumen previo de nuevos, actualizados, duplicados y rechazados.
- Validación de columnas obligatorias.
- Mapeo visible de columnas.
- Confirmación antes de guardar.

Entregables:

- Flujo de importación en dos pasos: analizar y confirmar.
- Reporte visual de errores por fila.
- Descarga de archivo de errores.

Criterios de éxito:

- El usuario detecta problemas antes de impactar la base de datos.
- Baja el volumen de correcciones posteriores.

### 5.9. Conciliación avanzada entre fuentes

Problema actual:

- El cruce existe, pero no se explotan bien los conflictos y discrepancias.

Alcance:

- Vista de conflictos entre SIGU, Avatar y otras fuentes.
- Reglas de precedencia por campo.
- Detección de diferencias de carrera, correo, teléfono o estado.
- Señalización de expedientes con baja confiabilidad.

Entregables:

- Módulo de conflictos de datos.
- Reglas configurables de resolución.
- Estado de conflicto resuelto o pendiente.

Criterios de éxito:

- El equipo puede resolver discrepancias sin depender de revisión manual dispersa.

### 5.10. Plantillas y archivos oficiales

Alcance:

- Plantillas descargables por tipo de importación.
- Guía visual de columnas esperadas.
- Validación del formato antes de importar.

Entregables:

- Catálogo de plantillas oficiales.
- Ayuda contextual en carga de archivos.

## Fase 4. Gestión documental avanzada

Horizonte sugerido: 6 a 10 semanas.

Objetivo: convertir la revisión de documentos en un flujo formal y trazable.

### 5.11. Versionado y detalle documental

Alcance:

- Historial de archivos cargados por documento.
- Fecha de carga y usuario responsable.
- Reemplazo controlado de archivos.
- Motivo de rechazo u observación.

Entregables:

- Modelo de versiones de documentos.
- Vista previa y panel documental por estudiante.

### 5.12. Estados documentales más expresivos

Alcance:

- Estados como pendiente, en revisión, observado, aprobado, rechazado.
- Observaciones predefinidas y personalizadas.
- Semáforos de cumplimiento.

Entregables:

- Nuevo catálogo de estados.
- Lógica de transición entre estados.

### 5.13. Expediente institucional exportable

Alcance:

- Portada institucional.
- Resumen del estudiante.
- Checklist documental.
- Historial del expediente.
- Exportación consolidada en PDF además de ZIP.

Entregables:

- Exportación PDF institucional.
- Diseño formal de expediente.

## Fase 5. Comunicación y seguimiento

Horizonte sugerido: 5 a 8 semanas.

Objetivo: convertir la comunicación con estudiantes en un proceso controlado y medible.

### 5.14. Centro de comunicaciones

Alcance:

- Historial unificado de correos enviados.
- Plantillas con variables.
- Vista previa de mensajes.
- Estado de envío, error o reintento.

Entregables:

- Registro de comunicaciones.
- Panel de plantillas mejorado.
- Métricas de contacto.

### 5.15. Recordatorios y seguimiento automatizado

Alcance:

- Reglas automáticas por tiempo sin respuesta.
- Programación de recordatorios.
- Próxima fecha de seguimiento visible.

Entregables:

- Motor básico de reglas de seguimiento.
- Alertas y recordatorios programados.

## Fase 6. Analítica y control institucional

Horizonte sugerido: 6 a 12 semanas.

Objetivo: que coordinación y jefatura puedan tomar decisiones con datos útiles.

### 5.16. Dashboard ejecutivo

Alcance:

- Embudo del proceso completo.
- Evolución semanal o mensual.
- Pendientes por carrera, sede y tipo de matrícula.
- Tiempo promedio de resolución.
- Riesgos por acumulación.

Entregables:

- Dashboard ejecutivo separado del operativo.
- Comparativos por período.

### 5.17. Reportes de gestión

Alcance:

- Reporte por funcionario.
- Reporte por carrera.
- Reporte por sede.
- Reporte de completitud documental.
- Reporte de tiempos de atención.
- Reporte de productividad.

Entregables:

- Centro de reportes exportables.
- Filtros guardables.

## Fase 7. Configuración institucional y escalabilidad

Horizonte sugerido: 8 a 14 semanas.

Objetivo: adaptar el sistema a ciclos académicos y contextos operativos más amplios.

### 5.18. Configuración por período académico

Alcance:

- Gestión por año y ciclo.
- Separación de campañas ordinarias y extraordinarias.
- Comparativos entre períodos.
- Configuraciones heredables del período anterior.

Entregables:

- Módulo de períodos.
- Filtros globales por campaña.

### 5.19. Catálogos y reglas configurables

Alcance:

- Catálogo de carreras.
- Reglas de documentos requeridos.
- Reglas por tipo de matrícula.
- Configuración de plazos, alertas y prioridades.

Entregables:

- Panel de administración funcional.

### 5.20. Almacenamiento y respaldo

Alcance:

- Estrategia formal de backup.
- Almacenamiento desacoplado del servidor si el volumen crece.
- Limpieza y control de integridad de archivos.

Entregables:

- Política de respaldo.
- Procedimiento de recuperación.

## 6. Iniciativas transversales

Estas mejoras deben acompañar varias fases del roadmap:

### 6.1. Experiencia de usuario

- Mejoras de accesibilidad.
- Mejor navegación móvil.
- Menos clicks para acciones frecuentes.
- Confirmaciones más claras.
- Estados vacíos más útiles.

### 6.2. Observabilidad técnica

- Logs estructurados.
- Monitoreo de errores.
- Métricas de uso.
- Health checks ampliados.

### 6.3. Rendimiento

- Mejor paginación y consultas indexadas.
- Optimización de tablas grandes.
- Cargas y descargas más robustas.

### 6.4. Documentación del producto

- README real del sistema.
- Manual de operación.
- Manual de administrador.
- Guía de despliegue.
- Guía de respaldos.

## 7. Backlog priorizado

## Prioridad alta

- Autenticación backend real.
- Roles y permisos por endpoint.
- Auditoría de acciones.
- Importación con vista previa.
- Bandejas de trabajo.
- Acciones masivas.
- Timeline por estudiante.

## Prioridad media

- Centro de alertas.
- Conciliación avanzada entre fuentes.
- Estados documentales ampliados.
- Historial de versiones de documentos.
- Centro de comunicaciones.
- Reportes de gestión.

## Prioridad baja pero estratégica

- Configuración por período académico.
- Reglas configurables por carrera.
- Exportación PDF institucional.
- Integraciones externas.
- Portal o autoservicio para estudiantes.

## 8. Propuesta de releases

### Release 1. Seguridad y control

Incluye:

- Autenticación backend.
- Roles y permisos.
- Auditoría base.
- Endurecimiento de API.

Resultado esperado:

- Sistema apto para operación más formal.

### Release 2. Operación diaria

Incluye:

- Bandejas de trabajo.
- Acciones masivas.
- Alertas.
- Timeline por estudiante.

Resultado esperado:

- Menor carga manual y más claridad operativa.

### Release 3. Calidad de datos

Incluye:

- Importación en dos pasos.
- Validación previa.
- Reporte de errores.
- Conflictos entre fuentes.

Resultado esperado:

- Menos inconsistencias y menos retrabajo.

### Release 4. Gestión documental y comunicación

Incluye:

- Estados documentales avanzados.
- Historial de archivos.
- Plantillas mejoradas.
- Seguimiento automatizado.

Resultado esperado:

- Flujo documental y de comunicación más profesional.

### Release 5. Analítica institucional

Incluye:

- Dashboard ejecutivo.
- Reportes avanzados.
- Configuración por período.

Resultado esperado:

- Mayor valor para coordinación y toma de decisiones.

## 9. KPIs sugeridos

Para evaluar el avance del roadmap, se recomienda medir:

- Tiempo promedio desde importación hasta expediente completo.
- Porcentaje de expedientes completos por período.
- Cantidad de expedientes pendientes por más de 3, 7 y 14 días.
- Porcentaje de correcciones post importación.
- Cantidad de conflictos entre fuentes por carga.
- Tiempo promedio hasta primer contacto con el estudiante.
- Porcentaje de acciones auditadas correctamente.
- Número de tareas resueltas mediante acciones masivas.

## 10. Riesgos y dependencias

### Riesgos

- Crecimiento del sistema sin reforzar seguridad.
- Incremento del trabajo manual si no se introducen bandejas y automatizaciones.
- Pérdida de trazabilidad en procesos sensibles.
- Dificultad para escalar a nuevos períodos o sedes.

### Dependencias

- Definición de roles reales del negocio.
- Aprobación de reglas de operación por parte del área usuaria.
- Decisión sobre infraestructura de almacenamiento y respaldo.
- Priorización institucional de tiempo de desarrollo.

## 11. Recomendación de inicio

Si se debe elegir solo un primer bloque de trabajo, la recomendación es implementar este paquete inicial:

1. Autenticación backend.
2. Roles y permisos.
3. Auditoría mínima viable.
4. Importación con análisis previo.
5. Bandeja operativa de pendientes.

Ese bloque entrega el mejor equilibrio entre riesgo reducido, mejora real del trabajo diario y preparación del sistema para crecer.

## 12. Conclusión

SIDERMI ya resolvió el problema básico de centralizar datos y revisar expedientes. El siguiente salto de madurez consiste en que el sistema no solo permita registrar información, sino que también gobierne el proceso, reduzca errores, trace responsabilidades y ofrezca control institucional.

El valor más alto no vendrá únicamente de una interfaz más moderna, sino de una operación más segura, guiada, automatizada y medible.