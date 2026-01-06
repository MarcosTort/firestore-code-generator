# Firestore Dart Generator

A TypeScript CLI tool that automatically generates Dart models from Firestore collections by analyzing document schemas in your Firebase project.

## Features

- 🎮 **Interactive Mode**: Guided CLI experience with collection selection
- 🔥 Connects directly to Firebase Firestore
- 📊 Analyzes real documents to infer field types
- 🎯 Generates clean Dart models with `fromJson`/`toJson`
- 🔍 Detects optional and nullable fields automatically
- ✅ **Multiple selection**: Choose multiple collections at once with checkboxes
- 🌳 **Auto-discovery**: Automatically detects and offers subcollections
- 🎨 **Auto-formats generated code with `dart format`**
- ⚡ Fast and easy to use

## Installation

### Global Installation (Recommended)

```bash
npm install -g firestore-dart-generator
```

### Using npx (No Installation Required)

```bash
npx firestore-dart-generator --help
```

### Local Installation

```bash
npm install --save-dev firestore-dart-generator
```

## Quick Start

1. **Install the tool**:
   ```bash
   npm install -g firestore-dart-generator
   ```

2. **Run interactively**:
   ```bash
   firestore-dart-gen --service-account firebase_service_account.json
   ```

3. **Follow the prompts**:
   - ✨ View your Firebase project name
   - ✅ Select collections with checkboxes (Space to select, Enter to confirm)
   - 🌳 Choose whether to include subcollections (auto-detected)
   - 📁 Configure output directory and sample size
   - 🎯 Review summary and confirm

Done! Your Dart models are generated.

## Prerequisites

- Node.js 18+ with npm
- Firebase project with Firestore
- Firebase service account JSON file (for authentication)
- (Optional) Dart SDK for auto-formatting

## Firebase Authentication Setup

### 1. Create a Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file securely (e.g., `firebase_service_account.json`)

⚠️ **Important**: Never commit this file to git!

### 2. Configure Environment Variables (Optional)

Create a `.env` file in your project directory:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./firebase_service_account.json
FIREBASE_PROJECT_ID=your-project-id
```

Or use the `--service-account` and `--project-id` flags when running the command.

## Configuration File (Optional)

You can create a `firestore-dart-gen.yaml` file to:
- ✅ Specify Firebase credentials (no need to type them every time)
- ✅ Pre-select collections you use frequently
- ✅ Set default output directory and sample size
- ✅ Share configuration with your team (without credentials)

### Example Configuration

Create `firestore-dart-gen.yaml` in your project root:

```yaml
# Firebase Configuration
firebase:
  serviceAccount: ./firebase_service_account.json
  projectId: my-project-id  # optional

# Pre-select these collections in the CLI
collections:
  - users
  - products
  - orders

# Default output settings
output:
  directory: ./lib/src/models
  sampleSize: 20
  subcollectionSearchLimit: 50  # Max parent docs to search for subcollections
```

Copy from the example file:
```bash
cp firestore-dart-gen.example.yaml firestore-dart-gen.yaml
# Edit with your settings
```

### Usage with Config File

```bash
# CLI will automatically find firestore-dart-gen.yaml
firestore-dart-gen

# Or specify a custom config file
firestore-dart-gen --config my-config.yaml

# Override config with CLI arguments
firestore-dart-gen --service-account other.json
```

### Priority Order

Configuration is resolved in this order (highest to lowest priority):

1. **CLI arguments** (e.g., `--service-account other.json`)
2. **Config file** (`firestore-dart-gen.yaml`)
3. **Environment variables** (`.env` file)

**Example:** If you have `serviceAccount` in the YAML but also pass `--service-account`, the CLI argument wins.

### Benefits

- ✅ Save time - no need to type credentials every run
- ✅ Pre-select collections you work with frequently
- ✅ Team consistency - share same defaults
- ✅ Flexible - can override with CLI args anytime

⚠️ **Important:** Add `firestore-dart-gen.yaml` to `.gitignore` if it contains sensitive paths!

## Usage

### Interactive Mode (Default) 🎮

The tool runs in interactive mode by default, providing a guided experience:

**Features:**
- 🔍 **Auto-discovery**: Automatically lists all collections in your project
- ✅ **Multiple selection**: Use checkboxes to select multiple collections at once
- 🌳 **Subcollection detection**: Automatically finds and offers to include subcollections
- ⚙️ **Easy configuration**: Configure output directory and sample size with prompts
- 📊 **Summary review**: See exactly what will be generated before confirming

**Run the interactive mode:**

```bash
firestore-dart-gen --service-account firebase_service_account.json
```

**Example Session:**

```
🔥 Firestore Dart Generator - Interactive Mode

