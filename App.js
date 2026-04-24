import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Dimensions, Platform, Linking, Image } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]); 
  const [savedPoint, setSavedPoint] = useState(null); 
  const mapRef = useRef(null);

  // Programma açylanda GPS-i we ýatdaky nokady barlaýar
  useEffect(() => {
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus("GPS rugsady ýok");
        return;
      }

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // Her 5 metrden täzeleýär
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          const newPoint = { latitude, longitude };
          setLocation(newPoint);
          setRouteCoordinates((prev) => [...prev, newPoint]);
        }
      );
    })();
  }, []);

  // Ýerleşýän ýeri SMS ýa-da beýleki programmalarda paýlaşmak
  const shareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");

    try {
      const { latitude, longitude } = location;
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`; // Siziň işleýän linkiňiz
      const messageBody = `📍 ÝOLBELET: Men häzir şu ýerde. Kömek gerek bolsa, kordinatlam: ${mapUrl}`;

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
      setStatus("Näsazlyk ýüze çykdy");
    } finally {
      setLoading(false);
    }
  };

  // Häzirki duran nokadyňyzy ýatda saklaýar (A nokady)
  const freezeLocation = async () => {
    if (location) {
      await AsyncStorage.setItem('saved_point', JSON.stringify(location));
      setSavedPoint(location);
      Alert.alert("Nokat Saklandy", "Siziň başlangyç nokadyňyz ýatda saklandy.");
    } else {
      Alert.alert("Hata", "GPS kordinatalaryňyz tapylmady.");
    }
  };

  // Ýatda saklanan nokada tarap Google Maps-da ýol görkezýär
  const goToSavedPoint = () => {
    if (!savedPoint) {
      Alert.alert("Nokat ýok", "Ilki başlangyç nokadyňyzy saklamaly.");
      return;
    }
    const url = `https://Maps.google.com/?q=${savedPoint.latitude},${savedPoint.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert("Hata", "Karta açylmady."));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Bölümi */}
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Siziň ynamdar syýahat hemraňyz</Text>
      </View>

      {/* Karta Bölümi */}
      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          followsUserLocation={true}
          initialRegion={{
            latitude: location ? location.latitude : 37.95,
            longitude: location ? location.longitude : 58.38,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Ýöreýän ýoluňyzy çyzýar */}
          <Polyline coordinates={routeCoordinates} strokeColor="#1d3557" strokeWidth={5} />
          
          {/* Ýatda saklanan nokat */}
          {savedPoint && (
            <Marker coordinate={savedPoint} pinColor="#e63946" title="Siziň başlangyç nokadyňyz" />
          )}
          
          {/* Başlangyç nokat bilen häzirki ýeriňiz arasyndaky gönümel çyzyk */}
          {savedPoint && location && (
            <Polyline 
              coordinates={[location, savedPoint]} 
              strokeColor="#ffb703" 
              strokeWidth={3} 
              lineDashPattern={[10, 10]} 
            />
          )}
        </MapView>
      </View>

      {/* Programma Barada Maglumat (Doly we Giňişleýin) */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutHeader}>Programmanyň Manysy we Maksady:</Text>
        <Text style={styles.aboutText}>
          Salam! Men <Text style={styles.highlightText}>Meňli Aşyrowa Altyýewna</Text>.
          {"\n\n"}
          "Ýolbelet" programmasynyň esasy maksady — azaşan ulanyjylaryň başlangyç nokadyna (öýine, ulagyna ýa-da lagerine) durnukly dolanmagyny üpjün etmekdir. 
          {"\n\n"}
          <Text style={{fontWeight: 'bold'}}>Esasy aýratynlyklary:</Text>
          {"\n"}• <Text style={{fontWeight: '600'}}>Nokady Doňdur:</Text> Başlangyç nokadyňyzyň kordinatalaryny ýatda saklaýar.
          {"\n"}• <Text style={{fontWeight: '600'}}>Yzyna Ýol:</Text> Hatda azaşsaňyz-da, sizi başlangyç nokadyňyza tarap gönükdirýär.
          {"\n"}• <Text style={{fontWeight: '600'}}>Howpsuzlyk:</Text> Zerur ýagdaýda öz kordinatalaryňyzy ýakynlaryňyza SMS arkaly dessine ugradyp bilersiňiz.
        </Text>
      </View>

      {/* Düwmeler Bölümi */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={[styles.button, styles.btnBlue]} onPress={freezeLocation}>
          <Text style={styles.buttonText}>📍 BAŞLANGYÇ NOKADY SAKLA</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, {backgroundColor: savedPoint ? '#457b9d' : '#ccc', marginBottom: 12}]} 
          onPress={goToSavedPoint}
          disabled={!savedPoint}
        >
          <Text style={styles.buttonText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={shareLocation}>
            <Text style={styles.buttonText}>✉️ ÝERIMI SMS BILEN UGRAT</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Meňli</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', paddingVertical: 40, paddingHorizontal: 20 },
  header: { marginBottom: 20, alignItems: 'center' },
  logoText: { fontSize: 32, fontWeight: '900', color: '#1d3557' },
  subTitle: { fontSize: 14, color: '#457b9d', textAlign: 'center' },
  mapCard: { height: 320, width: '100%', borderRadius: 25, overflow: 'hidden', marginBottom: 20, elevation: 6, borderWidth: 2, borderColor: '#1d3557' },
  map: { flex: 1 },
  aboutCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 20, width: '100%', elevation: 4, marginBottom: 25 },
  aboutHeader: { fontSize: 18, fontWeight: 'bold', color: '#1d3557', marginBottom: 10 },
  aboutText: { fontSize: 14, color: '#444', lineHeight: 22, textAlign: 'justify' },
  highlightText: { fontWeight: 'bold', color: '#e63946' },
  actionSection: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#e63946', paddingVertical: 18, borderRadius: 15, width: '95%', alignItems: 'center', elevation: 5, marginBottom: 12 },
  btnBlue: { backgroundColor: '#1d3557' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  statusText: { marginTop: 10, color: '#457b9d', fontSize: 13, fontWeight: '600' },
  footerText: { marginTop: 30, color: '#a8dadc', fontSize: 12, textAlign: 'center' },
});
