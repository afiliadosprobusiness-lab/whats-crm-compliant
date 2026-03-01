# Manual Completo de WhatsWidget (Guia simple y detallada)

Version manual: 0.4.10  
Producto: WhatsWidget (CRM para WhatsApp Web)

## 1) Que es WhatsWidget

WhatsWidget es una ayuda para vender y hacer seguimiento por WhatsApp sin perder orden.

En palabras simples:
1. Guarda tus contactos como "leads" (personas interesadas).
2. Te ayuda a recordar a quien responder.
3. Te deja usar mensajes tipo plantilla para ir mas rapido.
4. Te muestra en que etapa esta cada persona (nuevo, contactado, etc.).
5. Te ayuda a trabajar en equipo sin confusiones.

Importante:
1. En el panel dentro de WhatsApp, WhatsWidget NO envia mensajes solo.
2. WhatsWidget inserta texto y tu confirmas envio manual.
3. Para campanas, primero valida reglas de cumplimiento.

## 2) Lo que necesitas antes de usarlo

1. Tener la extension instalada en Chrome.
2. Abrir `web.whatsapp.com` con sesion iniciada.
3. Iniciar sesion en el popup de WhatsWidget.
4. Tener suscripcion activa en tu workspace.

Si falta uno de estos 4 puntos, varias funciones se bloquean para evitar errores.

## 3) Dos lugares donde usaras WhatsWidget

### A. Popup de la extension

Es la ventana que se abre al tocar el icono de la extension.
Aqui haces gestion general:
1. Crear leads.
2. Crear plantillas.
3. Campanas masivas.
4. Importar CSV.
5. Ver paneles de productividad e inbox.

### B. Panel dentro de WhatsApp Web

Aparece sobre `web.whatsapp.com`.
Aqui trabajas en el chat del dia a dia:
1. Guardar lead rapido.
2. Insertar plantilla en la caja de mensaje.
3. Crear recordatorios.
4. Ver contactos por etapa.
5. Usar Kanban.

## 4) Glosario simple

1. Lead: persona o empresa que podria comprarte.
2. Etapa: estado del lead (new, contacted, qualified, won, lost).
3. Plantilla: mensaje base reutilizable.
4. Recordatorio: aviso para no olvidar seguimiento.
5. Segmento/Pestana: filtro guardado para ver solo cierto tipo de leads.
6. Opted_in: contacto con consentimiento para recibir mensajes.
7. Preflight: revision antes de enviar campana para evitar errores.

## 5) Como usar el popup (paso a paso, funcion por funcion)

## 5.1 Acceso

1. Abre popup.
2. Entra con email y password.
3. Si no tienes cuenta, crea owner desde "Crear cuenta owner".

Que veras:
1. Estado de sesion.
2. Estado de suscripcion.
3. Modulos CRM habilitados.

## 5.2 Estado de suscripcion

Si esta inactiva:
1. No podras usar funciones CRM.
2. El sistema lo muestra de forma clara.

Si esta activa:
1. Todo el flujo CRM queda habilitado.

## 5.3 Lead nuevo

Para crear un lead:
1. Escribe nombre.
2. Escribe telefono en formato E.164. Ejemplo: `+51999999999`.
3. Elige consentimiento.
4. Elige etapa.
5. Agrega tags separados por coma (opcional).
6. Guarda.

Que pasa despues:
1. El lead aparece en Kanban.
2. Aparece en filtros e inbox.
3. Ya puedes usar recordatorios y acciones sobre ese lead.

## 5.4 Plantillas

Para crear plantilla:
1. Escribe nombre.
2. Escribe mensaje.
3. Guarda.

Tip:
1. Usa `{{name}}` para personalizar nombre.

Uso:
1. En panel de WhatsApp, insertas plantilla en el chat activo.
2. Tu decides si enviar o editar antes.

## 5.5 Campana masiva

Flujo correcto:
1. Elige nombre de campana.
2. Elige plantilla.
3. Selecciona destinatarios.
4. Pulsa "Validar preflight".
5. Si todo esta bien, pulsa "Crear y enviar".

Diferencia de botones:
1. Validar preflight: solo revisa y NO envia.
2. Crear y enviar: revisa, crea campana y luego ejecuta envio.

Reglas clave:
1. Solo leads `opted_in`.
2. Si no hay consentimiento, la campana puede bloquearse.
3. Si la cuota diaria no alcanza, se bloquea.

## 5.6 Recordatorios

Para crear:
1. Elige lead.
2. Fecha y hora.
3. Nota.
4. Crear recordatorio.

Que veras:
1. Lista de recordatorios.
2. Botones de accion:
   `Calendar`, `Abrir chat`, `Completar`.

## 5.7 Kanban (popup)

Sirve para mover leads entre etapas con arrastrar y soltar.

Ejemplo:
1. Arrastra un lead de `new` a `contacted`.
2. Se guarda en CRM.
3. Se actualiza en panel embebido tambien.

