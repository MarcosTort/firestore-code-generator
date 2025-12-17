import 'package:equatable/equatable.dart';

/// A model representing a orderitem document from Firestore.
class OrderItem extends Equatable {
  /// Creates a new [OrderItem] instance.
  const OrderItem({
    required this.price,
    required this.productId,
    required this.quantity,
    required this.subtotal,
  });

  /// Creates a [OrderItem] from a JSON map.
  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
    price: json['price'] as double,
          productId: json['productId'] as String,
          quantity: json['quantity'] as int,
          subtotal: json['subtotal'] as double,
      
    );
  }

  /// The price field.
  final double price;

  /// The productId field.
  final String productId;

  /// The quantity field.
  final int quantity;

  /// The subtotal field.
  final double subtotal;

  @override
  List<Object?> get props => [
    price,
    productId,
    quantity,
    subtotal,
];

  /// Converts this [OrderItem] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'price': price,
      'productId': productId,
      'quantity': quantity,
      'subtotal': subtotal,
    };
  }
}


/// A model representing a ordershippingaddress document from Firestore.
class OrderShippingaddress extends Equatable {
  /// Creates a new [OrderShippingaddress] instance.
  const OrderShippingaddress({
    required this.city,
    required this.country,
    required this.state,
    required this.street,
    required this.zipCode,
  });

  /// Creates a [OrderShippingaddress] from a JSON map.
  factory OrderShippingaddress.fromJson(Map<String, dynamic> json) {
    return OrderShippingaddress(
    city: json['city'] as String,
          country: json['country'] as String,
          state: json['state'] as String,
          street: json['street'] as String,
          zipCode: json['zipCode'] as String,
      
    );
  }

  /// The city field.
  final String city;

  /// The country field.
  final String country;

  /// The state field.
  final String state;

  /// The street field.
  final String street;

  /// The zipCode field.
  final String zipCode;

  @override
  List<Object?> get props => [
    city,
    country,
    state,
    street,
    zipCode,
];

  /// Converts this [OrderShippingaddress] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'city': city,
      'country': country,
      'state': state,
      'street': street,
      'zipCode': zipCode,
    };
  }
}


/// A model representing a orders document from Firestore.
class OrderDTO extends Equatable {
  /// Creates a new [OrderDTO] instance.
  const OrderDTO({
    required this.createdAt,
    required this.deliveredAt,
    required this.id,
    required this.items,
    required this.orderNumber,
    required this.shippingAddress,
    required this.status,
    required this.total,
    required this.userId,
  });

  /// Creates a [OrderDTO] from a JSON map.
  factory OrderDTO.fromJson(Map<String, dynamic> json) {
    return OrderDTO(
    createdAt: DateTime.parse(json['createdAt'] as String),
          deliveredAt: DateTime.parse(json['deliveredAt'] as String),
          id: json['id'] as String,
          items: (json['items'] as List<dynamic>).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList(),
          orderNumber: json['orderNumber'] as String,
          shippingAddress: OrderShippingaddress.fromJson(json['shippingAddress'] as Map<String, dynamic>),
          status: json['status'] as String,
          total: json['total'] as double,
          userId: json['userId'] as String,
      
    );
  }

  /// The createdAt field.
  final DateTime createdAt;

  /// The deliveredAt field.
  final DateTime deliveredAt;

  /// The id field.
  final String id;

  /// The items field.
  final List<OrderItem> items;

  /// The orderNumber field.
  final String orderNumber;

  /// The shippingAddress field.
  final OrderShippingaddress shippingAddress;

  /// The status field.
  final String status;

  /// The total field.
  final double total;

  /// The userId field.
  final String userId;

  @override
  List<Object?> get props => [
    createdAt,
    deliveredAt,
    id,
    items,
    orderNumber,
    shippingAddress,
    status,
    total,
    userId,
];

  /// Converts this [OrderDTO] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'createdAt': createdAt.toIso8601String(),
      'deliveredAt': deliveredAt.toIso8601String(),
      'id': id,
      'items': items.map((e) => e.toJson()).toList(),
      'orderNumber': orderNumber,
      'shippingAddress': shippingAddress.toJson(),
      'status': status,
      'total': total,
      'userId': userId,
    };
  }
}
