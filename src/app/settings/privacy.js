import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, Text, View } from 'react-native';
import { SettingsSection, ToggleRow } from '../../components/settings';
import { Badge, Button, Card, Divider, Header, Input, Row, Screen, styles } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { consentItemsFor } from '../../data/consents';
import { db } from '../../db/db';
import { useI18n } from '../../i18n';
import { colors } from '../../theme';
import { confirm, notify } from '../../utils/alert';

// Which records in each collection belong to a user (for the data export).
const EXPORT_MAP = {
  appointments: (r, id) => r.clientId === id || r.proId === id,
  notes: (r, id) => r.proId === id,
  assessments: (r, id) => r.userId === id || r.administeredBy === id,
  moods: (r, id) => r.userId === id,
  goals: (r, id) => r.userId === id,
  chats: (r, id) => r.userId === id,
  messages: (r, id) => r.fromId === id || r.toId === id,
  notifications: (r, id) => r.userId === id,
  favorites: (r, id) => r.userId === id,
  orders: (r, id) => r.buyerId === id || r.sellerId === id,
  products: (r, id) => r.sellerId === id,
  reviews: (r, id) => r.clientId === id || r.proId === id,
  medications: (r, id) => r.clientId === id || r.proId === id,
  prescriptions: (r, id) => r.clientId === id || r.proId === id,
  paymentMethods: (r, id) => r.userId === id,
  payouts: (r, id) => r.proId === id,
  orgMembers: (r, id) => r.orgId === id || r.userId === id,
};

async function buildExport(user) {
  const { password, ...profile } = user;
  const data = { exportedAt: new Date().toISOString(), profile };
  for (const [name, belongs] of Object.entries(EXPORT_MAP)) {
    const rows = await db.where(name, (r) => belongs(r, user.id));
    if (rows.length) data[name] = rows;
  }
  return data;
}

async function shareExport(json) {
  const text = JSON.stringify(json, null, 2);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shift-and-thrive-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: 'My Shift & Thrive data', message: text });
}

export default function Privacy() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { t } = useI18n();
  const [exported, setExported] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const privacy = user.privacy ?? {};
  const setPrivacy = (patch) => updateProfile({ privacy: { ...privacy, ...patch } });
  const consents = user.consents ?? {};
  const acceptedOn = user.consentedAt ? new Date(user.consentedAt).toLocaleDateString() : null;
  const isClient = user.role === 'client';

  const prepare = async () => {
    setPreparing(true);
    setExported(await buildExport(user));
    setPreparing(false);
  };

  const remove = () =>
    confirm(t('privacy.delete'), 'This cannot be undone. Your account and personal data will be permanently deleted.', async () => {
      await deleteAccount();
      router.replace('/welcome');
    }, t('privacy.delete.confirm'), true);

  const counts = exported ? Object.entries(exported).filter(([k]) => !['exportedAt', 'profile'].includes(k)) : [];

  return (
    <Screen>
      <Header title={t('settings.privacy')} back />

      <SettingsSection title={t('privacy.consents')}>
        <Card>
          {consentItemsFor(user.role).map((item, i) => (
            <View key={item.key}>
              {i > 0 && <Divider style={{ marginVertical: 8 }} />}
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={[styles.body, { flex: 1 }]}>{t(item.label)}</Text>
                <Badge label={consents[item.key] ? t('common.on') : t('privacy.notGiven')} tone={consents[item.key] ? 'success' : 'muted'} />
              </Row>
            </View>
          ))}
          {!!acceptedOn && <Text style={[styles.muted, { marginTop: 10 }]}>{t('privacy.acceptedOn', undefined, { date: acceptedOn })}</Text>}
        </Card>
      </SettingsSection>

      <SettingsSection title={t('privacy.sharing')}>
        <Card>
          {isClient && (
            <>
              <ToggleRow title={t('privacy.shareMoods')} value={privacy.shareMoods} onChange={(v) => setPrivacy({ shareMoods: v })} />
              <ToggleRow title={t('privacy.shareAssessments')} value={privacy.shareAssessments} onChange={(v) => setPrivacy({ shareAssessments: v })} />
            </>
          )}
          <ToggleRow
            title={t('privacy.research')}
            value={consents.research}
            onChange={(v) => updateProfile({ consents: { ...consents, research: v } })}
          />
        </Card>
      </SettingsSection>

      <SettingsSection title={t('privacy.download')}>
        <Card>
          <Text style={styles.muted}>{t('privacy.download.sub')}</Text>
          {exported ? (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.body, { fontWeight: '600' }]}>Profile · {exported.profile.name}</Text>
              {counts.map(([name, rows]) => (
                <Row key={name} style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={styles.body}>{name}</Text>
                  <Text style={styles.muted}>{t('privacy.records', undefined, { n: rows.length })}</Text>
                </Row>
              ))}
              <Button title={t('privacy.share')} icon="share-outline" style={{ marginTop: 14 }} onPress={() => shareExport(exported).catch(() => notify('Could not share the export.'))} />
            </View>
          ) : (
            <Button title={t('privacy.prepare')} icon="download-outline" variant="outline" style={{ marginTop: 12 }} onPress={prepare} loading={preparing} />
          )}
        </Card>
      </SettingsSection>

      <SettingsSection title={t('privacy.delete')}>
        <Card style={{ borderColor: colors.dangerSoft }}>
          <Text style={styles.muted}>{t('privacy.delete.sub')}</Text>
          {user.role === 'pro' && <Text style={[styles.muted, { marginTop: 8 }]}>{t('privacy.retention')}</Text>}
          <View style={{ marginTop: 12 }}>
            <Input placeholder={t('privacy.delete.type')} value={deleteText} onChangeText={setDeleteText} autoCapitalize="characters" />
          </View>
          <Button title={t('privacy.delete.confirm')} variant="danger" disabled={deleteText.trim() !== 'DELETE'} onPress={remove} />
        </Card>
      </SettingsSection>
    </Screen>
  );
}
