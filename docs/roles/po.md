# Product Owner

## Misión
Garantizar que nunca se empieza a codificar sin saber exactamente qué se construye y cómo se valida.

---

## Checklist de entrada
Antes de pasar al Arquitecto, todos los puntos deben estar marcados:

- [ ] La historia tiene ID con formato `RF-Exx-yy` y nombre descriptivo
- [ ] Hay al menos 3 criterios de aceptación medibles (entrada → salida esperada)
- [ ] Los casos límite están identificados (¿qué pasa si está vacío? ¿si hay error de red? ¿si el usuario no tiene datos?)
- [ ] El scope está acotado: se documenta explícitamente qué NO incluye esta historia
- [ ] Las dependencias con otras historias están identificadas
- [ ] La historia puede revertirse de forma independiente (un solo PR, sin mezcla de responsabilidades)

---

## Formato de criterios de aceptación

```
DADO [contexto inicial]
CUANDO [acción del usuario o del sistema]
ENTONCES [resultado observable y medible]
```

**Ejemplo:**
```
DADO que el coach tiene 3 clientes activos
CUANDO aplica el filtro "Activos" y escribe "ana" en el buscador
ENTONCES solo se muestran los clientes activos cuyo nombre o email contenga "ana"
```

---

## Preguntas tipo antes de arrancar

Estas preguntas deben responderse antes de pasar al Arquitecto:

**Sobre los datos:**
- ¿Hay un catálogo base (datos predefinidos) o solo datos creados por el coach?
- ¿Los datos se asignan a atletas? ¿De forma individual o masiva?
- ¿Qué campos son obligatorios y cuáles opcionales?
- ¿Hay validaciones de negocio (unicidad, rangos, dependencias entre campos)?

**Sobre la UI:**
- ¿Hay búsqueda? ¿Filtros? ¿Paginación o lista completa?
- ¿Hay pantalla de detalle o solo lista + formulario de creación?
- ¿Qué ve el usuario cuando no hay datos todavía (estado vacío)?
- ¿Qué ve el usuario cuando hay un error de red?

**Sobre el alcance:**
- ¿Incluye edición o solo creación y borrado?
- ¿Hay diferencia de comportamiento entre coach y atleta?
- ¿Esta historia depende de otra que aún no está hecha?

---

## Tamaño correcto de una historia

- **Demasiado grande:** mezcla creación + edición + asignación + estadísticas
- **Demasiado pequeña:** solo añade un campo a un formulario existente sin valor completo
- **Correcto:** entrega una funcionalidad completa que el usuario puede usar de principio a fin

Si durante el desarrollo la historia crece, **parar y comunicarlo** antes de continuar.

---

## Al cerrar la historia

1. Actualizar `BACKLOG.md` con el formato estándar:
   - `¿Qué hace?` — descripción en lenguaje de producto, sin jerga técnica
   - `Pantallas / flujo` — rutas afectadas y acciones clave
   - `Decisiones de diseño` — solo lo no obvio
   - `Implementación técnica` — 3-5 bullets
   - `Métricas finales` — Test Suites X/X ✅ | Tests Y/Y ✅
2. Hacer push al repositorio remoto con commit descriptivo
