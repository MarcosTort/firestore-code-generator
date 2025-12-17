# Tests for Firestore Dart Generator

This directory contains the test suite for the Firestore Dart Generator project.

## 📁 Structure

```
test/
├── __golden__/              # Golden files (expected output)
│   ├── user_dto.golden.dart
│   ├── product_dto.golden.dart
│   └── order_dto.golden.dart
├── fixtures/                # Test data fixtures (if needed)
├── mocks/                   # Mock implementations
│   └── firestore-mocks.ts   # Firestore document mocks
├── dart-generator.golden.test.ts  # Golden tests for Dart generation
└── README.md               # This file
```

## 🧪 Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Update golden files
```bash
npm run test:update-goldens
```

## 🎯 Golden Tests

Golden tests (also known as snapshot tests or approval tests) compare the generated output against pre-approved "golden" reference files.

### How it works

1. **Generate code**: Tests run the schema analyzer and code generator with mock Firestore data
2. **Compare output**: Generated code is compared against golden files in `__golden__/`
3. **Pass/Fail**: Test passes if output matches golden file exactly

### When to update golden files

Update golden files when you intentionally change the code generation output:

```bash
npm run test:update-goldens
```

**⚠️ Important**: Always review the diff before committing updated golden files!

## 📝 Test Cases

### User Entity Generation
Tests the generation of a user model with:
- Required and optional fields
- Nested objects (profile)
- Arrays of primitives (tags)
- DateTime fields
- Metadata objects

### Product Entity Generation
Tests complex nested structures:
- Nested objects (specifications)
- Arrays of objects (reviews)
- Multiple image URLs
- Price and stock tracking

### Order Entity Generation
Tests advanced features:
- Complex nested items array
- Shipping address object
- Multiple DateTime fields
- Numeric calculations

### Schema Analysis Tests
- Field type detection (String, int, double, bool, DateTime)
- Required vs optional field detection
- Nested object schema extraction
- Array type detection
- List of objects handling

### Code Generation Features
- Equatable import
- fromJson factory constructor
- toJson method
- Equatable props
- DateTime serialization
- Optional field null checks

## 🔧 Mocks

### firestore-mocks.ts

Provides helper functions to create mock Firestore documents:

```typescript
import { getSampleUserDocuments } from './mocks/firestore-mocks';

const documents = getSampleUserDocuments();
const schema = analyzer.analyzeDocuments('users', documents);
```

Available mock collections:
- `getSampleUserDocuments()` - 3 user documents
- `getSampleProductDocuments()` - 2 product documents  
- `getSampleOrderDocuments()` - 1 order document

## 📊 Coverage

Run coverage report:
```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.

## 🐛 Debugging Tests

### View verbose output
```bash
npm test -- --verbose
```

### Run specific test file
```bash
npm test dart-generator.golden.test
```

### Run specific test case
```bash
npm test -- -t "should generate correct Dart model for users"
```

## ✅ Best Practices

1. **Always run tests before committing**
   ```bash
   npm test
   ```

2. **Update golden files intentionally**
   - Review diffs carefully
   - Commit golden files with code changes
   - Add explanation in commit message

3. **Add tests for new features**
   - Add new mock data to `firestore-mocks.ts`
   - Create new test cases
   - Generate new golden files

4. **Keep tests isolated**
   - Each test should be independent
   - Use fresh instances of analyzer/generator
   - Don't share state between tests

## 🔄 CI/CD Integration

Tests are automatically run in CI/CD pipeline. Golden files must match exactly for tests to pass.

If tests fail in CI:
1. Pull latest changes
2. Run `npm test` locally
3. If intentional change: `npm run test:update-goldens`
4. Commit updated golden files
5. Push changes

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Golden Testing Pattern](https://github.com/google/go-golden)
- [TypeScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

