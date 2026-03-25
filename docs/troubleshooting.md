# Troubleshooting

## `PnP.PowerShell module was not found`

- instalar el modulo:

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

## `A ClientId is required`

- pasar `-ClientId` al script;
- o definir la variable de entorno `ENTRAID_APP_ID`.

## El lookup no encuentra la lista maestra

- verificar orden de provision;
- confirmar que el contenedor maestro ya existe;
- comprobar que no se ha cambiado el nombre URL esperado (`MM_*`).

## El import de reuniones falla por el organizador

- asegurar que el usuario existe y es resoluble en el sitio;
- revisar formato de correo en el CSV;
- validar permisos del usuario en la coleccion de sitios.

## Las vistas no aparecen

- revisar permisos del script;
- verificar que no existan vistas previas con el mismo nombre;
- repetir provision una vez creados todos los campos.

## Los permisos no se aplican

- comprobar que los grupos existen en el sitio;
- revisar el JSON de entorno;
- verificar que el usuario ejecutor puede romper herencia y asignar roles.
