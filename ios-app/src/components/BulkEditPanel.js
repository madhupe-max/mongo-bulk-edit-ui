import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function BulkEditPanel({
  selectedCount,
  editFields,
  bulkUpdates,
  onFieldChange,
  onApply,
  onCancel,
}) {
  return (
    <View style={styles.panel} testID="bulk-edit-panel">
      <Text style={styles.panelTitle} testID="bulk-edit-title">
        Update {selectedCount} selected record{selectedCount !== 1 ? 's' : ''}
      </Text>

      <ScrollView
        style={styles.fieldsScroll}
        keyboardShouldPersistTaps="handled"
      >
        {editFields.map((field) => (
          <View key={field} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field}</Text>
            <TextInput
              style={styles.input}
              placeholder={`New ${field}`}
              placeholderTextColor="#94a3b8"
              value={bulkUpdates[field] || ''}
              onChangeText={(val) => onFieldChange(field, val)}
              autoCapitalize="none"
              autoCorrect={false}
              testID={`bulk-input-${field}`}
              accessibilityLabel={`New ${field}`}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnSuccess}
          onPress={onApply}
          testID="apply-updates-button"
        >
          <Text style={styles.btnText}>Apply Updates</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={onCancel}
          testID="cancel-bulk-edit-button"
        >
          <Text style={[styles.btnText, styles.btnSecondaryText]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    margin: 12,
    borderRadius: 8,
    padding: 16,
    maxHeight: 320,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 12,
  },
  fieldsScroll: {
    flexGrow: 0,
    maxHeight: 180,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btnSuccess: {
    flex: 1,
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondaryText: {
    color: '#374151',
  },
});
