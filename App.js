import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  // Programma açylanda diňe rugsat soraýarys (Kordinata alman)
  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
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

      // Iň durnukly GPS soragy
      let pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setLocation({ latitude, longitude });

      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = `YOLBELET: Menin yerim: ${mapUrl}`;

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

  // 1. GIRIŞ EKRANY (Siz barada maglumat)
  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Ýolbelet</Text>
          <Text style={styles.text}>
            Salam! Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meňli Aşyrowa Altyýewna</Text>.
            Bu programma ýolda kynçylyga uçranlara çalt kömek bermek üçin döredildi.
          </Text>
        </View>
        <TouchableOpacity style={styles.mainButton} onPress={() => setIsReady(true)}>
          <Text style={styles.buttonText}>DOWAM ET</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. KARTA EKRANY (Iň sada görnüş)
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 37.96,
          longitude: 58.32,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {location && <Marker coordinate={location} title="Men şu ýerde" />}
      </MapView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.sendButton} onPress={handleAction}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 20, elevation: 5, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1d3557', marginBottom: 15, textAlign: 'center' },
  text: { fontSize: 18, color: '#333', lineHeight: 28, textAlign: 'center' },
  mainButton: { backgroundColor: '#e63946', padding: 20, borderRadius: 15, alignItems: 'center' },
  sendButton: { backgroundColor: '#e63946', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  bottomBar: { position: 'absolute', bottom: 40, left: 20, right: 20 }
});
