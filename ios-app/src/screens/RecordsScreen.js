import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { fetchRecords, bulkUpdateRecords } from '../services/api';
import RecordRow from '../components/RecordRow';
import BulkEditPanel from '../components/BulkEditPanel';

export default function RecordsScreen() {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState({});
  const [editFields, setEditFields] = useState([]);
  const [error, setError] = useState('');

  const loadRecords = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      const data = await fetchRecords();
      setRecords(data);
      if (data.length > 0) {
        const fields = Object.keys(data[0]).filter((k) => k !== '_id');
        setEditFields(fields);
      }
    } catch (err) {
      setError('Failed to load records: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
    if (next.size === 0) setBulkEditMode(false);
  };

  const toggleSelectAll = () => {
    if (selected.size === records.length) {
      setSelected(new Set());
      setBulkEditMode(false);
    } else {
      setSelected(new Set(records.map((r) => r._id)));
    }
  };

  const applyBulkEdit = async () => {
    const filledUpdates = Object.fromEntries(
      Object.entries(bulkUpdates).filter(([, v]) => v.trim() !== '')
    );
    if (selected.size === 0 || Object.keys(filledUpdates).length === 0) {
      Alert.alert('Validation', 'Select records and enter at least one update value.');
      return;
    }
    try {
      setError('');
      const result = await bulkUpdateRecords(Array.from(selected), filledUpdates);
      if (result.success) {
        await loadRecords();
        setSelected(new Set());
        setBulkEditMode(false);
        setBulkUpdates({});
        Alert.alert('Success', `Updated ${result.modifiedCount ?? selected.size} records.`);
      }
    } catch (err) {
      setError('Bulk edit failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleBulkFieldChange = (field, value) => {
    setBulkUpdates((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View style={styles.centered} testID="loading-indicator">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading records…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="records-screen">
      {/* Toolbar */}
      <View style={styles.toolbar} testID="toolbar">
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => loadRecords(true)}
          testID="refresh-button"
        >
          <Text style={styles.btnText}>↻ Refresh</Text>
        </TouchableOpacity>

        {selected.size > 0 && (
          <Text style={styles.selectionCount} testID="selection-count">
            {selected.size} selected
          </Text>
        )}

        {selected.size > 0 && (
          <TouchableOpacity
            style={styles.btnWarning}
            onPress={() => setBulkEditMode(!bulkEditMode)}
            testID="bulk-edit-button"
          >
            <Text style={styles.btnText}>
              {bulkEditMode ? 'Cancel Bulk Edit' : 'Bulk Edit'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Banner */}
      {error ? (
        <View style={styles.errorBanner} testID="error-banner">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Bulk Edit Panel */}
      {bulkEditMode && selected.size > 0 && (
        <BulkEditPanel
          selectedCount={selected.size}
          editFields={editFields}
          bulkUpdates={bulkUpdates}
          onFieldChange={handleBulkFieldChange}
          onApply={applyBulkEdit}
          onCancel={() => {
            setBulkEditMode(false);
            setBulkUpdates({});
          }}
        />
      )}

      {/* Select All Row */}
      <TouchableOpacity
        style={styles.selectAllRow}
        onPress={toggleSelectAll}
        testID="select-all-button"
      >
        <View
          style={[
            styles.checkbox,
            selected.size === records.length && records.length > 0 && styles.checkboxChecked,
          ]}
          testID="select-all-checkbox"
        >
          {selected.size === records.length && records.length > 0 && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
        <Text style={styles.selectAllLabel}>Select All ({records.length})</Text>
      </TouchableOpacity>

      {/* Records List */}
      {records.length === 0 ? (
        <View style={styles.emptyState} testID="empty-state">
          <Text style={styles.emptyText}>
            No records found. Add some to MongoDB to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <RecordRow
              record={item}
              fields={editFields}
              isSelected={selected.has(item._id)}
              onToggle={() => toggleSelect(item._id)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRecords(true)}
              tintColor="#2563eb"
            />
          }
          testID="records-list"
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnWarning: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  selectionCount: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 6,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectAllLabel: {
    marginLeft: 10,
    fontWeight: '600',
    color: '#475569',
    fontSize: 14,
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
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
});
