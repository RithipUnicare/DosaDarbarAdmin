/* eslint-disable @typescript-eslint/no-unused-vars */
import type { RootStackParamList } from '../AppNav';
import type { StackScreenProps } from '@react-navigation/stack';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert,
  PermissionsAndroid,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Dimensions, Linking } from 'react-native';
import {
  USBPrinter,
  NetPrinter,
  BLEPrinter,
  IBLEPrinter,
} from 'react-native-thermal-receipt-printer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { deleteCard } from '../Services/ApiServices';

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
  served?: boolean;
}

export interface ConsolidatedBill {
  items: CartItemType[];
  totalAmount: string;
  userId: string;
  tableNo: string;
}

interface OrderType {
  items: CartItemType[];
  totalAmount: string;
  userId: string;
  tableNo: string;
  timestamp: string;
}

type BillScreenProps = StackScreenProps<RootStackParamList, 'BillScreen'>;

const ORDER_STORAGE_KEY = 'orderHistory';
const CART_STORAGE_KEY = 'cartItems';
const IMAGE_BASE_URL = 'http://unitech.agency/Dosadharbar/api/v1/images/';
const DEFAULT_PRINTER_KEY = 'defaultPrinter';

const BillScreen: React.FC<BillScreenProps> = ({ route, navigation }) => {
  const { consolidatedBill } = route.params;
  const [isPrinting, setIsPrinting] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<IBLEPrinter[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<IBLEPrinter | null>(
    null,
  );
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [defaultPrinterMac, setDefaultPrinterMac] = useState<string | null>(
    null,
  );

  useEffect(() => {
    loadDefaultPrinter();
    checkBluetoothAndPermissions();
  }, []);

  const loadDefaultPrinter = async () => {
    const storedMac = await AsyncStorage.getItem(DEFAULT_PRINTER_KEY);
    if (storedMac) {
      setDefaultPrinterMac(storedMac);
    }
  };

  const setAsDefaultPrinter = async () => {
    if (selectedDevice && selectedDevice.inner_mac_address) {
      await AsyncStorage.setItem(
        DEFAULT_PRINTER_KEY,
        selectedDevice.inner_mac_address,
      );
      setDefaultPrinterMac(selectedDevice.inner_mac_address);
      Alert.alert('Success', 'Printer set as default.');
    } else {
      Alert.alert('Error', 'No printer selected.');
    }
  };

  const requestBluetoothPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        return (
          granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
          granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
        );
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const checkBluetoothAndPermissions = async () => {
    try {
      const hasPermission = await requestBluetoothPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Bluetooth and location permissions are required to print. Please enable them in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      setBluetoothEnabled(true);
      await BLEPrinter.init();
      if (defaultPrinterMac) {
        connectToDefaultPrinter(defaultPrinterMac);
      } else {
        await scanDevices();
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to check Bluetooth status. Please ensure Bluetooth is enabled.',
      );
    }
  };

  const connectToDefaultPrinter = async (macAddress: string) => {
    try {
      await BLEPrinter.connectPrinter(macAddress);
      setIsConnected(true);
      Alert.alert('Success', 'Connected to default printer.');
    } catch (error) {
      //console.error('Default printer connection error:', error);
      Alert.alert(
        'Error',
        'Failed to connect to default printer. Scanning for devices...',
      );
      await scanDevices();
    }
  };

  const isPotentialPrinter = (device: IBLEPrinter): boolean => {
    const name = device.device_name?.toLowerCase() || '';
    const printerKeywords = [
      'printer',
      'print',
      'thermal',
      'pos',
      'receipt',
      'epson',
      'star',
      'zebra',
      'citizen',
    ];
    return printerKeywords.some(keyword => name.includes(keyword));
  };

  const scanDevices = async () => {
    if (isScanning || Platform.OS === 'ios') return;

    setIsScanning(true);
    try {
      const printers = await BLEPrinter.getDeviceList();

      if (Array.isArray(printers) && printers.length > 0) {
        const potentialPrinters = printers.filter(isPotentialPrinter);
        const devicesToShow =
          potentialPrinters.length > 0 ? potentialPrinters : printers;

        setDevices(devicesToShow);

        setShowDeviceModal(true);
      } else {
        Alert.alert(
          'No Devices Found',
          'No Bluetooth devices found. Please ensure:\n1. Bluetooth is enabled\n2. Your thermal printer is turned on\n3. The printer is paired in Android Bluetooth settings',
        );
      }
    } catch (error) {
      Alert.alert(
        'Scan Error',
        'Failed to scan for devices. Ensure Bluetooth is enabled and permissions are granted.',
      );
    } finally {
      setIsScanning(false);
    }
  };

  const selectAndConnectPrinter = async (device: IBLEPrinter) => {
    try {
      setSelectedDevice(device);
      setIsConnected(false);
      setShowDeviceModal(false);

      const macAddress = device.inner_mac_address;

      if (!macAddress) {
        Alert.alert('Error', 'Device MAC address not found');
        return;
      }

      await BLEPrinter.connectPrinter(macAddress);
      setIsConnected(true);
    } catch (error) {
      //console.error('Connection error:', error);
      setIsConnected(false);
      Alert.alert(
        'Connection Failed',
        'Failed to connect to the printer. Please ensure the printer is turned on and paired in Bluetooth settings.',
      );
    }
  };

  const saveOrderToHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(ORDER_STORAGE_KEY);
      const orderHistory: OrderType[] = stored ? JSON.parse(stored) : [];
      const newOrder: OrderType = {
        ...consolidatedBill,
        timestamp: dayjs().format(),
      };
      orderHistory.push(newOrder);
      await AsyncStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify(orderHistory),
      );
    } catch (error) {
      //console.error('Failed to save order to history:', error);
    }
  };

  const handlePrintBill = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Not Supported',
        'Bluetooth printing requires additional iOS setup with this library.',
      );
      return;
    }
    if (!bluetoothEnabled) {
      Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth first.');
      return;
    }
    // if (!isConnected) {
    //   Alert.alert(
    //     'Not Connected',
    //     'Please select and connect to a printer first.',
    //   );
    //   return;
    // }
    if (!consolidatedBill?.items?.length) {
      Alert.alert('No Items', 'No items available to print.');
      return;
    }

    setIsPrinting(true);
    try {
      const totalQuantity = consolidatedBill?.items?.reduce(
        (sum:any, item:any) => sum + (parseInt(item.quantity as string) || 0),
        0,
      );

      const itemsText = consolidatedBill.items
        .map((item:any, index:any) => {
          const srNo = `${(index + 1).toString().padStart(2, '0')}.`;
          const itemName = (item.name || 'N/A')
            .substring(0, 12)
            .padEnd(12, ' ');
          const quantity = (item.quantity || '0').toString().padStart(1, ' ');
          const price = parseFloat(String(item.product_price ?? 0)).toFixed(2);
          const total = parseFloat(String(item.total_amount ?? 0)).toFixed(2);

          let itemLine = `<L>${srNo} ${itemName}</L>\n`;
          const detailLine = `${quantity}x${price} = ${total}`;
          itemLine += `<R>${detailLine}</R>\n`;

          return itemLine;
        })
        .join('');

      const billNo = Math.floor(Math.random() * 10000);
      const printText = `
<C>============================</C>
<C>DOSA DHARBHAR</C>
<C>============================</C>
<L>Family Restaurant </L>
<L>Periyapalayam </L>
<L>ph no : 8056818630</L>
<C>============================</C>
<C>Bill No: ${billNo}</C>
<L>Date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</L>
<L>Table: ${consolidatedBill.tableNo}</L>
<L>User ID: ${consolidatedBill.userId}</L>
<C>============================</C>
<L>Item                Qty  Total</L>
<C>----------------------------</C>
${itemsText}
<C>============================</C>
<L>Total Quantity: ${totalQuantity}</L>
<L>Total Amount: Rs.${consolidatedBill.totalAmount}</L>
<C>============================</C>
<C>Thank you! Visit Again!</C>
<C>============================</C>
\n\n\n
      `;

      await BLEPrinter.printText(printText);
      await saveOrderToHistory();

      // Clear the cart after successful print
      try {
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
      Alert.alert('Success', 'Bill printed successfully!');
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      let cartItems: CartItemType[] = storedCart ? JSON.parse(storedCart) : [];
      cartItems = cartItems.filter(
        item => item.tableno !== consolidatedBill.tableNo,
      );
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      for (const item of consolidatedBill.items) {
        await deleteCard(item.id);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to print bill. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await BLEPrinter.closeConn();
      setIsConnected(false);
      setSelectedDevice(null);
      Alert.alert('Success', 'Printer disconnected.');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect printer.');
    }
  };

  const openBluetoothSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
    } else {
      Linking.openSettings();
    }
  };

  const renderDeviceItem = ({ item }: { item: IBLEPrinter }) => (
    <TouchableOpacity
      style={[
        styles.deviceItem,
        isPotentialPrinter(item) && styles.printerDeviceItem,
      ]}
      onPress={() => selectAndConnectPrinter(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {item.device_name || 'Unnamed Device'}
        </Text>
        {isPotentialPrinter(item) && (
          <Text style={styles.printerLabel}>Thermal Printer</Text>
        )}
        <Text style={styles.deviceAddress}>{item.inner_mac_address}</Text>
      </View>
      <Text style={styles.connectText}>Connect</Text>
    </TouchableOpacity>
  );

  const renderDeviceModal = () => (
    <Modal
      visible={showDeviceModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowDeviceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Printer</Text>
            <TouchableOpacity onPress={() => setShowDeviceModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            {isScanning
              ? 'Scanning for devices...'
              : 'Select a device to connect'}
          </Text>
          {devices.length === 0 && !isScanning && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No devices found</Text>
              <Text style={styles.emptySubtext}>
                Ensure Bluetooth is enabled and your thermal printer is turned
                on and paired.
              </Text>
            </View>
          )}
          <FlatList
            data={devices}
            renderItem={renderDeviceItem}
            keyExtractor={item => item.inner_mac_address}
            style={{ maxHeight: '60%' }}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={scanDevices}
              disabled={isScanning}
            >
              <Text style={styles.rescanButtonText}>
                {isScanning ? 'Scanning...' : 'Rescan Devices'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
      <Text style={styles.title}>Bill Details</Text>
      <Text style={styles.subtitle}>
        Table No: {consolidatedBill.tableNo} | User ID:{' '}
        {consolidatedBill.userId}
      </Text>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: bluetoothEnabled ? '#4CAF50' : '#F44336' },
          ]}
        >
          <Text style={styles.statusText}>
            Bluetooth: {bluetoothEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isConnected ? '#4CAF50' : '#F44336' },
          ]}
        >
          <Text style={styles.statusText}>
            Printer: {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{consolidatedBill.items.length}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{consolidatedBill.totalAmount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderDeviceModal()}
      <ScrollView contentContainerStyle={styles.billContainer}>
        {renderHeader()}
        {consolidatedBill?.items?.map((item: any, index: any) => (
          <View key={index} style={styles.billCard}>
            <LinearGradient
              colors={['#333', '#222']}
              style={styles.cardGradient}
            >
              <View style={styles.cartItemImageRow}>
                {item?.item_image ? (
                  <Image
                    source={{ uri: `${IMAGE_BASE_URL}${item?.item_image}`}}
                    style={styles.cartItemImage}
                  />
                ) : (
                  <View style={styles.cartItemImagePlaceholder} />
                )}
                <View style={styles.cartItemNameCol}>
                  <Text style={styles.cartItemName}>
                    {item?.name || 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.cartItemContent}>
                <View style={styles.cartItemRow}>
                  <Text style={styles.cartItemLabel}>Product ID:</Text>
                  <Text style={styles.cartItemValue}>{item?.product_id}</Text>
                </View>
                <View style={styles.cartItemRow}>
                  <Text style={styles.cartItemLabel}>Category ID:</Text>
                  <Text style={styles.cartItemValue}>{item?.category_id}</Text>
                </View>
                <View style={styles.cartItemRow}>
                  <Text style={styles.cartItemLabel}>Quantity:</Text>
                  <Text style={styles.cartItemValue}>{item?.quantity}</Text>
                </View>
                <View style={styles.cartItemRow}>
                  <Text style={styles.cartItemLabel}>Price:</Text>
                  <Text style={styles.cartItemPrice}>
                    ₹{item?.product_price}
                  </Text>
                </View>
                <View style={styles.cartItemRow}>
                  <Text style={styles.cartItemLabel}>Total:</Text>
                  <Text style={styles.cartItemTotal}>
                    ₹{item?.total_amount}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            ₹{consolidatedBill.totalAmount}
          </Text>
        </View>

        {/* Action Buttons Container */}
        <View style={styles.actionButtonsContainer}>
          {/* Top Row */}
          <View style={styles.buttonRow}>
            {/* Print Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isPrinting && styles.disabledButton,
              ]}
              onPress={handlePrintBill}
              disabled={isPrinting}
              accessibilityRole="button"
              accessibilityLabel="Print bill"
            >
              <Text style={styles.primaryButtonText}>
                {isPrinting ? 'Printing...' : 'Print'}
              </Text>
            </TouchableOpacity>

            {/* Bluetooth Toggle/Scan */}
            {!bluetoothEnabled ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={checkBluetoothAndPermissions}
                accessibilityRole="button"
                accessibilityLabel="Enable Bluetooth"
              >
                <Text style={styles.secondaryButtonText}>Enable BT</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={scanDevices}
                disabled={isScanning}
                accessibilityRole="button"
                accessibilityLabel="Scan for printers"
              >
                {isScanning ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Scan</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Row */}
          <View style={styles.buttonRow}>
            {/* Set Default / Disconnect Button */}
            {isConnected ? (
              <TouchableOpacity
                style={[styles.secondaryButton, styles.disconnectButton]}
                onPress={handleDisconnect}
                accessibilityRole="button"
                accessibilityLabel="Disconnect printer"
              >
                <Text style={styles.secondaryButtonText}>Disconnect</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholderButton} />
            )}

            {/* Settings Button */}
            <TouchableOpacity
              style={[styles.secondaryButton, styles.settingsButton]}
              onPress={openBluetoothSettings}
              accessibilityRole="button"
              accessibilityLabel="Open Bluetooth settings"
            >
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 21,
    paddingBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 15,
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statusIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
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
  billContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    flexGrow: 1,
  },
  billCard: {
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
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#444',
    marginTop: 10,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    marginTop: 20,
    paddingHorizontal: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
    minHeight: 45,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
    minHeight: 45,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
    marginRight: 5,
  },
  settingsButton: {
    backgroundColor: '#555',
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#666',
  },
  placeholderButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.6,
    marginTop: 10,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bluetoothSettingsButton: {
    backgroundColor: '#888',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  bluetoothSettingsButtonText: {
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
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalClose: {
    fontSize: 16,
    color: '#888',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  printerDeviceItem: {
    backgroundColor: '#333',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  printerLabel: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 5,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  connectText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  modalButtons: {
    marginTop: 20,
    alignItems: 'center',
  },
  rescanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default BillScreen;
