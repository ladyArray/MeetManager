# Arquitectura tecnica

## Principios

- separacion estricta entre UI, logica de aplicacion, acceso a datos e integraciones;
- tipado fuerte y contratos explicitos;
- foco en soporte, auditoria y evolucion por fases;
- provisioning repetible y portable entre entornos;
- gobierno de nombres y configuracion externa desde el primer dia.

## Capas del producto

### Presentacion SPFx

`src/webparts/`

- `meetManagerDashboard`: dashboard principal y centro operativo de reuniones.
- `teamsMeetingsPanel`: experiencia compacta orientada a contexto Teams y zonas operativas.

### Dominio compartido

`src/common/`

- `models/`: entidades, enums y contratos tipados.
- `constants/`: nombres recomendados, opciones UI y claves funcionales.
- `validators/`: reglas de negocio de reuniones, conflictos y duracion.
- `utils/`: calculos puros de fechas, vistas y recomendaciones.
- `hooks/`: orquestacion de carga, filtros, guardado y refresco.
- `services/`: proveedores `mock`, `sharepoint` y `graph`.
- `telemetry/`: logger y trazabilidad operativa.

### Provisioning y soporte

`provisioning/`

- `schema/`: fuente de verdad del modelo de informacion.
- `powershell/`: scripts de provision, content types y permisos.
- `powershell/common/`: modulo reutilizable de conexion, esquema, alta de columnas y upserts.

### Migracion y carga inicial

`migration/`

- `mappings/`: referencia de mapeos de importacion.
- `powershell/`: importadores idempotentes de ubicaciones, salas, recursos, plantillas y reuniones.

### Datos de ejemplo y configuracion

`samples/`

- `csv/`: semillas de catalogos y reuniones.
- `json/`: configuracion de entorno y seed data base.

### Documentacion

`docs/`

- arquitectura, datos, despliegue, migracion, permisos, troubleshooting, mantenimiento y plantillas documentales.

## Flujo de datos

```text
WebPart
  -> Hook de pantalla
    -> Servicio seleccionado por factory
      -> SharePoint / Mock / Graph
    -> Validadores y utilidades
  -> Render de UI

Provisioning PowerShell
  -> JSON schema
    -> listas / bibliotecas / vistas / content types
      -> seed data / migracion CSV-JSON
        -> sitio SharePoint Online listo para SPFx
```

## Decisiones clave

### Persistencia

- SharePoint Online es la capa operativa principal.
- Microsoft Graph se usa para enriquecer disponibilidad, usuarios, calendario y Teams.
- Exchange/Graph es la fuente de verdad de disponibilidad de salas; SharePoint guarda el contexto operativo.

### Modelado

- se normalizan asistentes, notas e incidencias para soportar reporting y mantenimiento;
- se mantienen `Choice` para catálogos estables como tipo de reunion, prioridad y estados, evitando lookups innecesarios;
- se usan listas maestras para ubicaciones, salas, recursos y plantillas, donde si aporta valor administrativo real.

### Documentacion

- las definiciones operativas viven en dos capas:
  - Markdown para consumo humano.
  - JSON en `provisioning/schema/` para ejecución y consistencia.

## Estructura de carpetas recomendada

```text
SPFx/
  config/
  docs/
    templates/
  migration/
    mappings/
    powershell/
  provisioning/
    powershell/
      common/
    schema/
      containers/
  samples/
    csv/
    json/
  src/
    common/
      constants/
      hooks/
      models/
      services/
        graph/
        interfaces/
        mock/
        sharepoint/
      telemetry/
      utils/
      validators/
    webparts/
      meetManagerDashboard/
      teamsMeetingsPanel/
  teams/
```

## Limites tecnicos asumidos

- SPFx cliente no debe contener secretos ni credenciales.
- provisiones cross-tenant o de alto privilegio se dejan a scripts administrativos o backend adicional.
- automatismos de sincronizacion desatendida y logica cross-user deben ir a Azure Function, Logic App o Power Automate en una segunda fase.
