import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Modal, TouchableOpacity, Text, TextInput, FlatList, Image, Alert, StatusBar } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';

const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';
const GOOGLE_DIRECTIONS_API_KEY = 'YOUR_GOOGLE_DIRECTIONS_API_KEY';

const NewMapComponent = () => {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [route, setRoute] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación denegado');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setOriginCoords({ latitude, longitude });
      setLoading(false);
    })();
  }, []);

  const fetchSuggestions = async (query) => {
    if (query.length > 2) {
      try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
          params: {
            input: query,
            key: GOOGLE_PLACES_API_KEY,
          },
        });
        setSuggestions(response.data.predictions);
      } catch (error) {
        console.error(error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = async (description, placeId) => {
    const location = await getPlaceDetails(placeId);
    if (location) {
      setOrigin(description);
      setOriginCoords(location);
      setRegion({
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setSuggestions([]);
    }
  };

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
        params: {
          place_id: placeId,
          key: GOOGLE_PLACES_API_KEY,
        },
      });
      return response.data.result.geometry.location;
    } catch (error) {
      console.error(error);
    }
  };

  const getRoute = async () => {
    if (!originCoords || !destinationCoords) {
      Alert.alert("Error", "Por favor, asegúrate de que las direcciones de origen y destino estén seleccionadas.");
      return;
    }
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
        params: {
          origin: `${originCoords.latitude},${originCoords.longitude}`,
          destination: `${destinationCoords.latitude},${destinationCoords.longitude}`,
          key: GOOGLE_DIRECTIONS_API_KEY,
        },
      });
      const points = response.data.routes[0].legs[0].steps.map(step => ({
        latitude: step.end_location.lat,
        longitude: step.end_location.lng,
      }));
      setRoute(points);
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
          longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
          latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.5,
          longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.5,
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo obtener la ruta. Intenta nuevamente.");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Dirección de Origen"
          style={styles.input}
          value={origin}
          onChangeText={(text) => {
            setOrigin(text);
            fetchSuggestions(text);
          }}
        />
        <TextInput
          placeholder="Dirección de Destino"
          style={styles.input}
          value={destination}
          onChangeText={(text) => {
            setDestination(text);
            fetchSuggestions(text);
          }}
        />
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectSuggestion(item.description, item.place_id)}>
                <Text style={styles.suggestionText}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      <MapView ref={mapRef} style={styles.map} region={region}>
        {originCoords && <Marker coordinate={originCoords} title="Origen" pinColor="black" />}
        {destinationCoords && <Marker coordinate={destinationCoords} title="Destino" pinColor="fuchsia" />}
        {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />}
      </MapView>
      <TouchableOpacity style={styles.goButton} onPress={getRoute}>
        <Text style={styles.goButtonText}>Buscar Ruta</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  searchBox: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  suggestionBox: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    maxHeight: 200,
  },
  suggestionText: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  goButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
  },
  goButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default NewMapComponent;
