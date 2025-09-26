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
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';
import {
  getAllOrders,
  getCategoryWiseReport,
  getItemWiseReport,
  getBillWiseReport,
} from '../Services/ApiServices';

const { width } = Dimensions.get('window');

interface OrderItemType {
  date: string;
  category: string | null;
  product: string | null;
  item_price: string;
  quantity: string;
  total_amount: string;
  tableno: string;
  bill_no?: string;
  payment_mode?: string;
}

interface ProcessedOrderType {
  tableNo: string;
  date: string;
  items: OrderItemType[];
  totalAmount: number;
  timestamp: string;
}

type ReportType = 'all' | 'category' | 'item' | 'bill';
type DatePickerType = 'from' | 'to' | null;

const ReportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [orders, setOrders] = useState<ProcessedOrderType[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [reportType, setReportType] = useState<ReportType>('all');

  // Date filters
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<DatePickerType>(null);

  // Filter inputs
  const [categoryId, setCategoryId] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');
  const [billNo, setBillNo] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('all');

  // UI state
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    if (reportType === 'all') {
      fetchAllOrders();
    }
  }, [reportType]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();

      if (response.ok && response.data?.Order) {
        console.log(response.data.Order);
        processAllOrders(response.data.Order);
      } else {
        Alert.alert('Error', 'Failed to fetch orders data');
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

  const fetchCategoryWiseReport = async () => {
    if (!categoryId.trim()) {
      Alert.alert('Error', 'Please enter category ID');
      return;
    }

    try {
      setLoading(true);
      const response = await getCategoryWiseReport(
        categoryId,
        dayjs(fromDate).format('YYYY-MM-DD'),
        dayjs(toDate).format('YYYY-MM-DD'),
      );

      if (response.ok && response.data?.data) {
        setReportData(response.data.Order);
      } else {
        Alert.alert('Error', 'Failed to fetch category wise report');
        setReportData([]);
      }
    } catch (error) {
      console.error('Category report error:', error);
      Alert.alert('Error', 'Network error occurred');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemWiseReport = async () => {
    if (!categoryId.trim() || !itemId.trim()) {
      Alert.alert('Error', 'Please enter both category ID and item ID');
      return;
    }

    try {
      setLoading(true);
      const response = await getItemWiseReport(
        categoryId,
        itemId,
        dayjs(fromDate).format('YYYY-MM-DD'),
        dayjs(toDate).format('YYYY-MM-DD'),
      );

      if (response.ok && response.data?.data) {
        setReportData(response.data.Order);
      } else {
        Alert.alert('Error', 'Failed to fetch item wise report');
        setReportData([]);
      }
    } catch (error) {
      console.error('Item report error:', error);
      Alert.alert('Error', 'Network error occurred');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillWiseReport = async () => {
    try {
      setLoading(true);
      const response = await getBillWiseReport(
        billNo,
        paymentMode,
        dayjs(fromDate).format('YYYY-MM-DD'),
        dayjs(toDate).format('YYYY-MM-DD'),
      );

      if (response.ok && response.data?.data) {
        setReportData(response.data.Order);
      } else {
        Alert.alert('Error', 'Failed to fetch bill wise report');
        setReportData([]);
      }
    } catch (error) {
      console.error('Bill report error:', error);
      Alert.alert('Error', 'Network error occurred');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const processAllOrders = (allOrders: OrderItemType[]) => {
    const startOfDay = dayjs(fromDate).startOf('day');
    const endOfDay = dayjs(toDate).endOf('day');

    // Filter orders for the date range
    const filteredOrders = allOrders.filter(order => {
      const orderDate = dayjs(order.date);
      return orderDate.isAfter(startOfDay) && orderDate.isBefore(endOfDay);
    });

    // Group orders by table number and date
    const groupedOrders = filteredOrders.reduce((acc, order) => {
      const key = `${order.tableno}-${order.date}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(order);
      return acc;
    }, {} as Record<string, OrderItemType[]>);

    // Convert grouped orders to ProcessedOrderType
    const processedOrders: ProcessedOrderType[] = Object.entries(
      groupedOrders,
    ).map(([key, tableOrders]) => {
      const [tableNo, date] = key.split('-');
      const totalAmount = tableOrders.reduce(
        (sum, item) => sum + parseFloat(item.total_amount),
        0,
      );

      return {
        tableNo,
        date,
        items: tableOrders,
        totalAmount,
        timestamp: `${date} 12:00:00`,
      };
    });

    // Sort by date and table number
    processedOrders.sort((a, b) => {
      const dateCompare = dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
      if (dateCompare !== 0) return dateCompare;

      const aNum = parseInt(a.tableNo) || 0;
      const bNum = parseInt(b.tableNo) || 0;
      return aNum - bNum;
    });

    setOrders(processedOrders);
  };

  const handleGenerateReport = () => {
    switch (reportType) {
      case 'all':
        fetchAllOrders();
        break;
      case 'category':
        fetchCategoryWiseReport();
        break;
      case 'item':
        fetchItemWiseReport();
        break;
      case 'bill':
        fetchBillWiseReport();
        break;
    }
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

  const renderReportTypeSelector = () => (
    <View style={styles.reportTypeContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'category', label: 'Category Wise' },
          { key: 'item', label: 'Item Wise' },
          { key: 'bill', label: 'Bill Wise' },
        ].map(type => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.reportTypeButton,
              reportType === type.key && styles.reportTypeButtonActive,
            ]}
            onPress={() => setReportType(type.key as ReportType)}
          >
            <Text
              style={[
                styles.reportTypeText,
                reportType === type.key && styles.reportTypeTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

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

          {/* Category Filter */}
          {(reportType === 'category' || reportType === 'item') && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category ID</Text>
              <TextInput
                style={styles.textInput}
                value={categoryId}
                onChangeText={setCategoryId}
                placeholder="Enter category ID"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Item Filter */}
          {reportType === 'item' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Item ID</Text>
              <TextInput
                style={styles.textInput}
                value={itemId}
                onChangeText={setItemId}
                placeholder="Enter item ID"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Bill Filters */}
          {reportType === 'bill' && (
            <>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Bill Number (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={billNo}
                  onChangeText={setBillNo}
                  placeholder="Enter bill number"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Payment Mode</Text>
                <View style={styles.paymentModeRow}>
                  {['all', 'cash', 'card', 'upi'].map(mode => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.paymentModeButton,
                        paymentMode === mode && styles.paymentModeButtonActive,
                      ]}
                      onPress={() => setPaymentMode(mode)}
                    >
                      <Text
                        style={[
                          styles.paymentModeText,
                          paymentMode === mode && styles.paymentModeTextActive,
                        ]}
                      >
                        {mode.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

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

  const renderOrderItem = ({ item }: { item: ProcessedOrderType }) => (
    <View style={styles.orderCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <Text style={styles.orderTitle}>Table No: {item.tableNo}</Text>
        <Text style={styles.orderSubtitle}>
          Date: {dayjs(item.date).format('DD-MM-YYYY')}
        </Text>
        <Text style={styles.orderSubtitle}>Items: {item.items.length}</Text>

        {item.items.map((orderItem, index) => (
          <View key={index} style={styles.cartItemContent}>
            <View style={styles.cartItemRow}>
              <Text style={styles.cartItemLabel}>
                {orderItem.product || 'Item'}
              </Text>
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
            {orderItem.category && (
              <View style={styles.cartItemRow}>
                <Text style={styles.cartItemCategory}>
                  Category: {orderItem.category}
                </Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Table Total:</Text>
          <Text style={styles.totalAmount}>₹{item.totalAmount.toFixed(2)}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderGenericReportItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        {Object.entries(item).map(([key, value]) => (
          <View key={key} style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>{key}:</Text>
            <Text style={styles.cartItemValue}>{String(value)}</Text>
          </View>
        ))}
      </LinearGradient>
    </View>
  );

  const renderHeader = () => {
    const isAllOrders = reportType === 'all';
    const dataToUse = isAllOrders ? orders : reportData;

    let totalAmount = 0;
    let totalItems = 0;

    if (isAllOrders) {
      totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
    } else {
      // For other report types, try to calculate totals if possible
      totalItems = reportData.length;
      if (reportData.length > 0 && reportData[0].total_amount) {
        totalAmount = reportData.reduce(
          (sum, item) => sum + parseFloat(item.total_amount || '0'),
          0,
        );
      }
    }

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

        {renderReportTypeSelector()}

        <Text style={styles.title}>
          {reportType === 'all' && 'All Orders Report'}
          {reportType === 'category' && 'Category Wise Report'}
          {reportType === 'item' && 'Item Wise Report'}
          {reportType === 'bill' && 'Bill Wise Report'}
        </Text>

        <Text style={styles.subtitle}>
          {dayjs(fromDate).format('DD/MM/YY')} -{' '}
          {dayjs(toDate).format('DD/MM/YY')}
        </Text>

        {dataToUse.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Total {isAllOrders ? 'Tables' : 'Records'}:
              </Text>
              <Text style={styles.summaryValue}>{dataToUse.length}</Text>
            </View>
            {totalItems > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items:</Text>
                <Text style={styles.summaryValue}>{totalItems}</Text>
              </View>
            )}
            {totalAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount:</Text>
                <Text style={styles.summaryTotal}>
                  ₹{totalAmount.toFixed(2)}
                </Text>
              </View>
            )}
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

  const dataToRender = reportType === 'all' ? orders : reportData;
  const renderItem =
    reportType === 'all' ? renderOrderItem : renderGenericReportItem;

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
        keyExtractor={(item, index) => `${reportType}-${index}`}
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
