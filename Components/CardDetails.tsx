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
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface ProductType {
  id: string | number;
  name: string;
  category_id: string | number;
  product_code: string | number;
  prices: string | number;
  status: string;
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

const CART_STORAGE_KEY = 'cartItems';

const CartDetailsScreen: React.FC<CartDetailsScreenProps> = ({
  navigation,
}) => {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
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
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tempSelectedItems, setTempSelectedItems] = useState<CartItemType[]>([]);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [newTableNo, setNewTableNo] = useState<string>('');

  const GET_PRODUCT_API = 'http://unitech.agency/Dosadharbar/api/v1/get_AllproductDetails';

  useEffect(() => {
    const loadCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          setCartItems(JSON.parse(stored));
        } else {
          // Add dummy if no stored
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
          setCartItems(dummyItems);
        }
      } catch (error) {
        console.error('Failed to load cart from storage');
      }
      setLoading(false);
    };
    loadCart();
    fetchProducts();
  }, []);

  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Failed to save cart to storage');
      }
    };
    saveCart();
  }, [cartItems]);

  useEffect(() => {
    calculateTotalAmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.product_price, formData.quantity]);

  const fetchProducts = async () => {
    try {
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
        [{ text: 'OK', style: 'default' }],
      );
    }
  };

  const calculateTotalAmount = () => {
    const price = parseFloat(formData.product_price) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    const total = (price * quantity).toFixed(2);
    setFormData(prev => ({ ...prev, total_amount: total }));
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

  const updateCartQuantity = (
    item: CartItemType,
    newQuantity: number,
  ) => {
    if (newQuantity <= 0) return;
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
  };

  const addOrUpdateLocalCart = (productData: any, isEdit: boolean) => {
    if (isEdit && editingItem) {
      const updatedItems = cartItems.map(i =>
        i.id === editingItem.id
          ? {
              ...i,
              product_id: productData.product_id,
              category_id: productData.category_id,
              product_price: productData.product_price,
              quantity: productData.quantity,
              total_amount: productData.total_amount,
              user_id: productData.user_id,
              tableno: productData.tableno,
            }
          : i,
      );
      setCartItems(updatedItems);
    } else {
      const newId = Date.now().toString();
      const newItem: CartItemType = {
        id: newId,
        cart_id: newId,
        ...productData,
      };
      setCartItems(prev => [...prev, newItem]);
    }
    resetForm();
    setShowAddModal(false);
    setEditingItem(null);
    Alert.alert(
      'Success',
      isEdit ? 'Cart item updated successfully!' : 'Product added to cart successfully!',
      [{ text: 'OK', style: 'default' }],
    );
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
          onPress: () => {
            setCartItems(prev => prev.filter(i => i.id !== item.id));
          },
        },
      ],
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    if (!selectedTable) {
      Alert.alert('Select Table', 'Please select or add a table before adding a product.');
      return;
    }
    setTempSelectedItems([]);
    setEditingItem(null);
    setSearchQuery('');
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
    addOrUpdateLocalCart(productData, !!editingItem);
  };

  const handleAddToTemp = (product: ProductType) => {
    console.log(product);
    setTempSelectedItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        const newQty = parseInt(existing.quantity as string) + 1;
        return prev.map(i => i.id === existing.id ? {
          ...i,
          quantity: newQty,
          total_amount: (parseFloat(i.product_price as string) * newQty).toFixed(2),
        } : i);
      } else {
        const price = parseFloat(product.prices as string) || 0;
        const qty = 1;
        const total = (price * qty).toFixed(2);
        const newItem: CartItemType = {
          id: product.id,
          cart_id: Date.now().toString(),
          product_id: product.id,
          category_id: product.category_id,
          product_price: price.toFixed(2),
          quantity: qty,
          total_amount: total,
          user_id: '999',
          tableno: selectedTable!,
          name: product.name,
          item_image: product.item_image,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateTempQuantity = (item: CartItemType, delta: number) => {
    setTempSelectedItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQty = parseInt(existing.quantity as string) + delta;
        if (newQty <= 0) return prev.filter(i => i.id !== item.id);
        return prev.map(i => i.id === item.id ? {
          ...i,
          quantity: newQty,
          total_amount: (parseFloat(i.product_price as string) * newQty).toFixed(2),
        } : i);
      }
      return prev;
    });
  };

  const removeFromTemp = (item: CartItemType) => {
    setTempSelectedItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleConfirmAdd = () => {
    setCartItems(prev => {
      let updated = [...prev];
      tempSelectedItems.forEach(newItem => {
        const existing = updated.find(i => i.product_id === newItem.product_id && i.tableno?.toString() === newItem.tableno?.toString());
        if (existing) {
          const newQty = parseInt(existing.quantity as string) + parseInt(newItem.quantity as string);
          const newTotal = (parseFloat(existing.product_price as string) * newQty).toFixed(2);
          updated = updated.map(i => i.id === existing.id ? { ...i, quantity: newQty, total_amount: newTotal } : i);
        } else {
          updated.push(newItem);
        }
      });
      return updated;
    });
    setShowAddModal(false);
    setTempSelectedItems([]);
  };

  const handleBackPress = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const handlePrintAllBill = () => {
    if (!selectedTable || filteredCartItems.length === 0) {
      Alert.alert('No Items', 'No cart items to print bill for.');
      return;
    }

    const consolidatedBill: ConsolidatedBillType = {
      items: filteredCartItems,
      totalAmount: filteredCartItems.reduce((sum, item) => sum + (parseFloat(item.total_amount as string) || 0), 0).toFixed(2),
      userId: filteredCartItems[0]?.user_id?.toString() || 'N/A',
      tableNo: selectedTable,
    };

    navigation.navigate('BillScreen', {
      consolidatedBill: consolidatedBill,
    });
  };

  const handleClearCart = () => {
    if (!selectedTable) return;
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear the cart for this table?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setCartItems(prev => prev.filter(item => item.tableno?.toString() !== selectedTable));
          },
        },
      ],
    );
  };

  const handleAddNewTable = () => {
    setNewTableNo('');
    setShowTableModal(true);
  };

  const confirmAddTable = () => {
    if (newTableNo && !isNaN(parseInt(newTableNo))) {
      setSelectedTable(newTableNo);
      setUserTables(prev => prev.includes(newTableNo) ? prev : [...prev, newTableNo]);
    } else {
      Alert.alert('Invalid', 'Please enter a valid table number.');
    }
    setShowTableModal(false);
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProductItem = ({ item }: { item: ProductType }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => handleAddToTemp(item)}
      activeOpacity={0.8}
    >
      {item.item_image ? (
        <Image
          source={{ uri: `http://deepikagroups.com/Dosadharbar/api/v1/images/${item.item_image}` }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.productImagePlaceholder} />
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>₹{item.prices}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTempItem = ({ item }: { item: CartItemType }) => (
    <View style={styles.tempItem}>
      <Text style={styles.tempItemName}>{item.name}</Text>
      <Text style={styles.tempItemPrice}>₹{item.product_price} x {item.quantity} = ₹{item.total_amount}</Text>
      <View style={styles.tempItemButtons}>
      <TouchableOpacity onPress={() => updateTempQuantity(item, 1)}>
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => updateTempQuantity(item, -1)}>
          <Icon name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeFromTemp(item)}>
          <Icon name="close" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
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
        setSearchQuery('');
        setTempSelectedItems([]);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#333', '#222']}
            style={styles.modalGradient}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Cart Item' : 'Add Product to Cart'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                    resetForm();
                    setSearchQuery('');
                    setTempSelectedItems([]);
                  }}
                >
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>
                {editingItem ? 'Update the product details below' : 'Search and select a product to add'}
              </Text>
              {editingItem ? (
                <>
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
                          Update Cart
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.textInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search products..."
                    placeholderTextColor="#888"
                  />
                  <FlatList
                    data={filteredProducts}
                    renderItem={renderProductItem}
                    keyExtractor={item => item.id.toString()}
                    style={styles.productList}
                    ListEmptyComponent={
                      <Text style={styles.emptyProductText}>No products found</Text>
                    }
                    showsVerticalScrollIndicator={false}
                  />
                  {tempSelectedItems.length > 0 && (
                    <>
                      <Text style={styles.previewTitle}>Selected Items Preview</Text>
                      <FlatList
                        data={tempSelectedItems}
                        renderItem={renderTempItem}
                        keyExtractor={item => item.id?.toString() || ''}
                        style={styles.tempList}
                        showsVerticalScrollIndicator={false}
                      />
                    </>
                  )}
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleConfirmAdd}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.submitButtonText}>Confirm Add</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  const renderTableModal = () => (
    <Modal
      visible={showTableModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowTableModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainerSmall}>
          <LinearGradient colors={['#333', '#222']} style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Table</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTableModal(false)}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              value={newTableNo}
              onChangeText={setNewTableNo}
              placeholder="Enter Table Number"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            <TouchableOpacity
              //style={[styles.submitButton,{height:50}]}
              style={{backgroundColor:'#4CAF50',padding:10,borderRadius:5}}
              onPress={confirmAddTable}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitButtonText,{textAlign:'center'}]}>Add Table</Text>
            </TouchableOpacity>
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
                uri: `http://deepikagroups.com/Dosadharbar/api/v1/images/${item.item_image}`,
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

  const [userTables, setUserTables] = useState<string[]>([]);

  const renderHeader = () => {
    const uniqueTables = Array.from(new Set([
      ...cartItems.map(item => item.tableno?.toString() || ''),
      ...userTables,
    ])).filter(Boolean);

    return (
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
        {/* Table Selection UI */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap' }}>
          <Text style={{ color: '#fff', fontSize: 16, marginRight: 10 }}>Choose Table:</Text>
          {uniqueTables.length === 0 ? (
            <Text style={{ color: '#888' }}>No Tables</Text>
          ) : (
            uniqueTables.map(table => (
              <TouchableOpacity
                key={table}
                style={{
                  backgroundColor: selectedTable === table ? '#4CAF50' : '#333',
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  marginBottom: 8,
                  borderWidth: selectedTable === table ? 2 : 1,
                  borderColor: selectedTable === table ? '#4CAF50' : '#444',
                }}
                onPress={() => setSelectedTable(table)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{table}</Text>
              </TouchableOpacity>
            ))
          )}
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              paddingHorizontal: 15,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
              marginBottom: 8,
            }}
            onPress={handleAddNewTable}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{filteredCartItems?.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{filteredCartItems?.reduce((sum, item) => sum + (parseFloat(item.total_amount as string) || 0), 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddProduct}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Add Product</Text>
          </TouchableOpacity>
          {selectedTable && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCart}
              activeOpacity={0.8}
            >
              <Text style={styles.clearButtonText}>Clear Cart</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.printAllButton}
          onPress={handlePrintAllBill}
          activeOpacity={0.8}
          disabled={filteredCartItems?.length === 0}
        >
          <Text style={styles.printAllButtonText}>Print Bill for This Table</Text>
        </TouchableOpacity>
        {/* {selectedTable && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearCart}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>Clear Cart</Text>
          </TouchableOpacity>
        )} */}
      </View>
    );
  };

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

  const filteredCartItems = selectedTable
    ? cartItems.filter(item => item.tableno?.toString() === selectedTable)
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderAddModal()}
      {renderTableModal()}
      {/* Only show cart if a table is selected */}
      {selectedTable ? (
        <FlatList
          data={filteredCartItems}
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
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {renderHeader()}
          <Text style={{ color: '#888', fontSize: 18, marginTop: 40 }}>Please select a table to view its cart.</Text>
        </View>
      )}
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
  clearButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 0,
  },
  clearButtonText: {
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
  modalContainerSmall: {
    width: width * 0.7,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 25,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalContent: {
    flexGrow: 1,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
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
    marginBottom: 20,
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
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  productList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#333',
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#4CAF50',
    fontSize: 14,
  },
  emptyProductText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tempList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  tempItem: {
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  tempItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tempItemPrice: {
    color: '#4CAF50',
    fontSize: 14,
  },
  tempItemButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 5,
  },
});

export default CartDetailsScreen;