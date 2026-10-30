import { Text, View } from 'react-native';
import { useUsername } from './useUsername';

export function WelcomeScreen() {
  const { profile } = useUsername();
  if (!profile) return <Text>Assigning your username…</Text>;
  return (
    <View>
      <Text>Your username</Text>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>@{profile.username}</Text>
    </View>
  );
}
