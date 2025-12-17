# 📦 Guía para Publicar en NPM

## Paso 1: Preparar el Repositorio en GitHub

### 1.1. Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre sugerido: `firestore-dart-generator`
3. Descripción: "Generate Dart models from Firestore collections by analyzing real document schemas"
4. Público (para que sea accesible)
5. NO inicialices con README (ya lo tienes)
6. Crea el repositorio

### 1.2. Conectar tu proyecto local

```bash
cd /Users/marcostort/Documents/firestore-dart-generator

# Agregar el repositorio remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/firestore-dart-generator.git

# Verificar
git remote -v

# Hacer commit de todos los cambios
git add .
git commit -m "feat: add interactive CLI and complete tests"

# Subir al repositorio
git branch -M main
git push -u origin main
```

### 1.3. Actualizar package.json con la URL del repo

Necesitas actualizar el `repository.url` en `package.json`:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/TU_USUARIO/firestore-dart-generator.git"
},
"homepage": "https://github.com/TU_USUARIO/firestore-dart-generator#readme",
"bugs": {
  "url": "https://github.com/TU_USUARIO/firestore-dart-generator/issues"
}
```

---

## Paso 2: Verificar el Nombre del Paquete

### 2.1. Verificar disponibilidad

```bash
# Buscar si el nombre ya existe
npm search firestore-dart-generator
```

Si el nombre está tomado, considera alternativas:
- `firestore-dart-model-generator`
- `firebase-dart-generator`
- `dart-firestore-codegen`
- `@tu-usuario/firestore-dart-generator` (scoped package)

### 2.2. Si necesitas cambiar el nombre

Actualiza en `package.json`:
```json
"name": "tu-nuevo-nombre",
```

---

## Paso 3: Crear Cuenta en NPM (si no tienes)

### 3.1. Registrarse

1. Ve a https://www.npmjs.com/signup
2. Completa el formulario
3. Verifica tu email

### 3.2. Login desde la terminal

```bash
npm login
# Username: tu-usuario
# Password: tu-contraseña
# Email: tu-email
# OTP (si tienes 2FA habilitado)
```

Verifica que estás logueado:
```bash
npm whoami
```

---

## Paso 4: Preparar para Publicación

### 4.1. Verificar archivos incluidos

Crea `.npmignore` (si quieres excluir archivos del paquete publicado):

```bash
# Crear .npmignore
cat > .npmignore << 'EOF'
# Source files (solo publicamos dist/)
src/
test/
coverage/

# Development files
*.log
.env
.DS_Store
*.test.ts
*.spec.ts
jest.config.js
tsconfig.json

# Documentation (opcional, puedes incluirla)
*.md
!README.md

# Config files
.gitignore
.editorconfig

# Firebase credentials
*service-account.json
firebase_service_account.json
collections.yaml
EOF
```

**Nota:** Si no creas `.npmignore`, npm usará `.gitignore`, lo cual está bien.

### 4.2. Verificar qué se publicará

```bash
# Ver qué archivos se incluirán
npm pack --dry-run

# Esto crea un preview del paquete
```

### 4.3. Build final

```bash
# Asegurarte de que todo compila
npm run build

# Ejecutar tests
npm test

# Verificar que todo funciona
npm start -- --help
```

---

## Paso 5: Publicar

### 5.1. Primera publicación

```bash
# Publicar versión 1.0.0
npm publish
```

Si quieres hacer una versión beta primero:

```bash
# Cambiar version a 1.0.0-beta.1
npm version 1.0.0-beta.1

# Publicar como beta
npm publish --tag beta
```

### 5.2. Verificar publicación

1. Ve a https://www.npmjs.com/package/firestore-dart-generator
2. Verifica que todo se vea bien
3. Prueba instalarlo:

```bash
# En otro directorio
npm install -g firestore-dart-generator

# Probar
firestore-dart-gen --help
```

---

## Paso 6: Actualizar README con Badge

Agrega badges al principio de tu README.md:

```markdown
# Firestore Dart Generator

