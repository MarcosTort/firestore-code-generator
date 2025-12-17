import 'package:equatable/equatable.dart';

/// A model representing a productspecifications document from Firestore.
class ProductSpecifications extends Equatable {
  /// Creates a new [ProductSpecifications] instance.
  const ProductSpecifications({
    required this.brand,
    required this.color,
    required this.model,
    required this.weight,
  });

  /// Creates a [ProductSpecifications] from a JSON map.
  factory ProductSpecifications.fromJson(Map<String, dynamic> json) {
    return ProductSpecifications(
    brand: json['brand'] as String,
          color: json['color'] as String,
          model: json['model'] as String,
          weight: json['weight'] as int,
      
    );
  }

  /// The brand field.
  final String brand;

  /// The color field.
  final String color;

  /// The model field.
  final String model;

  /// The weight field.
  final int weight;

  @override
  List<Object?> get props => [
    brand,
    color,
    model,
    weight,
];

  /// Converts this [ProductSpecifications] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'brand': brand,
      'color': color,
      'model': model,
      'weight': weight,
    };
  }
}


/// A model representing a productreview document from Firestore.
class ProductReview extends Equatable {
  /// Creates a new [ProductReview] instance.
  const ProductReview({
    required this.comment,
    required this.date,
    required this.rating,
    required this.userId,
  });

  /// Creates a [ProductReview] from a JSON map.
  factory ProductReview.fromJson(Map<String, dynamic> json) {
    return ProductReview(
    comment: json['comment'] as String,
          date: DateTime.parse(json['date'] as String),
          rating: json['rating'] as int,
          userId: json['userId'] as String,
      
    );
  }

  /// The comment field.
  final String comment;

  /// The date field.
  final DateTime date;

  /// The rating field.
  final int rating;

  /// The userId field.
  final String userId;

  @override
  List<Object?> get props => [
    comment,
    date,
    rating,
    userId,
];

  /// Converts this [ProductReview] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'comment': comment,
      'date': date.toIso8601String(),
      'rating': rating,
      'userId': userId,
    };
  }
}


/// A model representing a products document from Firestore.
class ProductDTO extends Equatable {
  /// Creates a new [ProductDTO] instance.
  const ProductDTO({
    required this.category,
    required this.createdAt,
    required this.description,
    required this.id,
    required this.images,
    required this.isAvailable,
    required this.name,
    required this.price,
    required this.reviews,
    required this.specifications,
    required this.stock,
    required this.updatedAt,
  });

  /// Creates a [ProductDTO] from a JSON map.
  factory ProductDTO.fromJson(Map<String, dynamic> json) {
    return ProductDTO(
    category: json['category'] as String,
          createdAt: DateTime.parse(json['createdAt'] as String),
          description: json['description'] as String,
          id: json['id'] as String,
          images: json['images'] as List<String>,
          isAvailable: json['isAvailable'] as bool,
          name: json['name'] as String,
          price: json['price'] as double,
          reviews: (json['reviews'] as List<dynamic>).map((e) => ProductReview.fromJson(e as Map<String, dynamic>)).toList(),
          specifications: ProductSpecifications.fromJson(json['specifications'] as Map<String, dynamic>),
          stock: json['stock'] as int,
          updatedAt: DateTime.parse(json['updatedAt'] as String),
      
    );
  }

  /// The category field.
  final String category;

  /// The createdAt field.
  final DateTime createdAt;

  /// The description field.
  final String description;

  /// The id field.
  final String id;

  /// The images field.
  final List<String> images;

  /// The isAvailable field.
  final bool isAvailable;

  /// The name field.
  final String name;

  /// The price field.
  final double price;

  /// The reviews field.
  final List<ProductReview> reviews;

  /// The specifications field.
  final ProductSpecifications specifications;

  /// The stock field.
  final int stock;

  /// The updatedAt field.
  final DateTime updatedAt;

  @override
  List<Object?> get props => [
    category,
    createdAt,
    description,
    id,
    images,
    isAvailable,
    name,
    price,
    reviews,
    specifications,
    stock,
    updatedAt,
];

  /// Converts this [ProductDTO] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'category': category,
      'createdAt': createdAt.toIso8601String(),
      'description': description,
      'id': id,
      'images': images,
      'isAvailable': isAvailable,
      'name': name,
      'price': price,
      'reviews': reviews.map((e) => e.toJson()).toList(),
      'specifications': specifications.toJson(),
      'stock': stock,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
