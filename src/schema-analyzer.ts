import chalk from 'chalk';
import * as admin from 'firebase-admin';
import { DartType, FieldInfo, SchemaInfo } from './types';

export class SchemaAnalyzer {
  private nestedClassCounter = 0;

  /**
   * Analyze documents and extract schema information
   */
  analyzeDocuments(
    collectionName: string,
    documents: admin.firestore.DocumentSnapshot[]
  ): SchemaInfo {
    console.log(chalk.blue(`Analyzing schema for ${collectionName}...`));

    if (documents.length === 0) {
      throw new Error(`No documents to analyze for collection: ${collectionName}`);
    }

    // Reset nested class counter for each collection
    this.nestedClassCounter = 0;

    // Collect all fields across all documents with their actual values
    const fieldOccurrences = new Map<string, {
      types: Set<DartType>;
      count: number;
      values: any[];
    }>();
    const totalDocs = documents.length;

    for (const doc of documents) {
      const data = doc.data();
      if (!data) continue;

      for (const [fieldName, fieldValue] of Object.entries(data)) {
        if (!fieldOccurrences.has(fieldName)) {
          fieldOccurrences.set(fieldName, { types: new Set(), count: 0, values: [] });
        }

        const field = fieldOccurrences.get(fieldName)!;
        field.count++;
        field.types.add(this.detectDartType(fieldValue));
        field.values.push(fieldValue);
      }
    }

    // Build fields array with nested schema analysis
    const fields: FieldInfo[] = [];
    const nestedClasses: SchemaInfo[] = [];

    for (const [fieldName, { types, count, values }] of fieldOccurrences.entries()) {
      // Field is optional if it doesn't appear in all documents
      const isOptional = count < totalDocs;

      // If field has multiple types or null, it's nullable
      const hasMultipleTypes = types.size > 1;
      const dartType = this.resolveDartType(types);

      const fieldInfo: FieldInfo = {
        name: fieldName,
        type: dartType,
        isOptional,
        isNullable: isOptional || hasMultipleTypes,
      };

      // Analyze nested objects
      if (dartType === 'Map<String, dynamic>') {
        const nestedObjects = values.filter(v => v != null && typeof v === 'object' && !Array.isArray(v));
        if (nestedObjects.length > 0) {
          const nestedClassName = this.toNestedClassName(collectionName, fieldName);
          const nestedSchema = this.analyzeNestedObjects(nestedClassName, nestedObjects);
          fieldInfo.type = nestedClassName;
          fieldInfo.nestedSchema = nestedSchema;
          nestedClasses.push(nestedSchema);
          if (nestedSchema.nestedClasses) {
            nestedClasses.push(...nestedSchema.nestedClasses);
          }
        }
      }

      // Analyze arrays
      if (dartType === 'List<dynamic>') {
        const arrays = values.filter(v => Array.isArray(v) && v.length > 0);
        if (arrays.length > 0) {
          const allItems = arrays.flat();
          const itemTypes = new Set(allItems.map(item => this.detectDartType(item)));

          // Check if all items are objects
          const objectItems = allItems.filter(item =>
            item != null && typeof item === 'object' && !Array.isArray(item)
          );

          if (objectItems.length > 0 && objectItems.length === allItems.length) {
            // All items are objects, create a nested class
            const itemClassName = this.toNestedClassName(collectionName, this.toSingular(fieldName));
            const listItemSchema = this.analyzeNestedObjects(itemClassName, objectItems);
            fieldInfo.type = `List<${itemClassName}>`;
            fieldInfo.listItemSchema = listItemSchema;
            nestedClasses.push(listItemSchema);
            if (listItemSchema.nestedClasses) {
              nestedClasses.push(...listItemSchema.nestedClasses);
            }
          } else if (itemTypes.size === 1) {
            // Homogeneous array of primitives
            const itemType = Array.from(itemTypes)[0];
            if (itemType !== 'dynamic') {
              fieldInfo.type = `List<${itemType}>`;
            }
          }
        }
      }

      fields.push(fieldInfo);
    }

    // Sort fields: required first, then alphabetically
    fields.sort((a, b) => {
      if (a.isOptional !== b.isOptional) {
        return a.isOptional ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    const className = this.toClassName(collectionName);

    console.log(chalk.green(`✓ Detected ${fields.length} fields`));

    // Log field summary
    fields.forEach(field => {
      const optional = field.isOptional ? '?' : '';
      const nullable = field.isNullable && !field.isOptional ? '?' : '';
      console.log(chalk.gray(`  - ${field.name}: ${field.type}${nullable}${optional}`));
    });

    if (nestedClasses.length > 0) {
      console.log(chalk.green(`✓ Detected ${nestedClasses.length} nested classes`));
    }

    return {
      collectionName,
      className,
      fields,
      nestedClasses: nestedClasses.length > 0 ? nestedClasses : undefined,
    };
  }

  /**
   * Get field summary from documents (for comparison purposes)
   */
  getFieldSummary(documents: admin.firestore.DocumentSnapshot[]): string[] {
    const fieldNames = new Set<string>();

    for (const doc of documents) {
      const data = doc.data();
      if (!data) continue;

      for (const fieldName of Object.keys(data)) {
        fieldNames.add(fieldName);
      }
    }

    return Array.from(fieldNames).sort();
  }

  /**
   * Analyze nested objects and extract their schema
   */
  private analyzeNestedObjects(className: string, objects: any[]): SchemaInfo {
    const fieldOccurrences = new Map<string, {
      types: Set<DartType>;
      count: number;
      values: any[];
    }>();
    const totalObjects = objects.length;

    for (const obj of objects) {
      if (obj == null) continue;

      for (const [fieldName, fieldValue] of Object.entries(obj)) {
        if (!fieldOccurrences.has(fieldName)) {
          fieldOccurrences.set(fieldName, { types: new Set(), count: 0, values: [] });
        }

        const field = fieldOccurrences.get(fieldName)!;
        field.count++;
        field.types.add(this.detectDartType(fieldValue));
        field.values.push(fieldValue);
      }
    }

    const fields: FieldInfo[] = [];
    const nestedClasses: SchemaInfo[] = [];

    for (const [fieldName, { types, count, values }] of fieldOccurrences.entries()) {
      const isOptional = count < totalObjects;
      const hasMultipleTypes = types.size > 1;
      const dartType = this.resolveDartType(types);

      const fieldInfo: FieldInfo = {
        name: fieldName,
        type: dartType,
        isOptional,
        isNullable: isOptional || hasMultipleTypes,
      };

      // Recursively analyze nested objects
      if (dartType === 'Map<String, dynamic>') {
        const nestedObjects = values.filter(v => v != null && typeof v === 'object' && !Array.isArray(v));
        if (nestedObjects.length > 0) {
          const nestedClassName = `${className}${this.toPascalCase(fieldName)}`;
          const nestedSchema = this.analyzeNestedObjects(nestedClassName, nestedObjects);
          fieldInfo.type = nestedClassName;
          fieldInfo.nestedSchema = nestedSchema;
          nestedClasses.push(nestedSchema);
          if (nestedSchema.nestedClasses) {
            nestedClasses.push(...nestedSchema.nestedClasses);
          }
        }
      }

      // Recursively analyze arrays
      if (dartType === 'List<dynamic>') {
        const arrays = values.filter(v => Array.isArray(v) && v.length > 0);
        if (arrays.length > 0) {
          const allItems = arrays.flat();
          const objectItems = allItems.filter(item =>
            item != null && typeof item === 'object' && !Array.isArray(item)
          );

          if (objectItems.length > 0 && objectItems.length === allItems.length) {
            const itemClassName = `${className}${this.toPascalCase(this.toSingular(fieldName))}`;
            const listItemSchema = this.analyzeNestedObjects(itemClassName, objectItems);
            fieldInfo.type = `List<${itemClassName}>`;
            fieldInfo.listItemSchema = listItemSchema;
            nestedClasses.push(listItemSchema);
            if (listItemSchema.nestedClasses) {
              nestedClasses.push(...listItemSchema.nestedClasses);
            }
          } else {
            const itemTypes = new Set(allItems.map(item => this.detectDartType(item)));
            if (itemTypes.size === 1) {
              const itemType = Array.from(itemTypes)[0];
              if (itemType !== 'dynamic') {
                fieldInfo.type = `List<${itemType}>`;
              }
            }
          }
        }
      }

      fields.push(fieldInfo);
    }

    // Sort fields
    fields.sort((a, b) => {
      if (a.isOptional !== b.isOptional) {
        return a.isOptional ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      collectionName: className.toLowerCase(),
      className,
      fields,
      nestedClasses: nestedClasses.length > 0 ? nestedClasses : undefined,
    };
  }

  /**
   * Detect Dart type from JavaScript value
   */
  private detectDartType(value: any): DartType {
    if (value === null || value === undefined) {
      return 'dynamic';
    }

    const jsType = typeof value;

    switch (jsType) {
      case 'string':
        return 'String';

      case 'number':
        return Number.isInteger(value) ? 'int' : 'double';

      case 'boolean':
        return 'bool';

      case 'object':
        // Check for Firestore Timestamp
        if (value instanceof admin.firestore.Timestamp) {
          return 'DateTime';
        }

        // Check for Date
        if (value instanceof Date) {
          return 'DateTime';
        }

        // Check for Array
        if (Array.isArray(value)) {
          return 'List<dynamic>';
        }

        // Default to Map
        return 'Map<String, dynamic>';

      default:
        return 'dynamic';
    }
  }

  /**
   * Resolve the final Dart type when multiple types are detected
   */
  private resolveDartType(types: Set<DartType>): DartType {
    // Remove dynamic if there are other types
    const filteredTypes = Array.from(types).filter(t => t !== 'dynamic');

    if (filteredTypes.length === 0) {
      return 'dynamic';
    }

    if (filteredTypes.length === 1) {
      return filteredTypes[0];
    }

    // If we have both int and double, prefer double
    if (filteredTypes.includes('int') && filteredTypes.includes('double')) {
      return 'double';
    }

    // For mixed types, fall back to dynamic
    console.log(chalk.yellow(`⚠ Multiple types detected: ${filteredTypes.join(', ')}. Using 'dynamic'`));
    return 'dynamic';
  }

  /**
   * Convert collection name to PascalCase class name with DTO suffix
   */
  private toClassName(collectionName: string): string {
    // Remove trailing 's' if plural (users -> User)
    let singular = collectionName;
    if (collectionName.endsWith('s') && collectionName.length > 1) {
      singular = collectionName.slice(0, -1);
    }

    // Convert to PascalCase
    const className = singular
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');

    // Append DTO suffix
    return `${className}DTO`;
  }

  /**
   * Convert field name to PascalCase for nested class naming
   */
  private toPascalCase(fieldName: string): string {
    return fieldName
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Generate nested class name
   */
  private toNestedClassName(parentName: string, fieldName: string): string {
    const parentClass = this.toClassName(parentName).replace('DTO', '');
    const fieldPascal = this.toPascalCase(fieldName);
    return `${parentClass}${fieldPascal}`;
  }

  /**
   * Convert plural to singular (basic implementation)
   */
  private toSingular(word: string): string {
    if (word.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('es')) {
      return word.slice(0, -2);
    }
    if (word.endsWith('s') && word.length > 1) {
      return word.slice(0, -1);
    }
    return word;
  }
}

