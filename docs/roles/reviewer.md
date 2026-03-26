# Revisor

## Misión
Última línea de defensa antes de hacer push. No avanza si hay deuda técnica silenciosa. El Revisor lee el código como si fuera un desarrollador nuevo que va a mantenerlo.

---

## Cuándo actuar

El Revisor entra **después de que QA haya pasado** todos los tests. No revisa código sin cobertura de tests.

---

## Checklist completo

### Arquitectura y capas

- [ ] Ningún fichero importa de una capa superior a la suya
- [ ] No hay acceso directo a Supabase fuera de `infrastructure/` (salvo excepción documentada)
- [ ] No hay lógica de negocio en las pantallas (debe estar en use cases)
- [ ] No hay lógica de presentación en los use cases (formato de texto, colores, etc.)
- [ ] Los stores solo llaman a use cases, no al repo directamente
- [ ] Los nuevos ficheros están en el directorio correcto según su responsabilidad

### Código

- [ ] Sin `console.log`, `console.warn`, `console.error` que no sean errores reales
- [ ] Sin código comentado
- [ ] Sin TODOs o FIXMEs
- [ ] Sin tipos `any` no justificados (un `any` justificado lleva comentario)
- [ ] Sin variables o imports declarados y no usados
- [ ] Sin funciones definidas y no llamadas
- [ ] El manejo de errores usa el patrón correcto: `err instanceof Error ? err.message : Strings.errorFallback`
- [ ] Los strings de error de Zustand usan el fallback de `strings.ts`, no literales inline

### UI y pantallas

- [ ] Todos los literales visibles al usuario están en `strings.ts`
- [ ] `StyleSheet.create` está al final del fichero
- [ ] La pantalla usa `useFocusEffect` para recargar (no `useEffect` con dependencias frágiles)
- [ ] Hay estado de carga (`ActivityIndicator`) y estado vacío diferenciados
- [ ] El botón de submit se deshabilita durante `isCreating` / `isLoading`

### Tests

- [ ] `npx jest --no-coverage` pasa al 100% incluyendo los nuevos tests
- [ ] Los tests nuevos no son superfluos (verifican estado, no solo que el mock fue llamado)
- [ ] No hay tests duplicados que verifiquen exactamente lo mismo
- [ ] La cobertura no ha bajado respecto al commit anterior

### BACKLOG y documentación

- [ ] `BACKLOG.md` tiene la historia cerrada con el formato estándar completo
- [ ] Las métricas finales (test suites / tests) son correctas y actuales
- [ ] No hay historias en "En curso" que deberían estar en "Completado"

---

## Semáforo de salida

| Color | Condición | Acción |
|---|---|---|
| 🟢 Verde | Todo el checklist OK | Push |
| 🟡 Amarillo | Issues menores (un `any`, un string inline, un test superficial) | Corregir en el mismo commit, luego push |
| 🔴 Rojo | Arquitectura rota, tests que no detectan errores, deuda técnica que se acumula | Parar, comunicar, no hacer push hasta resolver |

---

## Decisiones frecuentes del Revisor

**¿Merece la pena refactorizar esto ahora?**
Solo si el código duplicado va a ser tocado en la próxima historia. Si no, anotarlo en BACKLOG como mejora futura.

**¿Este `any` está justificado?**
Aceptable en: mapeo de filas de Supabase (`row: any` en el `mapRow` del repositorio), respuestas de APIs externas con tipos no controlados. No aceptable en: lógica de negocio, stores, use cases.

**¿Este test añade valor real?**
Un test añade valor si, al borrar la línea de código que verifica, el test falla. Si el test pasa aunque borres la lógica → es un test vacío → eliminarlo o reescribirlo.

**¿Es código muerto?**
Si una función o componente no se importa en ningún lado → eliminar. Si un estado del store nunca se lee → eliminar. Si una prop nunca se pasa → eliminar.
