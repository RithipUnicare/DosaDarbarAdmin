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
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';

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
  timestamp?: string;
}

interface OrderType {
  items: CartItemType[];
  totalAmount: string;
  userId: string;
  tableNo: string;
  timestamp: string;
}

const ORDER_STORAGE_KEY = 'orderHistory';

const ReportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(ORDER_STORAGE_KEY);
      let orderHistory: OrderType[] = stored ? JSON.parse(stored) : [];

      // Filter orders for the selected date
      const startOfDay = dayjs(selectedDate).startOf('day');
      const endOfDay = dayjs(selectedDate).endOf('day');
      
      orderHistory = orderHistory.filter(order => {
        const orderTime = dayjs(order.timestamp);
        return orderTime.isAfter(startOfDay) && orderTime.isBefore(endOfDay);
      });

      setOrders(orderHistory);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateConfirm = (date: Date) => {
    setShowDatePicker(false);
    setSelectedDate(date);
  };

  const renderOrderItem = ({ item }: { item: OrderType }) => (
    <View style={styles.orderCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <Text style={styles.orderTitle}>Table No: {item.tableNo}</Text>
        <Text style={styles.orderSubtitle}>User ID: {item.userId}</Text>
        <Text style={styles.orderSubtitle}>
          Time: {dayjs(item.timestamp).format('DD-MM-YYYY HH:mm:ss')}
        </Text>
        {item.items.map((cartItem, index) => (
          <View key={index} style={styles.cartItemContent}>
            <View style={styles.cartItemRow}>
              <Text style={styles.cartItemLabel}>{cartItem.name || 'Unknown'}</Text>
              <Text style={styles.cartItemValue}>
                Qty: {cartItem.quantity} x ₹{cartItem.product_price}
              </Text>
            </View>
            <View style={styles.cartItemRow}>
              <Text style={styles.cartItemLabel}>Total:</Text>
              <Text style={styles.cartItemTotal}>₹{cartItem.total_amount}</Text>
            </View>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Order Total:</Text>
          <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {dayjs(selectedDate).format('DD MMM YYYY')}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Order Report</Text>
      <Text style={styles.subtitle}>
        {dayjs(selectedDate).format('DD MMMM YYYY')}
      </Text>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Orders Found</Text>
      <Text style={styles.emptySubtitle}>
        No orders have been placed on this date.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        maximumDate={new Date()}
        theme="dark"
      />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.timestamp}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 5,
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
  dateButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 14,
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
  orderCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardGradient: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  orderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  orderSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  cartItemContent: {
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cartItemLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cartItemValue: {
    color: '#fff',
    fontSize: 14,
  },
  cartItemTotal: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
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
});

export default ReportScreen;