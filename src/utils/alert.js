import { Alert, Platform } from 'react-native';

// Alert.alert is a no-op on react-native-web, so fall back to the browser dialogs there.
export function notify(title, message = '') {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export function confirm(title, message, onConfirm, confirmLabel = 'OK', destructive = false) {
  if (Platform.OS === 'web') {
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

export const comingSoon = (feature) => notify('Coming soon', `${feature} will be available once the backend is connected.`);
