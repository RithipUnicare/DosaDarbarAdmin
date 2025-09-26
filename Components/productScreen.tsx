/* eslint-disable @typescript-eslint/no-unused-vars */
import type { RootStackParamList } from '../AppNav';
import type { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCard } from '../Services/ApiServices.js';

const { width } = Dimensions.get('window');

interface ProductType {
  id: string | number;
  name: string;
  category_id: string | number;
  product_code: string | number;
  prices: string | number;
  status: string;
  item_image?: string;
}

export interface CartItemType {
  id?: string | number;
  cart_id?: string | number;
  product_id: string | number;
  category_id: string | number;
  product_price: string | number;
  quantity: string | number;
  total_amount: string | number;
  user_id: string | number;
  tableno: string | number;
  name?: string;
  item_image?: string;
}

type ProductSelectionScreenProps = StackScreenProps<
  RootStackParamList,
  'Product'
>;

const CART_STORAGE_KEY = 'cartItems';

const ProductSelectionScreen: React.FC<ProductSelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const { user_id, tableno } = route.params;
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null,
  );

  const GET_PRODUCT_API =
    'http://unitech.agency/Dosadharbar/api/v1/get_AllproductDetails';
  const IMAGE_BASE_URL = 'http://unitech.agency/Dosadharbar/api/v1/images/';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(GET_PRODUCT_API);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const Data = await response.json();
      const data = Data['Item'] || Data['data'] || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Failed to load products. Please check your internet connection.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = async (product: ProductType) => {
    if (quantity <= 0) {
      Alert.alert('Validation', 'Please enter a valid quantity.', [
        { text: 'OK' },
      ]);
      return;
    }

    const cartItem: CartItemType = {
      id: `cart_${Date.now()}`,
      product_id: product.id,
      category_id: product.category_id,
      product_price: product.prices,
      quantity: quantity,
      total_amount: (parseFloat(product.prices.toString()) * quantity).toFixed(
        2,
      ),
      user_id,
      tableno,
      name: product.name,
      item_image: product.item_image,
    };

    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      const existingItems: CartItemType[] = stored ? JSON.parse(stored) : [];
      const updatedItems = [...existingItems, cartItem];
      //console.log(updatedItems);
      //await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
      for (let product of updatedItems) {
        const postData = {
          product_id: product.product_id,
          category_id: product.category_id,
          product_price: Number(product.product_price),
          quantity: Number(product.quantity),
          total_amount: Number(product.total_amount),
          tableno: Number(product.tableno),
          edit_id: 0,
        };
        const response = await addCard(postData);
        console.log(response);
      }
      Alert.alert('Success', 'Item added to cart!', [{ text: 'OK' }]);
      setQuantity(1);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to save cart item:', error);
      Alert.alert('Error', 'Failed to add item to cart.', [{ text: 'OK' }]);
    }
  };

  const renderProductItem = ({ item }: { item: ProductType }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => setSelectedProduct(item)}
      activeOpacity={0.8}
    >
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <View style={styles.imageContainer}>
          {item.item_image ? (
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${item.item_image}` }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>₹{item.prices}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Products</Text>
        <Text style={styles.subtitle}>Table No: {tableno}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {selectedProduct && (
        <View style={styles.selectionContainer}>
          <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
          <Text style={styles.selectedProductPrice}>
            ₹{selectedProduct.prices}
          </Text>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decreaseQuantity}
                activeOpacity={0.7}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={increaseQuantity}
                activeOpacity={0.7}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddToCart(selectedProduct)}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 25,
    paddingBottom: 25,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
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
    marginTop: 10,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  searchInput: {
    backgroundColor: '#444',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  selectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#333',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedProductName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedProductPrice: {
    color: '#4CAF50',
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  quantityButton: {
    backgroundColor: '#555',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  quantityText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  itemSeparator: {
    height: 15,
  },
  productCard: {
    width: (width - 60) / 2,
    height: 220,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 15,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 130,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 15,
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
});

export default ProductSelectionScreen;
