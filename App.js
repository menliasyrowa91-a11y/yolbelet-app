import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Linking } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const [storageNote, setStorageNote] = useState("");

  useEffect(() => {
    checkMemory();
  }, []);

  const checkMemory = async () => {
    try {
      const free = await FileSystem.getFreeDiskStorageAsync();
      const mb = Math.round(free / (1024 * 1024));
      const days = mb > 100 ? "3-4 hepde" : "1 hepde";
      setStorageNote(`Ýat: ${mb}MB boş. Karta keşleri ${days} saklanar.`);
    } catch (e) {
      setStorageNote("Ýat maglumaty alynmady.");
    }
  };

  const shareLocation = async () => {
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");
    try {
      let { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        Alert.alert("Rugsat ýok", "GPS rugsady berilmese ýerňizi anyklap bolmaýar.");
        return;
      }

      // "High" ýerine "Balanced" ulanmak has çalt we durnukly netije berýär
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      
      const mapUrl = `https://Maps.google.com/?q=${latitude},${longitude}`;
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
      Alert.alert("GPS Hatasy", "Ýerleşýän ýeriňizi anyklap bolmady. GPS-iňiz açykmy?");
    } finally {
      setLoading(false);
    }
  };

  const savePointA = async () => {
    setLoading(true);
    try {
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setSavedLocation(loc.coords);
      Alert.alert("Üstünlikli", "A nokady (başlangyç) ýatda saklandy!");
      setStatus("A nokady saklandy");
    } catch (e) {
      Alert.alert("Hata", "Nokady saklap bolmady.");
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE} 
        initialRegion={{
          latitude: 37.95,
          longitude: 58.38,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <UrlTile 
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />
        {savedLocation && <Marker coordinate={savedLocation} title="A Nokady" pinColor="blue" />}
      </MapView>

      <ScrollView style={styles.content}>
        <Text style={styles.logo}>📍 ÝOLBELET</Text>
        <Text style={styles.memoryText}>{storageNote}</Text>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Maglumat:</Text>
          <Text style={styles.helpTxt}>• Ýerimi ugrat: GPS koordinatyňyzy paýlaşar.</Text>
          <Text style={styles.helpTxt}>• Nokady sakla: Häzirki ýeriňizi "A nokady" hökmünde ýatda saklar.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <View style={{gap: 10}}>
            <TouchableOpacity style={styles.btnRed} onPress={shareLocation}>
              <Text style={styles.btnText}>📍 ÝERIMI UGRAT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnDark} onPress={savePointA}>
              <Text style={styles.btnText}>💾 NOKADY ÝATDA SAKLA</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnBlue, {opacity: savedLocation ? 1 : 0.5}]}
              onPress={() => {
                if(savedLocation) {
                  const url = `https://Maps.google.com/?q=${savedLocation.latitude},${savedLocation.longitude}`;
                  Linking.openURL(url);
                }
              }}
              disabled={!savedLocation}
            >
              <Text style={styles.btnText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.footer}>© 2026 Düzüji: Meňli Aşyrowa</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  map: { height: '40%', width: '100%' },
  content: { padding: 20 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#1d3557', textAlign: 'center' },
  memoryText: { fontSize: 10, color: '#666', textAlign: 'center', marginBottom: 15 },
  helpCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 3 },
  helpTitle: { fontWeight: 'bold', marginBottom: 5, color: '#1d3557' },
  helpTxt: { fontSize: 12, color: '#444', marginBottom: 3 },
  btnRed: { backgroundColor: '#e63946', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnDark: { backgroundColor: '#1d3557', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnBlue: { backgroundColor: '#457b9d', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  status: { textAlign: 'center', marginTop: 10, color: '#457b9d' },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 10, color: '#aaa' }
});
