import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './app/WelcomeScreen';
import LoginScreen from './app/LoginScreen';

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Welcome">
                <Stack.Screen 
                    name="Welcome" 
                    component={WelcomeScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ title: 'Login' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}