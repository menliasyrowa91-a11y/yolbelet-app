import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);

  const shareLocation = async () => {
    setLoading(false);
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");

    try {
      // 1. GPS Rugsady
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert("Rugsat berilmedi", "GPS rugsady bolmasa, Ýolbelet işlemän biler.");
        setLoading(false);
        setStatus("Rugsat ýok");
        return;
      }

      // 2. Koordinatany almak
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // Iň "howpsuz" we gysga link görnüşi (https we www aýryldy)
      const mapUrl = `maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = "YOLBELET: Yerlesyan Yerim: " + mapUrl;

      // 3. SMS hyzmaty
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        // SMS penjiresini açýar
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS taýýar!");
      } else {
        // SMS ýok bolsa umumy paýlaşmak
        await Share.share({ message: messageBody });
        setStatus("Paýlaşyldy");
      }
    } catch (error) {
      Alert.alert("Ýalňyşlyk", "GPS maglumatyny alyp bolmady.");
      setStatus("Säwlik boldy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>ÝOLBELET</Text>
        <Text style={styles.subText}>Sanly Ýol Görkeziji</Text>
      </View>

      <View style={styles.main}>
        <TouchableOpacity 
          style={[styles.sosButton, loading && styles.disabledButton]} 
          onPress={shareLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#1a1a1a" />
          ) : (
            <Text style={styles.sosText}>ÝERIMI{"\n"}UGRAT</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.statusBox}>
          <Text style={styles.statusValue}>{status}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Ýolbelet</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', padding: 20 },
  header: { marginTop: 60, alignItems: 'center' },
  logoText: { color: '#f1c40f', fontSize: 45, fontWeight: 'bold' },
  subText: { color: '#bdc3c7', fontSize: 14, letterSpacing: 2 },
  main: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sosButton: { 
    backgroundColor: '#f1c40f', width: 220, height: 220, borderRadius: 110, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 10, borderColor: '#d4ac0d' 
  },
  disabledButton: { backgroundColor: '#7f8c8d', borderColor: '#95a5a6' },
  sosText: { color: '#1a1a1a', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  statusBox: { marginTop: 30 },
  statusValue: { color: '#f1c40f', fontSize: 16 },
  footer: { marginBottom: 20, alignItems: 'center' },
  footerText: { color: '#555', fontSize: 12 }
});
