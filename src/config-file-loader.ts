import chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

export interface CLIConfig {
  firebase?: {
    serviceAccount?: string;
    projectId?: string;
  };
  collections?: string[];
  output?: {
    directory?: string;
    sampleSize?: number;
    subcollectionSearchLimit?: number;
    serializationMethod?: 'manual' | 'json_serializable';
  };
}

export class ConfigFileLoader {
  private static CONFIG_FILES = [
    'firestore-dart-gen.yaml',
    'firestore-dart-gen.yml',
    '.firestore-dart-gen.yaml',
    '.firestore-dart-gen.yml',
  ];

  /**
   * Load configuration from YAML file if exists
   */
  static loadConfig(configPath?: string): CLIConfig | null {
    // If path provided, try to load it
    if (configPath) {
      return this.loadFromPath(configPath);
    }

    // Try default config file names
    for (const fileName of this.CONFIG_FILES) {
      const filePath = path.resolve(process.cwd(), fileName);
      if (fs.existsSync(filePath)) {
        console.log(chalk.gray(`📄 Found config file: ${fileName}\n`));
        return this.loadFromPath(filePath);
      }
    }

    return null;
  }

  /**
   * Load config from specific path
   */
  private static loadFromPath(filePath: string): CLIConfig | null {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const config = yaml.load(fileContents) as CLIConfig;

      // Validate basic structure
      this.validateConfig(config);

      return config;
    } catch (error) {
      console.error(chalk.yellow(`⚠ Could not load config file: ${error}`));
      return null;
    }
  }

  /**
   * Validate configuration structure
   */
  private static validateConfig(config: CLIConfig): void {
    // Validate service account path if provided
    if (config.firebase?.serviceAccount) {
      const fullPath = path.resolve(process.cwd(), config.firebase.serviceAccount);
      if (!fs.existsSync(fullPath)) {
        console.warn(chalk.yellow(`⚠ Service account file not found: ${config.firebase.serviceAccount}`));
      }
    }

    // Validate collections is array if provided
    if (config.collections && !Array.isArray(config.collections)) {
      throw new Error('Config error: collections must be an array');
    }

    // Validate sample size if provided
    if (config.output?.sampleSize && config.output.sampleSize < 1) {
      throw new Error('Config error: sampleSize must be greater than 0');
    }
  }

  /**
   * Resolve service account path
   */
  static resolveServiceAccountPath(config: CLIConfig | null, cliArg?: string): string | undefined {
    // Priority: CLI argument > config file > env variable
    if (cliArg) {
      const resolved = path.isAbsolute(cliArg) ? cliArg : path.resolve(process.cwd(), cliArg);
      return resolved;
    }
    if (config?.firebase?.serviceAccount) {
      const resolved = path.isAbsolute(config.firebase.serviceAccount)
        ? config.firebase.serviceAccount
        : path.resolve(process.cwd(), config.firebase.serviceAccount);
      return resolved;
    }
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  /**
   * Resolve project ID
   */
  static resolveProjectId(config: CLIConfig | null, cliArg?: string): string | undefined {
    // Priority: CLI argument > config file > env variable
    if (cliArg) return cliArg;
    if (config?.firebase?.projectId) return config.firebase.projectId;
    return process.env.FIREBASE_PROJECT_ID;
  }
}

