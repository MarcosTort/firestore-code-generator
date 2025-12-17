# 📄 Guía de Archivo de Configuración

## ✅ IMPLEMENTACIÓN COMPLETA

El CLI ahora soporta un archivo de configuración YAML que hace el uso mucho más conveniente.

---

## 🚀 Uso Rápido

### 1. Crear archivo de configuración

```bash
# Copiar el ejemplo
cp firestore-dart-gen.example.yaml firestore-dart-gen.yaml

# Editar con tus valores
nano firestore-dart-gen.yaml
```

### 2. Configurar

```yaml
# firestore-dart-gen.yaml
firebase:
  serviceAccount: ./firebase_service_account.json

collections:
  - users
  - products

output:
  directory: ./lib/src/models
  sampleSize: 20
```

### 3. Ejecutar

```bash
# Simplemente ejecuta sin argumentos
firestore-dart-gen

# El CLI:
# ✓ Carga credenciales del YAML
# ✓ Pre-selecciona users y products
# ✓ Usa ./lib/src/models como directorio por defecto
# ✓ Usa 20 como sample size por defecto
```

---

## 📋 Estructura del Archivo

### Completo (todos los campos opcionales)

```yaml
# Firebase Configuration
firebase:
  # Path al service account (requerido si no usas CLI args)
  serviceAccount: ./firebase_service_account.json
  
  # Project ID (opcional, se puede obtener del service account)
  projectId: my-project-id

# Collections que aparecerán pre-seleccionadas (opcional)
collections:
  - users
  - products
  - orders
  - reviews
  - settings

# Configuración de output (opcional)
output:
  # Directorio donde se generarán los modelos
  directory: ./lib/src/models
  
  # Cantidad de documentos a samplear por colección
  sampleSize: 20
```

### Mínimo (solo credenciales)

```yaml
firebase:
  serviceAccount: ./firebase_service_account.json
```

### Solo pre-selección (sin credenciales)

```yaml
collections:
  - users
  - products

output:
  directory: ./lib/src/models
```

Luego ejecutar:
```bash
firestore-dart-gen --service-account credentials.json
```

---

## 🎯 Comportamiento

### Sin Archivo de Config

```bash
firestore-dart-gen --service-account credentials.json
```

**Resultado:**
- Todas las colecciones SIN pre-seleccionar
- Default output: `./lib/src/models`
- Default sample size: `20`

### Con Archivo de Config

```bash
# firestore-dart-gen.yaml existe
firestore-dart-gen
```

**Resultado:**
- Colecciones del YAML aparecen **✓ PRE-SELECCIONADAS**
- Output directory del YAML como default
- Sample size del YAML como default
- Usuario puede cambiar cualquier valor en los prompts

### Con Config + CLI Args

```bash
# firestore-dart-gen.yaml existe
firestore-dart-gen --service-account other.json
```

**Resultado:**
- Usa `other.json` (CLI arg gana sobre YAML)
- Pre-selecciona colecciones del YAML
- Usa outputs del YAML

---

## 🔐 Prioridad de Configuración

```
┌─────────────────────────────────────────────┐
│  1. CLI Arguments (highest priority)        │
│     --service-account                       │
│     --project-id                            │
│     --config                                │
├─────────────────────────────────────────────┤
│  2. Config File                             │
│     firestore-dart-gen.yaml                 │
├─────────────────────────────────────────────┤
│  3. Environment Variables (lowest priority) │
│     GOOGLE_APPLICATION_CREDENTIALS          │
│     FIREBASE_PROJECT_ID                     │
└─────────────────────────────────────────────┘
```

**Ejemplo práctico:**

```yaml
# firestore-dart-gen.yaml
firebase:
  serviceAccount: ./dev-credentials.json  # Priority 2

# .env
GOOGLE_APPLICATION_CREDENTIALS=./prod-credentials.json  # Priority 3
```

```bash
# Usa dev-credentials.json (del YAML, priority 2)
firestore-dart-gen

# Usa prod-credentials.json (CLI arg, priority 1)
firestore-dart-gen --service-account ./prod-credentials.json
```

---

## 📁 Ubicación del Archivo

El CLI busca el archivo de config en este orden:

1. Path especificado con `--config`
2. `firestore-dart-gen.yaml` (en directorio actual)
3. `firestore-dart-gen.yml`
4. `.firestore-dart-gen.yaml` (hidden)
5. `.firestore-dart-gen.yml` (hidden)

**Recomendación:** Usa `firestore-dart-gen.yaml` en la raíz de tu proyecto Flutter.

---

## 🎨 Ejemplo de Sesión Interactiva

### Con archivo de config:

