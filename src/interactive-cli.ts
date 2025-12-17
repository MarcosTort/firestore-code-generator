import inquirer from 'inquirer';
import chalk from 'chalk';
import * as path from 'path';
import { spawn } from 'child_process';
import { FirestoreClient } from './firestore-client';
import { SchemaAnalyzer } from './schema-analyzer';
import { DartGenerator } from './dart-generator';
import { ConfigFileLoader } from './config-file-loader';

/**
 * Run dart format command
 */
function runDartFormat(directory: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(chalk.gray(`  Formatting: ${directory}`));

    const dartFormat = spawn('dart', ['format', '.'], {
      cwd: directory,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    dartFormat.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    dartFormat.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    dartFormat.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`  ✓ Formatted: ${directory}`));
        resolve();
      } else {
        reject(new Error(stderr || 'dart format failed'));
      }
    });

    dartFormat.on('error', (error) => {
      reject(new Error(`dart command not found. Make sure Dart SDK is installed: ${error.message}`));
    });
  });
}

/**
 * Run interactive CLI mode
 */
export async function runInteractiveCLI(
  serviceAccountPath?: string,
  projectId?: string,
  configPath?: string
): Promise<void> {
  console.log(chalk.bold.blue('\n🔥 Firestore Dart Generator - Interactive Mode\n'));

  // Load config file if exists
  const config = ConfigFileLoader.loadConfig(configPath);

  // Resolve credentials with priority: CLI args > config file > env
  const resolvedServiceAccount = ConfigFileLoader.resolveServiceAccountPath(
    config,
    serviceAccountPath
  );
  const resolvedProjectId = ConfigFileLoader.resolveProjectId(config, projectId);

  // Debug: Show what credentials will be used
  if (resolvedServiceAccount) {
    console.log(chalk.gray(`📁 Using service account: ${resolvedServiceAccount}`));
    if (!require('fs').existsSync(resolvedServiceAccount)) {
      console.error(chalk.red(`\n✗ Service account file not found at: ${resolvedServiceAccount}`));
      console.error(chalk.yellow(`\nCurrent working directory: ${process.cwd()}`));
      console.error(chalk.yellow(`\nPlease check:`));
      console.error(chalk.gray(`  1. The path in firestore-dart-gen.yaml is correct`));
      console.error(chalk.gray(`  2. The file exists relative to: ${process.cwd()}`));
      console.error(chalk.gray(`  3. Or use: firestore-dart-gen --service-account <path>\n`));
      process.exit(1);
    }
    console.log('');
  }

  // Initialize Firebase
  const client = new FirestoreClient(resolvedProjectId, resolvedServiceAccount);
  
  // Handle interruption (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n\n⚠ Process interrupted by user'));
    await client.close();
    process.exit(0);
  });

  try {
    await client.initialize();
  } catch (error) {
    console.error(chalk.red('\n✗ Failed to connect to Firebase'));
    console.error(chalk.yellow('\nPossible solutions:'));
    
    // Check if config file exists
    const configExists = ConfigFileLoader.loadConfig(configPath) !== null;
    
    if (!configExists && !resolvedServiceAccount) {
      console.error(chalk.cyan('\n📄 Option 1: Create a config file'));
      console.error(chalk.gray('   Create firestore-dart-gen.yaml:'));
      console.error(chalk.gray('   firebase:'));
      console.error(chalk.gray('     serviceAccount: ./firebase_service_account.json\n'));
      console.error(chalk.cyan('   Or copy from example:'));
      console.error(chalk.gray('   cp firestore-dart-gen.example.yaml firestore-dart-gen.yaml\n'));
    }
    
    console.error(chalk.cyan('🔧 Option 2: Use CLI arguments'));
    console.error(chalk.gray('   firestore-dart-gen --service-account ./firebase_service_account.json\n'));
    
    console.error(chalk.cyan('🌍 Option 3: Set environment variable'));
    console.error(chalk.gray('   export GOOGLE_APPLICATION_CREDENTIALS=./firebase_service_account.json\n'));
    
    console.error(chalk.yellow('Other checks:'));
    console.error(chalk.gray('  - Verify your service account file path is correct'));
    console.error(chalk.gray('  - Ensure service account has read permissions\n'));
    throw error;
  }
  
  const firebaseProjectId = client.getProjectId();
  console.log(chalk.green(`✓ Connected to Firebase Project: ${chalk.bold(firebaseProjectId)}\n`));

  try {
    // List collections
    console.log(chalk.blue('🔍 Discovering collections...\n'));
    const collections = await client.listCollections();
    
    if (collections.length === 0) {
      console.log(chalk.yellow('⚠ No collections found in this project'));
      await client.close();
      return;
    }

    console.log(chalk.blue(`Found ${collections.length} collection(s)\n`));

    // Get pre-selected collections from config
    const preSelected = config?.collections || [];
    if (preSelected.length > 0) {
      console.log(chalk.gray(`Pre-selected from config: ${preSelected.join(', ')}\n`));
    }

    // Select collections (multiple)
    const { selectedCollections } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedCollections',
        message: 'Select collections to generate models for:',
        choices: collections.map(col => ({
          name: col,
          value: col,
          checked: preSelected.includes(col), // PRE-SELECCIONAR
        })),
        validate: (answer) => {
          if (answer.length < 1) {
            return 'You must select at least one collection';
          }
          return true;
        },
      },
    ]);

    if (selectedCollections.length === 0) {
      console.log(chalk.yellow('\nNo collections selected. Exiting.'));
      await client.close();
      return;
    }

    // Detect and ask about subcollections
    const collectionsWithSubs: Map<string, string[]> = new Map();
    
    console.log(chalk.blue('\n🌳 Checking for subcollections...\n'));
    for (const collection of selectedCollections) {
      console.log(chalk.gray(`  Analyzing ${collection}...`));
      const subcollections = await client.listSubcollections(collection);
      
      if (subcollections.length > 0) {
        console.log(chalk.cyan(`  Found ${subcollections.length} subcollection(s): ${subcollections.join(', ')}`));
        
        const { includeSubcollections } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'includeSubcollections',
            message: `  Include subcollections for ${chalk.bold(collection)}?`,
            default: true,
          },
        ]);
        
        if (includeSubcollections) {
          collectionsWithSubs.set(collection, subcollections);
        }
        console.log('');
      } else {
        console.log(chalk.gray(`  No subcollections found\n`));
      }
    }

    // Configure output directory (with default from config)
    const { outputDirectory } = await inquirer.prompt([
      {
        type: 'input',
        name: 'outputDirectory',
        message: 'Output directory for generated Dart files:',
        default: config?.output?.directory || './lib/src/models',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'Output directory cannot be empty';
          }
          return true;
        },
      },
    ]);

    // Configure sample size (with default from config)
    const { sampleSize } = await inquirer.prompt([
      {
        type: 'number',
        name: 'sampleSize',
        message: 'Number of documents to sample per collection:',
        default: config?.output?.sampleSize || 20,
        validate: (input: any) => {
          const num = Number(input);
          if (isNaN(num) || num < 1) {
            return 'Sample size must be at least 1';
          }
          return true;
        },
      },
    ]);

    // Show summary and confirm
    console.log(chalk.bold.cyan('\n📋 Generation Summary:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white(`  Firebase Project: ${firebaseProjectId}`));
    console.log(chalk.white(`  Collections: ${selectedCollections.join(', ')}`));
    
    if (collectionsWithSubs.size > 0) {
      console.log(chalk.white('  Subcollections:'));
      for (const [parent, subs] of collectionsWithSubs.entries()) {
        console.log(chalk.gray(`    └─ ${parent}: ${subs.join(', ')}`));
      }
    }
    
    console.log(chalk.white(`  Output: ${outputDirectory}`));
    console.log(chalk.white(`  Sample Size: ${sampleSize} documents per collection`));
    console.log(chalk.gray('─'.repeat(60)));

    const { confirmGeneration } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmGeneration',
        message: 'Generate Dart models with these settings?',
        default: true,
      },
    ]);

    if (!confirmGeneration) {
      console.log(chalk.yellow('\n⚠ Generation cancelled by user\n'));
      await client.close();
      return;
    }

    // Generate models
    console.log(chalk.bold.blue('\n🚀 Starting generation...\n'));
    
    const analyzer = new SchemaAnalyzer();
    const generator = new DartGenerator();
    const generatedFiles: string[] = [];
    const outputPath = path.resolve(process.cwd(), outputDirectory);

    // Process main collections
    for (const collection of selectedCollections) {
      console.log(chalk.bold(`\n📦 Processing collection: ${collection}`));
      
      // Check if collection exists and has documents
      const exists = await client.collectionExists(collection);
      if (!exists) {
        console.log(chalk.yellow(`  ⚠ No documents found, skipping\n`));
        continue;
      }

      const documents = await client.fetchSampleDocuments(collection, sampleSize);
      if (documents.length === 0) {
        console.log(chalk.yellow(`  ⚠ No documents found, skipping\n`));
        continue;
      }
      
      const schema = analyzer.analyzeDocuments(collection, documents);
      const filePath = await generator.writeModelToFile(schema, outputPath);
      generatedFiles.push(filePath);
      console.log('');
      
      // Process subcollections
      const subcollections = collectionsWithSubs.get(collection) || [];
      for (const subcollection of subcollections) {
        console.log(chalk.bold(`\n📦 Processing subcollection: ${collection}/${subcollection}`));
        
        const subExists = await client.subcollectionExists(collection, subcollection);
        if (!subExists) {
          console.log(chalk.yellow(`  ⚠ No documents found, skipping\n`));
          continue;
        }

        const subDocs = await client.fetchSampleDocumentsFromSubcollection(
          collection,
          subcollection,
          sampleSize
        );
        
        if (subDocs.length === 0) {
          console.log(chalk.yellow(`  ⚠ No documents found, skipping\n`));
          continue;
        }
        
        const subSchema = analyzer.analyzeDocuments(subcollection, subDocs);
        const subFilePath = await generator.writeModelToFile(subSchema, outputPath);
        generatedFiles.push(subFilePath);
        console.log('');
      }
    }

    if (generatedFiles.length === 0) {
      console.log(chalk.yellow('\n⚠ No models were generated (no documents found)\n'));
      await client.close();
      return;
    }

    // Generate barrel file if multiple models
    if (generatedFiles.length > 1) {
      await generator.generateBarrelFile(outputPath, generatedFiles);
    }

    // Format files
    console.log(chalk.bold.blue('🎨 Formatting generated files...\n'));
    try {
      await runDartFormat(outputPath);
    } catch (error) {
      console.log(chalk.yellow(`⚠ Could not format files: ${error}\n`));
    }

    // Show success
    console.log(chalk.bold.green(`\n✨ Success! Generated ${generatedFiles.length} model(s)\n`));
    console.log(chalk.cyan('Generated files:'));
    generatedFiles.forEach(file => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(chalk.green(`  ✓ ${relativePath}`));
    });

    console.log(chalk.bold('\n📚 Next steps:'));
    console.log(chalk.gray('  1. Review the generated files'));
    console.log(chalk.gray('  2. Import the models in your Dart code'));
    console.log(chalk.gray(`  3. Add 'equatable' to your pubspec.yaml if not already present\n`));

  } finally {
    await client.close();
  }
}