## 5.8 Pestanas personalizadas (segmentos)

Para que sirve:
1. Ver solo un tipo de leads.
2. Trabajar por prioridad.

Como crear:
1. Nombre: ejemplo `Urgentes`.
2. Tipo: `tag`, `source`, `stage`, `urgency`, `agent`.
3. Valor: ejemplo `premium`.
4. Guardar pestana.

Donde aparecen:
1. En el popup, debajo del formulario.
2. En WhatsApp Web, dentro de "Contactos por etapa".

Dato importante:
1. Si intentas crear una pestana igual (mismo tipo + valor), no falla.
2. Se activa automaticamente la existente.

Boton recomendado:
1. "Cargar segmentos recomendados".
2. Crea en un clic filtros base:
   `Leads Calientes`, `Urgentes`, `Premium`, `Negociacion`, `Contactado`, `Referidos`.

## 5.9 Numero no guardado

Sirve para abrir chat con numero que no esta en tu agenda.

Pasos:
1. Escribe telefono E.164.
2. Escribe mensaje opcional.
3. Pulsa "Abrir chat (manual)".

No crea lead automaticamente.
Solo abre chat para que tu atiendas rapido.

## 5.10 Importar CSV a CRM

Esta funcion NO crea chats nuevos por si sola.
Esta funcion crea/actualiza leads en tu CRM.

### Botones

1. Importar CSV: procesa el archivo.
2. Descargar plantilla: baja un archivo modelo listo para usar.

### Formato recomendado

Columnas:
1. `name`
2. `phoneE164`
3. `consentStatus`
4. `consentSource`
5. `stage`
6. `tags`

Delimitadores aceptados:
1. `;`
2. `,`
3. TAB

### Como importar

1. Pulsa "Descargar plantilla".
2. Llena filas en Excel o Google Sheets.
3. Guarda como CSV.
4. Selecciona archivo en popup.
5. Revisa la vista previa.
6. Elige consentimiento y etapa por defecto.
7. Pulsa "Importar CSV".

### Que significa el resultado

Al final veras algo asi: `ok:X | skip:Y | err:Z`

1. ok: filas importadas o actualizadas.
2. skip: filas saltadas (ejemplo, telefono invalido).
3. err: filas que fallaron al guardar.

### Donde aparecen los contactos importados

1. Kanban.
2. Inbox.
3. Contactos por etapa.
4. Segmentos.
5. Destinatarios de campana (si son `opted_in`).

## 5.11 Inbox multiagente

Sirve para repartir trabajo entre personas.

Vistas:
1. Mis leads.
2. Sin asignar.
3. Vencidos.
4. Todos.

Acciones tipicas:
1. Asignar responsable.
2. Ver leads atrasados.
3. Priorizar por carga real.

## 5.12 Productividad

Muestra:
1. Embudo por etapas.
2. Resumen por agente.
3. Indicadores de carga y conversion.

Sirve para decidir:
1. A quien apoyar.
2. Donde se cae el proceso comercial.

## 6) Como usar el panel dentro de WhatsApp (dia a dia)

## 6.1 Barra superior del panel

Controles:
1. Campana de recordatorios vencidos.
2. Blur ON/OFF para demos con privacidad.
3. Minimizar/Expandir panel.

## 6.2 Tabs del panel

1. Inicio: estado de chat, leads calientes, inbox.
2. Leads: datos del lead, etapa, tags, perfil.
3. Acciones: plantillas, notas, recordatorios, copiloto.
4. CRM: Kanban y operacion visual.
5. Tutorial: checklist + guia completa.

## 6.3 Barra de estado junto al input

Muestra:
1. Lead activo o "sin lead".
2. Riesgo.
3. Modo.

Botones:
1. Guardar.
2. Resumen.
3. CRM.

## 6.4 Barra de acciones junto al input

Botones:
1. Plantilla.
2. Sugerir + insertar.
3. Seguimiento.
4. Recordatorio +24h.

Uso recomendado:
1. Atiendes chat.
2. Insertas texto rapido.
3. Envias manualmente.

## 6.5 Lead rapido en el panel

Campos principales:
1. Nombre.
2. Telefono E.164.
3. Etapa.
4. Consentimiento.
5. Responsable.
6. Tags.

Acciones:
1. Guardar lead.
2. Refrescar.
3. Actualizar etapa.

## 6.6 Plantilla operativa (General / Inmobiliaria)

General:
1. Para ventas y servicios en general.

Inmobiliaria:
1. Para compra/venta/alquiler.
2. Incluye ficha mas detallada de perfil.

## 6.7 Contactos por etapa + segmentos

En este bloque puedes combinar:
1. Etapa.
2. Segmento.

Ejemplo util:
1. Etapa `contacted`.
2. Segmento `Urgentes`.
3. Resultado: lista corta de a quien llamar hoy.