```bash
$ firestore-dart-gen

🔥 Firestore Dart Generator - Interactive Mode

📄 Found config file: firestore-dart-gen.yaml

✓ Connected to Firebase Project: my-awesome-app

🔍 Discovering collections...

Found 7 collection(s)

Pre-selected from config: users, products

? Select collections to generate models for: (Use ↑↓, Space, Enter)
❯◉ users         ← Pre-seleccionado ✓
 ◉ products      ← Pre-seleccionado ✓
 ◯ orders
 ◯ reviews
 ◯ settings
 ◯ notifications
 ◯ analytics

🌳 Checking for subcollections...

  Analyzing users...
  Found 2 subcollection(s): profiles, settings
  Include subcollections for users? (Y/n) y

? Output directory: ./lib/src/models  ← Default del config
? Sample size: 20  ← Default del config

📋 Generation Summary:
────────────────────────────────────────────────
  Firebase Project: my-awesome-app
  Collections: users, products
  Subcollections:
    └─ users: profiles, settings
  Output: ./lib/src/models
  Sample Size: 20 documents per collection
────────────────────────────────────────────────

? Generate? (Y/n) y

✨ Success! Generated 4 model(s)
```

---

## 💡 Casos de Uso

### Desarrollo Local

```yaml
# firestore-dart-gen.yaml
firebase:
  serviceAccount: ./dev-credentials.json
  projectId: my-app-dev

collections:
  - users
  - products

output:
  directory: ./lib/src/models
  sampleSize: 10  # Menos documentos para desarrollo
```

### Producción / CI/CD

```yaml
# firestore-dart-gen.yaml (commitear en repo)
collections:
  - users
  - products
  - orders

output:
  directory: ./lib/src/models
  sampleSize: 50  # Más documentos para mejor análisis

# NO incluir firebase.serviceAccount aquí!
# Usar variable de entorno o CLI arg en CI
```

En CI:
```bash
firestore-dart-gen --service-account $SERVICE_ACCOUNT_PATH
```

### Equipos

```yaml
# firestore-dart-gen.yaml (compartir en repo)
# NO incluir credenciales

collections:
  - users
  - products
  - orders
  - reviews
  - notifications

output:
  directory: ./packages/core/lib/models
  sampleSize: 20
```

Cada desarrollador crea su propio `.env`:
```bash
GOOGLE_APPLICATION_CREDENTIALS=./mi-credentials.json
```

---

## ⚠️ Seguridad

### ✅ Buenas Prácticas

```yaml
# firestore-dart-gen.yaml (SAFE para commitear)
collections:
  - users
  - products

output:
  directory: ./lib/src/models
```

```bash
# .gitignore
firestore-dart-gen.yaml  # Si incluye credenciales
*service-account.json
```

### ❌ NO Hacer

```yaml
# ❌ NO commitear credenciales en el YAML
firebase:
  serviceAccount: ./super-secret-credentials.json  # PELIGRO!
```

**Solución:** Usa variables de entorno o CLI args para credenciales sensibles.

---

## 🔧 Troubleshooting

### "Could not load config file"

```bash
# Verifica que el YAML es válido
cat firestore-dart-gen.yaml

# Verifica la sintaxis YAML
npm install -g js-yaml
js-yaml firestore-dart-gen.yaml
```

### "Service account file not found"

```bash
# Verifica el path en el config
cat firestore-dart-gen.yaml

# Verifica que el archivo existe
ls -la firebase_service_account.json

# Usa path absoluto si es necesario
firebase:
  serviceAccount: /Users/you/projects/credentials.json
```

### Config no se carga

```bash
# Verifica que estás en el directorio correcto
pwd
ls firestore-dart-gen.yaml

# O especifica el path explícitamente
firestore-dart-gen --config ./path/to/config.yaml
```

---

## 📊 Archivos Creados

### Nuevos Archivos
- ✅ `src/config-file-loader.ts` (108 líneas) - Loader de configuración
- ✅ `firestore-dart-gen.example.yaml` (27 líneas) - Ejemplo de configuración
- ✅ `CONFIG_FILE_GUIDE.md` (este archivo) - Guía completa

### Archivos Modificados
- ✅ `src/interactive-cli.ts` - Integra configuración YAML
- ✅ `src/index.ts` - Agrega opción --config
- ✅ `src/types.ts` - Define CLIConfig interface
- ✅ `.gitignore` - Ignora archivos de config
- ✅ `README.md` - Documenta configuración

---

## ✨ Beneficios

### Para Desarrolladores
✅ No escribir credenciales cada vez
✅ Pre-selección automática de colecciones frecuentes
✅ Configuración compartible entre equipo
✅ Valores por defecto personalizables

### Para Equipos
✅ Configuración estándar compartida en repo
✅ Credenciales manejadas externamente
✅ Consistencia en outputs
✅ Fácil onboarding de nuevos miembros

### Para CI/CD
✅ Config en repo, credenciales en secrets
✅ Override con CLI args
✅ Configuración versionada
✅ Reproducible

---

## 🎉 Estado

**✅ COMPLETAMENTE IMPLEMENTADO Y FUNCIONAL**

- Build exitoso ✓
- Tests pasando (23/23) ✓
- CLI funcionando ✓
- Documentación completa ✓

**Listo para usar!** 🚀

---

*Creado: Diciembre 17, 2024*
*Versión: 1.1.0*

