# 🚀 Inicio Rápido - Firestore Dart Generator

## Opción 1: Con Archivo de Configuración (Recomendado)

### Paso 1: Crear configuración
```bash
cp firestore-dart-gen.example.yaml firestore-dart-gen.yaml
```

### Paso 2: Editar configuración
```yaml
# firestore-dart-gen.yaml
firebase:
  serviceAccount: ./firebase_service_account.json

collections:
  - users      # Pre-seleccionados
  - products   # Pre-seleccionados

output:
  directory: ./lib/src/models
  sampleSize: 20
```

### Paso 3: Ejecutar
```bash
npm run dev
```

**Resultado:**
- ✅ Carga credenciales automáticamente
- ✅ users y products aparecen pre-seleccionados
- ✅ Puedes agregar/quitar más colecciones
- ✅ Defaults ya configurados

---

## Opción 2: Sin Archivo de Configuración

### Ejecutar directamente
```bash
npm run dev -- --service-account firebase_service_account.json
```

**Resultado:**
- Te pedirá seleccionar colecciones
- Te pedirá configurar output
- Todo manual, más flexible

---

## 📋 Flujo Interactivo

```
🔥 Firestore Dart Generator - Interactive Mode

📄 Found config file: firestore-dart-gen.yaml

✓ Connected to Firebase Project: mi-proyecto

Found 5 collection(s)

Pre-selected from config: users, products

? Select collections: (↑↓ Space Enter)
❯◉ users         ← Pre-seleccionado
 ◉ products      ← Pre-seleccionado
 ◯ orders
 ◯ reviews
 ◯ settings

🌳 Checking for subcollections...

  Analyzing users...
  Found 2 subcollection(s): profiles, settings
  Include subcollections for users? (Y/n) y

? Output directory: ./lib/src/models
? Sample size: 20

📋 Generation Summary:
────────────────────────────────────────────
  Firebase Project: mi-proyecto
  Collections: users, products
  Subcollections:
    └─ users: profiles, settings
  Output: ./lib/src/models
  Sample Size: 20 documents per collection
────────────────────────────────────────────

? Generate Dart models with these settings? (Y/n) y

🚀 Starting generation...

📦 Processing collection: users
Analyzing schema for users...
✓ Detected 10 fields
✓ Generated UserDTO model
  with 2 nested class(es)
✓ Written to: lib/src/models/user_dto.dart

📦 Processing subcollection: users/profiles
...

✨ Success! Generated 4 model(s)

Generated files:
  ✓ lib/src/models/user_dto.dart
  ✓ lib/src/models/profile_dto.dart
  ✓ lib/src/models/setting_dto.dart
  ✓ lib/src/models/product_dto.dart

📚 Next steps:
  1. Review the generated files
  2. Import the models in your Dart code
  3. Add 'equatable' to your pubspec.yaml
```

---

## ⚙️ Configuración Avanzada

### Pre-seleccionar colecciones específicas

```yaml
collections:
  - users
  - products
  - orders
  - reviews
```

Al ejecutar el CLI, estas 4 aparecerán **pre-seleccionadas con ✓**.

### Cambiar directorio de salida

```yaml
output:
  directory: ./packages/core/lib/models
  sampleSize: 50
```

### Override con CLI args

```bash
# Usa prod.json en lugar del del config
firestore-dart-gen --service-account prod.json

# Usa config custom
firestore-dart-gen --config my-config.yaml
```

---

## 🎯 Casos de Uso

### Desarrollo diario
```yaml
# firestore-dart-gen.yaml
firebase:
  serviceAccount: ./dev-credentials.json

collections:
  - users
  - products

output:
  directory: ./lib/src/models
  sampleSize: 10  # Rápido para desarrollo
```

```bash
firestore-dart-gen  # ¡Eso es todo!
```

### Diferentes ambientes

```bash
# Desarrollo
firestore-dart-gen --service-account dev.json

# Staging
firestore-dart-gen --service-account staging.json

# Producción
firestore-dart-gen --service-account prod.json
```

Las colecciones pre-seleccionadas permanecen, solo cambias credenciales.

---

## 🔧 Comandos Útiles

```bash
# Desarrollo con config
npm run dev

# Desarrollo con service account específico
npm run dev -- --service-account credentials.json

# Con config custom
npm run dev -- --config other-config.yaml

# Ver help
npm run dev -- --help

# Build y ejecutar producción
npm run build
npm start

# Ejecutar tests
npm test
```

---

## 📚 Más Información

- **Guía Completa**: [`CONFIG_FILE_GUIDE.md`](CONFIG_FILE_GUIDE.md)
- **Archivo Ejemplo**: [`firestore-dart-gen.example.yaml`](firestore-dart-gen.example.yaml)
- **README Principal**: [`README.md`](README.md)
- **Testing**: [`TESTING.md`](TESTING.md)
- **Publicación**: [`PUBLICACION_NPM.md`](PUBLICACION_NPM.md)

---

## ✅ Checklist para Empezar

- [ ] Crear `firestore-dart-gen.yaml` desde el ejemplo
- [ ] Configurar path de service account
- [ ] Listar colecciones que usas frecuentemente
- [ ] Ejecutar `npm run dev`
- [ ] Seleccionar colecciones (pre-seleccionadas por ti)
- [ ] Revisar modelos generados
- [ ] ¡Listo para usar en tu app Flutter!

---

🎉 **¡Disfruta del nuevo sistema de configuración!**

