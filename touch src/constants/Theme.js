export const COLORS = {
  primary: '#1d3557', // Gök
  danger: '#e63946',  // Gyzyl
  warning: '#ffb703', // Sary
  background: '#f8f9fa',
  white: '#ffffff',
};

export const MAP_CONFIG = {
  tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  initialRegion: {
    latitude: 38.43,
    longitude: 56.32,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  }
};
