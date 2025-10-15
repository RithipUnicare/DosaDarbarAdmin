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
  PermissionsAndroid,
  Platform,
  Modal,
  ScrollView,
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

const { width } = Dimensions.get('window');

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
  served?: boolean;
}

export interface KitchenOrder {
  items: CartItemType[];
  tableNo: string;
  userId: string;
}

type KitchenScreenProps = StackScreenProps<RootStackParamList, 'KitchenScreen'>;

const DEFAULT_PRINTER_KEY = 'defaultPrinter';

const KitchenScreen: React.FC<KitchenScreenProps> = ({ route, navigation }) => {
  const { kitchenOrder } = route.params as { kitchenOrder: KitchenOrder };
  const [items, setItems] = useState<CartItemType[]>(
    kitchenOrder.items.map(item => ({ ...item, served: item.served ?? false })),
  );
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
      console.error('Default printer connection error:', error);
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
    console.log(name);
    //return printerKeywords.some(keyword => name.includes(keyword));
    return true;
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

  const handleServeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems[index].served = true;
    setItems(updatedItems);
  };

  const handlePrintKitchenOrder = async () => {
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
    if (!isConnected) {
      Alert.alert(
        'Not Connected',
        'Please select and connect to a printer first.',
      );
      return;
    }
    if (!items.length) {
      Alert.alert('No Items', 'No items available to print.');
      return;
    }

    setIsPrinting(true);
    try {
      const itemsText = items
        .map((item, index) => {
          const srNo = `${(index + 1).toString().padStart(2, '0')}.`;
          const itemName = (item.name || 'N/A')
            .substring(0, 12)
            .padEnd(12, ' ');
          const quantity = (item.quantity || '0').toString().padStart(1, ' ');

          let itemLine = `<L>${srNo} ${itemName}</L>\n`;
          const detailLine = `Qty: ${quantity}`;
          itemLine += `<R>${detailLine}</R>\n`;

          return itemLine;
        })
        .join('');

      const printText = `
<C>============================</C>
<C>KITCHEN ORDER</C>
<C>============================</C>
<L>Date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</L>
<L>Table: ${kitchenOrder.tableNo}</L>
<L>User ID: ${kitchenOrder.userId}</L>
<C>============================</C>
<L>Item                Quantity</L>
<C>----------------------------</C>
${itemsText}
<C>============================</C>
<C>Prepare Order!</C>
<C>============================</C>
\n\n\n
      `;

      await BLEPrinter.printText(printText);
      Alert.alert('Success', 'Kitchen order printed successfully!');
    } catch (error) {
      console.error('Printing error:', error);
      Alert.alert('Error', 'Failed to print kitchen order. Please try again.');
    } finally {
      setIsPrinting(false);
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

  const renderItem = ({
    item,
    index,
  }: {
    item: CartItemType;
    index: number;
  }) => (
    <View style={styles.itemCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <Text style={styles.itemName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
        <TouchableOpacity
          style={[styles.serveButton, item.served && styles.servedButton]}
          onPress={() => !item.served && handleServeItem(index)}
          disabled={item.served}
        >
          <Text style={styles.serveButtonText}>
            {item.served ? 'Served' : 'Serve'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>{'< Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Kitchen Orders</Text>
      <Text style={styles.subtitle}>
        Table No: {kitchenOrder.tableNo} | User ID: {kitchenOrder.userId}
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
    </View>
  );

  const renderControlButtons = () => (
    <View style={styles.bottomContainer}>
      {/* Top Row */}
      <View style={styles.buttonRow}>
        {/* Print Button */}
        <TouchableOpacity
          style={[styles.primaryButton, isPrinting && styles.disabledButton]}
          onPress={handlePrintKitchenOrder}
          disabled={isPrinting}
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
          >
            <Text style={styles.secondaryButtonText}>Enable BT</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={scanDevices}
            disabled={isScanning}
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
        {/* Disconnect Button */}
        {isConnected && (
          <TouchableOpacity
            style={[styles.secondaryButton, styles.disconnectButton]}
            onPress={handleDisconnect}
          >
            <Text style={styles.secondaryButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        {/* Settings Button */}
        <TouchableOpacity
          style={[styles.secondaryButton, styles.settingsButton]}
          onPress={openBluetoothSettings}
        >
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderDeviceModal()}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item =>
          item.id?.toString() || `${item.product_id}-${item.tableno}`
        }
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {renderControlButtons()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 25,
    paddingBottom: 25,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 15,
    marginTop: 15,
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 25,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  statusIndicator: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    flex: 0.48,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemCard: {
    marginBottom: 18,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  itemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemQuantity: {
    color: '#888',
    fontSize: 15,
    marginBottom: 15,
  },
  serveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
    minWidth: 80,
    alignSelf: 'flex-end',
  },
  servedButton: {
    backgroundColor: '#666',
  },
  serveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 10,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
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
    elevation: 2,
    minHeight: 45,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
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
  disconnectButton: {
    backgroundColor: '#F44336',
    marginRight: 5,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: '#555',
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#666',
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
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalClose: {
    fontSize: 16,
    color: '#888',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
    textAlign: 'center',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    borderRadius: 10,
    marginBottom: 5,
  },
  printerDeviceItem: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#4CAF50',
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
    fontWeight: '600',
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
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  modalButtons: {
    marginTop: 20,
    alignItems: 'center',
  },
  rescanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default KitchenScreen;
