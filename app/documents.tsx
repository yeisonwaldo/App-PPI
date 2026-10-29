import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  Upload,
  X,
  Trash2,
  ExternalLink,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useDocuments,
  useDocumentTypes,
  useUploadEmployeeDocument,
  useDeleteDocument,
  getSignedDocumentUrl,
} from '@/features/documents/useDocuments';
import { useEmployees } from '@/features/employees/useEmployees';
import { getDocumentStatusInfo } from '@/lib/formatters';
import type { DocumentStatus } from '@/types/database';

export default function DocumentsScreen() {
  const [filterStatus, setFilterStatus] = useState<'all' | DocumentStatus>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const {
    data: docs = [],
    isLoading,
    refetch,
    isRefetching,
  } = useDocuments({ status: filterStatus });

  const { data: docTypes = [] } = useDocumentTypes();
  const { data: employees = [] } = useEmployees({ status: 'active' });

  const uploadMutation = useUploadEmployeeDocument();
  const deleteMutation = useDeleteDocument();

  // Estado del formulario de subida
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]!
  );
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [pickedFile, setPickedFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const handleOpenUploadModal = () => {
    if (!selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0]!.id);
    }
    if (!selectedDocTypeId && docTypes.length > 0) {
      setSelectedDocTypeId(docTypes[0]!.id);
    }
    setShowUploadModal(true);
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPickedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/pdf',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo seleccionar el archivo.');
    }
  };

  const handleSubmitDocument = async () => {
    const empId = selectedEmployeeId || employees[0]?.id;
    const typeId = selectedDocTypeId || docTypes[0]?.id;

    if (!empId || !typeId) {
      Alert.alert(
        'Datos incompletos',
        'Selecciona un colaborador y un tipo de documento.'
      );
      return;
    }

    if (!pickedFile) {
      Alert.alert('Archivo requerido', 'Selecciona un archivo PDF o imagen.');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        employee_id: empId,
        document_type_id: typeId,
        issue_date: issueDate.trim() || null,
        expiry_date: expiryDate.trim() || null,
        file: pickedFile,
      });

      setShowUploadModal(false);
      setPickedFile(null);
      setExpiryDate('');
      Alert.alert('Éxito', 'Documento guardado en Supabase correctamente.');
    } catch (err: any) {
      Alert.alert('Error al guardar', err.message || 'No se pudo registrar el documento.');
    }
  };

  const handleViewDocument = async (filePath: string, fileName: string) => {
    try {
      const signedUrl = await getSignedDocumentUrl(filePath);
      await Linking.openURL(signedUrl);
    } catch {
      Alert.alert(
        'Archivo Registrado',
        `Ruta en bucket: ${filePath}\nNombre: ${fileName}\n\nNota: Este registro proviene del seed SQL o aún no tiene el binario subido en el bucket 'employee-documents'.`
      );
    }
  };

  const handleDeleteDocument = (id: string, filePath: string, fileName: string) => {
    Alert.alert(
      'Eliminar Documento',
      `¿Deseas eliminar "${fileName}" de Supabase?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id, file_path: filePath });
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor="#1A56DB"
          />
        }
      >
        <View className="mb-4">
          <Text className="text-xl font-bold text-slate-900">
            Documentación Laboral y SST
          </Text>
          <Text className="text-xs text-slate-500">
            Consultando vista employee_documents_view en Supabase
          </Text>
        </View>

        {/* Upload button */}
        <Button
          title="Subir Nuevo Documento (PDF / Imagen)"
          variant="primary"
          icon={<Upload size={16} color="#FFFFFF" />}
          onPress={handleOpenUploadModal}
          className="mb-4"
        />

        {/* Filter tabs */}
        <View className="flex-row gap-2 mb-4">
          {(['all', 'por_vencer', 'vencido', 'vigente'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-full border ${
                filterStatus === st
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filterStatus === st ? 'text-white' : 'text-slate-600'
                }`}
              >
                {st === 'all'
                  ? 'Todos'
                  : st === 'por_vencer'
                  ? 'Por Vencer'
                  : st === 'vencido'
                  ? 'Vencidos'
                  : 'Vigentes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#1A56DB" className="py-10" />
        ) : docs.length === 0 ? (
          <Card className="p-6 items-center">
            <Text className="text-xs text-slate-500">
              No se encontraron documentos para este filtro en Supabase.
            </Text>
          </Card>
        ) : (
          docs.map((doc) => {
            const statusInfo = getDocumentStatusInfo(
              doc.expiry_date,
              doc.alert_days_before
            );
            return (
              <Card key={doc.id} className="p-4 mb-3">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold text-slate-900">
                      {doc.document_type_name}
                    </Text>
                    <Text className="text-xs text-slate-600 mt-0.5">
                      Colaborador: {doc.first_name} {doc.last_name}
                    </Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5">
                      Archivo: {doc.file_name}
                    </Text>
                  </View>
                  <Badge
                    label={statusInfo.label}
                    variant={statusInfo.badgeVariant}
                    size="sm"
                  />
                </View>

                <View className="border-t border-slate-100 pt-2 flex-row justify-between items-center">
                  <Text className="text-[11px] text-slate-500">
                    Vence: {doc.expiry_date || 'Sin vencimiento'}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                      onPress={() => handleViewDocument(doc.file_path, doc.file_name)}
                      className="flex-row items-center"
                    >
                      <ExternalLink size={13} color="#1A56DB" className="mr-1" />
                      <Text className="text-xs font-bold text-blue-600">
                        Ver Archivo
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteDocument(doc.id, doc.file_path, doc.file_name)
                      }
                    >
                      <Trash2 size={14} color="#E11D48" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal para subir documento */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900">
                Registrar Documento en Supabase
              </Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selector de Colaborador */}
              <Text className="text-xs font-semibold text-slate-700 mb-1.5">
                Colaborador *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 8 }}
              >
                {employees.map((emp) => {
                  const selected =
                    (selectedEmployeeId || employees[0]?.id) === emp.id;
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      onPress={() => setSelectedEmployeeId(emp.id)}
                      className={`px-3 py-2 rounded-xl border ${
                        selected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {emp.first_name} {emp.last_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selector de Tipo de Documento */}
              <Text className="text-xs font-semibold text-slate-700 mb-1.5">
                Tipo de Documento *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 8 }}
              >
                {docTypes.map((dt) => {
                  const selected =
                    (selectedDocTypeId || docTypes[0]?.id) === dt.id;
                  return (
                    <TouchableOpacity
                      key={dt.id}
                      onPress={() => setSelectedDocTypeId(dt.id)}
                      className={`px-3 py-2 rounded-xl border ${
                        selected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selected ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {dt.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input
                    label="Fecha Emisión (YYYY-MM-DD)"
                    placeholder="2026-10-01"
                    value={issueDate}
                    onChangeText={setIssueDate}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Fecha Vencimiento"
                    placeholder="2027-10-01 (opcional)"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSelectFile}
                className="p-4 border border-dashed border-blue-400 bg-blue-50/50 rounded-2xl items-center mb-5"
              >
                <Upload size={22} color="#1A56DB" className="mb-1" />
                <Text className="text-xs font-bold text-blue-700">
                  {pickedFile
                    ? `Archivo: ${pickedFile.name}`
                    : 'Seleccionar PDF o Imagen del dispositivo'}
                </Text>
              </TouchableOpacity>

              <Button
                title="Subir y Guardar"
                variant="primary"
                size="lg"
                loading={uploadMutation.isPending}
                onPress={handleSubmitDocument}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
