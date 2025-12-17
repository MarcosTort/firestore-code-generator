import { SchemaAnalyzer } from '../src/schema-analyzer';
import { DartGenerator } from '../src/dart-generator';
import { createMockDocumentSnapshot, createTimestamp } from './mocks/firestore-mocks';

/**
 * Integration tests that demonstrate the complete flow:
 * JSON from Firestore → Schema Analysis → Dart Code Generation
 */
describe('Integration Tests: Firestore JSON to Dart Code', () => {
  
  it('should convert simple Firestore document to Dart model', () => {
    // Arrange: Simulate a Firestore document
    const firestoreDocument = createMockDocumentSnapshot('doc1', {
      id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      isActive: true,
    });

    // Act: Analyze and generate
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    
    const schema = analyzer.analyzeDocuments('users', [firestoreDocument]);
    const dartCode = generator.generateModel(schema);

    // Assert: Verify generated code structure
    expect(dartCode).toContain("import 'package:equatable/equatable.dart'");
    expect(dartCode).toContain('class UserDTO extends Equatable');
    expect(dartCode).toContain('factory UserDTO.fromJson');
    expect(dartCode).toContain('Map<String, dynamic> toJson()');
    
    // Verify fields
    expect(dartCode).toContain('final String id');
    expect(dartCode).toContain('final String name');
    expect(dartCode).toContain('final String email');
    expect(dartCode).toContain('final int age');
    expect(dartCode).toContain('final bool isActive');
  });

  it('should handle nested objects from Firestore', () => {
    // Arrange: Firestore document with nested object
    const firestoreDocument = createMockDocumentSnapshot('doc1', {
      id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        zipCode: '94102',
      },
    });

    // Act
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    
    const schema = analyzer.analyzeDocuments('users', [firestoreDocument]);
    const dartCode = generator.generateModel(schema);

    // Assert: Should create nested class
    expect(dartCode).toContain('class UserAddress extends Equatable');
    expect(dartCode).toContain('class UserDTO extends Equatable');
    expect(dartCode).toContain('final UserAddress address');
    expect(dartCode).toContain('UserAddress.fromJson');
  });

  it('should handle DateTime/Timestamp fields', () => {
    // Arrange: Firestore document with Timestamp
    const firestoreDocument = createMockDocumentSnapshot('doc1', {
      id: 'post123',
      title: 'My Blog Post',
      content: 'Lorem ipsum...',
      publishedAt: createTimestamp('2024-03-15T10:30:00Z'),
      updatedAt: createTimestamp('2024-03-16T14:20:00Z'),
    });

    // Act
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    
    const schema = analyzer.analyzeDocuments('posts', [firestoreDocument]);
    const dartCode = generator.generateModel(schema);

    // Assert: DateTime handling
    expect(dartCode).toContain('final DateTime publishedAt');
    expect(dartCode).toContain('final DateTime updatedAt');
    expect(dartCode).toContain('DateTime.parse');
    expect(dartCode).toContain('.toIso8601String()');
  });

  it('should handle arrays of primitives', () => {
    // Arrange: Firestore document with array
    const firestoreDocument = createMockDocumentSnapshot('doc1', {
      id: 'post123',
      title: 'My Blog Post',
      tags: ['flutter', 'dart', 'firebase'],
      likes: [5, 10, 15],
    });

    // Act
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    
    const schema = analyzer.analyzeDocuments('posts', [firestoreDocument]);
    const dartCode = generator.generateModel(schema);

    // Assert: Typed lists
    expect(dartCode).toContain('final List<String> tags');
    expect(dartCode).toContain('final List<int> likes');
  });

  it('should handle arrays of objects', () => {
    // Arrange: Firestore document with array of objects
    const firestoreDocument = createMockDocumentSnapshot('doc1', {
      id: 'order123',
      total: 299.99,
      items: [
        { productId: 'p1', quantity: 2, price: 99.99 },
        { productId: 'p2', quantity: 1, price: 199.99 },
      ],
    });

    // Act
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    
    const schema = analyzer.analyzeDocuments('orders', [firestoreDocument]);
    const dartCode = generator.generateModel(schema);

    // Assert: List of custom objects
    expect(dartCode).toContain('class OrderItem extends Equatable');
    expect(dartCode).toContain('final List<OrderItem> items');
    expect(dartCode).toContain('OrderItem.fromJson');
    expect(dartCode).toContain('.map((e) => e.toJson()).toList()');
  });

  it('should detect optional vs required fields', () => {
    // Arrange: Multiple documents with different field presence
    const doc1 = createMockDocumentSnapshot('doc1', {
      id: 'user1',
      email: 'user1@example.com',
      name: 'User One',
      age: 25,
    });

    const doc2 = createMockDocumentSnapshot('doc2', {
      id: 'user2',
      email: 'user2@example.com',
      name: 'User Two',
      // age is missing - should be optional
    });

    // Act
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    
    const schema = analyzer.analyzeDocuments('users', [doc1, doc2]);
    const dartCode = generator.generateModel(schema);

    // Assert: Required fields (present in all docs)
    expect(dartCode).toMatch(/required this\.id/);
    expect(dartCode).toMatch(/required this\.email/);
    expect(dartCode).toMatch(/required this\.name/);
    
    // Optional field (not in all docs)
    expect(dartCode).toContain('this.age');
    expect(dartCode).not.toMatch(/required this\.age/);
    expect(dartCode).toContain('final int? age');
    expect(dartCode).toMatch(/if \(age != null\)/);
  });

  it('should handle complex real-world document structure', () => {
    // Arrange: Complex e-commerce product document
    const firestoreDocument = createMockDocumentSnapshot('product1', {
      id: 'prod123',
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling headphones',
      price: 299.99,
      currency: 'USD',
      inStock: true,
      stockCount: 45,
      categories: ['Electronics', 'Audio', 'Headphones'],
      images: [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
      ],
      specifications: {
        brand: 'AudioPro',
        model: 'AP-1000',
        color: 'Black',
        weight: 250,
        batteryLife: 30,
      },
      ratings: {
        average: 4.5,
        count: 128,
      },
      reviews: [
        {
          userId: 'u1',
          rating: 5,
          comment: 'Excellent!',
          helpful: 15,
          date: createTimestamp('2024-03-01T10:00:00Z'),
        },
        {
          userId: 'u2',
          rating: 4,
          comment: 'Very good',
          helpful: 8,
          date: createTimestamp('2024-03-10T14:30:00Z'),
        },
      ],
      metadata: {
        createdAt: createTimestamp('2024-01-01T00:00:00Z'),
        updatedAt: createTimestamp('2024-03-15T12:00:00Z'),
        createdBy: 'admin',
      },
    });

    // Act
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    
    const schema = analyzer.analyzeDocuments('products', [firestoreDocument]);
    const dartCode = generator.generateModel(schema);

    // Assert: Complex structure is properly generated
    expect(dartCode).toContain('class ProductDTO extends Equatable');
    expect(dartCode).toContain('class ProductSpecifications extends Equatable');
    expect(dartCode).toContain('class ProductRatings extends Equatable');
    expect(dartCode).toContain('class ProductReview extends Equatable');
    expect(dartCode).toContain('class ProductMetadata extends Equatable');
    
    // Verify nested relationships
    expect(dartCode).toContain('final ProductSpecifications specifications');
    expect(dartCode).toContain('final ProductRatings ratings');
    expect(dartCode).toContain('final List<ProductReview> reviews');
    expect(dartCode).toContain('final ProductMetadata metadata');
    
    // Verify primitive fields
    expect(dartCode).toContain('final String name');
    expect(dartCode).toContain('final double price');
    expect(dartCode).toContain('final bool inStock');
    expect(dartCode).toContain('final List<String> categories');
    expect(dartCode).toContain('final List<String> images');
  });

  it('should generate valid Dart code that compiles', () => {
    // Arrange
    const firestoreDocument = createMockDocumentSnapshot('doc1', {
      id: 'test123',
      value: 42,
    });

    // Act
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    
    const schema = analyzer.analyzeDocuments('tests', [firestoreDocument]);
    const dartCode = generator.generateModel(schema);

    // Assert: Basic syntax checks
    expect(dartCode).toMatch(/class \w+DTO extends Equatable \{/);
    expect(dartCode).toMatch(/factory \w+DTO\.fromJson\(Map<String, dynamic> json\) \{/);
    expect(dartCode).toMatch(/Map<String, dynamic> toJson\(\) \{/);
    expect(dartCode).toMatch(/@override/);
    expect(dartCode).toMatch(/List<Object\?> get props => \[/);
    
    // No syntax errors
    expect(dartCode).not.toContain('undefined');
    expect(dartCode).not.toContain('null null');
    expect(dartCode).not.toContain('}}}}'); // Too many braces
  });
});

