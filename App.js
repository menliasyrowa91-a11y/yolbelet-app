import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Marker, Polyline } from 'react-native-maps'; // PROVIDER_GOOGLE aýryldy
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [savedPoint, setSavedPoint] = useState(null); 
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Rugsat", "Karta we GPS üçin rugsat gerek.");
        return;
      }

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, 
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          const newCoord = { latitude, longitude };
          setCurrentLocation(newCoord);
          setRouteCoordinates((prev) => [...prev, newCoord]); 
        }
      );

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));
    })();
  }, []);

  const freezePoint = async () => {
    if (!currentLocation) {
      Alert.alert("Garaşyň", "GPS heniz anyklanmady.");
      return;
    }
    try {
      await AsyncStorage.setItem('saved_point', JSON.stringify(currentLocation));
      setSavedPoint(currentLocation);
      Alert.alert("Nokat Doňduryldy", "Siziň häzirki ýeriňiz ýatda saklandy.");
    } catch (e) {
      Alert.alert("Ýalňyşlyk", "Ýatda saklap bolmady.");
    }
  };

  const shareLocation = async () => {
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      // DOGRY WE IŞLEÝÄN LINK FORMATY (TM CELL ÜÇIN):
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS taýýarlandy");
      } else {
        await Share.share({ message: messageBody });
        setStatus("Paýlaşyldy");
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "GPS maglumatyny alyp bolmady.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: 37.96,
          longitude: 58.32,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Polyline coordinates={routeCoordinates} strokeWidth={5} strokeColor="#e63946" />
        {savedPoint && (
          <Marker coordinate={savedPoint} title="Doňdurlan Nokat" pinColor="blue" />
        )}
      </MapView>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>📍 ÝOLBELET</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.button, {backgroundColor: '#457b9d'}]} onPress={freezePoint}>
            <Text style={styles.buttonText}>❄️ NOKADY DOŇDUR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, {marginTop: 10}]} onPress={shareLocation}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, {backgroundColor: '#1d3557', marginTop: 10}]} 
            onPress={() => {
              const target = savedPoint || currentLocation;
              if (target) {
                mapRef.current?.animateToRegion({
                  latitude: target.latitude,
                  longitude: target.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }, 1000);
              }
            }}
          >
            <Text style={styles.buttonText}>🔄 MENI YZMA DOLA</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            Düzüji: <Text style={{fontWeight: 'bold'}}>Meñli Aşyrowa</Text>. 
            Gelen ýoluňyz karta çyzylýar. Doňdurlan nokadyňyz gök reňk bilen görkezilýär.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.4,
  },
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: { alignItems: 'center', marginBottom: 20 },
  logoText: { fontSize: 28, fontWeight: '900', color: '#1d3557' },
  statusText: { color: '#457b9d', fontSize: 14 },
  actionSection: { width: '100%', marginBottom: 20 },
  button: {
    backgroundColor: '#e63946',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  aboutCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 1 },
  aboutText: { fontSize: 13, color: '#333', textAlign: 'center' },
});
