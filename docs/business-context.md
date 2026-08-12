# Contexto de negocio

## El cliente

**Oldemar Villagrán Zelaya** es dueño de una empresa de transporte y logística en
Guatemala. Su servicio principal es la renta de cabezales, furgones refrigerados de 48
pies y pilotos profesionales, facturados con tarifas mensuales fijas. También hace
trabajos de outsourcing de maquinaria/equipo y personal operativo.

Comercialmente opera bajo el nombre **"Servicios Generales TPM"**, y factura a través de
**4 entidades distintas**:

- **SIAP** (Corporación SIAP S.A., Guatemala)
- **Estados Unidos**
- **Panamá**
- **Individual** (persona individual, no sociedad registrada)

Tiene además un socio informal ("de palabra", sin sociedad registrada formalmente) con
quien comparte la operación de una de estas empresas. Ese socio necesita ver y generar
documentos, pero **solo de la empresa que llevan juntos** — nunca de las otras tres.

El logo real del negocio es un **engranaje azul**. No tiene todavía un logo pulido/
vectorizado de alta calidad — mejorarlo es una tarea de Fase 3, no de este desarrollo.

## Cómo trabaja hoy (el problema que resuelve el sistema)

Antes de este sistema, Oldemar generaba todo a mano en Word y Excel:

- Cada cotización se escribía copiando un formato de Word, sin ningún control
  automático de numeración. Los correlativos se llevaban de memoria, se repetían, o se
  les agregaba una letra para diferenciarlos cuando chocaban.
- No había forma de ver, de un vistazo, qué cotizaciones estaban pendientes de
  respuesta, cuáles se habían aceptado, o cuáles se habían vencido sin que nadie se
  diera cuenta.
- El seguimiento de cada cliente dependía de la memoria o de buscar entre archivos.
- Los documentos con mucho detalle (como cambios de estructura o mantenimientos, no solo
  renta mensual) los maneja en **Excel**, donde las celdas de descripción crecen solas
  según el contenido — este comportamiento es explícitamente algo que quiere conservar
  en el sistema nuevo (ver `document-export.md`).

## Los dos formatos de documento que ya existían

1. **"Cotización para facturación"** — formato simple, usado para el servicio mensual
   recurrente (renta de cabezal + furgón). Un cliente recurrente recibe básicamente la
   misma cotización mes a mes; solo cambian la fecha y el correlativo.
2. **"Propuesta de servicios"** — formato completo, usado al negociar con un cliente
   nuevo. Incluye una portada institucional (Definición Empresarial, Misión, Visión,
   Política de Calidad, Lema, Valores, Recurso Humano, Nuestros Servicios) seguida de la
   cotización detallada por renglón (cabezal, furgón, piloto por separado).

El sistema agrega un tercer tipo: **Factura** — mismo motor de datos, otro rótulo. No
sustituye ni se conecta con **Digifact**, el sistema de facturación electrónica (FEL)
que el cliente ya usa y seguirá usando para certificar ante la SAT. La factura que
genera este sistema es solo el documento con los datos correctos, listo para pasar a
Digifact sin volver a escribir nada.

## Los dos flujos de cliente

No todos los clientes de Oldemar funcionan igual:

- **Clientes con cotización previa:** se les cotiza el servicio, esperan respuesta, y
  una vez aceptan, se genera la factura.
- **Clientes con orden de compra directa** (ejemplo real: cliente "Panta"): mandan
  directamente su orden de compra y Oldemar genera la factura de una vez, sin pasar por
  el paso de cotización. El sistema no debe forzar una cotización si no hace falta.

## El caso de uso más frecuente: renovación mensual

La mayoría de los meses, la cotización de un cliente recurrente es idéntica a la
anterior — solo cambia la fecha (y el correlativo). Esto ya se validó con el cliente
usando una función de "Duplicar": copia cliente, servicio y precio de una cotización
existente, y solo actualiza el correlativo (siguiente número de esa empresa) y la fecha
a hoy. El cliente vio esto funcionando en la demo y fue parte de lo que lo convenció.

## Terminología del cliente (usar estos términos, no inventar otros)

| Término del cliente | Qué significa en el sistema |
|---|---|
| Correlativo | Número secuencial único del documento, por empresa |
| Cuadrícula | La tabla/grid del documento — no debe "romperse" al agregar campos nuevos |
| Descripción general | Campo de texto libre que resume el servicio cotizado, ubicado en la sección de datos del documento, no dentro de la tabla de ítems |
| Renglón / ítem | Cada fila de la tabla de servicios cotizados |
| Vigencia / oferta válida hasta | Fecha límite de validez de la cotización |
| Sociedad | La empresa que Oldemar lleva junto con su socio (de palabra, no registrada como tal) |
