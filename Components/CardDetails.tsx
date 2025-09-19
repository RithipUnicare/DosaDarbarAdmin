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
  served?: boolean; // Added to track served status
}

interface ConsolidatedBillType {
  items: CartItemType[];
  totalAmount: string;
  userId: string;
  tableNo: string;
}

interface CartDetailsScreenProps {
  navigation: any;
  route: { params?: { user_id?: string; tableno?: string } };
}

const CART_STORAGE_KEY = 'cartItems';
const GET_CART_API = 'http://unitech.agency/Dosadharbar/api/v1/get_cart_detailsAdmin';
const IMAGE_BASE_URL = 'http://unitech.agency/Dosadharbar/api/v1/images/';

const CartDetailsScreen: React.FC<CartDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const [groupedByTable, setGroupedByTable] = useState<{ [key: string]: CartItemType[] }>({});
  const [sortedTableNumbers, setSortedTableNumbers] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [newTableNo, setNewTableNo] = useState<string>('');
  const [userId, setUserId] = useState<string>(route.params?.user_id || '999');
  const [tableNo, setTableNo] = useState<string>('');//route.params?.tableno || 

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCartAndFetchOrders();
    });
    
    // Initial load
    loadCartAndFetchOrders();
    
    // Clean up the event listener
    return unsubscribe;
  }, [navigation, userId]);
  useEffect(()=>{
    if(tableNo){
      loadCartAndFetchOrders();
    }
  },[tableNo])

  const loadCartAndFetchOrders = async () => {
    try {
      setLoading(true);
      // Load local cart
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      let localItems: CartItemType[] = stored ? JSON.parse(stored) : [];
      

      // Fetch server orders
      const response = await fetch(GET_CART_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // const data = await response.json();
      
      // const serverItems: CartItemType[] = data?.Item?.filter((item: any) => item.tableno && item.quantity).map((item: any) => ({
      //   id: item.id || `server_${item.id}`,
      //   product_id: item.id,
      //   category_id: item.category_id,
      //   product_price: item.prices,
      //   quantity: item.quantity,
      //   total_amount: (parseFloat(item.prices) * parseInt(item.quantity)).toFixed(2),
      //   user_id: userId,
      //   tableno: item.tableno,
      //   name: item.name,
      //   item_image: item.item_image,
      //   served: false,
      // }));
      
      // Merge server items with local items, prioritizing server items
      const mergedItems: CartItemType[] = [];//[...serverItems];
      localItems?.forEach(localItem => {
        const existing = mergedItems.find(
          item => item.product_id === localItem.product_id && item.tableno === localItem.tableno
        );
        if (existing) {
          // Update quantity and total if exists
          const newQuantity = parseInt(existing.quantity as string) + parseInt(localItem.quantity as string);
          existing.quantity = newQuantity;
          existing.total_amount = (parseFloat(existing.product_price as string) * newQuantity).toFixed(2);
        } else {
          mergedItems.push(localItem);
        }
      });

      // Group items by table number
      const grouped: { [key: string]: CartItemType[] } = {};
      mergedItems?.forEach(item => {
        if (item.tableno) {
          const table = item.tableno.toString();
          if (!grouped[table]) {
            grouped[table] = [];
          }
          grouped[table].push(item);
        }
      });

      // Sort table numbers
      const sorted = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

      setCartItems(mergedItems);
      setGroupedByTable(grouped);
      setSortedTableNumbers(sorted);

      // Set default table if none selected and tables exist
      if (!tableNo && sorted?.length > 0) {
        setTableNo(sorted[0]);
      }

      // Save merged items to AsyncStorage
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mergedItems));
    } catch (error) {
      console.error('Failed to load cart or orders:', error);
      Alert.alert(
        'Error',
        'Failed to load cart or orders. Please check your internet connection.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Show table modal if no tables exist
    if (sortedTableNumbers.length === 0 && !tableNo && !showTableModal) {
      setShowTableModal(true);
    }
  }, [sortedTableNumbers, tableNo, showTableModal]);

  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Failed to save cart to storage:', error);
      }
    };
    saveCart();
  }, [cartItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartAndFetchOrders();
    setRefreshing(false);
  };

  const updateCartQuantity = (item: CartItemType, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      const parsedPrice = parseFloat(item.product_price as string);
      if (isNaN(parsedPrice)) {
        throw new Error('Invalid product price');
      }
      const updatedCartItems = cartItems.map(cartItem =>
        cartItem.product_id === item.product_id &&
        cartItem.user_id === item.user_id &&
        cartItem.tableno === item.tableno
          ? {
              ...cartItem,
              quantity: newQuantity,
              total_amount: (parsedPrice * newQuantity).toFixed(2),
            }
          : cartItem
      );

      // Update groupedByTable to reflect quantity changes
      const grouped: { [key: string]: CartItemType[] } = {};
      updatedCartItems.forEach(updatedItem => {
        if (updatedItem.tableno) {
          const table = updatedItem.tableno.toString();
          if (!grouped[table]) {
            grouped[table] = [];
          }
          grouped[table].push(updatedItem);
        }
      });

      setCartItems(updatedCartItems);
      setGroupedByTable(grouped);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      Alert.alert('Error', 'Unable to update quantity. Please try again.');
    }
  };

  const handleDeleteItem = (item: CartItemType) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedCartItems = cartItems.filter(
              i => !(i.product_id === item.product_id && i.tableno === item.tableno)
            );
            // Update groupedByTable after deletion
            const grouped: { [key: string]: CartItemType[] } = {};
            updatedCartItems.forEach(updatedItem => {
              if (updatedItem.tableno) {
                const table = updatedItem.tableno.toString();
                if (!grouped[table]) {
                  grouped[table] = [];
                }
                grouped[table].push(updatedItem);
              }
            });
            const sorted = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
            setCartItems(updatedCartItems);
            setGroupedByTable(grouped);
            setSortedTableNumbers(sorted);
            // If current table has no items, select first available table or show modal
            if (!grouped[tableNo] && sorted.length > 0) {
              setTableNo(sorted[0]);
            } else if (!grouped[tableNo] && sorted.length === 0) {
              setTableNo('');
              setShowTableModal(true);
            }
          },
        },
      ]
    );
  };

  const handlePrintBill = () => {
    if (!tableNo) {
      Alert.alert('Error', 'Please select a table number first.', [{ text: 'OK' }]);
      return;
    }
    const itemsForTable = groupedByTable[tableNo] || [];
    const totalAmount = itemsForTable
      .reduce((sum, item) => sum + parseFloat(item.total_amount as string), 0)
      .toFixed(2);
    const consolidatedBill: ConsolidatedBillType = {
      items: itemsForTable,
      totalAmount,
      userId,
      tableNo,
    };
    navigation.navigate('BillScreen', { consolidatedBill });
  };

  const handleSendToKitchen = () => {
    if (!tableNo) {
      Alert.alert('Error', 'Please select a table number first.', [{ text: 'OK' }]);
      return;
    }
    const unservedItems = (groupedByTable[tableNo] || []).filter(item => !item.served);
    if (unservedItems.length === 0) {
      Alert.alert('No Items', 'No unserved items to send to kitchen.');
      return;
    }
    const kitchenOrder = {
      items: unservedItems,
      tableNo,
      userId,
    };
    navigation.navigate('KitchenScreen', { kitchenOrder });
  };

  const handleClearTable = async () => {
    if (!tableNo) {
      Alert.alert('Error', 'Please select a table to clear.', [{ text: 'OK' }]);
      return;
    }
  
    Alert.alert(
      'Clear Table',
      `Are you sure you want to clear all items from Table ${tableNo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove items from local storage
              const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
              let localItems: CartItemType[] = stored ? JSON.parse(stored) : [];
  
              // Filter out items for the current table (ensure type coercion)
              const updatedItems = localItems.filter(
                item => String(item.tableno) !== String(tableNo)
              );
  
              // Save the updated items back to local storage
              await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
  
              // Update the UI
              const updatedGrouped = { ...groupedByTable };
              delete updatedGrouped[tableNo];
              const updatedTableNumbers = sortedTableNumbers.filter(num => num !== tableNo);
  
              setGroupedByTable(updatedGrouped);
              setSortedTableNumbers(updatedTableNumbers);
  
              // Select the first available table or clear selection
              if (updatedTableNumbers.length > 0) {
                setTableNo(updatedTableNumbers[0]);
              } else {
                setTableNo('');
                setShowTableModal(true); // Show modal if no tables remain
              }
  
              // TODO: Implement server-side deletion (replace with your API endpoint)
              try {
                const response = await fetch('YOUR_DELETE_TABLE_API_ENDPOINT', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    tableNo,
                    userId,
                  }),
                });
                if (!response.ok) {
                  throw new Error(`Failed to clear table on server: ${response.status}`);
                }
              } catch (serverError) {
                console.warn('Server-side deletion failed:', serverError);
                // Optionally notify user but proceed with local changes
                Alert.alert(
                  'Warning',
                  'Table cleared locally, but server sync failed. Please try again later.',
                  [{ text: 'OK' }]
                );
              }
  
              Alert.alert('Success', `Table ${tableNo} has been cleared.`);
            } catch (error) {
              console.error('Error clearing table:', error);
              Alert.alert(
                'Error',
                `Failed to clear the table: ${error.message || 'Unknown error'}. Please try again.`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };
  
  // Move isMounted logic to useEffect for proper cleanup
  useEffect(() => {
    let isMounted = true;
  
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Move isMounted logic to useEffect for proper cleanup
  useEffect(() => {
    let isMounted = true;
  
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectTable = () => {
    if (!newTableNo.trim()) {
      Alert.alert('Validation', 'Please enter a table number.', [{ text: 'OK' }]);
      return;
    }
    if (sortedTableNumbers.includes(newTableNo)) {
      Alert.alert('Error', 'Table number already exists. Select it from the list.', [{ text: 'OK' }]);
      return;
    }
    // Add empty group for new table to show immediately
    setGroupedByTable({...groupedByTable, [newTableNo]: []});
    setSortedTableNumbers([...sortedTableNumbers, newTableNo].sort((a, b) => Number(a) - Number(b)));
    setTableNo(newTableNo);
    setShowTableModal(false);
    setNewTableNo('');
  };

  const handleAddProduct = () => {
    if (!tableNo) {
      Alert.alert('Error', 'Please select or create a table number first.', [{ text: 'OK' }]);
      setShowTableModal(true);
      return;
    }
    navigation.navigate('Product', { user_id: userId, tableno: tableNo });
  };

  const renderCartItem = ({ item }: { item: CartItemType }) => (
    <View style={styles.cartCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <View style={styles.cartItemHeaderRowFixed}>
          <View style={styles.buttonGroupWithIdFixed}>
            <Text style={styles.cartItemLabel}>ID: {item.product_id}</Text>
            <View style={styles.buttonGroupFixed}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateCartQuantity(item, parseInt(item.quantity as string) - 1)}
              >
                <Text style={styles.cartItemValue}>-</Text>
              </TouchableOpacity>
              <Text style={styles.cartItemValue}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateCartQuantity(item, parseInt(item.quantity as string) + 1)}
              >
                <Text style={styles.cartItemValue}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteItem(item)}
              >
                <Icon name="delete" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.cartItemImageRow}>
          {item.item_image ? (
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${item.item_image}` }}
              style={styles.cartItemImage}
            />
          ) : (
            <View style={styles.cartItemImagePlaceholder} />
          )}
          <View style={styles.cartItemNameCol}>
            <Text style={styles.cartItemName}>{item.name || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.cartItemContent}>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Category ID:</Text>
            <Text style={styles.cartItemValue}>{item.category_id}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Price:</Text>
            <Text style={styles.cartItemPrice}>₹{item.product_price}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Total:</Text>
            <Text style={styles.cartItemTotal}>₹{item.total_amount}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTableModal = () => (
    <Modal
      visible={showTableModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowTableModal(false)}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#333', '#222']}
          style={styles.modalContainerSmall}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Table</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTableModal(false)}
            >
              <Icon name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Table Number"
            placeholderTextColor="#888"
            value={newTableNo}
            onChangeText={setNewTableNo}
            keyboardType="numeric"
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSelectTable}
            >
              <Text style={styles.submitButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>{'< Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Cart Details</Text>
      <Text style={styles.subtitle}>
        {tableNo ? `Table No: ${tableNo}` : 'Select a Table'}
      </Text>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {(groupedByTable[tableNo] || []).length}
          </Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            ₹
            {(groupedByTable[tableNo] || [])
              .reduce((sum, item) => sum + parseFloat(item.total_amount as string), 0)
              .toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.addButton, { flex: 1, marginRight: 10 }]}
            onPress={handleAddProduct}
          >
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.printAllButton, { flex: 1 }]}
            onPress={handlePrintBill}
          >
            <Text style={styles.printAllButtonText}>Print Bill</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.buttonRow, { marginTop: 10 }]}>
          <TouchableOpacity
            style={[styles.clearButton, { flex: 1, marginRight: 10 }]}
            onPress={handleClearTable}
            disabled={!tableNo || !groupedByTable[tableNo]?.length}
          >
            <Text style={styles.clearButtonText}>Clear Table</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toKitchenButton, { flex: 1 }]}
            onPress={handleSendToKitchen}
          >
            <Text style={styles.toKitchenButtonText}>To Kitchen</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.tableSelectorHeader}>
        <Text style={styles.tableSelectorTitle}>Tables</Text>
        <TouchableOpacity
          style={styles.addTableButton}
          onPress={() => setShowTableModal(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal style={styles.tableSelectorContainer} showsHorizontalScrollIndicator={false}>
        {sortedTableNumbers.map((num) => (
          <TouchableOpacity
            key={num}
            style={[styles.tableNumberButton, num === tableNo && styles.tableNumberButtonActive]}
            onPress={() => setTableNo(num)}
          >
            <Text style={[styles.tableNumberText, num === tableNo && styles.tableNumberTextActive]}>
              Table {num}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="shopping-cart" style={styles.emptyIcon} color="#888" />
      <Text style={styles.emptyTitle}>No Items in Cart</Text>
      <Text style={styles.emptySubtitle}>
        Add items to the cart to proceed with billing.
      </Text>
      <TouchableOpacity
        style={styles.addFirstItemButton}
        onPress={handleAddProduct}
      >
        <Text style={styles.addFirstItemText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderTableModal()}
      <FlatList
        data={groupedByTable[tableNo] || []}
        renderItem={renderCartItem}
        keyExtractor={item => item.id?.toString() || `${item.product_id}-${item.tableno}`}
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
  buttonContainer: {
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  printAllButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
  },
  printAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  toKitchenButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
  },
  toKitchenButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    opacity: 1,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  tableSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  tableSelectorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addTableButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableSelectorContainer: {
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 0,
    flexDirection: 'row',
    minHeight: 50,
  },
  tableNumberButton: {
    backgroundColor: '#444',
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#666',
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableNumberButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tableNumberText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tableNumberTextActive: {
    color: '#fff',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
  modalContainerSmall: {
    width: width * 0.7,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
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
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
});

export default CartDetailsScreen;