✓ Connected to Firebase Project: my-awesome-app

🔍 Discovering collections...

Found 5 collection(s)

? Select collections to generate models for: (Use arrow keys, Space to select, Enter to confirm)
❯◯ users
 ◯ products
 ◯ orders
 ◯ reviews
 ◯ settings

🌳 Checking for subcollections...

  Analyzing users...
  Found 2 subcollection(s): profiles, settings
  Include subcollections for users? (Y/n) Yes

? Output directory for generated Dart files: ./lib/src/models
? Number of documents to sample per collection: 20
? Maximum parent documents to search for subcollections: 50

📋 Generation Summary:
────────────────────────────────────────────────────────────
  Firebase Project: my-awesome-app
  Collections: users, products
  Subcollections:
    └─ users: profiles, settings
  Output: ./lib/src/models
  Sample Size: 20 documents per collection
  Subcollection Search Limit: 50 parent documents
────────────────────────────────────────────────────────────

? Generate Dart models with these settings? (Y/n) Yes

🚀 Starting generation...

📦 Processing collection: users
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
  3. Add 'equatable' to your pubspec.yaml if not already present
```

## Legacy Usage (Advanced)

### Batch Mode (Legacy)

*Note: Interactive mode is now recommended for most use cases.*

Extract multiple collections using a YAML configuration file:

1. **Create `collections.yaml`** (or copy from `collections.example.yaml`):

```yaml
collections:
  - name: users
    output: ./lib/src/models
    sampleSize: 20
    subcollections:
      - profiles
      - settings

  - name: products
    output: ./lib/src/models
```

2. **Run the extractor**:

```bash
firestore-dart-gen batch --service-account firebase_service_account.json
```

That's it! All collections in the YAML file will be processed.

### Single Collection Mode (Legacy)

*Note: Interactive mode is now recommended for most use cases.*

For programmatic use or CI/CD, you can still extract collections using the old commands (requires custom wrapper):

```bash
firestore-dart-gen single \
  --collection users \
  --output ./lib/src/models \
  --service-account firebase_service_account.json
```

### With Subcollections

```bash
firestore-dart-gen single \
  --collection orders \
  --subcollections items,shipping_info \
  --output ./lib/src/models \
  --service-account firebase_service_account.json
```

## Command Line Options

### Interactive Mode (Default)

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `--service-account <path>` | No | Path to service account JSON | From env |
| `--project-id <id>` | No | Firebase project ID | From env |

### Batch Mode (Legacy)

| Option | Alias | Required | Description | Default |
|--------|-------|----------|-------------|---------|
| `--config <path>` | `-f` | No | Path to collections.yaml | `collections.yaml` |
| `--service-account <path>` | - | No | Path to service account JSON | From env |
| `--project-id <id>` | - | No | Firebase project ID | From env |

### Single Mode

| Option | Alias | Required | Description | Default |
|--------|-------|----------|-------------|---------|
| `--collection <name>` | `-c` | Yes | Firestore collection name | - |
| `--output <path>` | `-o` | Yes | Output directory for Dart files | - |
| `--subcollections <names>` | `-s` | No | Comma-separated subcollections | - |
| `--service-account <path>` | - | No | Path to service account JSON | From env |
| `--project-id <id>` | - | No | Firebase project ID | From env |
| `--sample-size <number>` | - | No | Number of docs to sample | 20 |

## Configuration File

The `collections.yaml` file defines which collections to extract:

```yaml
collections:
  # Simple collection
  - name: users
    output: ./lib/src/models
    sampleSize: 20  # Optional: number of documents to sample (default: 20)

  # Collection with subcollections
  - name: orders
    output: ./lib/src/models
    subcollections:
      - items          # Will extract from orders/{orderId}/items
      - shipping_info  # Will extract from orders/{orderId}/shipping_info
```

## Generated Output

### Example Input (Firestore Document)

```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "createdAt": Timestamp(2024-01-01),
  "metadata": {
    "source": "mobile"
  }
}
```

### Generated Dart Model

```dart
import 'package:equatable/equatable.dart';

