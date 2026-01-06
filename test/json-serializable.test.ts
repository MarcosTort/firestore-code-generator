import { DartGenerator } from '../src/dart-generator';
import { SchemaAnalyzer } from '../src/schema-analyzer';
import { getSampleUserDocuments } from './mocks/firestore-mocks';

describe('DartGenerator - json_serializable Tests', () => {
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();

    describe('json_serializable Code Generation', () => {
        it('should include json_annotation import when using json_serializable', () => {
            // Arrange
            const documents = getSampleUserDocuments();
            const schema = analyzer.analyzeDocuments('users', documents);

            // Act
            const generatedCode = generator.generateModel(schema, 'json_serializable');

            // Assert
            expect(generatedCode).toContain("import 'package:json_annotation/json_annotation.dart';");
        });

        it('should include part directive when using json_serializable', () => {
            // Arrange
            const documents = getSampleUserDocuments();
            const schema = analyzer.analyzeDocuments('users', documents);

            // Act
            const generatedCode = generator.generateModel(schema, 'json_serializable');

            // Assert
            expect(generatedCode).toContain("part 'user_dto.g.dart';");
        });

        it('should include @JsonSerializable annotation when using json_serializable', () => {
            // Arrange
            const documents = getSampleUserDocuments();
            const schema = analyzer.analyzeDocuments('users', documents);

            // Act
            const generatedCode = generator.generateModel(schema, 'json_serializable');

            // Assert
            expect(generatedCode).toContain('@JsonSerializable()');
        });

        it('should generate fromJson using generated function when using json_serializable', () => {
            // Arrange
            const documents = getSampleUserDocuments();
            const schema = analyzer.analyzeDocuments('users', documents);

            // Act
            const generatedCode = generator.generateModel(schema, 'json_serializable');

            // Assert
            expect(generatedCode).toContain('factory UserDTO.fromJson(Map<String, dynamic> json) => _$UserDTOFromJson(json);');
        });

        it('should generate toJson using generated function when using json_serializable', () => {
            // Arrange
            const documents = getSampleUserDocuments();
            const schema = analyzer.analyzeDocuments('users', documents);

            // Act
            const generatedCode = generator.generateModel(schema, 'json_serializable');

            // Assert
            expect(generatedCode).toContain('Map<String, dynamic> toJson() => _$UserDTOToJson(this);');
        });

        it('should NOT include Equatable when using json_serializable', () => {
            // Arrange
            const documents = getSampleUserDocuments();
            const schema = analyzer.analyzeDocuments('users', documents);

            // Act
            const generatedCode = generator.generateModel(schema, 'json_serializable');

            // Assert
            expect(generatedCode).not.toContain("import 'package:equatable/equatable.dart';");
            expect(generatedCode).not.toContain('extends Equatable');
            expect(generatedCode).not.toContain('@override');
            expect(generatedCode).not.toContain('List<Object?> get props');
        });

        it('should use manual serialization by default', () => {
            // Arrange
            const documents = getSampleUserDocuments();
            const schema = analyzer.analyzeDocuments('users', documents);

            // Act - No serialization method specified
            const generatedCode = generator.generateModel(schema);

            // Assert
            expect(generatedCode).toContain("import 'package:equatable/equatable.dart';");
            expect(generatedCode).not.toContain('@JsonSerializable()');
        });
    });

    describe('Backward Compatibility', () => {
        it('should generate same code as before when using manual method explicitly', () => {
            // Arrange
            const documents = getSampleUserDocuments();
            const schema = analyzer.analyzeDocuments('users', documents);

            // Act
            const manualCode = generator.generateModel(schema, 'manual');
            const defaultCode = generator.generateModel(schema);

            // Assert - Both should be identical
            expect(manualCode).toBe(defaultCode);
        });
    });
});
