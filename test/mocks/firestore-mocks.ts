import * as admin from 'firebase-admin';

/**
 * Create a mock Firestore DocumentSnapshot
 */
export function createMockDocumentSnapshot(
  id: string,
  data: any
): admin.firestore.DocumentSnapshot {
  return {
    id,
    exists: true,
    ref: {} as any,
    data: () => data,
    get: (fieldPath: string) => {
      const keys = fieldPath.split('.');
      let value = data;
      for (const key of keys) {
        value = value?.[key];
      }
      return value;
    },
    createTime: admin.firestore.Timestamp.now(),
    updateTime: admin.firestore.Timestamp.now(),
    readTime: admin.firestore.Timestamp.now(),
  } as admin.firestore.DocumentSnapshot;
}

/**
 * Create a Firestore Timestamp from a date string
 */
export function createTimestamp(dateString: string): admin.firestore.Timestamp {
  const date = new Date(dateString);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Sample user documents for testing
 */
export function getSampleUserDocuments(): admin.firestore.DocumentSnapshot[] {
  return [
    createMockDocumentSnapshot('user1', {
      id: 'user1',
      email: 'john.doe@example.com',
      name: 'John Doe',
      age: 30,
      isActive: true,
      role: 'admin',
      createdAt: createTimestamp('2024-01-15T10:30:00Z'),
      profile: {
        bio: 'Software developer',
        avatar: 'https://example.com/avatar1.jpg',
        location: 'San Francisco',
      },
      tags: ['developer', 'typescript', 'flutter'],
      metadata: {
        source: 'mobile',
        version: '1.0.0',
      },
    }),
    createMockDocumentSnapshot('user2', {
      id: 'user2',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      age: 28,
      isActive: true,
      role: 'user',
      createdAt: createTimestamp('2024-02-20T14:45:00Z'),
      profile: {
        bio: 'Product designer',
        avatar: 'https://example.com/avatar2.jpg',
        location: 'New York',
      },
      tags: ['designer', 'ux', 'ui'],
      metadata: {
        source: 'web',
        version: '1.0.0',
      },
    }),
    createMockDocumentSnapshot('user3', {
      id: 'user3',
      email: 'bob.wilson@example.com',
      name: 'Bob Wilson',
      isActive: false,
      role: 'user',
      createdAt: createTimestamp('2024-03-10T09:15:00Z'),
      // Note: age, profile, tags, and metadata are optional
      metadata: {
        source: 'mobile',
      },
    }),
  ];
}

/**
 * Sample product documents with nested objects and arrays
 */
export function getSampleProductDocuments(): admin.firestore.DocumentSnapshot[] {
  return [
    createMockDocumentSnapshot('product1', {
      id: 'product1',
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 199.99,
      stock: 50,
      isAvailable: true,
      category: 'Electronics',
      images: [
        'https://example.com/product1-1.jpg',
        'https://example.com/product1-2.jpg',
      ],
      specifications: {
        brand: 'AudioPro',
        model: 'WH-1000',
        color: 'Black',
        weight: 250,
      },
      reviews: [
        {
          userId: 'user1',
          rating: 5,
          comment: 'Excellent sound quality!',
          date: createTimestamp('2024-01-20T15:30:00Z'),
        },
        {
          userId: 'user2',
          rating: 4,
          comment: 'Great product, comfortable to wear',
          date: createTimestamp('2024-02-05T10:20:00Z'),
        },
      ],
      createdAt: createTimestamp('2023-12-01T08:00:00Z'),
      updatedAt: createTimestamp('2024-03-15T12:30:00Z'),
    }),
    createMockDocumentSnapshot('product2', {
      id: 'product2',
      name: 'Smart Watch',
      description: 'Fitness tracking smartwatch',
      price: 299.99,
      stock: 30,
      isAvailable: true,
      category: 'Wearables',
      images: ['https://example.com/product2.jpg'],
      specifications: {
        brand: 'TechFit',
        model: 'SW-200',
        color: 'Silver',
        weight: 45,
      },
      reviews: [
        {
          userId: 'user3',
          rating: 5,
          comment: 'Perfect for fitness tracking',
          date: createTimestamp('2024-03-01T14:00:00Z'),
        },
      ],
      createdAt: createTimestamp('2024-01-10T09:00:00Z'),
      updatedAt: createTimestamp('2024-03-10T16:45:00Z'),
    }),
  ];
}

/**
 * Sample order documents with complex nested structures
 */
export function getSampleOrderDocuments(): admin.firestore.DocumentSnapshot[] {
  return [
    createMockDocumentSnapshot('order1', {
      id: 'order1',
      userId: 'user1',
      orderNumber: 'ORD-2024-0001',
      status: 'delivered',
      total: 499.98,
      items: [
        {
          productId: 'product1',
          quantity: 2,
          price: 199.99,
          subtotal: 399.98,
        },
        {
          productId: 'product2',
          quantity: 1,
          price: 299.99,
          subtotal: 299.99,
        },
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
      },
      createdAt: createTimestamp('2024-03-15T10:00:00Z'),
      deliveredAt: createTimestamp('2024-03-20T15:30:00Z'),
    }),
  ];
}

