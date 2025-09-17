/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface CategoryType {
  id: string;
  name: string;
  status: string;
  category_image?: string;
  created_by?: string;
}

interface CategoryFormType {
  id: string;
  name: string;
  status: string;
  image: any;
}

interface CategoriesScreenProps {
  navigation: any;
}

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormType>({
    id: '',
    name: '',
    status: 'Active',
    image: null,
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [imageBaseUrl, setImageBaseUrl] = useState<string>(
    'http://unitech.agency/Dosadharbar/uploads/category/',
  );

  const API_URL = 'http://unitech.agency/Dosadharbar/api/v1/getAllCategory';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data['image_link']) {
        setImageBaseUrl(data['image_link']);
      }
      const activeCategories = data['Category'].filter(
        (category: CategoryType) => category.status === 'Active',
      );
      setCategories(activeCategories);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      Alert.alert(
        'Error',
        'Failed to load categories. Please check your internet connection and try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: CategoryType) => {
    // navigation.navigate('Products', { categoryId: category.id, categoryName: category.name });
  };

  const handleBackPress = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const openAddModal = () => {
    setCategoryForm({ id: '', name: '', status: 'Active', image: null });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (item: CategoryType) => {
    setCategoryForm({
      id: item.id,
      name: item.name,
      status: item.status,
      image: null,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const pickImage = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 500,
        maxWidth: 500,
        quality: 0.7,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Image pick error');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          setCategoryForm(prev => ({ ...prev, image: response.assets![0] }));
        }
      },
    );
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert('Validation', 'Category name is required.', [{ text: 'OK' }]);
      return;
    }
    if (!isEditing && !categoryForm.image) {
      Alert.alert('Validation', 'Category image is required.', [
        { text: 'OK' },
      ]);
      return;
    }
    setFormLoading(true);
    try {
      const formData = new FormData();
      if (isEditing) formData.append('id', categoryForm.id);
      formData.append('name', categoryForm.name);
      formData.append('status', categoryForm.status);
      if (categoryForm.image) {
        const localUri = categoryForm.image.uri;
        const filename = localUri.split('/').pop();
        let match = filename.match(/\.(\w+)$/);
        let type = match ? `image/${match[1].toLowerCase()}` : 'image';
        formData.append('category_image', {
          uri: localUri,
          name: filename,
          type,
        } as any);
      }
      const response = await fetch(
        'http://unitech.agency/Dosadharbar/api/v1/add_Category',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        },
      );
      if (!response.ok) throw new Error('Failed to save category');
      Alert.alert(
        'Success',
        isEditing ? 'Category updated!' : 'Category added!',
        [{ text: 'OK' }],
      );
      setShowModal(false);
      fetchCategories();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save category', [
        { text: 'OK' },
      ]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(
                `http://unitech.agency/Dosadharbar/api/v1/delete_Category/${id}`,
                { method: 'GET' },
              );
              if (!response.ok) throw new Error('Failed to delete category');
              Alert.alert('Success', 'Category deleted!', [{ text: 'OK' }]);
              fetchCategories();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete category', [
                { text: 'OK' },
              ]);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          marginBottom: 10,
        }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>
      <Text style={styles.title}>FOOD CATEGORIES</Text>
      <Text style={styles.subtitle}>Choose your favorite cuisine</Text>
      <View
        style={[
          styles.statsContainer,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 10,
          },
        ]}
      >
        <Text style={styles.statsText}>
          {categories.length} Categories Available
        </Text>
        <TouchableOpacity style={styles.addIconButton} onPress={openAddModal}>
          <Text style={styles.addIconText}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: CategoryType;
    index: number;
  }) => (
    <View style={styles.categoryCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `${imageBaseUrl}${item.category_image}` }}
            style={styles.categoryImage}
            onError={() =>
              console.log(
                'Error loading image:',
                item.category_image,
                `${imageBaseUrl}${item.category_image}`,
              )
            }
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
            activeOpacity={0.8}
          >
            <Icon name="edit" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCategory(item.id)}
            activeOpacity={0.8}
          >
            <Icon name="delete" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryId}>ID: {item.id}</Text>
          {item.created_by && (
            <Text style={styles.createdBy}>By: {item.created_by}</Text>
          )}
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'Active' ? '#4CAF50' : '#F44336',
              },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🍽️</Text>
      <Text style={styles.emptyTitle}>No Categories Found</Text>
      <Text style={styles.emptySubtitle}>
        Pull down to refresh or check your internet connection
      </Text>
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: width * 0.9,
            backgroundColor: '#222',
            borderRadius: 20,
            padding: 20,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 15,
            }}
          >
            {isEditing ? 'Edit Category' : 'Add Category'}
          </Text>
          <Text style={{ color: '#fff', marginBottom: 8 }}>Name</Text>
          <TextInput
            style={{
              backgroundColor: '#333',
              color: '#fff',
              borderRadius: 8,
              padding: 10,
              marginBottom: 15,
            }}
            value={categoryForm.name}
            onChangeText={text =>
              setCategoryForm(prev => ({ ...prev, name: text }))
            }
            placeholder="Category Name"
            placeholderTextColor="#888"
          />
          <Text style={{ color: '#fff', marginBottom: 8 }}>Status</Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#333',
              borderRadius: 8,
              padding: 10,
              marginBottom: 15,
            }}
            onPress={() =>
              setCategoryForm(prev => ({
                ...prev,
                status: prev.status === 'Active' ? 'Pending' : 'Active',
              }))
            }
          >
            <Text style={{ color: '#fff' }}>{categoryForm.status}</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', marginBottom: 8 }}>Image</Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#333',
              borderRadius: 8,
              padding: 10,
              marginBottom: 15,
              alignItems: 'center',
            }}
            onPress={pickImage}
          >
            <Text style={{ color: '#fff' }}>
              {categoryForm.image ? 'Change Image' : 'Pick Image'}
            </Text>
          </TouchableOpacity>
          {categoryForm.image && (
            <Image
              source={{ uri: categoryForm.image.uri }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                marginBottom: 15,
              }}
            />
          )}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: '#888',
                borderRadius: 8,
                padding: 12,
                flex: 0.45,
                alignItems: 'center',
              }}
              onPress={() => setShowModal(false)}
              disabled={formLoading}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#4CAF50',
                borderRadius: 8,
                padding: 12,
                flex: 0.45,
                alignItems: 'center',
                opacity: formLoading ? 0.7 : 1,
              }}
              onPress={handleCategorySubmit}
              disabled={formLoading}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {formLoading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderModal()}
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#fff']}
            tintColor="#fff"
            title="Pull to refresh"
            titleColor="#fff"
          />
        }
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ...existing code...
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 20,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  statsContainer: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    marginTop: 0,
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 45) / 2,
    height: 200,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 15,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  categoryInfo: {
    position: 'absolute',
    bottom: 35,
    left: 10,
    right: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
  categoryId: {
    fontSize: 12,
    color: '#ccc',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  createdBy: {
    fontSize: 10,
    color: '#aaa',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statusContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addIconButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginTop: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  addIconText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -5,
  },
  editButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 18,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 2,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 18,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 2,
  },
});

export default CategoriesScreen;
