import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function RecordDetailScreen({ route, navigation }) {
  const { record, fields } = route.params || {};

  if (!record) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Record not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} testID="record-detail-screen">
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Record Details</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>ID</Text>
          <Text style={styles.fieldValue} testID="detail-id" selectable>
            {record._id}
          </Text>
        </View>

        {(fields || Object.keys(record).filter((k) => k !== '_id')).map((field) => (
          <View key={field} style={styles.field}>
            <Text style={styles.fieldLabel}>{field}</Text>
            <Text
              style={styles.fieldValue}
              testID={`detail-${field}`}
              selectable
            >
              {String(record[field] ?? '')}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        testID="back-button"
      >
        <Text style={styles.backButtonText}>← Back to Records</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
  },
  field: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: '#1e293b',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
  },
  backButton: {
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginBottom: 32,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
