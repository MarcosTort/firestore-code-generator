#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as admin from 'firebase-admin';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { FirestoreClient } from './firestore-client';
import { SchemaAnalyzer } from './schema-analyzer';
import { DartGenerator } from './dart-generator';
import { ConfigLoader } from './config-loader';
import { ExtractOptions, BatchExtractOptions } from './types';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('firestore-schema-extractor')
  .description('Extract Firestore schema and generate Dart models')
  .version('1.0.0');

// Single collection command
program
  .command('single')
  .description('Extract a single collection')
  .requiredOption('-c, --collection <name>', 'Firestore collection name')
  .requiredOption('-o, --output <path>', 'Output directory for generated Dart files')
  .option('-s, --subcollections <names>', 'Comma-separated list of subcollections to extract', '')
  .option('--service-account <path>', 'Path to Firebase service account JSON file')
  .option('--project-id <id>', 'Firebase project ID', process.env.FIREBASE_PROJECT_ID)
  .option('--sample-size <number>', 'Number of documents to sample', '20')
  .action(async (options: ExtractOptions) => {
    try {
      await extractSchema(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Batch extraction from YAML config
program
  .command('batch')
  .description('Extract multiple collections from YAML configuration file')
  .option('-f, --config <path>', 'Path to collections.yaml file', 'collections.yaml')
  .option('--service-account <path>', 'Path to Firebase service account JSON file')
  .option('--project-id <id>', 'Firebase project ID', process.env.FIREBASE_PROJECT_ID)
  .action(async (options: BatchExtractOptions) => {
    try {
      await extractBatch(options);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Make 'batch' the default command when no command is specified
program
  .arguments('[command]')
  .action((command) => {
    if (!command) {
      // Default to batch if no command specified
      program.parse(['node', 'script', 'batch', ...process.argv.slice(2)]);
    }
  });

async function extractSchema(options: ExtractOptions): Promise<void> {
  console.log(chalk.bold.blue('\n🔥 Firestore Schema Extractor\n'));

  const {
    collection,
    output,
    subcollections,
    serviceAccount,
    projectId,
    sampleSize = 20,
  } = options;

  // Parse subcollections
  const subcollectionList = subcollections
    ? subcollections.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  // Initialize Firestore client
  const firestoreClient = new FirestoreClient(projectId, serviceAccount);
  await firestoreClient.initialize();

  try {
    // Collections to process
    const collectionsToProcess = [collection, ...subcollectionList];
    const generator = new DartGenerator();
    const analyzer = new SchemaAnalyzer();
    const generatedFiles: string[] = [];

    for (const collectionName of collectionsToProcess) {
      console.log(chalk.bold(`\n📦 Processing collection: ${collectionName}\n`));

      // Check if collection exists
      const exists = await firestoreClient.collectionExists(collectionName);
      if (!exists) {
        console.log(chalk.yellow(`⚠ Skipping empty collection: ${collectionName}\n`));
        continue;
      }

      // Fetch sample documents
      const documents = await firestoreClient.fetchSampleDocuments(
        collectionName,
        parseInt(sampleSize.toString(), 10)
      );

      if (documents.length === 0) {
        console.log(chalk.yellow(`⚠ No documents found in: ${collectionName}\n`));
        continue;
      }

      // Analyze schema
      const schema = analyzer.analyzeDocuments(collectionName, documents);

      // Resolve output path (relative to project root)
      const outputPath = path.resolve(process.cwd(), output);

      // Generate and write Dart model
      const filePath = await generator.writeModelToFile(schema, outputPath);
      generatedFiles.push(filePath);

      console.log('');
    }

    // Generate barrel file if multiple models were created
    if (generatedFiles.length > 1) {
      const outputPath = path.resolve(process.cwd(), output);
      await generator.generateBarrelFile(outputPath, generatedFiles);
    }

    console.log(chalk.bold.green(`\n✓ Successfully generated ${generatedFiles.length} model(s)!\n`));

    // Format generated files with dart format
    if (generatedFiles.length > 0) {
      console.log(chalk.bold.blue('🎨 Formatting generated Dart files...\n'));
      const outputPath = path.resolve(process.cwd(), output);
      try {
        await runDartFormat(outputPath);
      } catch (error) {
        console.log(chalk.yellow(`⚠ Could not format files: ${error}\n`));
      }
    }

    // Print next steps
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.gray('  1. Review the generated files'));
    console.log(chalk.gray('  2. Import the models in your Dart code\n'));

  } finally {
    // Clean up
    await firestoreClient.close();
  }
}

async function extractBatch(options: BatchExtractOptions): Promise<void> {
  console.log(chalk.bold.blue('\n🔥 Firestore Schema Extractor - Batch Mode\n'));

  const { config = 'collections.yaml', serviceAccount, projectId } = options;

  // Load configuration
  const configFile = ConfigLoader.loadConfig(config);

  // Initialize Firestore client
  const firestoreClient = new FirestoreClient(projectId, serviceAccount);
  await firestoreClient.initialize();

  try {
    const generator = new DartGenerator();
    const analyzer = new SchemaAnalyzer();
    let totalGenerated = 0;

    // Process each collection configuration
    for (const collectionConfig of configFile.collections) {
      console.log(chalk.bold.cyan(`\n═══ Processing: ${collectionConfig.name} ═══\n`));

      const collectionsToProcess = ConfigLoader.getCollectionsToProcess(collectionConfig);
      const generatedFiles: string[] = [];
      const sampleSize = collectionConfig.sampleSize || 20;

      for (const { name: collectionName, output, isSubcollection, parentCollection } of collectionsToProcess) {
        const displayName = isSubcollection 
          ? `${parentCollection}/${collectionName} (subcollection)` 
          : collectionName;
        console.log(chalk.bold(`📦 Collection: ${displayName}\n`));

        let documents: admin.firestore.DocumentSnapshot[];

        if (isSubcollection && parentCollection) {
          // Check if subcollection exists
          const exists = await firestoreClient.subcollectionExists(parentCollection, collectionName);
          if (!exists) {
            console.log(chalk.yellow(`⚠ Skipping empty subcollection: ${collectionName}\n`));
            continue;
          }

          // Fetch sample documents from subcollection
          documents = await firestoreClient.fetchSampleDocumentsFromSubcollection(
            parentCollection,
            collectionName,
            sampleSize
          );
        } else {
          // Check if collection exists
          const exists = await firestoreClient.collectionExists(collectionName);
          if (!exists) {
            console.log(chalk.yellow(`⚠ Skipping empty collection: ${collectionName}\n`));
            continue;
          }

          // Fetch sample documents from regular collection
          documents = await firestoreClient.fetchSampleDocuments(collectionName, sampleSize);
        }

        if (documents.length === 0) {
          console.log(chalk.yellow(`⚠ No documents found in: ${collectionName}\n`));
          continue;
        }

        // Analyze schema
        const schema = analyzer.analyzeDocuments(collectionName, documents);

        // Resolve output path
        const outputPath = path.resolve(process.cwd(), output);

        // Generate and write Dart model
        const filePath = await generator.writeModelToFile(schema, outputPath);
        generatedFiles.push(filePath);
        totalGenerated++;

        console.log('');
      }

      // Generate barrel file if multiple models were created in this collection group
      if (generatedFiles.length > 1) {
        const outputPath = path.resolve(process.cwd(), collectionConfig.output);
        await generator.generateBarrelFile(outputPath, generatedFiles);
      }
    }

    console.log(chalk.bold.green(`\n✓ Successfully generated ${totalGenerated} model(s) from ${configFile.collections.length} collection group(s)!\n`));

    // Format generated files with dart format
    if (totalGenerated > 0) {
      await formatDartFiles(configFile);
    }

    // Print next steps
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.gray('  1. Review the generated files'));
    console.log(chalk.gray('  2. Import the models in your Dart code\n'));

  } finally {
    // Clean up
    await firestoreClient.close();
  }
}

/**
 * Format Dart files using dart format
 */
async function formatDartFiles(configFile: any): Promise<void> {
  console.log(chalk.bold.blue('🎨 Formatting generated Dart files...\n'));

  // Get unique output directories
  const outputDirs = Array.from(new Set<string>(
    configFile.collections.map((c: any) => path.resolve(process.cwd(), c.output) as string)
  ));

  for (const outputDir of outputDirs) {
    try {
      await runDartFormat(outputDir);
    } catch (error) {
      // Non-fatal error, just warn
      console.log(chalk.yellow(`⚠ Could not format ${outputDir}: ${error}\n`));
    }
  }
}

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

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

