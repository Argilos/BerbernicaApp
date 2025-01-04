import React from 'react';
import { ImageBackground, View, StyleSheet, Image, Text, TouchableOpacity, Animated } from 'react-native';


function WelcomeScreen({navigation}) {
    const handleLoginPress = () => navigation.navigate("Login")
    const handleRegisterPress = () => console.log("Register pressed!")
    const onPressLearnMore = () => console.log("login");
    return (

       
        <ImageBackground 
        style={styles.background}
        source={require("../assets/wlcs.jpg")}>
            
                
            <Image source={require("../assets/bandido.jpg")} style={styles.logo}/>
             
        <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.registerButton} onPress={handleRegisterPress}>
                    <Text style={styles.regButtonText}>Register</Text>

                </TouchableOpacity>
             
             </View>
        



        </ImageBackground>
        
    );
}

const styles = StyleSheet.create({

    background: {
        flex:1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },

    
    // logoContainer:{
        
    //     justifyContent: 'center',
    //     height: 100,
    //     width: 100,
    //     position: 'absolute',
    //     top: 70
    // },
    
    logo:{
        width: 130,
        height: 130,
        position: 'absolute',
        top: 60,
        borderRadius: 100,
        left: '34.5%',
        
        
    },

    buttonContainer:{
        width:"80%",
        paddingBottom: 20,
        marginBottom: 40,

        

    },

    loginButton:{
        width: "100%",
        height: 70,
        backgroundColor: "#E24C3B",
        borderRadius: 50,
        marginBottom: 5,
        
        
    },
    
    registerButton:{
        width: "100%",
        height: 70,
        backgroundColor: "#0088E0",
        borderRadius: 50,
    },
    
    buttonText:{
        color: "#fff",
        fontSize: 20,
        fontWeight: 'bold',
        paddingLeft: "44%",
        paddingTop: "6%"

    },

    regButtonText:{
        color: "#fff",
        fontSize: 20,
        fontWeight: 'bold',
        paddingLeft: "40%",
        paddingTop: "6%"
        
    }
    
})

export default WelcomeScreen;