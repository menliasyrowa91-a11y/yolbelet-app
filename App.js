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
      
      // DIŇE ŞU ÝERDE $ BELGISI GOŞULDY (Build öçmezligi üçin):
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const messageBody = "ÝOLBELET: Meniň häzirki ýerim: " + mapUrl;

      // 3. SMS Ugratmak sahypasyny açmak
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync([], messageBody);
        setStatus("SMS taýýarlandy");
      } else {
        // SMS bolmasa Share (paýlaşmak) ulanmak
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
      {/* Başlyk we Logo */}
      <View style={styles.header}>
        <Text style={styles.logoText}>📍 ÝOLBELET</Text>
        <Text style={styles.subTitle}>Seniň ynamdar kömekçiň</Text>
      </View>

      {/* Programma Barada Bölümi */}
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

      {/* Esasy Düwme */}
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

      {/* Footer */}
      <Text style={styles.footerText}>© 2026 Ýolbelet - Düzüji: Mengli</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1d3557',
  },
  subTitle: {
    fontSize: 16,
    color: '#457b9d',
    marginTop: 5,
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 40,
  },
  aboutHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d3557',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    marginTop: 15,
    fontStyle: 'italic',
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#e63946',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    width: '90%',
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusText: {
    marginTop: 15,
    color: '#457b9d',
    fontSize: 14,
  },
  footerText: {
    marginTop: 'auto',
    color: '#a8dadc',
    fontSize: 12,
  },
});
