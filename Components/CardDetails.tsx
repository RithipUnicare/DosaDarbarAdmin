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
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface CartItemType {
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

interface FormDataType {
  product_id: string;
  category_id: string;
  product_price: string;
  quantity: string;
  total_amount: string;
  user_id: string;
  tableno: string;
}

interface FormErrorsType {
  [key: string]: string | undefined | null;
}

interface ConsolidatedBillType {
  items: CartItemType[];
  totalAmount: string;
  userId: string;
  tableNo: string;
}

interface CartDetailsScreenProps {
  navigation: any;
}

const CartDetailsScreen: React.FC<CartDetailsScreenProps> = ({
  navigation,
}) => {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CartItemType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormDataType>({
    product_id: '',
    category_id: '',
    product_price: '',
    quantity: '1',
    total_amount: '',
    user_id: '',
    tableno: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrorsType>({});

  const GET_CART_API =
    'https://deepikagroups.in/Dosadharbar/api/v1/get_cart_detailsAdmin';
  const ADD_CART_API =
    'https://deepikagroups.in/Dosadharbar/api/v1/add_product_cart';
  const DELETE_CART_API =
    'https://deepikagroups.in/Dosadharbar/api/v1/delete_Cart/';

  useEffect(() => {
    fetchCartDetails();

    // Add dummy cart items for testing (3-4 items for a user)
    setTimeout(() => {
      setCartItems(prev => {
        if (prev.length === 0) {
          const dummyItems: CartItemType[] = [
            {
              id: 'dummy1',
              cart_id: 'dummy1',
              product_id: '101',
              category_id: '1',
              product_price: '50.00',
              quantity: '2',
              total_amount: '100.00',
              user_id: '999',
              tableno: '5',
              name: 'Masala Dosa',
              item_image: '',
            },
            {
              id: 'dummy2',
              cart_id: 'dummy2',
              product_id: '102',
              category_id: '1',
              product_price: '30.00',
              quantity: '1',
              total_amount: '30.00',
              user_id: '999',
              tableno: '5',
              name: 'Idli Sambhar',
              item_image: '',
            },
            {
              id: 'dummy3',
              cart_id: 'dummy3',
              product_id: '103',
              category_id: '2',
              product_price: '40.00',
              quantity: '3',
              total_amount: '120.00',
              user_id: '999',
              tableno: '5',
              name: 'Vada Pav',
              item_image: '',
            },
            {
              id: 'dummy4',
              cart_id: 'dummy4',
              product_id: '104',
              category_id: '1',
              product_price: '25.00',
              quantity: '1',
              total_amount: '25.00',
              user_id: '999',
              tableno: '5',
              name: 'Filter Coffee',
              item_image: '',
            },
          ];
          return dummyItems;
        }
        return prev;
      });
    }, 1500); // Wait for API call to finish
  }, []);

  useEffect(() => {
    calculateTotalAmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.product_price, formData.quantity]);

  const calculateTotalAmount = () => {
    const price = parseFloat(formData.product_price) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    const total = (price * quantity).toFixed(2);
    setFormData(prev => ({ ...prev, total_amount: total }));
  };

  const fetchCartDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(GET_CART_API);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const Data = await response.json();
      const data = Data['Item'];
      if (Array.isArray(data)) {
        setCartItems(data);
      } else if (data && data.cart_items && Array.isArray(data.cart_items)) {
        setCartItems(data.cart_items);
      } else if (data && data.data && Array.isArray(data.data)) {
        setCartItems(data.data);
      } else {
        setCartItems([]);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Failed to load cart details. Please check your internet connection.',
        [{ text: 'OK', style: 'default' }],
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: FormErrorsType = {};
    const requiredFields = [
      { key: 'product_id', label: 'Product ID' },
      { key: 'category_id', label: 'Category ID' },
      { key: 'product_price', label: 'Product Price' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'user_id', label: 'User ID' },
      { key: 'tableno', label: 'Table Number' },
    ];
    requiredFields.forEach(({ key, label }) => {
      if (
        !formData[key as keyof FormDataType] ||
        !formData[key as keyof FormDataType].toString().trim()
      ) {
        errors[key] = `${label} is required`;
      }
    });
    if (formData.product_price && isNaN(parseFloat(formData.product_price))) {
      errors.product_price = 'Please enter a valid price';
    }
    if (
      formData.quantity &&
      (isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) <= 0)
    ) {
      errors.quantity = 'Please enter a valid quantity (greater than 0)';
    }
    if (formData.product_price && parseFloat(formData.product_price) <= 0) {
      errors.product_price = 'Price must be greater than 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateCartQuantity = async (
    item: CartItemType,
    newQuantity: number,
  ) => {
    if (newQuantity <= 0) return;
    const originalCartItems = [...cartItems];
    const updatedCartItems = cartItems.map(cartItem =>
      cartItem.product_id === item.product_id &&
      cartItem.user_id === item.user_id &&
      cartItem.tableno === item.tableno
        ? {
            ...cartItem,
            quantity: newQuantity,
            total_amount: (
              parseFloat(cartItem.product_price as string) * newQuantity
            ).toFixed(2),
          }
        : cartItem,
    );
    setCartItems(updatedCartItems);
    try {
      setIsSubmitting(true);
      const productData = {
        product_id: parseInt(item.product_id as string),
        category_id: parseInt(item.category_id as string),
        product_price: parseFloat(item.product_price as string).toFixed(2),
        quantity: newQuantity,
        total_amount: (
          parseFloat(item.product_price as string) * newQuantity
        ).toFixed(2),
        user_id: parseInt(item.user_id as string),
        tableno: parseInt(item.tableno as string),
        user_id_str: 'admin',
      };
      const response = await fetch(ADD_CART_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      setCartItems(originalCartItems);
      Alert.alert('Error', 'Failed to update quantity. Please try again.', [
        { text: 'OK', style: 'default' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addProductToCart = async (productData: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(ADD_CART_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await fetchCartDetails();
      resetForm();
      setShowAddModal(false);
      setEditingItem(null);
      Alert.alert(
        'Success',
        editingItem
          ? 'Cart item updated successfully!'
          : 'Product added to cart successfully!',
        [{ text: 'OK', style: 'default' }],
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        editingItem
          ? 'Failed to update cart item. Please try again.'
          : 'Failed to add product to cart. Please try again.',
        [{ text: 'OK', style: 'default' }],
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCartItem = async (item: CartItemType) => {
    Alert.alert(
      'Delete Cart Item',
      'Are you sure you want to delete this cart item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const response = await fetch(
                `${DELETE_CART_API}${
                  item.id || item.cart_id || item.product_id
                }`,
              );
              if (!response.ok) throw new Error('Failed to delete cart item');
              await fetchCartDetails();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete cart item', [
                { text: 'OK' },
              ]);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCartDetails();
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    resetForm();
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (item: CartItemType) => {
    setFormData({
      product_id: item.product_id?.toString() || '',
      category_id: item.category_id?.toString() || '',
      product_price: item.product_price?.toString() || '',
      quantity: item.quantity?.toString() || '1',
      total_amount: item.total_amount?.toString() || '',
      user_id: item.user_id?.toString() || '',
      tableno: item.tableno?.toString() || '',
    });
    setEditingItem(item);
    setFormErrors({});
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      category_id: '',
      product_price: '',
      quantity: '1',
      total_amount: '',
      user_id: '',
      tableno: '',
    });
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    const productData = {
      product_id: parseInt(formData.product_id),
      category_id: parseInt(formData.category_id),
      product_price: parseFloat(formData.product_price).toFixed(2),
      quantity: parseInt(formData.quantity),
      total_amount: parseFloat(formData.total_amount).toFixed(2),
      user_id: parseInt(formData.user_id),
      tableno: parseInt(formData.tableno),
    };
    addProductToCart(productData);
  };

  const handleBackPress = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const calculateCartTotal = () => {
    return cartItems
      .reduce((total, item) => {
        return total + (parseFloat(item.total_amount as string) || 0);
      }, 0)
      .toFixed(2);
  };

  const handlePrintAllBill = () => {
    if (cartItems.length === 0) {
      Alert.alert('No Items', 'No cart items to print bill for.');
      return;
    }

    // Create consolidated bill object
    const consolidatedBill: ConsolidatedBillType = {
      items: cartItems,
      totalAmount: calculateCartTotal(),
      userId: cartItems[0]?.user_id?.toString() || 'N/A', // Assume all items same user
      tableNo: cartItems[0]?.tableno?.toString() || 'N/A', // Assume same table
    };

    navigation.navigate('BillScreen', { 
      consolidatedBill: consolidatedBill 
    });
  };

  const renderInputField = (
    key: keyof FormDataType,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'decimal-pad' = 'default',
    editable = true,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {!editable ? '' : '*'}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          !editable && styles.disabledInput,
          formErrors[key] && styles.errorInput,
        ]}
        value={formData[key]}
        onChangeText={text => {
          setFormData(prev => ({ ...prev, [key]: text }));
          if (formErrors[key]) {
            setFormErrors(prev => ({ ...prev, [key]: null }));
          }
        }}
        placeholder={placeholder}
        placeholderTextColor="#888"
        keyboardType={keyboardType}
        editable={editable}
      />
      {formErrors[key] && (
        <Text style={styles.errorText}>{formErrors[key]}</Text>
      )}
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        setShowAddModal(false);
        setEditingItem(null);
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#333', '#222']}
            style={styles.modalGradient}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Cart Item' : 'Add Product to Cart'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Fill in the product details below
              </Text>
              {renderInputField(
                'product_id',
                'Product ID',
                'Enter Product ID',
                'numeric',
              )}
              {renderInputField(
                'category_id',
                'Category ID',
                'Enter Category ID',
                'numeric',
              )}
              {renderInputField(
                'product_price',
                'Product Price',
                'Enter Price (e.g., 20.00)',
                'decimal-pad',
              )}
              {renderInputField(
                'quantity',
                'Quantity',
                'Enter Quantity',
                'numeric',
              )}
              {renderInputField(
                'total_amount',
                'Total Amount (Auto-calculated)',
                'Auto-calculated',
                'numeric',
                false,
              )}
              {renderInputField(
                'user_id',
                'User ID',
                'Enter User ID',
                'numeric',
              )}
              {renderInputField(
                'tableno',
                'Table Number',
                'Enter Table Number',
                'numeric',
              )}
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editingItem ? 'Update Cart' : 'Add to Cart'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  const renderCartItem = ({
    item,
    index,
  }: {
    item: CartItemType;
    index: number;
  }) => (
    <View style={styles.cartCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <View style={styles.cartItemHeaderRowFixed}>
          <View style={{ flex: 1 }} />
          <View style={styles.buttonGroupWithIdFixed}>
            <View style={styles.buttonGroupFixed}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  updateCartQuantity(
                    item,
                    parseInt(item.quantity as string) + 1,
                  )
                }
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Icon name="add" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  updateCartQuantity(
                    item,
                    parseInt(item.quantity as string) - 1,
                  )
                }
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Icon name="remove" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditProduct(item)}
                activeOpacity={0.8}
              >
                <Icon name="edit" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteCartItem(item)}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Icon name="delete" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.cartItemImageRow}>
          {item.item_image ? (
            <Image
              source={{
                uri: `https://deepikagroups.com/Dosadharbar/api/v1/images/${item.item_image}`,
              }}
              style={styles.cartItemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cartItemImagePlaceholder} />
          )}
          <View style={styles.cartItemNameCol}>
            <Text style={styles.cartItemName}>{item.name}</Text>
          </View>
        </View>
        <View style={styles.cartItemContent}>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Product ID:</Text>
            <Text style={styles.cartItemValue}>{item.id}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Name:</Text>
            <Text style={styles.cartItemValue}>{item.name}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Category ID:</Text>
            <Text style={styles.cartItemValue}>{item.category_id}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Price:</Text>
            <Text style={styles.cartItemPrice}>₹{item.product_price}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Quantity:</Text>
            <Text style={styles.cartItemValue}>{item.quantity}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Total Amount:</Text>
            <Text style={styles.cartItemTotal}>₹{item.total_amount}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>User ID:</Text>
            <Text style={styles.cartItemValue}>{item.user_id}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Table Number</Text>
            <Text style={styles.cartItemValue}>{item.tableno}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text style={styles.emptyTitle}>Cart is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Add some delicious items to your cart to get started
      </Text>
      <TouchableOpacity
        style={styles.addFirstItemButton}
        onPress={handleAddProduct}
        activeOpacity={0.8}
      >
        <Text style={styles.addFirstItemText}>Add First Item</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>{'< Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>CART DETAILS</Text>
      <Text style={styles.subtitle}>Manage your cart items</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{cartItems.length}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{calculateCartTotal()}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddProduct}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>+ Add Product</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.printAllButton}
        onPress={handlePrintAllBill}
        activeOpacity={0.8}
        disabled={cartItems.length === 0}
      >
        <Text style={styles.printAllButtonText}>Print Bill for All Items</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Cart Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderAddModal()}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item, index) => `cart-item-${item.product_id}-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
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
      />
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
    paddingTop: 21,
    paddingBottom: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  statBox: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444',
    flex: 0.45,
    alignItems: 'center',
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  printAllButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  printAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardGradient: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  cartItemHeaderRowFixed: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  buttonGroupWithIdFixed: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 120,
    marginRight: 0,
  },
  buttonGroupFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 2,
  },
  editButton: {
    backgroundColor: '#555',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#666',
  },
  quantityButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#666',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#666',
    marginHorizontal: 4,
  },
  cartItemImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
  },
  cartItemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  cartItemNameCol: {
    flex: 1,
    justifyContent: 'center',
  },
  cartItemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cartItemContent: {
    gap: 10,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemLabel: {
    color: '#888',
    fontSize: 14,
  },
  cartItemValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cartItemPrice: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartItemTotal: {
    color: '#4CAF50',
    fontSize: 16,
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
  addFirstItemButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 25,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalTitle: {
    fontSize: 20,
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
    marginBottom: 15,
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
  disabledInput: {
    backgroundColor: '#333',
    color: '#888',
  },
  errorInput: {
    borderColor: '#FF5252',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  disabledButton: {
    backgroundColor: '#666',
  },
});

export default CartDetailsScreen;