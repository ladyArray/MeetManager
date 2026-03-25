# Configuracion por entorno

## Entornos previstos

- `dev`
- `int`
- `pre`
- `prod`

## Valores que deben externalizarse

- `SiteUrl`
- `ClientId`
- nombres de grupos de seguridad
- listas/bibliotecas si se adaptan por entorno
- flags funcionales del producto
- politicas de recomendacion o ventanas horarias

## Ficheros ejemplo

- `samples/json/environment.dev.sample.json`
- `samples/json/environment.int.sample.json`
- `samples/json/environment.pre.sample.json`
- `samples/json/environment.prod.sample.json`

## Reglas

- no hardcodear URLs reales de tenant;
- no guardar secretos en JSON del repositorio;
- usar placeholders y variables de pipeline/host;
- mantener misma taxonomia de nombres entre entornos para reducir divergencias.

## Parametrizacion de scripts

Los scripts admiten:

- `SiteUrl`
- `ClientId`
- `EnvironmentConfigPath`
- `AuthenticationMode`

Si se pasa `EnvironmentConfigPath`, el script puede resolver `SiteUrl` y `ClientId` desde el fichero.
