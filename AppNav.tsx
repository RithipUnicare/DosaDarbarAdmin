import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./Components/HomeScreen";
import CategoriesScreen from "./Components/Category";
import GetProductsScreen from "./Components/GetProducts";
import CartDetailsScreen from "./Components/CardDetails";
import BillScreen from "./Components/BillScreen";
import ReportScreen from "./Components/ReportScreen";
import ProductScreen from "./Components/productScreen";
import { ConsolidatedBill} from "./Components/BillScreen";
import { CartItemType } from "./Components/productScreen";
import { KitchenOrder } from "./Components/KitchanScreen";
import KitchenScreen from "./Components/KitchanScreen";


export type RootStackParamList = {
  Home: undefined;
  Category: undefined;
  GetProducts: undefined;
  CardDetails: undefined;
  BillScreen: ConsolidatedBill;
  Report: undefined;
  Product: CartItemType;
  KitchenScreen: KitchenOrder;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom", // or 'slide_from_right' for iOS-like
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Category" component={CategoriesScreen} />
        <Stack.Screen name="GetProducts" component={GetProductsScreen} />
        <Stack.Screen name="CardDetails" component={CartDetailsScreen} />
        <Stack.Screen name="BillScreen" component={BillScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen name="Product" component={ProductScreen} />
        <Stack.Screen name="KitchenScreen" component={KitchenScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
