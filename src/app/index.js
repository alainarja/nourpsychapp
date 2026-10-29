import { Redirect } from 'expo-router';
import { homeFor, useAuth } from '../context/AuthContext';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? homeFor(user) : '/welcome'} />;
}
