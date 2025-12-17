import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export class FirestoreClient {
  private db: admin.firestore.Firestore | null = null;
  private initialized = false;

  constructor(
    private projectId?: string,
    private serviceAccountPath?: string
  ) {}

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Try to use service account path if provided
      if (this.serviceAccountPath) {
        const serviceAccountFullPath = path.resolve(process.cwd(), this.serviceAccountPath);
        
        if (!fs.existsSync(serviceAccountFullPath)) {
          throw new Error(`Service account file not found: ${serviceAccountFullPath}`);
        }

        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountFullPath, 'utf8')
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.projectId || serviceAccount.project_id,
        });

        console.log(chalk.green('✓ Firebase initialized with service account'));
      } 
      // Try GOOGLE_APPLICATION_CREDENTIALS env variable
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: this.projectId || process.env.FIREBASE_PROJECT_ID,
        });

        console.log(chalk.green('✓ Firebase initialized with application default credentials'));
      } 
      // No credentials provided
      else {
        throw new Error(
          'No Firebase credentials provided. Set GOOGLE_APPLICATION_CREDENTIALS env variable or use --service-account flag'
        );
      }

      this.db = admin.firestore();
      this.initialized = true;
    } catch (error) {
      console.error(chalk.red('✗ Failed to initialize Firebase:'), error);
      throw error;
    }
  }

  /**
   * Get Firestore instance
   */
  getFirestore(): admin.firestore.Firestore {
    if (!this.db) {
      throw new Error('Firestore not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Fetch sample documents from a collection
   */
  async fetchSampleDocuments(
    collectionPath: string,
    limit: number = 20
  ): Promise<admin.firestore.DocumentSnapshot[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    console.log(chalk.blue(`Fetching up to ${limit} documents from ${collectionPath}...`));

    const snapshot = await this.db
      .collection(collectionPath)
      .limit(limit)
      .get();

    if (snapshot.empty) {
      console.log(chalk.yellow(`⚠ No documents found in collection: ${collectionPath}`));
      return [];
    }

    console.log(chalk.green(`✓ Found ${snapshot.docs.length} documents`));
    return snapshot.docs;
  }

  /**
   * Fetch sample documents from a subcollection
   */
  async fetchSampleDocumentsFromSubcollection(
    parentCollectionPath: string,
    subcollectionName: string,
    limit: number = 20
  ): Promise<admin.firestore.DocumentSnapshot[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    console.log(chalk.blue(`Fetching subcollection ${subcollectionName} from ${parentCollectionPath}...`));

    // Get a sample parent document
    const parentSnapshot = await this.db
      .collection(parentCollectionPath)
      .limit(1)
      .get();

    if (parentSnapshot.empty) {
      console.log(chalk.yellow(`⚠ No parent documents found in: ${parentCollectionPath}`));
      return [];
    }

    const parentDoc = parentSnapshot.docs[0];
    console.log(chalk.gray(`  Using parent document: ${parentDoc.id}`));

    // Get subcollection documents
    const subcollectionSnapshot = await parentDoc.ref
      .collection(subcollectionName)
      .limit(limit)
      .get();

    if (subcollectionSnapshot.empty) {
      console.log(chalk.yellow(`⚠ No documents found in subcollection: ${subcollectionName}`));
      return [];
    }

    console.log(chalk.green(`✓ Found ${subcollectionSnapshot.docs.length} documents in subcollection`));
    return subcollectionSnapshot.docs;
  }

  /**
   * Check if collection exists
   */
  async collectionExists(collectionPath: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    const snapshot = await this.db.collection(collectionPath).limit(1).get();
    return !snapshot.empty;
  }

  /**
   * Check if subcollection exists
   */
  async subcollectionExists(
    parentCollectionPath: string,
    subcollectionName: string
  ): Promise<boolean> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    // Get a sample parent document
    const parentSnapshot = await this.db
      .collection(parentCollectionPath)
      .limit(1)
      .get();

    if (parentSnapshot.empty) {
      return false;
    }

    const parentDoc = parentSnapshot.docs[0];
    const subcollectionSnapshot = await parentDoc.ref
      .collection(subcollectionName)
      .limit(1)
      .get();

    return !subcollectionSnapshot.empty;
  }

  /**
   * List all root-level collections in the database
   */
  async listCollections(): Promise<string[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }
    
    const collections = await this.db.listCollections();
    return collections.map(col => col.id);
  }

  /**
   * List subcollections for a given collection (by checking first document)
   */
  async listSubcollections(collectionPath: string): Promise<string[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }
    
    // Get first document to check subcollections
    const snapshot = await this.db.collection(collectionPath).limit(1).get();
    
    if (snapshot.empty) {
      return [];
    }
    
    const doc = snapshot.docs[0];
    const subcollections = await doc.ref.listCollections();
    return subcollections.map(col => col.id);
  }

  /**
   * Get project ID from initialized Firebase app
   */
  getProjectId(): string | undefined {
    return admin.app().options.projectId;
  }

  /**
   * Close Firebase connection
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await admin.app().delete();
      this.initialized = false;
      this.db = null;
    }
  }
}

