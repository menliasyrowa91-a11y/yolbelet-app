import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
      }
    })();
  }, []);

  const handleAction = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Rugsat", "GPS rugsatyny bermeli.");
        setLoading(false);
        return;
      }

      let pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setLocation({ latitude, longitude });

      // Siziň öňki ulanan takyk link formatyňyz:
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
      } else {
        await Share.share({ message: messageBody });
      }
    } catch (e) {
      Alert.alert("Ýalňyşlyk", "GPS maglumatyny alyp bolmady.");
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>📍 Ýolbelet</Text>
          <Text style={styles.text}>
            Salam! Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meňli Aşyrowa Altyýewna</Text>.
            Bu programma ýolda kynçylyga uçranlara çalt kömek bermek üçin döredildi.
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={() => {
            if (!permissionGranted) {
              Alert.alert("Rugsat gerek", "Dowam etmek üçin GPS rugsatyny tassyklamaly.");
            } else {
              setIsReady(true);
            }
          }}
        >
          <Text style={styles.buttonText}>DOWAM ET</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: location?.latitude || 37.96,
          longitude: location?.longitude || 58.32,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {location && <Marker coordinate={location} title="Men şu ýerde" />}
      </MapView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={handleAction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#1d3557', justifyContent: 'center', padding: 25 },
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 25, elevation: 10, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1d3557', marginBottom: 20, textAlign: 'center' },
  text: { fontSize: 18, color: '#333', lineHeight: 28, textAlign: 'center' },
  mainButton: { backgroundColor: '#e63946', padding: 22, borderRadius: 15, alignItems: 'center' },
  sendButton: { backgroundColor: '#e63946', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  bottomBar: { position: 'absolute', bottom: 50, left: 20, right: 20 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height }
});