/// {@template user}
/// A model representing a users document from Firestore.
/// {@endtemplate}
class User extends Equatable {
  /// {@macro user}
  const User({
    required this.id,
    required this.email,
    required this.isActive,
    this.age,
    this.name,
    this.createdAt,
    this.metadata,
  });

  /// Creates a [User] from a JSON map.
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      isActive: json['isActive'] as bool,
      age: json['age'] as int?,
      name: json['name'] as String?,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String) 
          : null,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  /// The id field.
  final String id;

  /// The email field.
  final String email;

  /// The isActive field.
  final bool isActive;

  /// The age field.
  final int? age;

  /// The name field.
  final String? name;

  /// The createdAt field.
  final DateTime? createdAt;

  /// The metadata field.
  final Map<String, dynamic>? metadata;

  @override
  List<Object?> get props => [
    id,
    email,
    isActive,
    age,
    name,
    createdAt,
    metadata,
  ];

  /// Converts this [User] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'isActive': isActive,
      if (age != null) 'age': age,
      if (name != null) 'name': name,
      if (createdAt != null) 'createdAt': createdAt?.toIso8601String(),
      if (metadata != null) 'metadata': metadata,
    };
  }
}
```

## Type Detection

The tool automatically detects and maps Firestore types to Dart types:

| Firestore Type | Dart Type |
|----------------|-----------|
| String | `String` |
| Number (integer) | `int` |
| Number (float) | `double` |
| Boolean | `bool` |
| Timestamp | `DateTime` |
| Array | `List<dynamic>` |
| Map | `Map<String, dynamic>` |
| Null/Mixed | `dynamic` |

### Optional Fields

- A field is marked **optional** (`field?`) if it doesn't appear in all sampled documents
- Optional fields use `if (field != null)` in `toJson()`

### Nullable Fields

- A field is marked **nullable** (`Type?`) if it has inconsistent types across documents
- Required fields present in all documents are non-nullable

## Workflow

### 1. Extract Schema

```bash
firestore-dart-gen single \
  --collection users \
  --output ./lib/src/models \
  --service-account firebase_service_account.json
```

### 2. Review and Customize

**Note:** The tool automatically runs `dart format` on generated files, so formatting is already done!

The generated models are basic. You may want to:

- Add more detailed documentation
- Customize field names (if Firestore uses different naming)
- Add validation logic
- Use `json_serializable` for more complex scenarios

### 3. Import in Your Code

```dart
import 'package:your_package/models/user.dart';

final user = User.fromJson(firestoreDoc.data()!);
```

## Troubleshooting

### "Service account file not found"

Make sure the path to your service account JSON is correct. Use absolute paths or paths relative to your current directory.

### "No documents found in collection"

- Verify the collection name is correct
- Ensure the collection has at least one document
- Check Firebase rules allow read access for the service account

### "Multiple types detected" warning

This happens when a field has different types across documents. The tool will use `dynamic` type. Consider:

- Cleaning up inconsistent data in Firestore
- Manually editing the generated model to use the correct type

### "dart command not found" warning

The tool tries to auto-format generated files with `dart format`. If Dart SDK is not in your PATH, you'll see a warning:

```
⚠ Could not format files: dart command not found
```

This is **non-fatal** - your files are still generated correctly, just not formatted. To fix:

1. **Install Dart SDK** (if not installed): https://dart.dev/get-dart
2. **Add to PATH**: Make sure `dart` command is available in your terminal
3. **Manual format**: Run `dart format <output-directory>` manually after generation

Or ignore it - the generated code is valid, just might need manual formatting.

## Development

### Running Locally

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run: `npm run extract` or `npm run extract:single`

### Testing

The project includes comprehensive golden tests to ensure code generation quality:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Update golden files (when intentionally changing output)
npm run test:update-goldens
```

Golden tests verify that the generated Dart code matches expected output exactly. See [test/README.md](test/README.md) for more details.

### Project Structure

```
firestore-dart-generator/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── firestore-client.ts   # Firebase connection
│   ├── schema-analyzer.ts    # Type detection logic
│   ├── dart-generator.ts     # Code generation
│   ├── config-loader.ts      # YAML config loader
│   ├── types.ts              # TypeScript interfaces
│   └── templates/
│       └── model.hbs         # Handlebars template
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Security Notes

- ⚠️ **Never commit** service account JSON files
- Add `*service-account.json` to `.gitignore`
- Use environment variables for sensitive data
- Limit service account permissions to read-only Firestore access

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/MarcosTort/firestore-code-generator/issues) on GitHub.

