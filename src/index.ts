#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { runInteractiveCLI } from './interactive-cli';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('firestore-dart-gen')
  .description('Generate Dart models from Firestore collections')
  .version('1.0.0')
  .option('--service-account <path>', 'Path to Firebase service account JSON file')
  .option('--project-id <id>', 'Firebase project ID', process.env.FIREBASE_PROJECT_ID)
  .action(async (options) => {
    try {
      await runInteractiveCLI(options.serviceAccount, options.projectId);
    } catch (error) {
      console.error(chalk.red('\nError:'), error);
      process.exit(1);
    }
  });

// Parse and run
program.parse();
