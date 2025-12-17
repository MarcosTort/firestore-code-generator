export interface FieldInfo {
  name: string;
  type: DartType | string; // Allow custom types for nested classes
  isOptional: boolean;
  isNullable: boolean;
  nestedSchema?: SchemaInfo; // For nested objects
  listItemSchema?: SchemaInfo; // For list of objects
}

export interface SchemaInfo {
  collectionName: string;
  className: string;
  fields: FieldInfo[];
  nestedClasses?: SchemaInfo[]; // All nested class definitions
}

export type DartType = 
  | 'String'
  | 'int'
  | 'double'
  | 'bool'
  | 'DateTime'
  | 'List<dynamic>'
  | 'Map<String, dynamic>'
  | 'dynamic';

export interface ExtractOptions {
  collection: string;
  output: string;
  subcollections?: string;
  serviceAccount?: string;
  projectId?: string;
  sampleSize?: number;
}

export interface BatchExtractOptions {
  config?: string;
  serviceAccount?: string;
  projectId?: string;
}

export interface CollectionConfig {
  name: string;
  output: string;
  sampleSize?: number;
  subcollections?: string[];
}

export interface ConfigFile {
  collections: CollectionConfig[];
}

export interface InteractiveOptions {
  serviceAccount?: string;
  projectId?: string;
}

export interface CollectionSelection {
  name: string;
  includeSubcollections: boolean;
  subcollections: string[];
}

export interface CLIConfig {
  firebase?: {
    serviceAccount?: string;
    projectId?: string;
  };
  collections?: string[];
  output?: {
    directory?: string;
    sampleSize?: number;
  };
}