[![npm version](https://badge.fury.io/js/firestore-dart-generator.svg)](https://www.npmjs.com/package/firestore-dart-generator)
[![npm downloads](https://img.shields.io/npm/dm/firestore-dart-generator.svg)](https://www.npmjs.com/package/firestore-dart-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

...resto del README...
```

---

## Paso 7: Publicar Actualizaciones Futuras

### 7.1. Hacer cambios

```bash
# Hacer tus cambios
git add .
git commit -m "feat: add new feature"
```

### 7.2. Actualizar versión

Usa semantic versioning (semver):

```bash
# Patch (bug fixes): 1.0.0 -> 1.0.1
npm version patch

# Minor (new features): 1.0.0 -> 1.1.0
npm version minor

# Major (breaking changes): 1.0.0 -> 2.0.0
npm version major
```

### 7.3. Publicar

```bash
# Subir a GitHub
git push
git push --tags

# Publicar en npm
npm publish
```

---

## 📋 Checklist Pre-Publicación

- [ ] Repositorio en GitHub creado y pusheado
- [ ] `package.json` tiene repository.url correcto
- [ ] `package.json` tiene homepage y bugs
- [ ] Nombre del paquete disponible en npm
- [ ] Cuenta npm creada y login exitoso
- [ ] README.md completo y claro
- [ ] LICENSE file presente (MIT está bien)
- [ ] `.npmignore` configurado (opcional)
- [ ] `npm run build` exitoso
- [ ] `npm test` pasando
- [ ] `npm pack --dry-run` verificado
- [ ] Version en package.json correcta (1.0.0)

---

## 🚀 Comando Rápido (Todo en Uno)

Una vez que tengas todo configurado:

```bash
# Build, test y publish
npm run build && npm test && npm publish
```

---

## ⚠️ Consideraciones Importantes

### Archivo .npmignore recomendado

```
# Development
src/
test/
coverage/
*.test.ts
*.spec.ts
jest.config.js
tsconfig.json

# Documentation extra (mantén README.md)
TESTING.md
TEST_SUMMARY.md
INTERACTIVE_CLI.md
cli.plan.md
PUBLICACION_NPM.md

# Config
.env
.env.example
.gitignore
.editorconfig

# Firebase
*service-account.json
collections.yaml
collections.example.yaml
```

### Archivos que SÍ deben incluirse

```
✅ dist/                 (código compilado)
✅ README.md            (documentación principal)
✅ LICENSE              (licencia)
✅ package.json         (metadata)
✅ dist/templates/      (templates Handlebars)
```

### Verificar tamaño del paquete

```bash
# Ver tamaño del paquete
npm pack
ls -lh firestore-dart-generator-1.0.0.tgz

# Idealmente < 1MB
```

---

## 🔒 Seguridad

### Antes de publicar:

```bash
# Verificar que no haya credenciales
grep -r "service-account" --exclude-dir=node_modules --exclude-dir=dist .

# Verificar .gitignore
cat .gitignore

# Asegurarte de que estos estén ignorados:
# - *service-account.json
# - .env
# - *.log
```

---

## 📊 Después de Publicar

### Monitorear

1. **npm stats**: https://npm-stat.com/charts.html?package=firestore-dart-generator
2. **GitHub stars**: Anima a los usuarios a dar star
3. **Issues**: Responde issues en GitHub
4. **Versiones**: Mantén el paquete actualizado

### Promoción

1. Tweet sobre el lanzamiento
2. Comparte en Reddit (r/FlutterDev, r/Firebase)
3. Escribe un artículo en Medium/Dev.to
4. Agrega a awesome-flutter lists

---

## 🎯 Ejemplo Completo

```bash
# 1. Verificar estado
npm whoami
git remote -v

# 2. Build y test
npm run build
npm test

# 3. Verificar qué se publicará
npm pack --dry-run

# 4. Publicar
npm publish

# 5. Verificar
npm info firestore-dart-generator

# 6. Instalar y probar
npm install -g firestore-dart-generator
firestore-dart-gen --help
```

---

## 🆘 Troubleshooting

### "You must be logged in to publish"
```bash
npm logout
npm login
```

### "You do not have permission to publish"
```bash
# Verifica el nombre del paquete
npm search firestore-dart-generator

# Si está tomado, cámbialo en package.json
```

### "Package name too similar to existing package"
```bash
# Usa un nombre más específico o scoped
"name": "@tu-usuario/firestore-dart-generator"
```

### "Missing required field: repository"
```bash
# Agrega en package.json:
"repository": {
  "type": "git",
  "url": "git+https://github.com/TU_USUARIO/firestore-dart-generator.git"
}
```

---

## ✅ Éxito!

Una vez publicado, tu paquete estará disponible en:

- **npm**: https://www.npmjs.com/package/firestore-dart-generator
- **Instalar**: `npm install -g firestore-dart-generator`
- **Usar**: `firestore-dart-gen --help`

🎉 ¡Felicidades por publicar tu primer paquete npm!

