import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");

  const shareLocation = async () => {
    setStatus("GPS gözlenilýär...");
    let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (permissionStatus !== 'granted') {
      Alert.alert("GPS Rugsady", "Siziň ýeriňizi anyklamak üçin GPS rugsady gerek.");
      setStatus("Rugsat berilmedi");
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      
      // Seniň isleýän we işleýän diýen link formatyň:
      const mapUrl = `http://googleusercontent.com/maps.google.com/q=${latitude},${longitude}`;
      const messageBody = `YOLBELET: Menin yerim: ${mapUrl}`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS ugradyldy");
      } else {
        Alert.alert("SMS", "SMS funksiýasy elýeterli däl.");
        setStatus("Ýalňyşlyk ýüze çykdy");
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "GPS maglumaty alynmady.");
      setStatus("GPS tapylmady");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.logo}>📍 ÝOLBELET</Text>
          <Text style={styles.subTitle}>Seniň ynamdar kömekçiň</Text>
          
          <View style={styles.aboutBox}>
            <Text style={styles.aboutHeader}>Programma barada:</Text>
            <Text style={styles.aboutText}>
              Salam! Men <Text style={styles.authorName}>Meňli Aşyrowa Altyýewna</Text>. 
              Bu programmany ýolda kynçylyga uçranlara kömek bermek üçin döretdim.
            </Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={shareLocation}>
            <Text style={styles.btnText}>✉️ ÝERIMI SMS BILEN UGRAT</Text>
          </TouchableOpacity>
          
          <Text style={styles.status}>{status}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Ýolbelet - Meňli Aşyrowa</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 25, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  logo: { fontSize: 36, fontWeight: '900', color: '#1d3557', marginBottom: 5 },
  subTitle: { fontSize: 16, color: '#457b9d', marginBottom: 25 },
  aboutBox: { backgroundColor: '#f1f3f5', padding: 15, borderRadius: 15, marginBottom: 25, width: '100%' },
  aboutHeader: { fontSize: 18, fontWeight: 'bold', color: '#1d3557', marginBottom: 8 },
  aboutText: { fontSize: 15, color: '#333', lineHeight: 22 },
  authorName: { fontWeight: 'bold', color: '#e63946' },
  btn: { backgroundColor: '#e63946', padding: 20, borderRadius: 15, width: '100%', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  status: { marginTop: 20, color: '#6c757d', fontSize: 14 },
  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { color: '#adb5bd', fontSize: 12 }
});
