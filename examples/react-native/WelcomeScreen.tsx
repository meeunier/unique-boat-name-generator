import { Text, View } from 'react-native';
import { usePseudonym } from './usePseudonym';

export function WelcomeScreen() {
  const { profile } = usePseudonym();
  if (!profile) return <Text>Assigning your boat name…</Text>;
  return (
    <View>
      <Text>Ahoy! You're sailing as</Text>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>{profile.pseudonym}</Text>
      <Text>@{profile.username}</Text>
    </View>
  );
}
