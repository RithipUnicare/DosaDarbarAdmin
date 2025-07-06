import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./Components/HomeScreen";
import CategoriesScreen from "./Components/Category";
import GetProductsScreen from "./Components/GetProducts";
import CartDetailsScreen from "./Components/CardDetails";

const Stack = createStackNavigator();

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
