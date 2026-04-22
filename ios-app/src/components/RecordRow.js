import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RecordRow({ record, fields, isSelected, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected]}
      onPress={onToggle}
      testID={`record-row-${record._id}`}
      accessibilityLabel={`Record ${record._id}`}
      accessibilityState={{ selected: isSelected }}
    >
      {/* Checkbox */}
      <View
        style={[styles.checkbox, isSelected && styles.checkboxChecked]}
        testID={`record-checkbox-${record._id}`}
      >
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Fields */}
      <View style={styles.fieldsContainer}>
        <Text style={styles.idText} testID={`record-id-${record._id}`} numberOfLines={1}>
          ID: {String(record._id).slice(0, 12)}…
        </Text>
        {fields.map((field) => (
          <View key={field} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{field}: </Text>
            <Text
              style={styles.fieldValue}
              testID={`record-${field}-${record._id}`}
              numberOfLines={1}
            >
              {String(record[field] ?? '')}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  rowSelected: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#94a3b8',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 2,
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  fieldsContainer: {
    flex: 1,
  },
  idText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  fieldValue: {
    fontSize: 13,
    color: '#1e293b',
    flex: 1,
  },
});
