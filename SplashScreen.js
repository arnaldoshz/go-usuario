// SplashScreen.js
import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const SplashScreen = ({ navigation }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('MapComponent'); // Cambia 'Main' a 'MapComponent'
        }, 2000); // 2000 ms = 2 segundos

        return () => clearTimeout(timer); // Limpia el temporizador al desmontar
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Image source={require('./assets/login.gif')} style={styles.logo} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000', // Color de fondo
    },
    logo: {
        width: 300, // Ajusta el tamaño según sea necesario
        height: 300,
    },
});

export default SplashScreen;
