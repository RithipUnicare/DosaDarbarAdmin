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
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface ProductType {
  id: string;
  name?: string;
  product_name?: string;
  category_id?: string;
  product_code?: string;
  item_code?: string;
  price?: string | number;
  prices?: string | number;
  status?: string;
  item_image?: string;
  product_image?: string;
  description?: string;
}

interface ProductFormType {
  id: string;
  name: string;
  category_id: string;
  product_code: string;
  prices: string;
  status: string;
  image: any;
}

interface GetProductsScreenProps {
  navigation: any;
  route?: any;
}

const GetProductsScreen: React.FC<GetProductsScreenProps> = ({
  navigation,
  route,
}) => {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [categoryName, setCategoryName] = useState<string>('');
  const [imageBaseUrl, setImageBaseUrl] = useState<string>(
    'https://deepikagroups.com/Dosadharbar/uploads/product/',
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [productForm, setProductForm] = useState<ProductFormType>({
    id: '',
    name: '',
    category_id: '',
    product_code: '',
    prices: '',
    status: 'Active',
    image: null,
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const API_BASE_URL =
    'https://deepikagroups.com/Dosadharbar/api/v1/get_AllproductDetails';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const apiUrl = API_BASE_URL;
      console.log(apiUrl);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const Data = await response.json();
      if (Data['image_link']) {
        setImageBaseUrl(Data['image_link']);
        console.log('Image Base URL:', Data['image_link']);
      }
      const data = Data['Item'];

      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
        Alert.alert('Info', 'No products found.');
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      Alert.alert(
        'Error',
        'Failed to load products. Please check your internet connection.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleProductPress = (product: ProductType) => {
    console.log('Product selected:', product);
    // Handle product selection - add to cart, show details, etc.
  };

  const handleBackPress = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const openAddModal = () => {
    setProductForm({
      id: '',
      name: '',
      category_id: '',
      product_code: '',
      prices: '',
      status: 'Active',
      image: null,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (item: ProductType) => {
    setProductForm({
      id: item.id,
      name: item.product_name || item.name || '',
      category_id: item.category_id ? String(item.category_id) : '',
      product_code: item.product_code
        ? String(item.product_code)
        : item.item_code
        ? String(item.item_code)
        : '',
      prices: item.price
        ? String(item.price)
        : item.prices
        ? String(item.prices)
        : '',
      status: item.status || 'Active',
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
          setProductForm(prev => ({ ...prev, image: response.assets![0] }));
        }
      },
    );
  };

  const handleProductSubmit = async () => {
    if (
      !productForm.name.trim() ||
      !productForm.category_id.trim() ||
      !productForm.product_code.trim() ||
      !productForm.prices.trim() ||
      (!isEditing && !productForm.image)
    ) {
      Alert.alert('Validation', 'All fields and image are required.', [
        { text: 'OK' },
      ]);
      return;
    }
    setFormLoading(true);
    try {
      const formData = new FormData();
      if (isEditing && productForm.id) formData.append('id', productForm.id);
      formData.append('name', productForm.name);
      formData.append('category_id', productForm.category_id);
      formData.append('product_code', productForm.product_code);
      formData.append('prices', productForm.prices);
      formData.append('status', productForm.status);
      if (productForm.image) {
        const localUri = productForm.image.uri;
        const filename = localUri.split('/').pop();
        let match = filename.match(/\.(\w+)$/);
        let type = match ? `image/${match[1].toLowerCase()}` : 'image';
        formData.append('image', {
          uri: localUri,
          name: filename,
          type,
        } as any);
      }
      const response = await fetch(
        'https://deepikagroups.com/Dosadharbar/api/v1/add_Products',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        },
      );
      if (!response.ok) throw new Error('Failed to save product');
      Alert.alert(
        'Success',
        isEditing ? 'Product updated!' : 'Product added!',
        [{ text: 'OK' }],
      );
      setShowModal(false);
      fetchProducts();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save product', [
        { text: 'OK' },
      ]);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(
                `https://deepikagroups.com/Dosadharbar/api/v1/delete_Product/${id}`,
                { method: 'GET' },
              );
              if (!response.ok) throw new Error('Failed to delete product');
              Alert.alert('Success', 'Product deleted!', [{ text: 'OK' }]);
              fetchProducts();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete product', [
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
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>{'< Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>PRODUCTS</Text>
      <View
        style={[
          styles.statsContainer,
          {
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between',
            marginTop: 10,
          },
        ]}
      >
        <Text style={styles.statsText}>
          {products.length} Products Available
        </Text>
        <TouchableOpacity style={styles.addIconButton} onPress={openAddModal}>
          <Text style={styles.addIconText}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductItem = ({
    item,
    index,
  }: {
    item: ProductType;
    index: number;
  }) => (
    <View style={styles.productCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: `${imageBaseUrl}${item.item_image || 'default.jpg'}`,
            }}
            style={styles.productImage}
            onError={() =>
              console.log(
                'Error loading image:',
                item.product_image,
                `${imageBaseUrl}${item.product_image || 'default.jpg'}`,
              )
            }
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
            {item.status === 'Active' && (
              <View style={styles.statusBadgeActive}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
            activeOpacity={0.8}
          >
            <Icon name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name || item.name || 'Unknown Product'}
          </Text>
          {item.price && <Text style={styles.productPrice}>₹{item.price}</Text>}
          <Text style={styles.productId}>ID: {item.id}</Text>
          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(item.id)}
            activeOpacity={0.8}
          >
            <Icon name="delete" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🥘</Text>
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>No products available.</Text>
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
            {isEditing ? 'Edit Product' : 'Add Product'}
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
            value={productForm.name}
            onChangeText={text =>
              setProductForm(prev => ({ ...prev, name: text }))
            }
            placeholder="Product Name"
            placeholderTextColor="#888"
          />
          <Text style={{ color: '#fff', marginBottom: 8 }}>Category ID</Text>
          <TextInput
            style={{
              backgroundColor: '#333',
              color: '#fff',
              borderRadius: 8,
              padding: 10,
              marginBottom: 15,
            }}
            value={productForm.category_id}
            onChangeText={text =>
              setProductForm(prev => ({ ...prev, category_id: text }))
            }
            placeholder="Category ID"
            placeholderTextColor="#888"
            keyboardType="numeric"
          />
          <Text style={{ color: '#fff', marginBottom: 8 }}>Product Code</Text>
          <TextInput
            style={{
              backgroundColor: '#333',
              color: '#fff',
              borderRadius: 8,
              padding: 10,
              marginBottom: 15,
            }}
            value={productForm.product_code}
            onChangeText={text =>
              setProductForm(prev => ({ ...prev, product_code: text }))
            }
            placeholder="Product Code"
            placeholderTextColor="#888"
            keyboardType="numeric"
          />
          <Text style={{ color: '#fff', marginBottom: 8 }}>Price</Text>
          <TextInput
            style={{
              backgroundColor: '#333',
              color: '#fff',
              borderRadius: 8,
              padding: 10,
              marginBottom: 15,
            }}
            value={productForm.prices}
            onChangeText={text =>
              setProductForm(prev => ({ ...prev, prices: text }))
            }
            placeholder="Price"
            placeholderTextColor="#888"
            keyboardType="numeric"
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
              setProductForm(prev => ({
                ...prev,
                status: prev.status === 'Active' ? 'Pending' : 'Active',
              }))
            }
          >
            <Text style={{ color: '#fff' }}>{productForm.status}</Text>
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
              {productForm.image ? 'Change Image' : 'Pick Image'}
            </Text>
          </TouchableOpacity>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
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
              onPress={handleProductSubmit}
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
          <Text style={styles.loadingText}>Loading Products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item, index) => `${item.id || index}`}
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
        columnWrapperStyle={products.length > 0 ? styles.row : undefined}
      />
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 5,
  },
  categoryTitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  infoBox: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    flex: 0.45,
    alignItems: 'center',
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 15,
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  changeInputsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeInputsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 45) / 2,
    height: 220,
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
    height: 120,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  productInfo: {
    padding: 10,
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 3,
  },
  productId: {
    fontSize: 10,
    color: '#888',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 11,
    color: '#ccc',
    lineHeight: 14,
  },
  statusContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 25,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 0.45,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 0.45,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  deleteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#F44336',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  statusBadgeActive: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  //   statsContainer: {
  //     backgroundColor: '#333',
  //     paddingHorizontal: 15,
  //     paddingVertical: 8,
  //     borderRadius: 20,
  //     borderWidth: 1,
  //     borderColor: '#444',
  //     marginTop: 0,
  //   },
});

export default GetProductsScreen;
