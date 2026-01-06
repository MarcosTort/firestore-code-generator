import chalk from 'chalk';
import * as fs from 'fs';
import Handlebars from 'handlebars';
import * as path from 'path';
import { SchemaInfo, SerializationMethod } from './types';

export class DartGenerator {
  private template: HandlebarsTemplateDelegate | null = null;

  constructor() {
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Helper to check equality
    Handlebars.registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });
  }

  /**
   * Load the Handlebars template
   */
  private loadTemplate(serializationMethod: SerializationMethod = 'manual'): void {
    const templateName = serializationMethod === 'json_serializable'
      ? 'model_json_serializable.hbs'
      : 'model.hbs';

    const templatePath = path.join(__dirname, 'templates', templateName);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    this.template = Handlebars.compile(templateSource);
  }

  /**
   * Generate imports based on serialization method
   */
  private generateImports(serializationMethod: SerializationMethod, fileName: string): string {
    if (serializationMethod === 'json_serializable') {
      return `import 'package:json_annotation/json_annotation.dart';\n\npart '${fileName}.g.dart';\n\n`;
    }
    return "import 'package:equatable/equatable.dart';\n\n";
  }

  /**
   * Generate Dart model code from schema
   */
  generateModel(schema: SchemaInfo, serializationMethod: SerializationMethod = 'manual'): string {
    this.loadTemplate(serializationMethod);

    if (!this.template) {
      throw new Error('Template not loaded');
    }

    console.log(chalk.blue(`Generating Dart code for ${schema.className} (${serializationMethod})...`));

    // Convert class name to snake_case for filename
    const fileName = this.toSnakeCase(schema.className);

    // Start with import statement
    let code = this.generateImports(serializationMethod, fileName);

    // Generate nested classes first
    if (schema.nestedClasses && schema.nestedClasses.length > 0) {
      const nestedClassesCode = schema.nestedClasses
        .map(nestedSchema => this.generateNestedClass(nestedSchema, serializationMethod))
        .join('\n\n');
      code += nestedClassesCode + '\n\n';
    }

    // Prepare template context with additional computed values
    const templateContext = {
      ...schema,
      classNameLower: schema.className.toLowerCase(),
      isNestedClass: false, // Main class is not nested
    };

    const mainCode = this.template(templateContext);
    code += mainCode;

    console.log(chalk.green(`✓ Generated ${schema.className} model`));
    if (schema.nestedClasses && schema.nestedClasses.length > 0) {
      console.log(chalk.green(`  with ${schema.nestedClasses.length} nested class(es)`));
    }

    return code;
  }

  /**
   * Generate code for a nested class
   */
  private generateNestedClass(schema: SchemaInfo, serializationMethod: SerializationMethod = 'manual'): string {
    if (!this.template) {
      throw new Error('Template not loaded');
    }

    const templateContext = {
      ...schema,
      classNameLower: schema.className.toLowerCase(),
      isNestedClass: true,
    };

    return this.template(templateContext);
  }

  /**
   * Write Dart model to file
   */
  async writeModelToFile(
    schema: SchemaInfo,
    outputDir: string,
    serializationMethod: SerializationMethod = 'manual'
  ): Promise<string> {
    const code = this.generateModel(schema, serializationMethod);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(chalk.green(`✓ Created directory: ${outputDir}`));
    }

    // Convert class name to snake_case for filename
    const fileName = this.toSnakeCase(schema.className) + '.dart';
    const filePath = path.join(outputDir, fileName);

    // Write file
    fs.writeFileSync(filePath, code, 'utf8');

    console.log(chalk.green(`✓ Written to: ${filePath}`));

    return filePath;
  }

  /**
   * Convert PascalCase to snake_case
   * Handles acronyms properly (e.g., UserDTO -> user_dto, Gamesv2DTO -> gamesv2_dto)
   */
  private toSnakeCase(str: string): string {
    return str
      // Insert underscore before uppercase letters that follow lowercase letters
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      // Insert underscore before uppercase letters that follow numbers
      .replace(/([0-9])([A-Z])/g, '$1_$2')
      // Insert underscore before uppercase letter followed by lowercase (for acronyms)
      .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
      .toLowerCase();
  }

  /**
   * Generate barrel file (models.dart) that exports all models
   */
  async generateBarrelFile(outputDir: string, modelFiles: string[]): Promise<void> {
    const barrelPath = path.join(outputDir, 'models.dart');

    const exports = modelFiles
      .map(file => {
        const fileName = path.basename(file);
        return `export '${fileName}';`;
      })
      .join('\n');

    const content = `// Generated barrel file for models\n${exports}\n`;

    fs.writeFileSync(barrelPath, content, 'utf8');

    console.log(chalk.green(`✓ Generated barrel file: ${barrelPath}`));
  }
}

