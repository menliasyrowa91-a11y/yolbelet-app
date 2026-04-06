import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Share, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

export default function App() {
  const [status, setStatus] = useState("Ulanmaga taýýar");
  const [loading, setLoading] = useState(false);

  const shareLocation = async () => {
    setLoading(true);
    setStatus("Ýerleşýän ýeriňiz anyklanýar...");

    try {
      // 1. GPS Rugsady
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert("Rugsat berilmedi", "GPS rugsady bolmasa, Ýolbelet işlemäp biler.");
        setLoading(false);
        setStatus("Rugsat ýok");
        return;
      }

      // 2. Koordinatany almak
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // 3. DOGRY FORMAT (Seniň tapan formatyň)
      const mapUrl = `Maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = `YOLBELET: Menin yerim: ${mapUrl}`;

      // 4. SMS ugratmak
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        // BU ÝERDE NOMERI DOGRY ÝAZYŇ
        await SMS.sendSMSAsync(['+99365123456'], messageBody); 
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
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.logoText}>📍 ÝOLBELET</Text>
          <View style={styles.line} />
          <Text style={styles.subTitle}>Seniň ynamdar kömekçiň</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.aboutHeader}>Programma Barada</Text>
          <Text style={styles.aboutText}>
            Salam! Men <Text style={styles.highlightText}>Meňli Aşyrowa Altyýewna</Text>. 
            Bu programma ýolda kynçylyga uçranlara we adresi tapyp bilmeýänlere çalt kömek bermek üçin döredildi.
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Bitarap Türkmenistan 🇹🇲</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#f1faee" />
          ) : (
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.button} 
              onPress={shareLocation}>
              <Text style={styles.buttonText}>📍 ÝERIMI UGRAT</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Ýolbelet | Düzüji: Mengli</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1d3557', 
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 25,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#f1faee',
    letterSpacing: 1,
  },
  line: {
    height: 4,
    width: 50,
    backgroundColor: '#e63946',
    marginVertical: 10,
    borderRadius: 2,
  },
  subTitle: {
    fontSize: 16,
    color: '#a8dadc',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    padding: 20,
    borderRadius: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 30,
  },
  aboutHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e63946',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 15,
    color: '#f1faee',
    lineHeight: 24,
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#f1faee',
    textDecorationLine: 'underline',
  },
  badge: {
    backgroundColor: '#457b9d',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 15,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#e63946', 
    paddingVertical: 20,
    width: '100%',
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 15,
    color: '#a8dadc',
    fontSize: 14,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 30,
  },
  footerText: {
    color: '#457b9d',
    fontSize: 12,
  },
});
