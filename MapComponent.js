import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Modal, TouchableOpacity, Text, TextInput, FlatList, Image, Alert, PanResponder, TouchableWithoutFeedback, StatusBar } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import MapViewDirections from 'react-native-maps-directions';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import UserProfile from './UserProfile';
import MapScreen from './MapScreen';
import Icon from 'react-native-vector-icons/Ionicons';

const GOOGLE_PLACES_API_KEY = 'AIzaSyBEXEiaXcTjsnI4I1rAQtKgpZbqwYygzps';
const GOOGLE_DIRECTIONS_API_KEY = 'AIzaSyBEXEiaXcTjsnI4I1rAQtKgpZbqwYygzps';

const Drawer = createDrawerNavigator();

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f0f0f0" // Color gris claro para la geometría
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off" // Ocultar íconos de etiquetas
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#000000" // Color negro para el texto
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#ffffff" // Color blanco para el fondo del texto (sin borde)
      },
      {
        "weight": 0 // Eliminar el borde
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#d1a6c9" // Color rosa claro para la geometría administrativa
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#000000" // Color negro para etiquetas de país
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5" // Color gris claro para el paisaje
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee" // Color claro para puntos de interés
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff" // Color blanco para las carreteras
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c9c9c9" // Color claro para el agua
      }
    ]
  }
];

