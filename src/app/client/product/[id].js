import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, EmptyState, Header, ProductCover, Row, Screen, styles } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { isLive, isWorkshop, kindLabel, seatsLeft, workshopWhen } from '../../../data/marketplace';
import { apptDateTime, purchaseProduct } from '../../../db/actions';
import { useCollection } from '../../../db/db';
import { colors } from '../../../theme';
import { notify } from '../../../utils/alert';

// The live room opens 15 minutes before the start and stays open for the workshop's duration.
const JOIN_EARLY_MS = 15 * 60 * 1000;

function InfoRow({ icon, children }) {
  return (
    <Row gap={10} style={{ paddingVertical: 6, alignItems: 'flex-start' }}>
      <Ionicons name={icon} size={18} color={colors.primary} style={{ marginTop: 2 }} />
      <Text style={[styles.body, { flex: 1 }]}>{children}</Text>
    </Row>
  );
}

// Current time, refreshed every 30s so the Join button opens without leaving the page.
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { data: products, loading } = useCollection('products');
  const { data: users } = useCollection('users');
  const { data: orders } = useCollection('orders');
  const [busy, setBusy] = useState(false);
  const now = useNow();

  const product = products.find((p) => p.id === id);
  const seller = users.find((u) => u.id === product?.sellerId);
  const owned = useMemo(() => orders.some((o) => o.productId === id && o.buyerId === user.id), [orders, id, user.id]);

  if (!product) {
    return (
      <Screen>
        <Header title="Product" back />
        {!loading && <EmptyState title="Product not found" />}
      </Screen>
    );
  }

  const workshop = isWorkshop(product);
  const live = isLive(product);
  const left = seatsLeft(product, orders);
  const start = live ? apptDateTime(product) : null;
  const end = live ? new Date(start.getTime() + (product.duration ?? 60) * 60000) : null;
  const roomOpen = live && now >= start - JOIN_EARLY_MS && now <= end;

  const buy = async () => {
    if (product.price) return router.push({ pathname: '/checkout', params: { type: 'product', productId: product.id } });
    setBusy(true);
    try {
      await purchaseProduct(product, user.id);
      notify(workshop ? "You're registered" : 'Added to My Purchases', workshop ? `${product.title}\n${workshopWhen(product)}` : product.title);
    } catch (e) {
      notify('Could not register', e.message);
    } finally {
      setBusy(false);
    }
  };

  let action;
  if (!owned) {
    action = left === 0
      ? <Button title="Fully booked" disabled />
      : <Button title={`${workshop ? 'Register' : 'Buy'} · ${product.price ? `$${product.price}` : 'Free'}`} onPress={buy} loading={busy} />;
  } else if (live) {
    action = roomOpen
      ? <Button title="Join live workshop" icon="videocam" onPress={() => notify('Joining live room', 'The live video room is simulated in offline mode.')} />
      : <Button title={now > end ? 'This workshop has ended' : `Join opens ${workshopWhen(product)}`} icon="time-outline" variant="secondary" disabled />;
  } else if (workshop) {
    action = <Button title="Watch recording" icon="play" onPress={() => notify('Coming soon', 'Video playback will be available once the backend is connected.')} />;
  } else {
    action = <Button title="Open" icon="book-outline" onPress={() => notify('Coming soon', 'Downloading and reading content will be available once the backend is connected.')} />;
  }

  return (
    <Screen footer={<View style={{ padding: 16, paddingBottom: 24 }}>{action}</View>}>
      <Header title="" back />
      <ProductCover product={product} height={240} />
      <Row style={{ marginTop: 16, justifyContent: 'space-between' }}>
        <Badge label={kindLabel(product)} tone="tan" />
        {owned && <Badge label={live ? 'Registered' : 'Owned'} tone="success" />}
      </Row>
      <Text style={[styles.h1, { marginTop: 8 }]}>{product.title}</Text>
      {!!product.subtitle && <Text style={styles.subtitle}>{product.subtitle}</Text>}
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary, marginTop: 10 }}>{product.price ? `$${product.price}` : 'Free'}</Text>
      <Text style={[styles.body, { marginTop: 12 }]}>{product.description}</Text>

      {workshop && (
        <Card style={{ marginTop: 20 }}>
          <Text style={[styles.h3, { marginBottom: 6 }]}>How it works</Text>
          {live ? (
            <>
              <InfoRow icon="calendar-outline">{workshopWhen(product)} · {product.duration ?? 60} min</InfoRow>
              <InfoRow icon={product.mode === 'in-person' ? 'location-outline' : 'videocam-outline'}>
                {product.mode === 'in-person' ? `In person${product.location ? ` · ${product.location}` : ''}` : 'Live online — join from this page, the room opens 15 minutes before the start.'}
              </InfoRow>
              <InfoRow icon="notifications-outline">{"You'll get a reminder before it starts."}</InfoRow>
              {left != null && <InfoRow icon="people-outline">{left} of {product.seats} seats left</InfoRow>}
            </>
          ) : (
            <>
              <InfoRow icon="play-circle-outline">{product.duration ?? 60}-minute recording</InfoRow>
              <InfoRow icon="infinite-outline">Watch any time, as often as you like, from My Purchases.</InfoRow>
            </>
          )}
        </Card>
      )}

      {seller && (
        <Card style={{ marginTop: 16 }} onPress={seller.role === 'pro' ? () => router.push(`/client/therapist/${seller.id}`) : undefined}>
          <Row gap={12}>
            <Avatar name={seller.name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.muted}>{workshop ? 'Hosted by' : 'Created by'}</Text>
              <Text style={styles.h3}>{seller.name}</Text>
              {!!seller.title && <Text style={styles.muted}>{seller.title}</Text>}
            </View>
          </Row>
        </Card>
      )}
    </Screen>
  );
}
