import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0708' }}>
      <Text style={{ color: '#F6EEF0', fontSize: 24, fontWeight: '700' }}>The Playroom</Text>
      <Text style={{ color: '#B69AA1', marginTop: 12 }}>Mobile skeleton ready for Expo.</Text>
    </View>
  );
}
