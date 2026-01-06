import chalk from 'chalk';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export interface SubcollectionParentInfo {
  parentId: string;
  parentPath: string;
  documentCount: number;
  fieldCount: number;
  sampleFields: string[];
}

export class FirestoreClient {
  private db: admin.firestore.Firestore | null = null;
  private initialized = false;

  constructor(
    private projectId?: string,
    private serviceAccountPath?: string
  ) { }

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
        // If path is already absolute, use it; otherwise resolve relative to cwd
        const serviceAccountFullPath = path.isAbsolute(this.serviceAccountPath)
          ? this.serviceAccountPath
          : path.resolve(process.cwd(), this.serviceAccountPath);

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
   * Searches through parent documents to find one that has the subcollection
   * If parentDocumentId is provided, fetches from that specific parent
   */
  async fetchSampleDocumentsFromSubcollection(
    parentCollectionPath: string,
    subcollectionName: string,
    limit: number = 20,
    subcollectionSearchLimit: number = 50,
    parentDocumentId?: string
  ): Promise<admin.firestore.DocumentSnapshot[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    console.log(chalk.blue(`Fetching subcollection ${subcollectionName} from ${parentCollectionPath}...`));

    // If a specific parent document ID is provided, fetch from that parent
    if (parentDocumentId) {
      console.log(chalk.gray(`  Using specified parent document: ${parentDocumentId}`));

      const parentDocRef = this.db.collection(parentCollectionPath).doc(parentDocumentId);
      const subcollectionSnapshot = await parentDocRef
        .collection(subcollectionName)
        .limit(limit)
        .get();

      if (subcollectionSnapshot.empty) {
        console.log(chalk.yellow(`⚠ No documents found in subcollection for parent: ${parentDocumentId}`));
        return [];
      }

      console.log(chalk.green(`✓ Found ${subcollectionSnapshot.docs.length} document(s) in subcollection`));
      return subcollectionSnapshot.docs;
    }

    // Otherwise, search through parent documents to find one with the subcollection
    const searchLimit = Math.min(limit, subcollectionSearchLimit);
    const parentSnapshot = await this.db
      .collection(parentCollectionPath)
      .limit(searchLimit)
      .get();

    if (parentSnapshot.empty) {
      console.log(chalk.yellow(`⚠ No parent documents found in: ${parentCollectionPath}`));
      return [];
    }

    console.log(chalk.gray(`  Searching through ${parentSnapshot.docs.length} parent document(s)...`));

    // Search for a parent document that has this subcollection
    for (const parentDoc of parentSnapshot.docs) {
      const subcollectionSnapshot = await parentDoc.ref
        .collection(subcollectionName)
        .limit(1)
        .get();

      if (!subcollectionSnapshot.empty) {
        // Found a parent with this subcollection, now fetch all sample documents
        console.log(chalk.gray(`  ✓ Found parent with subcollection: ${parentDoc.id}`));

        const allSubcollectionDocs = await parentDoc.ref
          .collection(subcollectionName)
          .limit(limit)
          .get();

        console.log(chalk.green(`✓ Found ${allSubcollectionDocs.docs.length} document(s) in subcollection`));
        return allSubcollectionDocs.docs;
      }
    }

    // No parent document had this subcollection
    console.log(chalk.yellow(`⚠ No documents found in subcollection: ${subcollectionName}`));
    console.log(chalk.yellow(`  Searched ${parentSnapshot.docs.length} parent document(s), none had this subcollection`));
    return [];
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
   * Searches through parent documents to find one that has the subcollection
   */
  async subcollectionExists(
    parentCollectionPath: string,
    subcollectionName: string,
    subcollectionSearchLimit: number = 10
  ): Promise<boolean> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    // Get multiple parent documents to search
    const parentSnapshot = await this.db
      .collection(parentCollectionPath)
      .limit(subcollectionSearchLimit)
      .get();

    if (parentSnapshot.empty) {
      return false;
    }

    // Search for a parent document that has this subcollection
    for (const parentDoc of parentSnapshot.docs) {
      const subcollectionSnapshot = await parentDoc.ref
        .collection(subcollectionName)
        .limit(1)
        .get();

      if (!subcollectionSnapshot.empty) {
        return true; // Found at least one parent with this subcollection
      }
    }

    return false; // None of the parent documents had this subcollection
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
   * List subcollections for a given collection (by checking a sample of documents)
   */
  async listSubcollections(collectionPath: string, limit: number = 10): Promise<string[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    console.log(chalk.gray(`  Sampling ${limit} document(s) from ${collectionPath}...`));

    // Get a sample of documents to check for subcollections
    // We check more than one because some documents might not have subcollections
    // while others do
    const snapshot = await this.db.collection(collectionPath).limit(limit).get();

    if (snapshot.empty) {
      console.log(chalk.yellow(`  ⚠ No documents found in collection`));
      return [];
    }

    const subcollectionsSet = new Set<string>();
    const docsWithSubcollections: string[] = [];
    const subcollectionsByDoc = new Map<string, string[]>();

    for (const doc of snapshot.docs) {
      const subcollections = await doc.ref.listCollections();
      if (subcollections.length > 0) {
        docsWithSubcollections.push(doc.id);
        const subNames = subcollections.map(col => col.id);
        subcollectionsByDoc.set(doc.id, subNames);
        for (const col of subcollections) {
          subcollectionsSet.add(col.id);
        }
      }
    }

    // Detailed logging
    console.log(chalk.gray(`  📊 Sampled ${snapshot.docs.length} document(s)`));
    console.log(chalk.gray(`  📊 Documents with subcollections: ${docsWithSubcollections.length}/${snapshot.docs.length}`));

    if (docsWithSubcollections.length > 0) {
      console.log(chalk.gray(`  📊 Unique subcollections found: ${subcollectionsSet.size}`));

      // Show which documents have which subcollections (up to 5 examples)
      const exampleDocs = docsWithSubcollections.slice(0, 5);
      for (const docId of exampleDocs) {
        const subs = subcollectionsByDoc.get(docId) || [];
        console.log(chalk.gray(`     └─ Document "${docId}": [${subs.join(', ')}]`));
      }

      if (docsWithSubcollections.length > 5) {
        console.log(chalk.gray(`     └─ ... and ${docsWithSubcollections.length - 5} more document(s)`));
      }
    } else {
      console.log(chalk.gray(`  📊 No subcollections found in sampled documents`));
    }

    // Warning if we hit the limit - there might be more subcollections
    if (snapshot.docs.length === limit) {
      console.log(chalk.yellow(`  ⚠ Sampled limit reached (${limit} docs). If subcollections exist in other documents, they may not be detected.`));
      console.log(chalk.yellow(`     Consider increasing the sample size if you suspect missing subcollections.`));
    }

    return Array.from(subcollectionsSet);
  }

  /**
   * Analyze all parent documents that have a specific subcollection
   * Returns information about each parent's subcollection schema
   */
  async analyzeSubcollectionParents(
    parentCollectionPath: string,
    subcollectionName: string,
    sampleSize: number = 20,
    searchLimit: number = 50
  ): Promise<SubcollectionParentInfo[]> {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }

    console.log(chalk.blue(`\n📊 Analyzing parent documents for subcollection: ${subcollectionName}...`));

    // Get parent documents to search
    const parentSnapshot = await this.db
      .collection(parentCollectionPath)
      .limit(searchLimit)
      .get();

    if (parentSnapshot.empty) {
      console.log(chalk.yellow(`⚠ No parent documents found in: ${parentCollectionPath}`));
      return [];
    }

    const parentsWithSubcollection: SubcollectionParentInfo[] = [];
    const maxParentsToAnalyze = 10; // Limit to avoid overwhelming the user

    // Check each parent document for the subcollection
    let checkedCount = 0;
    for (const parentDoc of parentSnapshot.docs) {
      checkedCount++;

      // Show progress every 10 documents
      if (checkedCount % 10 === 0) {
        console.log(chalk.gray(`  Checked ${checkedCount}/${parentSnapshot.docs.length} parent documents...`));
      }

      const subcollectionSnapshot = await parentDoc.ref
        .collection(subcollectionName)
        .limit(sampleSize)
        .get();

      if (!subcollectionSnapshot.empty) {
        // Extract field names from subcollection documents
        const fieldNames = new Set<string>();
        for (const subDoc of subcollectionSnapshot.docs) {
          const data = subDoc.data();
          if (data) {
            Object.keys(data).forEach(key => fieldNames.add(key));
          }
        }

        const sampleFields = Array.from(fieldNames).sort();

        parentsWithSubcollection.push({
          parentId: parentDoc.id,
          parentPath: parentDoc.ref.path,
          documentCount: subcollectionSnapshot.docs.length,
          fieldCount: sampleFields.length,
          sampleFields,
        });

        // Stop if we've found enough parents to choose from
        if (parentsWithSubcollection.length >= maxParentsToAnalyze) {
          console.log(chalk.gray(`  Found ${maxParentsToAnalyze} parents, stopping search...`));
          break;
        }
      }
    }

    if (parentsWithSubcollection.length === 0) {
      console.log(chalk.yellow(`⚠ No parent documents found with subcollection: ${subcollectionName}`));
      return [];
    }

    // Sort by field count (descending) to show most complete schemas first
    parentsWithSubcollection.sort((a, b) => b.fieldCount - a.fieldCount);

    console.log(chalk.green(`✓ Found ${parentsWithSubcollection.length} parent document(s) with subcollection`));

    return parentsWithSubcollection;
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

