import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Asset } from 'expo-asset';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);

  // SMS UGRATMAK FUNKSIÝASY (Belgi formatlary üçin düzedişli)
  const shareLocation = async () => {
    Alert.alert(
      "📍 Ýerimi Ugratmak",
      "Koordinatalaryňyz anyklanyp, SMS hökmünde taýýarlanylar. Siz belgini islendik formatda (+993 ýa-da 8) ýazyp bilersiňiz.",
      [{ text: "Dowam et", onPress: async () => {
        setLoading(true);
        setStatus("Ýerleşýän ýeriňiz anyklanýar...");
        try {
          let { status: perm } = await Location.requestForegroundPermissionsAsync();
          if (perm !== 'granted') {
            Alert.alert("Rugsat ýok", "GPS rugsady bolmasa nokat alyp bolmaýar.");
            return;
          }

          let location = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Highest 
          });

          const { latitude, longitude } = location.coords;
          
          // SENIŇ IŞLEÝÄN FORMATYŇ:
          const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
          const messageBody = "YOLBELET: Menin yerim: " + mapUrl;

          const isAvailable = await SMS.isAvailableAsync();
          if (isAvailable) {
            // SMS penjiresini açýarys. Ulanyjy belgini 8... ýa-da +993... diýip ýazsa-da, 
            // Android ulgamy ony awtomatiki kabul eder.
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
      }}]
    );
  };

  // BAŞLANGYÇ NOKADY ÝATDA SAKLAMAK
  const savePointA = async () => {
    Alert.alert(
      "💾 Nokady Ýatda Saklamak",
      "Häzirki nokadyňyz başlangyç nokat hökmünde saklanar.",
      [{ text: "Ýatda sakla", onPress: async () => {
        setLoading(true);
        try {
          let { status: perm } = await Location.requestForegroundPermissionsAsync();
          if (perm !== 'granted') return;
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
          setSavedLocation(location.coords);
          Alert.alert("Sazly", "Başlangyç nokat ýatda saklandy!");
          setStatus("A nokady saklandy");
        } catch (e) {
          Alert.alert("Hata", "Nokady saklap bolmady.");
        } finally {
          setLoading(false);
        }
      }}]
    );
  };

  // OFFLINE KARTA (KMZ)
  const openOfflineMap = async () => {
    Alert.alert(
      "🗺️ Offline Karta",
      "Siziň offline kartaňyz (KMZ faýly) ýüklener.",
      [{ text: "Kartany Aç", onPress: async () => {
        setLoading(true);
        try {
          // Skrinşotyňyzdaky takyk faýl ady:
          const kmzFile = Asset.fromModule(require('./assets/Yolbelet-un-offline.kmz'));
          await kmzFile.downloadAsync();
          Alert.alert("Gatlak taýýar", "Offline karta gatlagy ýüklendi.");
          setStatus("Karta işjeň");
        } catch (e) {
          Alert.alert("Hata", "KMZ faýly tapylmady.");
        } finally {
          setLoading(false);
        }
      }}]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Seniň ynamdar kömekçiň</Text>
      </View>

      <View style={styles.actionSection}>
        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={shareLocation}>
              <Text style={styles.buttonText}>📍 ÝERIMI UGRAT (SMS)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, {backgroundColor: '#1d3557'}]} onPress={savePointA}>
              <Text style={styles.buttonText}>💾 BAŞLANGYÇ NOKAT SAKLA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, {backgroundColor: '#457b9d'}]} onPress={openOfflineMap}>
              <Text style={styles.buttonText}>🗺️ OFFLINE KARTA (KMZ)</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Meňli</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  logoText: { fontSize: 36, fontWeight: '900', color: '#1d3557' },
  subTitle: { fontSize: 16, color: '#457b9d' },
  actionSection: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#e63946', padding: 18, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15, elevation: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusText: { marginTop: 15, color: '#457b9d' },
  footerText: { marginTop: 40, color: '#a8dadc', fontSize: 12 },
});
