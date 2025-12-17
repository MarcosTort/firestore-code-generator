import * as fs from 'fs';
import * as path from 'path';
import { SchemaAnalyzer } from '../src/schema-analyzer';
import { DartGenerator } from '../src/dart-generator';
import {
  getSampleUserDocuments,
  getSampleProductDocuments,
  getSampleOrderDocuments,
} from './mocks/firestore-mocks';

describe('DartGenerator Golden Tests', () => {
  const goldenDir = path.join(__dirname, '__golden__');
  const shouldUpdateGoldens = process.env.UPDATE_GOLDENS === 'true';

  beforeAll(() => {
    // Ensure golden directory exists
    if (!fs.existsSync(goldenDir)) {
      fs.mkdirSync(goldenDir, { recursive: true });
    }
  });

  /**
   * Helper function to compare generated code with golden file
   */
  function compareWithGolden(testName: string, generatedCode: string): void {
    const goldenPath = path.join(goldenDir, `${testName}.golden.dart`);

    if (shouldUpdateGoldens) {
      // Update mode: write the generated code to golden file
      fs.writeFileSync(goldenPath, generatedCode, 'utf8');
      console.log(`✓ Updated golden file: ${goldenPath}`);
    } else {
      // Test mode: compare generated code with golden file
      if (!fs.existsSync(goldenPath)) {
        throw new Error(
          `Golden file not found: ${goldenPath}\n` +
          `Run tests with UPDATE_GOLDENS=true to create it.`
        );
      }

      const goldenContent = fs.readFileSync(goldenPath, 'utf8');
      
      // Normalize line endings for cross-platform compatibility
      const normalizedGenerated = generatedCode.replace(/\r\n/g, '\n').trim();
      const normalizedGolden = goldenContent.replace(/\r\n/g, '\n').trim();

      expect(normalizedGenerated).toBe(normalizedGolden);
    }
  }

  describe('User Entity Generation', () => {
    it('should generate correct Dart model for users collection', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      compareWithGolden('user_dto', generatedCode);
    });
  });

  describe('Product Entity Generation', () => {
    it('should generate correct Dart model with nested objects and arrays', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleProductDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('products', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      compareWithGolden('product_dto', generatedCode);
    });
  });

  describe('Order Entity Generation', () => {
    it('should generate correct Dart model with complex nested structures', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleOrderDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('orders', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      compareWithGolden('order_dto', generatedCode);
    });
  });

  describe('Schema Analysis', () => {
    it('should correctly detect required vs optional fields', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);

      // Assert - Required fields (present in all documents)
      const requiredFields = schema.fields.filter(f => !f.isOptional);
      const requiredFieldNames = requiredFields.map(f => f.name);
      expect(requiredFieldNames).toContain('id');
      expect(requiredFieldNames).toContain('email');
      expect(requiredFieldNames).toContain('name');
      expect(requiredFieldNames).toContain('isActive');
      expect(requiredFieldNames).toContain('role');
      expect(requiredFieldNames).toContain('createdAt');

      // Assert - Optional fields (not in all documents)
      const optionalFields = schema.fields.filter(f => f.isOptional);
      const optionalFieldNames = optionalFields.map(f => f.name);
      expect(optionalFieldNames).toContain('age');
      expect(optionalFieldNames).toContain('profile');
      expect(optionalFieldNames).toContain('tags');
    });

    it('should correctly detect field types', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);

      // Assert
      const fieldTypes = new Map(schema.fields.map(f => [f.name, f.type]));
      expect(fieldTypes.get('id')).toBe('String');
      expect(fieldTypes.get('email')).toBe('String');
      expect(fieldTypes.get('name')).toBe('String');
      expect(fieldTypes.get('age')).toBe('int');
      expect(fieldTypes.get('isActive')).toBe('bool');
      expect(fieldTypes.get('createdAt')).toBe('DateTime');
      expect(fieldTypes.get('tags')).toBe('List<String>');
    });

    it('should detect nested objects and create nested classes', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);

      // Assert
      const profileField = schema.fields.find(f => f.name === 'profile');
      expect(profileField).toBeDefined();
      expect(profileField?.nestedSchema).toBeDefined();
      expect(profileField?.nestedSchema?.className).toBe('UserProfile');
      
      // Check nested class is included
      expect(schema.nestedClasses).toBeDefined();
      expect(schema.nestedClasses?.length).toBeGreaterThan(0);
      
      const profileClass = schema.nestedClasses?.find(c => c.className === 'UserProfile');
      expect(profileClass).toBeDefined();
      expect(profileClass?.fields.length).toBeGreaterThan(0);
    });

    it('should detect arrays of objects and create item classes', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const documents = getSampleProductDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('products', documents);

      // Assert
      const reviewsField = schema.fields.find(f => f.name === 'reviews');
      expect(reviewsField).toBeDefined();
      expect(reviewsField?.listItemSchema).toBeDefined();
      expect(reviewsField?.listItemSchema?.className).toBe('ProductReview');
      expect(reviewsField?.type).toBe('List<ProductReview>');
    });
  });

  describe('Code Generation Features', () => {
    it('should include Equatable import', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      expect(generatedCode).toContain("import 'package:equatable/equatable.dart';");
    });

    it('should generate fromJson factory constructor', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      expect(generatedCode).toContain('factory UserDTO.fromJson(Map<String, dynamic> json)');
    });

    it('should generate toJson method', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      expect(generatedCode).toContain('Map<String, dynamic> toJson()');
    });

    it('should generate Equatable props', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      expect(generatedCode).toContain('@override');
      expect(generatedCode).toContain('List<Object?> get props =>');
    });

    it('should handle DateTime fields correctly', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      expect(generatedCode).toContain('DateTime.parse');
      expect(generatedCode).toContain('.toIso8601String()');
    });

    it('should handle optional fields with null checks in toJson', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();
      const generator = new DartGenerator();
      const documents = getSampleUserDocuments();

      // Act
      const schema = analyzer.analyzeDocuments('users', documents);
      const generatedCode = generator.generateModel(schema);

      // Assert
      expect(generatedCode).toMatch(/if \(.+? != null\)/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty documents array gracefully', () => {
      // Arrange
      const analyzer = new SchemaAnalyzer();

      // Act & Assert
      expect(() => {
        analyzer.analyzeDocuments('empty_collection', []);
      }).toThrow('No documents to analyze');
    });

    it('should handle documents with all different types (dynamic)', () => {
      // This would test the fallback to dynamic type
      // Implementation depends on your specific needs
    });
  });
});

