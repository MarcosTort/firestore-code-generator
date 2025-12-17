# Example: How to Use Golden Tests

This guide demonstrates how to use the golden test system to verify Dart code generation.

## 🎯 Quick Example

### Step 1: Create Mock Firestore Data

```typescript
import { createMockDocumentSnapshot, createTimestamp } from './mocks/firestore-mocks';

// Create a mock Firestore document
const userDoc = createMockDocumentSnapshot('user123', {
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  createdAt: createTimestamp('2024-03-15T10:00:00Z'),
});
```

### Step 2: Analyze Schema

```typescript
import { SchemaAnalyzer } from '../src/schema-analyzer';

const analyzer = new SchemaAnalyzer();
const schema = analyzer.analyzeDocuments('users', [userDoc]);

// Schema will contain:
// - className: 'UserDTO'
// - fields: [{ name: 'id', type: 'String', isOptional: false, ... }, ...]
// - nestedClasses: [...]
```

### Step 3: Generate Dart Code

```typescript
import { DartGenerator } from '../src/dart-generator';

const generator = new DartGenerator();
const dartCode = generator.generateModel(schema);

console.log(dartCode);
// Output:
// import 'package:equatable/equatable.dart';
//
// class UserDTO extends Equatable {
//   const UserDTO({ ... });
//   factory UserDTO.fromJson(...) { ... }
//   Map<String, dynamic> toJson() { ... }
// }
```

### Step 4: Compare with Golden File

```typescript
// In your test
compareWithGolden('user_dto', dartCode);

// This will:
// 1. Read test/__golden__/user_dto.golden.dart
// 2. Compare generated code with golden file
// 3. Throw error if they don't match
```

## 📝 Complete Test Example

```typescript
import { SchemaAnalyzer } from '../src/schema-analyzer';
import { DartGenerator } from '../src/dart-generator';
import { createMockDocumentSnapshot } from './mocks/firestore-mocks';

describe('My Feature Test', () => {
  it('should generate Dart model from Firestore JSON', () => {
    // 1. Arrange: Create mock Firestore data
    const documents = [
      createMockDocumentSnapshot('doc1', {
        id: 'task1',
        title: 'Buy groceries',
        completed: false,
        priority: 5,
      }),
      createMockDocumentSnapshot('doc2', {
        id: 'task2',
        title: 'Write tests',
        completed: true,
        priority: 10,
        dueDate: createTimestamp('2024-12-31T23:59:59Z'),
      }),
    ];

    // 2. Act: Analyze and generate
    const analyzer = new SchemaAnalyzer();
    const schema = analyzer.analyzeDocuments('tasks', documents);
    
    const generator = new DartGenerator();
    const dartCode = generator.generateModel(schema);

    // 3. Assert: Verify structure
    expect(dartCode).toContain('class TaskDTO extends Equatable');
    expect(dartCode).toContain('factory TaskDTO.fromJson');
    expect(dartCode).toContain('final String title');
    expect(dartCode).toContain('final bool completed');
    expect(dartCode).toContain('final int priority');
    expect(dartCode).toContain('final DateTime? dueDate'); // Optional
  });
});
```

## 🔄 Update Golden Files Workflow

### When to Update

Update golden files when you intentionally change the code generation:

1. **After improving the template**
   ```bash
   # Edit src/templates/model.hbs
   npm run test:update-goldens
   git diff test/__golden__/  # Review changes
   git add test/__golden__/
   git commit -m "feat: improve Dart code generation template"
   ```

2. **After adding new features**
   ```bash
   # Add new test with new mock data
   npm run test:update-goldens
   git add test/__golden__/*.golden.dart
   git commit -m "test: add golden test for new feature"
   ```

3. **After fixing bugs**
   ```bash
   # Fix bug in schema-analyzer.ts
   npm run test:update-goldens
   git diff test/__golden__/  # Verify fix
   ```

### Review Checklist

Before committing updated golden files:

