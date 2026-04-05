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
      let { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        Alert.alert("Rugsat berilmedi", "GPS rugsady bolmasa, Ýolbelet işlemäp biler.");
        setLoading(false);
        setStatus("Rugsat ýok");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // SENIŇ TAPAN DOGRY FORMATYŇ (SMS-de gowy işleýär)
      const mapUrl = `maps.google.com/?q=${latitude},${longitude}`;
      const messageBody = `YOLBELET: Meniň ýerim: ${mapUrl}`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        // NOMERIŇIZI ŞU ÝERDE BARLAŇ
        await SMS.sendSMSAsync(['+99365123456'], messageBody); 
        setStatus("SMS taýýarlandy");
      } else {
        await Share.share({ message: messageBody });
        setStatus("Paýlaşyldy");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Ýalňyşlyk", "GPS maglumatyny alyp bolmady.");
      setStatus("Näsazlyk ýüze çykdy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.
