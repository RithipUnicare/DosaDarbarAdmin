/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';
import { getOrder } from '../Services/ApiServices';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface OrderListItem {
  id: string;
  item_name: string;
  item_price: string;
  quantity: string;
  total_amount: string;
  date: string; // YYYY-MM-DD
  tableno: string;
}

interface OrderDetail {
  order_list: OrderListItem[];
  order_id: string;
  total_amount: string;
  bill_no: string;
  instruction: string;
  date: string; // YYYY-MM-DD HH:mm:ss
}

type DatePickerType = 'from' | 'to' | null;

const ReportScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>(route?.params?.user_id || '999');

  // Date filters
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<DatePickerType>(null);

  // UI state
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrder('Admin');

      if (response.ok && Array.isArray(response.data?.order_details)) {
        const allOrders: OrderDetail[] = response.data.order_details;
        // local date filter on order header date
        const startOfDay = dayjs(fromDate).startOf('day');
        const endOfDay = dayjs(toDate).endOf('day');
        const filtered = allOrders.filter(o => {
          const od = dayjs(o.date);
          return od.isAfter(startOfDay) && od.isBefore(endOfDay);
        });
        // sort by date desc then bill no/order_id
        filtered.sort(
          (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf(),
        );
        setOrders(filtered);
      } else {
        Alert.alert('Error', 'Failed to fetch orders');
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Network error occurred while fetching orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  const applyDateFilter = () => {
    // re-run fetch to apply date filter on server data locally
    fetchOrders();
  };

  const handleGenerateReport = () => {
    applyDateFilter();
    setShowFilters(false);
  };

  const handleDateConfirm = (date: Date) => {
    if (showDatePicker === 'from') {
      setFromDate(date);
    } else if (showDatePicker === 'to') {
      setToDate(date);
    }
    setShowDatePicker(null);
  };

  const renderReportTypeSelector = () => null;

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Report Filters</Text>

          {/* Date Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker('from')}
              >
                <Text style={styles.dateText}>
                  From: {dayjs(fromDate).format('DD/MM/YYYY')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker('to')}
              >
                <Text style={styles.dateText}>
                  To: {dayjs(toDate).format('DD/MM/YYYY')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Only date range filter is available */}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateReport}
            >
              <Text style={styles.generateButtonText}>Generate Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOrderItem = ({ item }: { item: OrderDetail }) => (
    <View style={styles.orderCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <Text style={styles.orderTitle}>
          Table No: {item.order_list?.[0]?.tableno || '-'}
        </Text>
        <Text style={styles.orderSubtitle}>Bill No: {item.bill_no}</Text>
        <Text style={styles.orderSubtitle}>
          Date: {dayjs(item.date).format('DD-MM-YYYY HH:mm')}
        </Text>
        <Text style={styles.orderSubtitle}>
          Items: {item.order_list.length}
        </Text>

        {item.order_list.map((orderItem, index) => (
          <View key={index} style={styles.cartItemContent}>
            <View style={styles.cartItemRow}>
              <Text style={styles.cartItemLabel}>{orderItem.item_name}</Text>
              <Text style={styles.cartItemValue}>
                Qty: {orderItem.quantity} x ₹{orderItem.item_price}
              </Text>
            </View>
            <View style={styles.cartItemRow}>
              <Text style={styles.cartItemLabel}>Subtotal:</Text>
              <Text style={styles.cartItemTotal}>
                ₹{orderItem.total_amount}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Table Total:</Text>
          <Text style={styles.totalAmount}>
            ₹{parseFloat(item.total_amount).toFixed(2)}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderGenericReportItem = () => null;

  const renderHeader = () => {
    const dataToUse = orders;

    let totalAmount = 0;
    let totalItems = 0;

    totalAmount = orders.reduce(
      (sum, order) => sum + parseFloat(order.total_amount || '0'),
      0,
    );
    totalItems = orders.reduce(
      (sum, order) => sum + order.order_list.length,
      0,
    );

    return (
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{'< Back'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Orders Report</Text>

        <Text style={styles.subtitle}>
          {dayjs(fromDate).format('DD/MM/YY')} -{' '}
          {dayjs(toDate).format('DD/MM/YY')}
        </Text>

        {dataToUse.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Orders:</Text>
              <Text style={styles.summaryValue}>{dataToUse.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items:</Text>
              <Text style={styles.summaryValue}>{totalItems}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryTotal}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Data Found</Text>
      <Text style={styles.emptySubtitle}>
        No records found for the selected criteria. Try adjusting your filters.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dataToRender = orders;
  const renderItem = renderOrderItem;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <DatePicker
        modal
        open={showDatePicker !== null}
        date={showDatePicker === 'from' ? fromDate : toDate}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(null)}
        maximumDate={new Date()}
        theme="dark"
      />

      {renderFiltersModal()}

      <FlatList
        data={dataToRender}
        renderItem={renderItem}
        keyExtractor={(item: any) => `${item.order_id}`}
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
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  reportTypeContainer: {
    width: '100%',
    marginBottom: 20,
  },
  reportTypeButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  reportTypeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  reportTypeText: {
    color: '#fff',
    fontSize: 14,
  },
  reportTypeTextActive: {
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryTotal: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
  },
  dateText: {
    color: '#fff',
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  paymentModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paymentModeButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 10,
    flex: 0.22,
  },
  paymentModeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  paymentModeText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  paymentModeTextActive: {
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#555',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.45,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.45,
  },
  generateButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
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
    flex: 1,
  },
  cartItemValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  cartItemTotal: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartItemCategory: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
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