## 6.8 Kanban en panel

1. Arrastra lead entre columnas.
2. El sistema guarda la nueva etapa.
3. Todo el equipo ve el cambio.

## 6.9 Notas y recordatorios en panel

1. Guardas nota del chat.
2. Programas recordatorio exacto.
3. Tambien puedes crear seguimiento rapido en horas.

## 6.10 Copiloto asistido

Funciones:
1. Sugerir respuesta.
2. Resumir lead.
3. Siguiente accion.
4. Insertar en chat.
5. Derivar a humano.

Regla:
1. No envia solo.
2. Tu revisas y envias manual.

## 6.11 Tutorial del panel

Incluye:
1. Checklist de avance.
2. Guia completa de funciones.
3. Donde usar cada herramienta.
4. Como usarla sin perder tiempo.

## 7) Casos de uso reales

## Caso 1: Negocio pequeño con muchos mensajes

Problema:
1. Llegan chats, se olvidan respuestas.

Solucion con WhatsWidget:
1. Guardar lead rapido.
2. Segmento `Urgentes`.
3. Recordatorios para cada promesa.
4. Seguimiento diario por etapa.

## Caso 2: Inmobiliaria

Problema:
1. Leads mezclados, poca claridad de perfil.

Solucion:
1. Modo Inmobiliaria.
2. Completar ficha basica.
3. Kanban por avance (contactado, visita, oferta, cierre).
4. Segmentos por tipo de cliente.

## Caso 3: Equipo comercial

Problema:
1. No se sabe quien atiende que.

Solucion:
1. Inbox multiagente.
2. Asignar responsables.
3. Ver vencidos.
4. Repartir carga por datos reales.

## Caso 4: Reactivar base de contactos

Problema:
1. Tienes lista vieja en Excel.

Solucion:
1. Importar CSV.
2. Revisar opt-in.
3. Validar preflight.
4. Ejecutar campana.

## 8) Preguntas frecuentes

## 8.1 "Importe 100 contactos. Por que no veo 100 chats nuevos?"

Porque importar CSV crea leads en CRM, no abre chats automaticos.

Para hablarles:
1. Abre chat por lead manualmente.
2. O usa campana si tienen `opted_in`.

## 8.2 "Me sale preflight bloqueado"

Revisa:
1. Consentimiento.
2. Cuota diaria.
3. Destinatarios invalidos.

Luego corrige y valida de nuevo.

## 8.3 "No me deja seguimiento o recordatorio"

Causa comun:
1. No hay lead guardado en ese chat.

Solucion:
1. Guarda primero nombre + telefono.
2. Luego crea seguimiento o recordatorio.

## 8.4 "No encuentro mi pestana personalizada"

Puede pasar por:
1. Segmento activo distinto.
2. Etapa activa que deja lista vacia.
3. No hay leads que cumplan ese filtro.

## 8.5 "No suena recordatorio"

Revisa:
1. Permiso de notificaciones del navegador.
2. Sesion activa.
3. Hora correcta del recordatorio.

## 9) Buenas practicas (muy recomendadas)

1. Usa telefono E.164 siempre.
2. Guarda lead antes de hacer acciones avanzadas.
3. Usa tags cortos y claros.
4. Crea 4 a 6 segmentos maximo para no sobrecargar.
5. Usa recordatorios para toda promesa al cliente.
6. Revisa inbox vencidos cada dia.
7. Valida preflight siempre antes de campana.

## 10) Rutina diaria sugerida (15 a 25 minutos)

1. Revisa recordatorios vencidos.
2. Revisa inbox `Vencidos`.
3. Revisa segmento `Urgentes`.
4. Atiende y mueve etapas.
5. Deja notas y nuevos recordatorios.
6. Revisa productividad al cierre del dia.

## 11) Rutina semanal sugerida

1. Limpiar tags duplicados.
2. Revisar etapas estancadas.
3. Reasignar leads sin owner.
4. Revisar conversion por etapa.
5. Actualizar plantillas segun objeciones de la semana.

## 12) Lo que WhatsWidget SI hace y NO hace

SI hace:
1. Ordenar gestion comercial.
2. Acelerar respuestas.
3. Dar visibilidad de estado.
4. Evitar olvidar seguimientos.

NO hace:
1. Enviar automaticamente desde panel de WhatsApp Web.
2. Crear chats nuevos solo por importar CSV.
3. Saltarse reglas de cumplimiento.

## 13) Mini plan de arranque (primer dia)

1. Crea 2 o 3 plantillas base.
2. Carga segmentos recomendados.
3. Importa tu base CSV con plantilla descargable.
4. Revisa que todos tengan etapa y consentimiento correcto.
5. Prueba flujo completo con 5 leads reales:
   guardar -> insertar plantilla -> nota -> recordatorio -> mover etapa.

Con eso ya puedes operar de forma ordenada desde el primer dia.

