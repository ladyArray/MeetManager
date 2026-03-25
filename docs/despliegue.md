# Despliegue

## Secuencia recomendada

1. Provision de estructura SharePoint.
2. Carga de catalogos y configuracion base.
3. Migracion de datos iniciales si procede.
4. Build y empaquetado SPFx.
5. Carga del `.sppkg` en App Catalog.
6. Aprobacion de permisos API si aplica.
7. Insercion de webparts en paginas modernas o exposicion en Teams.
8. Validacion funcional post-despliegue.

## Build SPFx

```powershell
npm install
npm run build
npm run package-solution
```

Artefacto esperado:

- `sharepoint/solution/meet-manager.sppkg`

## Despliegue en SharePoint Online

1. Subir el paquete al App Catalog.
2. Confiar la solucion si la politica del tenant lo permite.
3. Aprobar permisos API si el paquete los declara.
4. Agregar los webparts a la pagina destino.

## Despliegue por entornos

- `dev`: validacion tecnica y seed data ligera
- `int`: validacion integrada con permisos y pruebas funcionales
- `pre`: ensayo general con datos cercanos a produccion
- `prod`: despliegue controlado y con checklist post-despliegue

## Riesgos

- diferencias de permisos entre entornos;
- listas creadas manualmente con nombres distintos;
- `ClientId` no disponible en el host de automatizacion;
- permisos Graph insuficientes para escenarios Teams/calendario.
