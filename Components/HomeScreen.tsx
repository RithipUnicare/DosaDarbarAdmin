/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { setProducts } from '../redux/slices/productSlice';
import { getAllProducts } from '../Services/ApiServices';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  Category: undefined;
  GetProducts: undefined;
  CardDetails: undefined;
  Report: undefined;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const dispatch = useDispatch();

  useEffect(() => {
    getAllproducts();
  }, []);

  const getAllproducts = async () => {
    const response = await getAllProducts();
    const data = response?.data?.Item;
    console.log(data);
    dispatch(setProducts(data));
  };

  const handleCategoriesPress = () => {
    navigation.navigate('Category');
  };

  const handleGetProductsPress = () => {
    navigation.navigate('GetProducts');
  };

  const handleCardDetailsPress = () => {
    navigation.navigate('CardDetails');
  };

  const handleReportPress = () => {
    navigation.navigate('Report');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to DOSA DHARBHAR</Text>
        </View>

        {/* Main Content Section */}
        <View style={styles.mainContent}>
          {/* First Row - Categories and Get Products */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.card}
              onPress={handleCategoriesPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#333', '#222']}
                style={styles.cardGradient}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>🍽️</Text>
                </View>
                <Text style={styles.cardTitle}>Categories</Text>
                <Text style={styles.cardSubtitle}>Browse all categories</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={handleGetProductsPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#333', '#222']}
                style={styles.cardGradient}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>🥘</Text>
                </View>
                <Text style={styles.cardTitle}>Get Products</Text>
                <Text style={styles.cardSubtitle}>View all products</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Second Row - Card Details and Report */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.card}
              onPress={handleCardDetailsPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#333', '#222']}
                style={styles.cardGradient}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>🛎️</Text>
                </View>
                <Text style={styles.cardTitle}>Card Details</Text>
                <Text style={styles.cardSubtitle}>
                  Manage your payment cards
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={handleReportPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#333', '#222']}
                style={styles.cardGradient}
              >
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>📊</Text>
                </View>
                <Text style={styles.cardTitle}>Daily Report</Text>
                <Text style={styles.cardSubtitle}>View today's orders</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Section - Logout */}
      <View style={styles.bottomSection}>
        <Text style={styles.website}>www.dosadharbar.com</Text>
        <Text style={styles.website}>1.0.1</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    paddingTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    flex: 0.48,
    height: 140,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 15,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardIconText: {
    fontSize: 30,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 50,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  website: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeScreen;
