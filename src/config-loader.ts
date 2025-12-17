import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';
import { ConfigFile, CollectionConfig } from './types';

export class ConfigLoader {
  /**
   * Load collections configuration from YAML file
   */
  static loadConfig(configPath: string): ConfigFile {
    const fullPath = path.resolve(process.cwd(), configPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Configuration file not found: ${fullPath}`);
    }

    try {
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const config = yaml.load(fileContents) as ConfigFile;

      // Validate configuration
      this.validateConfig(config);

      console.log(chalk.green(`✓ Loaded configuration from: ${configPath}`));
      console.log(chalk.gray(`  Found ${config.collections.length} collection(s) to process\n`));

      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse configuration file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate configuration structure
   */
  private static validateConfig(config: ConfigFile): void {
    if (!config.collections || !Array.isArray(config.collections)) {
      throw new Error('Configuration must have a "collections" array');
    }

    if (config.collections.length === 0) {
      throw new Error('Configuration must have at least one collection');
    }

    config.collections.forEach((collection, index) => {
      if (!collection.name) {
        throw new Error(`Collection at index ${index} is missing "name" field`);
      }

      if (!collection.output) {
        throw new Error(`Collection "${collection.name}" is missing "output" field`);
      }

      // Validate sample size if provided
      if (collection.sampleSize !== undefined) {
        if (typeof collection.sampleSize !== 'number' || collection.sampleSize < 1) {
          throw new Error(`Collection "${collection.name}" has invalid sampleSize (must be a positive number)`);
        }
      }

      // Validate subcollections if provided
      if (collection.subcollections !== undefined) {
        if (!Array.isArray(collection.subcollections)) {
          throw new Error(`Collection "${collection.name}" subcollections must be an array`);
        }
      }
    });
  }

  /**
   * Get all collections to process (including subcollections)
   */
  static getCollectionsToProcess(collectionConfig: CollectionConfig): Array<{ 
    name: string; 
    output: string;
    isSubcollection: boolean;
    parentCollection?: string;
  }> {
    const collections: Array<{ 
      name: string; 
      output: string;
      isSubcollection: boolean;
      parentCollection?: string;
    }> = [
      { 
        name: collectionConfig.name, 
        output: collectionConfig.output,
        isSubcollection: false
      }
    ];

    if (collectionConfig.subcollections && collectionConfig.subcollections.length > 0) {
      collectionConfig.subcollections.forEach(subName => {
        collections.push({ 
          name: subName, 
          output: collectionConfig.output,
          isSubcollection: true,
          parentCollection: collectionConfig.name
        });
      });
    }

    return collections;
  }
}

