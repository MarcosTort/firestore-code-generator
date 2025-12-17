import 'package:equatable/equatable.dart';

/// A model representing a userprofile document from Firestore.
class UserProfile extends Equatable {
  /// Creates a new [UserProfile] instance.
  const UserProfile({
    required this.avatar,
    required this.bio,
    required this.location,
  });

  /// Creates a [UserProfile] from a JSON map.
  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
    avatar: json['avatar'] as String,
          bio: json['bio'] as String,
          location: json['location'] as String,
      
    );
  }

  /// The avatar field.
  final String avatar;

  /// The bio field.
  final String bio;

  /// The location field.
  final String location;

  @override
  List<Object?> get props => [
    avatar,
    bio,
    location,
];

  /// Converts this [UserProfile] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'avatar': avatar,
      'bio': bio,
      'location': location,
    };
  }
}


/// A model representing a usermetadata document from Firestore.
class UserMetadata extends Equatable {
  /// Creates a new [UserMetadata] instance.
  const UserMetadata({
    required this.source,
    this.version,
  });

  /// Creates a [UserMetadata] from a JSON map.
  factory UserMetadata.fromJson(Map<String, dynamic> json) {
    return UserMetadata(
    source: json['source'] as String,
          version: json['version'] as String?,
      
    );
  }

  /// The source field.
  final String source;

  /// The version field.
  final String? version;

  @override
  List<Object?> get props => [
    source,
    version,
];

  /// Converts this [UserMetadata] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'source': source,
      if (version != null) 'version': version,
    };
  }
}


/// A model representing a users document from Firestore.
class UserDTO extends Equatable {
  /// Creates a new [UserDTO] instance.
  const UserDTO({
    required this.createdAt,
    required this.email,
    required this.id,
    required this.isActive,
    required this.metadata,
    required this.name,
    required this.role,
    this.age,
    this.profile,
    this.tags,
  });

  /// Creates a [UserDTO] from a JSON map.
  factory UserDTO.fromJson(Map<String, dynamic> json) {
    return UserDTO(
    createdAt: DateTime.parse(json['createdAt'] as String),
          email: json['email'] as String,
          id: json['id'] as String,
          isActive: json['isActive'] as bool,
          metadata: UserMetadata.fromJson(json['metadata'] as Map<String, dynamic>),
          name: json['name'] as String,
          role: json['role'] as String,
          age: json['age'] as int?,
          profile: json['profile'] != null ? UserProfile.fromJson(json['profile'] as Map<String, dynamic>) : null,
          tags: json['tags'] as List<String>?,
      
    );
  }

  /// The createdAt field.
  final DateTime createdAt;

  /// The email field.
  final String email;

  /// The id field.
  final String id;

  /// The isActive field.
  final bool isActive;

  /// The metadata field.
  final UserMetadata metadata;

  /// The name field.
  final String name;

  /// The role field.
  final String role;

  /// The age field.
  final int? age;

  /// The profile field.
  final UserProfile? profile;

  /// The tags field.
  final List<String>? tags;

  @override
  List<Object?> get props => [
    createdAt,
    email,
    id,
    isActive,
    metadata,
    name,
    role,
    age,
    profile,
    tags,
];

  /// Converts this [UserDTO] to a JSON map.
  Map<String, dynamic> toJson() {
    return {
      'createdAt': createdAt.toIso8601String(),
      'email': email,
      'id': id,
      'isActive': isActive,
      'metadata': metadata.toJson(),
      'name': name,
      'role': role,
      if (age != null) 'age': age,
      if (profile != null) 'profile': profile?.toJson(),
      if (tags != null) 'tags': tags,
    };
  }
}
