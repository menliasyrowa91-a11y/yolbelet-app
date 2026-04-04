import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);

  const shareLocation = async () => {
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");

    try {
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert("Rugsat berilmedi", "GPS rugsady bolmasa, Ýolbelet işlemän biler.");
        setLoading(false);
        setStatus("Rugsat ýok");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      // BU ÝERDE ÝALŇYŞLYK DÜZEDILDI: ${latitude} ulanyldy
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const messageBody = "ÝOLBELET: Meniň häzirki ýerim: " + mapUrl;

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Seniň ynamdar kömekçiň</Text>
      </View>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutHeader}>Programma barada:</Text>
        <Text style={styles.aboutText}>
          Salam! Men <Text style={{fontWeight: 'bold', color: '#e63946'}}>Meňli Aşyrowa Altyýewna</Text>. 
          Bu programmany ýolda kynçylyga uçranlara ýa-da adresi tapyp bilmeýänlere 
          çalt kömek bermek üçin döretdim.
        </Text>
        <Text style={styles.instructionText}>
          Aşakdaky düwmä basyp, GPS koordinatanyzy SMS arkaly dostlaryňyza ugradyp bilersiňiz.
        </Text>
      </View>

      <View style={styles.actionSection}>
        {loading ? (
          <ActivityIndicator size="large" color="#e63946" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={shareLocation}>
            <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Mengli</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f8f9fa', alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  logoText: { fontSize: 36, fontWeight: '900', color: '#1d3557' },
  subTitle: { fontSize: 16, color: '#457b9d', marginTop: 5 },
  aboutCard: { backgroundColor: '#ffffff', padding: 20, borderRadius: 15, width: '100%', elevation: 3, marginBottom: 40 },
  aboutHeader: { fontSize: 18, fontWeight: 'bold', color: '#1d3557', marginBottom: 10 },
  aboutText: { fontSize: 15, color: '#333', lineHeight: 22 },
  instructionText: { fontSize: 13, color: '#666', marginTop: 15, fontStyle: 'italic' },
  actionSection: { width: '100%', alignItems: 'center' },
  button: { backgroundColor: '#e63946', paddingVertical: 20, paddingHorizontal: 40, borderRadius: 50, width: '90%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statusText: { marginTop: 15, color: '#457b9d', fontSize: 14 },
  footerText: { marginTop: 50, color: '#a8dadc', fontSize: 12 },
});
