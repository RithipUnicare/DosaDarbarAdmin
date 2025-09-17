/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from "react-native-thermal-receipt-printer";
import dayjs from 'dayjs';

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

interface ConsolidatedBillType {
  items: CartItemType[];
  totalAmount: string;
  userId: string;
  tableNo: string;
}

interface BillScreenProps {
  route: { params: { consolidatedBill: ConsolidatedBillType } };
  navigation: any;
}

const BillScreen: React.FC<BillScreenProps> = ({ route, navigation }) => {
  const { consolidatedBill } = route.params;
  const [isPrinting, setIsPrinting] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<IBLEPrinter[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<IBLEPrinter | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    checkBluetoothAndPermissions();
  }, []);

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
      if (!selectedDevice) {
        await scanDevices();
      }
    } catch (error) {
      //console.error('Error checking Bluetooth:', error);
      Alert.alert('Error', 'Failed to check Bluetooth status. Please ensure Bluetooth is enabled.');
    }
  };

  const isPotentialPrinter = (device: IBLEPrinter): boolean => {
    const name = device.device_name?.toLowerCase() || '';
    const printerKeywords = ['printer', 'print', 'thermal', 'pos', 'receipt', 'epson', 'star', 'zebra', 'citizen'];
    return printerKeywords.some(keyword => name.includes(keyword));
  };

  const scanDevices = async () => {
    if (isScanning || Platform.OS === 'ios') return; // iOS support noted but scanning may differ
    
    setIsScanning(true);
    try {
      await BLEPrinter.init();
      setDevices([]);
      
      const printers = await BLEPrinter.getDeviceList();
      console.log('All discovered devices:', printers);
      
      if (Array.isArray(printers) && printers.length > 0) {
        const potentialPrinters = printers.filter(isPotentialPrinter);
        const devicesToShow = potentialPrinters.length > 0 ? potentialPrinters : printers;
        
        setDevices(devicesToShow);
        console.log('Available Printers:', devicesToShow);
        setShowDeviceModal(true);
      } else {
        Alert.alert(
          'No Devices Found', 
          'No Bluetooth devices found. Please ensure:\n1. Bluetooth is enabled\n2. Your thermal printer is turned on\n3. The printer is paired in Android Bluetooth settings',
        );
      }
    } catch (error) {
      //console.error('Error scanning devices:', error);
      Alert.alert('Scan Error', 'Failed to scan for devices. Ensure Bluetooth is enabled and permissions are granted.');
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

      console.log('Attempting to connect to:', macAddress);
      
      console.log();
      await BLEPrinter.connectPrinter(macAddress).then(() => {
        setIsConnected(true);
      }).catch((error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      //Alert.alert('Success', `Connected to printer: ${device.device_name || 'Unnamed Printer'}`);
    } catch (error: any) {
      //console.error('Connection error:', error);
      setIsConnected(false);
      
      if (error.message?.includes('pairing')) {
        Alert.alert(
          'Pairing Required', 
          `Please pair the printer "${device.device_name}" in Android Bluetooth settings first:\n1. Go to Settings > Bluetooth\n2. Find "${device.device_name}"\n3. Tap to pair\n4. Return to this app and try again`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Bluetooth Settings', onPress: () => Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS') },
          ],
        );
      } else {
        Alert.alert('Connection Failed', 'Failed to connect to the printer. Please ensure the printer is turned on and paired in Bluetooth settings.');
      }
    }
  };

  const handlePrintBill = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert('Not Supported', 'Bluetooth printing requires additional iOS setup with this library.');
      return;
    }
    if (!bluetoothEnabled) {
      Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth first.');
      return;
    }
    if (!isConnected || !selectedDevice) {
      Alert.alert('Not Connected', 'Please select and connect to a printer first.');
      return;
    }
    if (!consolidatedBill?.items?.length) {
      Alert.alert('No Items', 'No items available to print.');
      return;
    }

    setIsPrinting(true);
    try {
      const macAddress = selectedDevice.inner_mac_address;
      await BLEPrinter.connectPrinter(macAddress);

      // Calculate total quantity of all items
      const totalQuantity = consolidatedBill.items.reduce((sum, item) => {
        return sum + (parseInt(item.quantity.toString()) || 0);
      }, 0);

      const itemsText = consolidatedBill.items
        .map((item, index) => {
          const srNo = `${(index + 1).toString().padStart(2, '0')}.`;
          const itemName = (item.name || 'N/A').substring(0, 12); 
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
      const kotNo = `KOT${Math.floor(Math.random() * 1000)}`;
      const currentDate = dayjs().format('DD/MM/YY');
      const currentTime = dayjs().format('HH:mm');

      const receiptText =
        `<C>================================</C>\n` +
        `<C><B>DOSA DHARBAR    </B></C>\n` +
        `<C>================================</C>\n\n` +


        `<L>Bill No: ${billNo}</L>\n` +
        `<L>KOT: ${kotNo}  Table: ${consolidatedBill.tableNo || 'N/A'}</L>\n` +
        `<L>Date: ${currentDate}    Time: ${currentTime}</L>\n` +
        `<L>Captain: ${consolidatedBill.userId || 'N/A'}</L>\n\n` +

        `<L>--------------------------------</L>\n` +
        `<L><B>ITEMS ORDERED</B></L>\n` +
        `<L>--------------------------------</L>\n` +

        `${itemsText}` +


        `<L>--------------------------------</L>\n` +
        `<L>Total Items: ${consolidatedBill.items.length}    Qty: ${totalQuantity}</L>\n` +
        `<L>--------------------------------</L>\n\n` +

        // // Bill Totals
        // `<L>Subtotal          Rs.${parseFloat(consolidatedBill.totalAmount || 0).toFixed(2)}</L>\n` +
        // `<L>SGST @ 2.5%       Rs.0.00</L>\n` +
        // `<L>CGST @ 2.5%       Rs.0.00</L>\n` +
        // `<L>Service Charge    Rs.0.00</L>\n` +
        // `<L>Round Off         Rs.0.00</L>\n` +
        `<L>--------------------------------</L>\n` +
        `<L><B>TOTAL AMOUNT     Rs.${parseFloat(String(consolidatedBill.totalAmount || 0))}</B></L>\n` +
        `<L>--------------------------------</L>\n\n` +

        `<C>Customer Copy</C>\n` +
        `<C>Thank You! Visit Again</C>\n` +
        `<C>================================</C>\n\n\n`;


      await BLEPrinter.printBill(receiptText);

      Alert.alert('Success', 'Bill printed successfully!');
    } catch (error: any) {
      //console.error('Print error:', error);
      
      if (error.message?.includes('pairing')) {
        Alert.alert(
          'Printer Not Paired', 
          'The printer needs to be paired in Android Bluetooth settings. Please pair it and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Bluetooth Settings', onPress: () => Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS') },
          ],
        );
      } else {
        Alert.alert('Print Error', 'Failed to print bill. Please ensure:\n1. Printer is turned on\n2. Printer is paired in Bluetooth settings\n3. Printer has paper loaded\n4. You\'re within range of the printer');
      }
      
      setIsConnected(false);
      setSelectedDevice(null);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleDisconnect = async () => {
    try {
      if (selectedDevice) {
        await BLEPrinter.closeConn();
      }
      setSelectedDevice(null);
      setIsConnected(false);
      setShowDeviceModal(false);
      Alert.alert('Disconnected', 'Printer has been disconnected.');
    } catch (error) {
      //console.error('Disconnect error:', error);
      Alert.alert('Error', 'Failed to disconnect printer.');
    }
  };

  const openBluetoothSettings = () => {
    Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => {
      Linking.openSettings();
    });
  };

  const renderDeviceList = () => (
    <Modal visible={showDeviceModal} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Printer</Text>
            <TouchableOpacity
              onPress={() => setShowDeviceModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Close printer selection modal"
            >
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Note: Printer must be paired in Android Bluetooth settings first
          </Text>
          
          <FlatList
            data={devices}
            keyExtractor={(item) => item.inner_mac_address || Math.random().toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.deviceItem,
                  isPotentialPrinter(item) && styles.printerDeviceItem,
                ]}
                onPress={() => selectAndConnectPrinter(item)}
                accessibilityRole="button"
                accessibilityLabel={`Connect to printer ${item.device_name || 'Unnamed Device'}`}
              >
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>
                    {item.device_name || `Device (${item.inner_mac_address})`}
                    {isPotentialPrinter(item) && (
                      <Text style={styles.printerLabel}> (Printer)</Text>
                    )}
                  </Text>
                  <Text style={styles.deviceAddress}>
                    {item.inner_mac_address}
                  </Text>
                </View>
                <Text style={styles.connectText}>Connect</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No devices found</Text>
                <Text style={styles.emptySubtext}>
                  Make sure your thermal printer is:
                  {'\n'}• Turned on
                  {'\n'}• In pairing mode
                  {'\n'}• Paired in Bluetooth settings
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.rescanButton, isScanning && styles.disabledButton]} 
              onPress={scanDevices}
              disabled={isScanning}
              accessibilityRole="button"
              accessibilityLabel="Rescan for Bluetooth printers"
            >
              {isScanning ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.rescanButtonText}>Rescan Devices</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.bluetoothSettingsButton}
              onPress={openBluetoothSettings}
              accessibilityRole="button"
              accessibilityLabel="Open Bluetooth settings"
            >
              <Text style={styles.bluetoothSettingsButtonText}>Bluetooth Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBillItem = useCallback(({ item }: { item: CartItemType }) => (
    <View style={styles.billCard}>
      <LinearGradient colors={['#333', '#222']} style={styles.cardGradient}>
        <View style={styles.cartItemImageRow}>
          {item.item_image ? (
            <Image
              source={{
                uri: `http://deepikagroups.com/Dosadharbar/api/v1/images/${item.item_image}`,
              }}
              style={styles.cartItemImage}
              resizeMode="cover"
              //defaultSource={require('./path/to/placeholder.png')} // Add a local placeholder image
              onError={() => console.warn(`Failed to load image for ${item.name}`)}
              accessibilityLabel={`Image of ${item.name || 'item'}`}
            />
          ) : (
            <View style={styles.cartItemImagePlaceholder} />
          )}
          <View style={styles.cartItemNameCol}>
            <Text style={styles.cartItemName}>{item.name || 'Unknown Item'}</Text>
          </View>
        </View>
        <View style={styles.cartItemContent}>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Product ID:</Text>
            <Text style={styles.cartItemValue}>{item.id || item.product_id || 'N/A'}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Name:</Text>
            <Text style={styles.cartItemValue}>{item.name || 'N/A'}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Category ID:</Text>
            <Text style={styles.cartItemValue}>{item.category_id || 'N/A'}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Price:</Text>
            <Text style={styles.cartItemPrice}>₹{item.product_price || '0.00'}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Quantity:</Text>
            <Text style={styles.cartItemValue}>{item.quantity || '0'}</Text>
          </View>
          <View style={styles.cartItemRow}>
            <Text style={styles.cartItemLabel}>Total Amount:</Text>
            <Text style={styles.cartItemTotal}>₹{item.total_amount || '0.00'}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  ), []);

  if (!consolidatedBill?.items?.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>BILL DETAILS</Text>
          <Text style={styles.subtitle}>No items to display</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Items in Bill</Text>
          <Text style={styles.emptySubtext}>Please add items to the cart first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderDeviceList()}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>BILL DETAILS</Text>
        <Text style={styles.subtitle}>
          Bill for Table {consolidatedBill.tableNo} (User {consolidatedBill.userId})
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, { backgroundColor: bluetoothEnabled ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusText}>{bluetoothEnabled ? 'Bluetooth: ON' : 'Bluetooth: OFF'}</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.statusText}>{isConnected ? 'Connected' : selectedDevice ? 'Connecting...' : 'Not Connected'}</Text>
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
      
      <FlatList
        data={consolidatedBill.items}
        renderItem={renderBillItem}
        keyExtractor={(item, index) => `bill-item-${item.product_id}-${index}`}
        contentContainerStyle={styles.billContainer}
        ListFooterComponent={
          <>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Grand Total:</Text>
              <Text style={styles.totalAmount}>₹{consolidatedBill.totalAmount}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.printButton,
                (isPrinting || !bluetoothEnabled || !isConnected) && styles.disabledButton,
              ]}
              onPress={handlePrintBill}
              activeOpacity={0.8}
              disabled={isPrinting || !bluetoothEnabled || !isConnected}
              accessibilityRole="button"
              accessibilityLabel="Print bill to thermal printer"
            >
              {isPrinting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.printButtonText}>Print Bill to Thermal Printer</Text>
              )}
            </TouchableOpacity>
            {!bluetoothEnabled && (
              <TouchableOpacity
                style={styles.enableBluetoothButton}
                onPress={checkBluetoothAndPermissions}
                accessibilityRole="button"
                accessibilityLabel="Enable Bluetooth"
              >
                <Text style={styles.enableBluetoothButtonText}>Enable Bluetooth</Text>
              </TouchableOpacity>
            )}
            {bluetoothEnabled && !selectedDevice && (
              <TouchableOpacity
                style={[styles.scanButton, isScanning && styles.disabledButton]}
                onPress={scanDevices}
                disabled={isScanning}
                accessibilityRole="button"
                accessibilityLabel="Scan for Bluetooth printers"
              >
                {isScanning ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.scanButtonText}>Scan for Printers</Text>
                )}
              </TouchableOpacity>
            )}
            {selectedDevice && (
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnect}
                accessibilityRole="button"
                accessibilityLabel="Disconnect printer"
              >
                <Text style={styles.disconnectButtonText}>Disconnect Printer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.bluetoothSettingsButton}
              onPress={openBluetoothSettings}
              accessibilityRole="button"
              accessibilityLabel="Open Bluetooth settings"
            >
              <Text style={styles.bluetoothSettingsButtonText}>Open Bluetooth Settings</Text>
            </TouchableOpacity>
          </>
        }
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
    flex: 1,
  },
  cartItemValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  cartItemPrice: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  cartItemTotal: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
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
  printButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  enableBluetoothButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  enableBluetoothButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bluetoothSettingsButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
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
    maxHeight: '80%',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  modalClose: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSubtitle: {
    color: '#FFC107',
    fontSize: 12,
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deviceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 8,
    marginBottom: 8,
  },
  printerDeviceItem: {
    backgroundColor: '#2E7D32',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  printerLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deviceAddress: {
    color: '#888',
    fontSize: 12,
  },
  connectText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  rescanButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BillScreen;