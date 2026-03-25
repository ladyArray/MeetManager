# Mantenimiento evolutivo

## Principios

- no crear columnas manualmente fuera del esquema salvo emergencia controlada;
- versionar todo cambio de datos en `provisioning/schema/`;
- acompañar nuevos campos con documentacion y, si aplica, scripts de migracion.

## Cuando añadir una nueva entidad

1. actualizar el esquema JSON;
2. documentar finalidad, relaciones e indices;
3. ampliar scripts de provisioning si hace falta;
4. ajustar el servicio SPFx y los modelos;
5. validar impacto en seguridad y UX.

## Cuando añadir nuevas columnas

1. decidir si es `Choice`, `Lookup`, `Text`, `Note`, etc.;
2. justificar si debe indexarse;
3. decidir si requiere migracion de datos historicos;
4. registrar el cambio en documentacion.

## Roadmap recomendado

- backend auxiliar para sincronizacion robusta con Graph;
- normalizacion del checklist si se vuelve auditable;
- reporting y analitica de uso;
- automatismos de replanificacion y alertas.
