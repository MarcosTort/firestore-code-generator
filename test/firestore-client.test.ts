import * as admin from 'firebase-admin';
import { FirestoreClient } from '../src/firestore-client';

// Mock firebase-admin
jest.mock('firebase-admin', () => {
    return {
        credential: {
            cert: jest.fn(),
            applicationDefault: jest.fn(),
        },
        initializeApp: jest.fn(),
        firestore: jest.fn(),
        app: jest.fn().mockReturnValue({
            options: { projectId: 'test-project' },
            delete: jest.fn().mockResolvedValue(undefined),
        }),
    };
});

describe('FirestoreClient', () => {
    let firestoreClient: FirestoreClient;
    let mockListCollections: jest.Mock;
    let mockCollection: jest.Mock;
    let mockLimit: jest.Mock;
    let mockGet: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock Firestore chain
        mockGet = jest.fn();
        mockLimit = jest.fn().mockReturnValue({ get: mockGet });
        mockCollection = jest.fn().mockReturnValue({ limit: mockLimit });
        mockListCollections = jest.fn();

        (admin.firestore as unknown as jest.Mock).mockReturnValue({
            collection: mockCollection,
            listCollections: mockListCollections,
        });

        firestoreClient = new FirestoreClient('test-project');
        // Manually set initialized to true to bypass initialize() call which needs credsand complex setup
        (firestoreClient as any).db = admin.firestore();
        (firestoreClient as any).initialized = true;
    });

    describe('listSubcollections', () => {
        it('should find subcollections present in non-first documents', async () => {
            // Arrange
            const collectionPath = 'users'; // We are mocking 'users' collection

            // Mock documents in the collection
            const doc1 = {
                id: 'doc1',
                ref: {
                    listCollections: jest.fn().mockResolvedValue([]), // No subcollections
                },
            };

            const doc2 = {
                id: 'doc2',
                ref: {
                    listCollections: jest.fn().mockResolvedValue([{ id: 'orders' }]), // has 'orders' subcollection
                },
            };

            const doc3 = {
                id: 'doc3',
                ref: {
                    listCollections: jest.fn().mockResolvedValue([{ id: 'settings' }]), // has 'settings' subcollection
                }
            }

            // Mock get() to return these documents
            mockGet.mockResolvedValue({
                empty: false,
                docs: [doc1, doc2, doc3],
            });

            // Act
            const subcollections = await firestoreClient.listSubcollections(collectionPath);

            // Assert
            // Currently, it only checks doc1, so it should expect empty array if the bug exists.
            // But we want to fail if it DOESN'T find 'orders' and 'settings'.
            // So let's expect what we WANT: ['orders', 'settings'] (or just contains them)

            expect(subcollections).toContain('orders');
            expect(subcollections).toContain('settings');
            expect(mockCollection).toHaveBeenCalledWith(collectionPath);
        });
    });
});
