import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [savedPoint, setSavedPoint] = useState(null);

  useEffect(() => {
    (async () => {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus("GPS rugsady ýok");
        return;
      }

      const storedPoint = await AsyncStorage.getItem('saved_point');
      if (storedPoint) setSavedPoint(JSON.parse(storedPoint));

      // GPS yzygiderli yzarlamak
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation.coords);
        }
      );
    })();
  }, []);

  // 🔗 SENIŇ ASYL LINKIŇ (Dolduryldy)
  const shareLocation = async () => {
    if (!location) {
      Alert.alert("Garaşyň", "GPS entek anyklanmady.");
      return;
    }
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");

    try {
      const { latitude, longitude } = location;
      // HUT SENIŇ FORMATYŇ:
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
      setStatus("Näsazlyk ýüze çykdy");
    } finally {
      setLoading(false);
    }
  };

  const freezeLocation = async () => {
    if (location) {
      await AsyncStorage.setItem('saved_point', JSON.stringify(location));
      setSavedPoint(location);
      Alert.alert("Nokat Saklandy", "Başlangyç nokadyňyz ýatda saklandy.");
      setStatus("Nokat saklandy");
    } else {
      Alert.alert("Hata", "GPS tapylmady.");
    }
  };

  const goToSavedPoint = () => {
    if (!savedPoint) {
      Alert.alert("Nokat ýok", "Ilki nokady saklamaly.");
      return;
    }
    // 🔗 SENIŇ IŞLEÝÄN LINK FORMATYŇ:
    const url = `https://Maps.google.com/?q=${savedPoint.latitude},${savedPoint.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert("Hata", "Karta açylmady."));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>📍 ÝOLBELET</Text>
          <Text style={styles.subTitle}>Siziň ynamdar syýahat hemraňyz</Text>
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeader}>Programmanyň Manysy we Maksady:</Text>
          <Text style={styles.aboutText}>
            Salam! Men <Text style={styles.highlightText}>Meňli Aşyrowa Altyýewna</Text>.
            {"\n\n"}
            "Ýolbelet" programmasynyň esasy maksady — azaşan ulanyjylaryň başlangyç nokadyna (öýine, ulagyna ýa-da lagerine) durnukly dolanmagyny üpjün etmekdir. 
            {"\n\n"}
            <Text style={{fontWeight: 'bold'}}>Esasy aýratynlyklary:</Text>
            {"\n"}• <Text style={{fontWeight: '600'}}>Nokady Doňdur:</Text> Başlangyç nokadyňyzy kordinataly ýatda saklaýar.
            {"\n"}• <Text style={{fontWeight: '600'}}>Yzyna Ýol:</Text> Hatda azaşsaňyz-da, sizi başlangyç nokadyňyza tarap Google Maps arkaly gönükdirýär.
            {"\n"}• <Text style={{fontWeight: '600'}}>Howpsuzlyk:</Text> Kyn ýagdaýda öz kordinatalaryňyzy ýakynlaryňyza SMS arkaly dessine ugradyp bilersiňiz.
          </Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.button, styles.btnBlue]} onPress={freezeLocation}>
            <Text style={styles.buttonText}>📍 BAŞLANGYÇ NOKADY SAKLA</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, {backgroundColor: savedPoint ? '#457b9d' : '#ccc'}]} 
            onPress={goToSavedPoint}
            disabled={!savedPoint}
          >
            <Text style={styles.buttonText}>🔙 YZYNA ÝOL GÖRKEZ</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#e63946" style={{ marginVertical: 10 }} />
          ) : (
            <TouchableOpacity style={[styles.button, {marginTop: 5}]} onPress={shareLocation}>
              <Text style={styles.buttonText}>✉️ ÝERIMI SMS BILEN UGRAT</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.statusText}>{status}</Text>
          
          {savedPoint && (
            <Text style={styles.savedInfo}>
              Başlangyç nokadyňyz ýatda ✅
            </Text>
          )}
        </View>
      </ScrollView>
      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Meňli</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingVertical: 40, paddingHorizontal: 25 },
  header: { marginBottom: 20, alignItems: 'center' },
  logoText: { fontSize: 36, fontWeight: '900', color: '#1d3557' },
  subTitle: { fontSize: 16, color: '#457b9d', textAlign: 'center' },
  aboutCard: { backgroundColor: '#ffffff', padding: 25, borderRadius: 20, elevation: 4, marginBottom: 25 },
  aboutHeader: { fontSize: 18, fontWeight: 'bold', color: '#1d3557', marginBottom: 10 },
  aboutText: { fontSize: 15, color: '#444', lineHeight: 22, textAlign: 'justify' },
  highlightText: { fontWeight: 'bold', color: '#e63946' },
  actionSection: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#e63946', paddingVertical: 18, borderRadius: 15, width: '100%', alignItems: 'center', elevation: 5, marginBottom: 12 },
  btnBlue: { backgroundColor: '#1d3557' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  statusText: { marginTop: 10, color: '#457b9d', fontSize: 14, fontWeight: '600' },
  savedInfo: { marginTop: 5, color: '#2a9d8f', fontSize: 12, fontStyle: 'italic' },
  footerText: { paddingBottom: 15, color: '#a8dadc', fontSize: 12, textAlign: 'center', backgroundColor: '#f8f9fa' },
});
