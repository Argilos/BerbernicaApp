import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Image, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the icon library

function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        console.log('Username: ', username);
        console.log('Password: ', password);
    };

    return (
        <ImageBackground
            style={styles.background}
            source={require('../assets/bareber-shop-without-mockup-1.jpg')}
        >
            <Image
                source={require('../assets/bandido.jpg')}
                style={styles.logo}
            />
            
            <View style={styles.container}>
            

                {/* Grey Box with Gradient */}
                <LinearGradient
                    colors={['#D3D3D3', '#A9A9A9', '#707070', '#505050']} 
                    style={styles.inputBlock} 
                    start={{ x: 1, y: 0 }} 
                    end={{ x: 0, y: 1 }}   
                >
                    {/* Username input */}
                    <View style={styles.inputContainer}>
                        <Icon name="user" size={20} color="#333" style={styles.icon} />
                        <Text style={styles.label}>Korisničko ime: </Text>
                    </View>
                    <TextInput 
                        style={styles.input}
                        placeholder="Unesi korisničko ime"
                        placeholderTextColor="gray"
                        value={username}
                        onChangeText={(text) => setUsername(text)}
                    />

                    {/* Password input */}
                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="#333" style={styles.icon} />
                        <Text style={styles.label}>Šifra: </Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Upiši šifru"
                        placeholderTextColor="gray"
                        secureTextEntry
                        value={password}
                        onChangeText={(text) => setPassword(text)}
                    />
                    <View style={styles.buttonContainer}>
                    <Button title="Login" onPress={handleLogin} />
                </View>
                </LinearGradient>

                
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    inputBlock: {
        marginTop: "-45%",
        padding: 50,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row', // Align icon and label horizontally
        alignItems: 'center', // Center them vertically
        marginBottom: 5,
    },
    label: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333333',
        marginLeft: 10, // Space between icon and label
    },
    input: {
        width: 250,
        height: 40,
        borderColor: '#505050',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    icon: {
        marginRight: 5, 
        
    },
    buttonContainer: {
        backgroundColor: 'white',
        marginTop: 20,
    },
    logo: {
        width: 100,
        height: 100,
        marginTop: '10%',
        borderRadius: 50,

    },
});

export default LoginScreen;