const MapComponent = ({ navigation }) => {
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDirectionModal, setShowDirectionModal] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [vehicleLocations, setVehicleLocations] = useState([]);
  const [route, setRoute] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeField, setActiveField] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showSearchingModal, setShowSearchingModal] = useState(false);
  const [vehicleType, setVehicleType] = useState(null);
  const [servicePrices, setServicePrices] = useState({});
  const [currentLocation, setCurrentLocation] = useState(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 100, y: 600 });
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showStickerButton, setShowStickerButton] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [showVehicleButton, setShowVehicleButton] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [depositStatus, setDepositStatus] = useState('');
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showGoButton, setShowGoButton] = useState(false); // Estado para controlar la visibilidad del botón GO
  const [showTestButton, setShowTestButton] = useState(false); // Estado para controlar la visibilidad del botón de prueba
  const [showActionButtons, setShowActionButtons] = useState(false); // Estado para mostrar los botones de acción
  const [showConfirmButton, setShowConfirmButton] = useState(false); // Estado para controlar la visibilidad del botón de confirmar

  const messages = [
    "¡Dato Curioso ! 🌍💡 Los flamencos son rosados porque comen camarones: Sí, su dieta rica en carotenoides, pigmentos que se encuentran en los camarones y otras algas, es lo que les da su color rosado característico",
    "¡Dato Curioso ! 🌍💡 Las abejas pueden reconocer rostros humanos: A pesar de su tamaño diminuto, las abejas pueden procesar patrones complejos y reconocer rostros humanos de manera similar a cómo lo hacemos nosotros.",
    "¡Dato Curioso ! 🌍💡Los pulpos tienen tres corazones: Dos de ellos bombean sangre a las branquias, mientras que el tercero la bombea al resto del cuerpo. Además, su sangre es azul porque contiene cobre en lugar de hierro.",
    "¡Dato Curioso ! 🌍💡Los gusanos de seda no tienen estómago: Son capaces de digerir su propio cuerpo para obtener energía, lo que les permite sobrevivir en condiciones extremas.",
    "¡Dato Curioso ! 🌍💡Los gusanos de seda no tienen estómago: Son capaces de digerir su propio cuerpo para obtener energía, lo que les permite sobrevivir en condiciones extremas.",
  ];

  const [randomMessage, setRandomMessage] = useState(messages[0]);

  const changeMessage = () => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    setRandomMessage(messages[randomIndex]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        setButtonPosition({
          x: buttonPosition.x + gestureState.dx,
          y: buttonPosition.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const panResponderBottomSheet = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 50) {
          setShowBottomSheet(false);
        }
      },
    })
  ).current;

  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
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
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_PLACES_API_KEY,
        },
      });
      if (response.data.results.length > 0) {
        const address = response.data.results[0].formatted_address;
        setCurrentLocation({ latitude, longitude, address });
        setOrigin(address);
        setOriginCoords({ latitude, longitude });
      } else {
        console.log("No se encontraron resultados de geocodificación");
      }
      setLoading(false);
    })();
  }, []);

  const fetchSuggestions = async (query) => {
    if (query.length > 2) {
      setIsSearching(true);
      try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json`, {
          params: {
            input: query,
            key: GOOGLE_PLACES_API_KEY,
            components: 'country:VE',
          },
        });
        setSuggestions(response.data.predictions);
        if (activeField === 'origin' && currentLocation) {
          setSuggestions(prevSuggestions => [
            { description: "Mi Ubicación", place_id: 'current_location' },
            ...prevSuggestions,
          ]);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setSuggestions([]);
      setIsSearching(false);
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
      
      // Verificar si response.data.result existe
      if (response.data.result && response.data.result.geometry) {
        return response.data.result.geometry.location;
      } else {
        console.error("No se encontraron detalles del lugar:", response.data);
        return null; // O manejar el error de otra manera
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectSuggestion = async (description, placeId) => {
    const location = await getPlaceDetails(placeId);
    setSelectedCoords({ latitude: location.lat, longitude: location.lng });
    setRegion({
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    if (activeField === 'origin') {
      setOrigin(description);
      setDestination('');
      setOriginCoords({ latitude: location.lat, longitude: location.lng });
      console.log("Origen seleccionado:", description);
    } else if (activeField === 'destination') {
      setDestination(description);
      setDestinationCoords({ latitude: location.lat, longitude: location.lng });
      console.log("Destino seleccionado:", description);
    }
    setSuggestions([]);
    setIsSearching(false);
  };

  const getRoute = async () => {
    console.log("Origin Coords:", originCoords);
    console.log("Destination Coords:", destinationCoords);
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
      if (response.data.routes.length > 0) {
        const points = response.data.routes[0].legs[0].steps.map(step => {
          return {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          };
        });
        setRoute(points);
        const distance = response.data.routes[0].legs[0].distance.value;
        calculateServicePrices(distance);
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
            longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
            latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.5,
            longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.5,
          }, 1000);
        }
        setShowDirectionModal(false);
        setShowVehicleButton(true);
      } else {
        Alert.alert("Error", "No se pudo encontrar una ruta.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo obtener la ruta. Intenta nuevamente.");
    }
  };

  const calculateServicePrices = (distance) => {
    const basePrices = {
      economico: 2.5,
      confort: 3.0,
      camioneta: 4.0,
    };
    const distanceInKm = distance / 1000;
    const priceMultiplier = 0.41;
    const adjustedPrices = {
      economico: (basePrices.economico + distanceInKm * priceMultiplier).toFixed(2),
      confort: (basePrices.confort + distanceInKm * priceMultiplier).toFixed(2),
      camioneta: (basePrices.camioneta + distanceInKm * priceMultiplier).toFixed(2),
    };
    setServicePrices(adjustedPrices);
    console.log("Precios ajustados:", adjustedPrices);
  };

  const handleVehicleSelection = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowPaymentMethodModal(true);
  };

  const onMarkerDragEnd = (e, type) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (type === 'origin') {
      setOriginCoords({ latitude, longitude });
    } else if (type === 'destination') {
      setDestinationCoords({ latitude, longitude });
    }
  };

  const handleStickerPress = () => {
    setShowDirectionModal(true);
    setShowStickerButton(false);
  };

  const resetState = () => {
    setOrigin('');
    setDestination('');
    setOriginCoords(null);
    setDestinationCoords(null);
    setRoute(null);
    setShowDirectionModal(false);
    setShowVehicleButton(false);
    setShowVehicleModal(false);
    setShowSearchingModal(false);
    setSuggestions([]);
    setServicePrices({});
    setCurrentLocation(null);
    setShowStickerButton(true);
  };

  const handleGetCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permiso de ubicación denegado");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_PLACES_API_KEY,
        },
      });
      if (response.data.results.length > 0) {
        const address = response.data.results[0].formatted_address;
        setCurrentLocation({ latitude, longitude, address });
        setOrigin(address);
        setOriginCoords({ latitude, longitude });
      } else {
        console.log("No se encontraron resultados de geocodificación");
      }
    } catch (error) {
      console.error("Error al obtener la ubicación:", error);
    }
  };

  const confirmLocation = () => {
    if (originCoords && destinationCoords) {
        getRoute(); // Llamar a la función para obtener la ruta
        setShowActionButtons(true); // Mostrar los botones de acción
        setShowConfirmButton(false); // Ocultar el botón de confirmar

        // Ajustar la vista del mapa
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
                longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
                latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 2, // Aumentar el delta para alejar
                longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 2, // Aumentar el delta para alejar
            }, 1000);

            // Aplicar rotación de 180 grados y ajustar la inclinación
            mapRef.current.setCamera({
                heading: 180, // Rotación de 180 grados
                pitch: 50, // Aumentar la inclinación para una vista más "terrestre"
                altitude: 800, // Ajusta la altitud según sea necesario
                zoom: 9, // Ajusta el zoom según sea necesario
                center: {
                    latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
                    longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
                },
            }, 1000);
        }
    } else {
        Alert.alert("Error", "Por favor, asegúrate de que las ubicaciones de origen y destino estén seleccionadas.");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff"/>;
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      {/* Caja de búsqueda en la parte superior */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Dirección de Origen"
          style={styles.input}
          value={origin}
          onChangeText={(text) => {
            setOrigin(text);
            setActiveField('origin');
            fetchSuggestions(text);
          }}
        />
        <TextInput
          placeholder="Dirección de Destino"
          style={styles.input}
          value={destination}
          onChangeText={(text) => {
            setDestination(text);
            setActiveField('destination');
            console.log("Texto de destino:", text);
            fetchSuggestions(text);
            setShowConfirmButton(text.length > 0); // Mostrar el botón si hay texto en la dirección de destino
          }}
        />
      </View>

      {/* Iconos debajo de los cuadros de búsqueda */}
      <View style={styles.iconContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="home" size={30} color="grey" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="briefcase" size={30} color="grey" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="star" size={30} color="grey" />
        </TouchableOpacity>
      </View>

      {/* Lista de sugerencias */}
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

      <TouchableOpacity style={styles.profileButton} onPress={() => setShowProfileModal(true)}>
        <Image 
          source={require('./assets/profile.png')} // Asegúrate de que la ruta de la imagen sea correcta
          style={styles.profileImage} 
        />
      </TouchableOpacity>

      

      

      <MapView ref={mapRef} style={styles.map} region={region}>
        {originCoords && (
          <Marker coordinate={originCoords} title="Origen" pinColor="black"/>
        )}
        {destinationCoords && (
          <Marker coordinate={destinationCoords} title="Destino" pinColor="fuchsia"/>
        )}
        {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue"/>}
      </MapView>

      {showActionButtons && ( // Mostrar botones de acción si showActionButtons es true
        <View style={styles.actionButtonsContainer}>
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity style={styles.imageButton}>
              <Image source={require('./assets/1.png')} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton}>
              <Image source={require('./assets/2.png')} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton}>
              <Image source={require('./assets/3.png')} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton}>
              <Image source={require('./assets/4.png')} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton}>
              <Image source={require('./assets/5.png')} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton}>
              <Image source={require('./assets/6.png')} style={styles.image} />
            </TouchableOpacity>
          </View>

          {/* Botones Aceptar y Cancelar */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.acceptButton}>
              <Text style={styles.buttonText}>Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* {showStickerButton && ( // Comentado para ocultar el botón de sticker
        <TouchableOpacity onPress={handleStickerPress} style={styles.stickerButton}>
          <Image source={require('./assets/tocame.gif')} style={styles.stickerImage}/>
        </TouchableOpacity>
      )} */}
      <Modal visible={showDirectionModal} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => {
          setShowDirectionModal(false);
          setShowStickerButton(false);
        }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <View style={styles.inputContainer}>
                <View style={styles.pointWhite}/>
                <TextInput
                  placeholder="Dirección de Origen"
                  style={styles.input}
                  value={origin}
                  onChangeText={(text) => {
                    setOrigin(text);
                    setActiveField('origin');
                    console.log("Texto de origen:", text);
                    fetchSuggestions(text);
                  }}/>
                {origin.length > 0 && (
                  <TouchableOpacity onPress={() => setOrigin('')} style={styles.closeButton}>
                    <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.radarButton}>
                  <Image source={require('./assets/radar.png')} style={styles.radarImage}/>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <View style={styles.pointFuchsia}/>
                <TextInput
                  placeholder="Dirección de Destino"
                  style={styles.input}
                  value={destination}
                  onChangeText={(text) => {
                    setDestination(text);
                    setActiveField('destination');
                    console.log("Texto de destino:", text);
                    fetchSuggestions(text);
                  }}/>
                {destination.length > 0 && (
                  <TouchableOpacity onPress={() => setDestination('')} style={styles.closeButton}>
                    <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
                  </TouchableOpacity>
                )}
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
                    )}/>
                </View>
              )}
              <TouchableOpacity style={styles.goButton} onPress={() => {
                console.log("Antes de llamar a getRoute, Origin Coords:", originCoords);
                console.log("Destination Coords:", destinationCoords);
                getRoute();
              }}>
                <Text style={styles.goButtonText}>Buscar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal visible={showVehicleModal} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setShowVehicleModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.vehicleModal}>
              <Text style={styles.modalTitle}>Selecciona un tipo de vehículo</Text>
              {originCoords && destinationCoords && route && (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: (originCoords.latitude + destinationCoords.latitude) / 2 - 0.01, // Desplaza el centro hacia arriba
                    longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
                    latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 2.5, // Aumenta el valor para alejar más
                    longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 2, // Aumenta el valor para alejar
                  }}
                  customMapStyle={mapStyle} // Aplica el estilo personalizado
                >
                  <Marker coordinate={originCoords} title="Origen" pinColor="black"/>
                  <Marker coordinate={destinationCoords} title="Destino" pinColor="fuchsia"/>
                  <Polyline coordinates={route} strokeWidth={4} strokeColor="blue"/>
                </MapView>
              )}
              <View style={styles.vehicleOptionsContainer}>
                <TouchableOpacity 
                  style={styles.vehicleOption} 
                  onPress={() => {
                    setSelectedVehicle('economico');
                  }}>
                  <Image source={require('./assets/migo.png')} style={styles.vehicleImage}/> 
                  <Text style={[styles.vehicleText, selectedVehicle === 'economico' && { color: 'fuchsia' }]}>
                    Económico
                  </Text>
                  <Text style={[styles.vehicleText1, selectedVehicle === 'economico' && { color: 'fuchsia' }]}>
                      ${servicePrices.economico || 2.5}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.vehicleOption} 
                  onPress={() => {
                    setSelectedVehicle('confort');
                  }}>
                  <Image source={require('./assets/top.png')} style={styles.vehicleImage}/> 
                  <Text style={[styles.vehicleText, selectedVehicle === 'confort' && { color: 'fuchsia' }]}>
                    Confort - ${servicePrices.confort || 3.0}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider}/>
              <View style={styles.vehicleOptionsContainer}>
                <TouchableOpacity 
                  style={styles.vehicleOption} 
                  onPress={() => {
                    setSelectedVehicle('camioneta');
                  }}>
                  <Image source={require('./assets/top.png')} style={styles.vehicleImage}/>
                  <Text style={[styles.vehicleText, selectedVehicle === 'camioneta' && { color: 'fuchsia' }]}>
                    Camioneta - ${servicePrices.camioneta || 4.0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.vehicleOption} 
                  onPress={() => {
                    setSelectedVehicle('moto');
                  }}>
                  <Image source={require('./assets/mascota.gif')} style={styles.vehicleImage}/> 
                  <Text style={[styles.vehicleText, selectedVehicle === 'moto' && { color: 'fuchsia' }]}>
                    Moto - $1.0
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.continueButton, { opacity: selectedVehicle ? 1 : 0.5 }]} 
                onPress={() => {
                  if (selectedVehicle) {
                    setShowPaymentMethodModal(true);
                    setShowVehicleModal(false);
                  }
                }}
                disabled={!selectedVehicle}
              >
                <Text style={styles.continueButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal visible={showSearchingModal} transparent={true}>
        <View style={styles.searchingModal}>
          <Image source={require('./assets/migo.png')} style={styles.logoImage}/>
          <Text style={styles.searchingText}>Buscando conductor más cercano...</Text>
          <Image source={require('./assets/mascota.gif')} style={styles.searchingImage}/>
          <TouchableOpacity style={styles.cancelButton} onPress={() => {
            setShowSearchingModal(false);
          }}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {selectedCoords && (
        <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation}>
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      )}
      {showBottomSheet && (
        <View style={styles.bottomSheet} {...panResponderBottomSheet.panHandlers}>
          <View style={styles.inputContainer}>
            <View style={styles.pointWhite}/>
            <TextInput
              placeholder="Dirección de Origen"
              style={styles.input}
              value={origin}
              onChangeText={(text) => {
                setOrigin(text);
                setActiveField('origin');
                fetchSuggestions(text);
              }}/>
            {origin.length > 0 && (
              <TouchableOpacity onPress={() => setOrigin('')} style={styles.closeButton}>
                <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.pointFuchsia}/>
            <TextInput
              placeholder="Dirección de Destino"
              style={styles.input}
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                setActiveField('destination');
                fetchSuggestions(text);
              }}/>
            {destination.length > 0 && (
              <TouchableOpacity onPress={() => setDestination('')} style={styles.closeButton}>
                <Text style={{ color: 'red', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            )}
          </View>
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => {
                  if (activeField === 'origin') {
                    setOrigin(item.description);
                  } else if (activeField === 'destination') {
                    setDestination(item.description);
                  }
                  setSuggestions([]); 
                }}>
                  <Text style={styles.suggestionText}>{item.description}</Text>
                </TouchableOpacity>
              )}/>
          )}
          {origin.length > 0 && destination.length > 0 && (
            <TouchableOpacity style={styles.goButton} onPress={getRoute}>
              <Text style={styles.goButtonText}>Buscar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Modal visible={showRouteModal} animationType="slide">
        <View style={styles.modalContainer}>
          {originCoords && destinationCoords && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: (originCoords.latitude + destinationCoords.latitude) / 2,
                longitude: (originCoords.longitude + destinationCoords.longitude) / 2,
                latitudeDelta: Math.abs(originCoords.latitude - destinationCoords.latitude) * 1.5,
                longitudeDelta: Math.abs(originCoords.longitude - destinationCoords.longitude) * 1.5,
              }}>
              <Marker coordinate={originCoords} title="Origen" pinColor="black"/>
              <Marker coordinate={destinationCoords} title="Destino" pinColor="fuchsia" />
              {route && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue"/>}
            </MapView>
          )}
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowRouteModal(false)}>
            <Text style={styles.closeModalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      
      
      {showGoButton && ( // Mostrar el botón GO si showGoButton es true
        <TouchableOpacity style={styles.vehicleButton} onPress={() => {
          setShowVehicleModal(true); // Mostrar el modal de vehículos al presionar GO
          setShowGoButton(false); // Ocultar el botón GO después de presionar
        }}>
          <Text style={styles.vehicleButtonText}>GO</Text>
        </TouchableOpacity>
      )}
      <Modal visible={showProfileModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Image source={require('./assets/gogo.gif')} style={styles.profileImage}/>
            <Text style={styles.modalTitle}>Nombre del Usuario</Text>
            <Text style={styles.modalText}>Correo: usuario@example.com</Text>
            <Text style={styles.modalText}>Teléfono: +123456789</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={() => setShowPaymentForm(true)}>
              <Text style={styles.reloadButtonText}>Recargar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowProfileModal(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {activeField !== 'destination' && ( // Ocultar mensajes aleatorios si el campo activo es 'destination'
        <TouchableOpacity style={styles.roundButton} onPress={() => { changeMessage(); }}>
          <Text style={styles.roundButtonText}>{randomMessage}</Text>
        </TouchableOpacity>
      )}
      {showPaymentForm && (
        <Modal visible={showPaymentForm} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.paymentModal}>
              <Text style={styles.modalTitle}>Formulario de Pago</Text>
              <TextInput
                placeholder="Monto en $"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}/>
              <TextInput
                placeholder="Referencia Bancaria"
                value={bankReference}
                onChangeText={setBankReference}
                style={styles.input}/>
              <TouchableOpacity style={styles.submitButton} onPress={() => {
                setDepositStatus('Su depósito fue enviado exitosamente.');
                setAmount(''); 
                setBankReference(''); 
                setShowPaymentForm(false);
              }}>
                <Text style={styles.submitButtonText}>Enviar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowPaymentForm(false)}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
              {depositStatus && <Text style={styles.depositStatus}>{depositStatus}</Text>}
            </View>
          </View>
        </Modal>
      )}
      {showPaymentMethodModal && (
        <Modal visible={showPaymentMethodModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.paymentMethodModal}>
              <Text style={styles.modalTitle}>Selecciona un medio de pago</Text>
              <TouchableOpacity style={styles.paymentOption} onPress={() => {
                setShowPaymentMethodModal(false); 
                setShowVehicleModal(false); 
                setShowSearchingModal(true); 
              }}>
                <Text style={styles.paymentText}>Billetera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentOption} onPress={() => {
                setShowPaymentMethodModal(false); 
                setShowVehicleModal(false); 
                setShowSearchingModal(true); 
              }}>
                <Text style={styles.paymentText}>Pago Móvil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentOption} onPress={() => {
                setShowPaymentMethodModal(false); 
                setShowVehicleModal(false); 
                setShowSearchingModal(true); 
              }}>
                <Text style={styles.paymentText}>Efectivo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowPaymentMethodModal(false)}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {showTestButton && ( // Mostrar el botón de prueba solo si showTestButton es true
        <TouchableOpacity style={styles.openButton} onPress={() => setShowBottomSheet(true)}>
          <Text style={styles.openButtonText}>Prueba</Text>
        </TouchableOpacity>
      )}
      {showConfirmButton && ( // Mostrar el botón de confirmar si showConfirmButton es true
        <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation}>
          <Text style={styles.confirmButtonText}>Confirmar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', 
  },
  map: {
    flex: 1, 
    marginTop: 100, // Ajusta el margen superior para que no se superponga con la caja de búsqueda
  },
  searchBox: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Fondo blanco semitransparente
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    zIndex: 1, // Asegúrate de que esté por encima del mapa
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
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 5,
    padding: 10,
    elevation: 5,
    zIndex: 1,
  },
  movableButton: {
    position: 'absolute',
    backgroundColor: '#cb2daa',
    padding: 10,
    borderRadius: 50,
    elevation: 5,
    width: 200, 
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '98%',
    maxHeight: '30%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 5,
    marginBottom: 1,
  },
  pointWhite: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    marginRight: 10,
  },
  pointFuchsia: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'fuchsia',
    marginRight: 10,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 12,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  suggestionBox: {
    position: 'absolute',
    top: 190, // Ajusta según la altura de la caja de búsqueda
    left: 80,
    right: 20,
    backgroundColor: 'rgba(244, 6, 129, 0.9)',
    borderRadius: 10,
    elevation: 5,
    maxHeight: 200, // Limitar la altura de la lista de sugerencias
    zIndex: 1,
  },
  suggestionText: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    fontSize: 14,
    color: 'white',
  },
  goButton: {
    backgroundColor: '#cb2daa',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
  },
  goButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  confirmButton: {
    backgroundColor: '#cb2daa',
    padding: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: 180,
    left: '50%',
    transform: [{ translateX: -50 }],
    width: '30%',
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  vehicleModal: {
    width: '100%', // Ancho completo
    height: '180%', // Cambiado a la mitad de la pantalla
    justifyContent: 'absolute', // Centrar contenido verticalmente
    top: '-39%',
    alignItems: 'center', // Centrar contenido horizontalmente
    backgroundColor: 'rgba(244, 6, 129, 0.1)', // Fondo semitransparente
    borderRadius: 31,
    padding: 0,
    elevation: 0,
  },
  modalTitle: {
    fontSize: 50,
    marginBottom: 30,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  vehicleOption: {
    width: '151%',
    height: '90%',
    top: '-33%',
    flexDirection: 'column', // Cambiado a 'column' para que los elementos se alineen verticalmente
    alignItems: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderRadius: 25,
    padding: 1,
    marginVertical: 10,
    width: '47%',
    elevation: 5, // Controla la sombra en Android
    shadowColor: '#cb2daa', // Color de la sombra en iOS
    shadowOffset: {
        width: 0, // Desplazamiento horizontal
        height: 1, // Desplazamiento vertical
    },
    shadowOpacity: 0.55, // Opacidad de la sombra
    shadowRadius: 1.5, // Radio de la sombra
},
  vehicleImage: {
    width: 60,
    height: 60,
    top: 10,
    left: 20,
    right: 10,
    bottom: 10,
    marginRight: 1,
    marginTop: 5,
    marginBottom: 12,
  },
  vehicleText: {
    fontSize: 12, // Aumenta el tamaño de la fuente si es necesario
    color: 'white', // Cambia el color a azul (o el que prefieras)
    textAlign: 'center',
  },
  vehicleText1: {
      fontSize: 16, // Aumenta el tamaño de la fuente si es necesario
      color: 'white', // Cambia el color a azul (o el que prefieras)
      textAlign: 'center'
  },
  searchingModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 6, 129, 0.5)',
    padding: 20,
  },
  searchingText: {
    fontSize: 34,
    color: 'white',
    marginBottom: 20,
  },
  searchingImage: {
    width: 200,
    height: 200,
  },
  stickerButton: {
    position: 'absolute',
    bottom: 10,
    right: 80,
  },
  stickerImage: {
    width: 220,
    height: 400,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '80%',
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    zIndex: 0,
  },
  openButton: {
    position: 'absolute',
    bottom: 400,
    left: '60%',
    transform: [{ translateX: 100 }],
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    zIndex: 1,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  closeModalButton: {
    position: 'absolute',
    top: 350,
    right: 150,
    backgroundColor: 'rgba(244, 6, 129, 0.8)',
    borderRadius: 5,
    padding: 10,
    elevation: 3,
  },
  closeModalButtonText: {
    color: '#000',
    fontSize: 16,
  },
  radarButton: {
    marginLeft: 10,
  },
  radarImage: {
    width: 30,
    height: 30,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  vehicleButton: {
    position: 'absolute',
    bottom: 340,
    left: '60%',
    transform: [{ translateX: -70 }],
    backgroundColor: '#cb2daa',
    padding: 10,
    borderRadius: 25,
  },
  vehicleButtonText: {
    color: 'white',
    fontSize: 50,
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  redButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
    zIndex: 1,
  },
  redButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 5,
  },
  reloadButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  balanceContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 5,
    padding: 10,
    elevation: 5,
    zIndex: 2,
  },
  balanceText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
  },
  paymentModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
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
    width: '100%',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  depositStatus: {
    marginTop: 10,
    color: 'green',
    fontSize: 16,
  },
  paymentMethodModal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  paymentOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  paymentText: {
    fontSize: 16,
    textAlign: 'center',
  },
  vehicleOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Cambiado para que haya menos espacio
    width: '70%',
    marginVertical: 5,
  },
  map: {
    width: '100%',
    height: '100%', // Ajusta la altura según sea necesario
    marginBottom: -390, // Espacio entre el mapa y las opciones de vehículo
    top: '0%',
    left: '0%',
    right: '0%',
    bottom: '0%',


    borderRadius: 10,
  },
  divider: {
    height: 0, // Altura de la división
    backgroundColor: '#ccc', // Color de la división
    marginVertical: 0, // Espacio vertical alrededor de la división
    width: '50%', // Ancho completo
  },
  separator: {
    height: 0, // Altura de la separación
    backgroundColor: '#ccc', // Color de la separación
    width: '100%', // Ancho completo
    marginVertical: 1, // Espacio vertical alrededor de la separación
  },
  continueButton: {
    backgroundColor: '#cb2daa', // Color de fondo del botón
    padding: 15,
    borderRadius: 10,
    marginTop: -80,
    alignItems: 'center',
    width: '50%', // Ancho del botón
    alignSelf: 'center', // Centrar el botón
  },
  continueButtonText: {
    color: '#ffffff', // Color del texto
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchBox: {
    position: 'absolute',
    top: 30,
    left: 80,
    right: 20,
    backgroundColor: 'rgba(244, 6, 129, 0.7)',
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    zIndex: 1,
  },
  input: {
      height: 50,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 15,
      fontSize: 12,
      color: '#000',
      backgroundColor: '#FFFFFF',
      marginBottom: 10,
      zIndex: 1,
  },
  roundButton: {
    position: 'absolute',
    bottom: 30,
    left: 3,
    width: '99%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 25, // Semi redondo
    elevation: 1,
  },
  roundButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  profileButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'transparent', // Fondo transparente
    borderRadius: 50, // Para hacer el botón redondo
    elevation: 5,
    zIndex: 1,
  },
  profileImage: {
    width: 60, // Ajusta el tamaño según sea necesario
    height: 60, // Ajusta el tamaño según sea necesario
    borderRadius: 25, // Para hacer la imagen redonda
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: '10%',
    transform: [{ translateX: -50 }],
    alignItems: 'center',
    width: '100%',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Permite que los botones se envuelvan en varias filas
    justifyContent: 'space-between', // Distribuye el espacio entre los botones
    width: '100%', // Asegúrate de que ocupe el ancho completo
    marginBottom: 12,
    paddingHorizontal: 20, // Espacio lateral
  },
  imageButton: {
    width: '30%', // Ajusta el ancho para que quepan tres en la fila
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  image: {
    width: 90,
    height: 90,
  },
  confirmCancelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  confirmButton1: {
    backgroundColor: '#4CAF50', // Color verde
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
    top: -1,
    left: 100,
  },
  cancelButton: {
    backgroundColor: '#f44336', // Color rojo
    padding: 10,
    borderRadius: 5,
    width: '50%',
    alignItems: 'center',
    top: -10,
    left: 130,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  confirmButton: {
    position: 'absolute',
    bottom: '38%', // Ajusta la posición vertical según sea necesario
    left: '45%',
    transform: [{ translateX: -50 }], // Centrar horizontalmente
    backgroundColor: '#cb2daa', // Color de fondo del botón
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 160,
    left: 85,
    right: 100,
    zIndex: 1,
  },
  iconButton: {
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
  },
  acceptButton: {
    backgroundColor: '#4CAF50', // Color verde
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336', // Color rojo
    padding: 10,
    borderRadius: 5,
    width: '40%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default MapComponent;