- [ ] Run `git diff test/__golden__/` and review ALL changes
- [ ] Verify changes are intentional and correct
- [ ] Ensure no unintended formatting changes
- [ ] Check that all tests still pass: `npm test`
- [ ] Verify coverage hasn't decreased: `npm run test:coverage`

## 🎨 Adding New Test Cases

### 1. Create Mock Data

```typescript
// In test/mocks/firestore-mocks.ts
export function getSampleTaskDocuments() {
  return [
    createMockDocumentSnapshot('task1', {
      id: 'task1',
      title: 'Task One',
      completed: false,
    }),
  ];
}
```

### 2. Add Test

```typescript
// In test/dart-generator.golden.test.ts
describe('Task Entity Generation', () => {
  it('should generate correct Dart model for tasks collection', () => {
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    const documents = getSampleTaskDocuments();
    
    const schema = analyzer.analyzeDocuments('tasks', documents);
    const generatedCode = generator.generateModel(schema);
    
    compareWithGolden('task_dto', generatedCode);
  });
});
```

### 3. Generate Golden File

```bash
npm run test:update-goldens
```

### 4. Verify

```bash
npm test
cat test/__golden__/task_dto.golden.dart
```

## 🐛 Debugging Failed Tests

### Test fails with "Golden file not found"

```bash
# Solution: Generate the golden file
npm run test:update-goldens
```

### Test fails with diff

```bash
# View the difference
npm test -- --verbose

# If change is correct, update golden
npm run test:update-goldens

# If change is wrong, fix your code
```

### Test passes locally but fails in CI

```bash
# Possible causes:
# 1. Golden files not committed
git status test/__golden__/
git add test/__golden__/*.golden.dart
git commit -m "chore: update golden files"

# 2. Line ending differences (Windows vs Unix)
# Check .gitattributes:
echo "*.dart text eol=lf" >> .gitattributes
```

## 📊 Understanding Coverage Reports

```bash
npm run test:coverage
```

Coverage shows which parts of the code are tested:

- **src/schema-analyzer.ts**: Type detection and schema analysis
- **src/dart-generator.ts**: Code generation and templating
- **src/config-loader.ts**: Not covered (integration test needed)
- **src/firestore-client.ts**: Not covered (requires real Firebase)

### Interpreting Results

```
File                 | % Stmts | % Branch | % Funcs | % Lines
---------------------|---------|----------|---------|--------
schema-analyzer.ts   |   74.13 |    60.62 |   82.6  | 75.75
```

- **% Stmts**: Percentage of statements executed
- **% Branch**: Percentage of if/else branches tested
- **% Funcs**: Percentage of functions called
- **% Lines**: Percentage of lines executed

**Goal**: Aim for >80% coverage on critical paths

## 🚀 Best Practices

### 1. Test Real-World Scenarios

```typescript
// ✅ Good: Real-world document structure
const product = {
  id: 'prod123',
  name: 'Product Name',
  price: 29.99,
  images: ['url1.jpg', 'url2.jpg'],
  specs: { brand: 'BrandName', model: 'v1' },
};

// ❌ Bad: Overly simple
const product = { id: '1', name: 'test' };
```

### 2. Test Edge Cases

```typescript
// Empty arrays
items: []

// Missing optional fields
{ id: '1', name: 'Test' }  // age missing

// Mixed types (should use dynamic)
{ value: 'string' }  // in doc1
{ value: 123 }       // in doc2
```

### 3. Keep Mocks Realistic

```typescript
// ✅ Good: Realistic Firestore data
createdAt: createTimestamp('2024-03-15T10:30:00Z')

// ❌ Bad: Mock data that wouldn't exist in Firestore
createdAt: 'not a real timestamp'
```

### 4. One Golden File Per Entity

```
test/__golden__/
├── user_dto.golden.dart       ✅ One entity
├── product_dto.golden.dart    ✅ One entity
└── combined.golden.dart       ❌ Multiple entities (bad)
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Golden Testing Pattern](https://github.com/google/go-golden)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Dart Code Style Guide](https://dart.dev/guides/language/effective-dart/style)

