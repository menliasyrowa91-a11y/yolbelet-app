import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Linking, Dimensions } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const [currentRegion, setCurrentRegion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const storedPoint = await AsyncStorage.getItem('saved_point_a');
      if (storedPoint) setSavedLocation(JSON.parse(storedPoint));

      let loc = await Location.getCurrentPositionAsync({});
      setCurrentRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // SENIŇ ORIGINAL SMS FUNKSIÝAŇ (Üýtgetmesiz)
  const shareLocation = async () => {
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      
      // SENIŇ TEKSTIŇ WE LINKIŇ:
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

  const savePointA = async () => {
    setLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setSavedLocation(location.coords);
      await AsyncStorage.setItem('saved_point_a', JSON.stringify(location.coords));
      Alert.alert("Success", "A nokady ýatda saklandy!");
    } catch (error) {
      Alert.alert("Hata", "Nokady saklap bolmady.");
    } finally {
      setLoading(false);
    }
  };

  const goToSavedPoint = () => {
    if (!savedLocation) return;
    const url = `google.navigation:q=${savedLocation.latitude},${savedLocation.longitude}&mode=w`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.mapContainer}>
        {currentRegion && (
          <MapView 
            style={styles.map} 
            initialRegion={currentRegion}
            showsUserLocation={true}
            mapType="none"
          >
            <UrlTile 
              urlTemplate="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
              maximumZ={19} 
            />
            {savedLocation && (
              <Marker coordinate={savedLocation} pinColor="#e63946" />
            )}
          </MapView>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        </View>

        <View style={styles.actionSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#e63946" />
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={shareLocation}>
                <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, {backgroundColor: '#1d3557'}]} onPress={savePointA}>
                <Text style={styles.buttonText}>💾 NOKADY ÝATDA SAKLA</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, {backgroundColor: savedLocation ? '#457b9d' : '#ccc'}]} 
                onPress={goToSavedPoint}
                disabled={!savedLocation}
              >
                <Text style={styles.buttonText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.statusText}>{status}</Text>
        </View>
        <Text style={styles.footerText}>© 2026 Düzüji: Aşyrowa Meňli Altyýewna</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  mapContainer: { height: Dimensions.get('window').height * 0.35, width: '100%' },
  map: { ...StyleSheet.absoluteFillObject },
  scrollContainer: { padding: 20, alignItems: 'center' },
  header: { marginBottom: 20 },
  logoText: { fontSize: 32, fontWeight: '900', color: '#1d3557' },
  actionSection: { width: '100%' },
  button: { backgroundColor: '#e63946', padding: 18, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusText: { marginTop: 10, color: '#457b9d' },
  footerText: { marginTop: 20, fontSize: 10, color: '#999' }
});
