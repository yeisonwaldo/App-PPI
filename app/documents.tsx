import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import {
  FileText,
  Upload,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MOCK_DOCUMENTS_VIEW, MOCK_EMPLOYEES } from '@/lib/mockData';
import { getDocumentStatusInfo } from '@/lib/formatters';
import type { EmployeeDocumentView } from '@/types/database';

export default function DocumentsScreen() {
  const router = useRouter();
  const [docs, setDocs] = useState<EmployeeDocumentView[]>(MOCK_DOCUMENTS_VIEW);
  const [filterStatus, setFilterStatus] = useState<'all' | 'vigente' | 'por_vencer' | 'vencido'>('all');

  const filteredDocs = filterStatus === 'all' ? docs : docs.filter((d) => d.status === filterStatus);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        Alert.alert(
          'Documento Seleccionado',
          `Archivo: ${file.name}\nTamaño: ${(file.size ? file.size / 1024 : 0).toFixed(1)} KB.\n\nEn un entorno conectado, se subirá directamente al bucket 'employee-documents' en Supabase Storage con ruta segura.`,
          [
            {
              text: 'Simular Carga',
              onPress: () => {
                const newDoc: EmployeeDocumentView = {
                  id: `d-${Date.now()}`,
                  company_id: 'c0000000-0000-0000-0000-000000000001',
                  employee_id: MOCK_EMPLOYEES[0]!.id,
                  document_type_id: 'dt-nuevo',
                  file_path: `docs/${file.name}`,
                  file_name: file.name,
                  issue_date: '2026-10-01',
                  expiry_date: '2027-10-01',
                  uploaded_by: null,
                  first_name: MOCK_EMPLOYEES[0]!.first_name,
                  last_name: MOCK_EMPLOYEES[0]!.last_name,
                  document_number: MOCK_EMPLOYEES[0]!.document_number,
                  document_type_name: 'Certificación Laboral / SST',
                  requires_expiry: true,
                  alert_days_before: 30,
                  status: 'vigente',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                setDocs([newDoc, ...docs]);
                Alert.alert('Éxito', 'Documento registrado y verificado.');
              },
            },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      <View className="mb-4">
        <Text className="text-xl font-bold text-slate-900">
          Documentación Laboral y SST
        </Text>
        <Text className="text-xs text-slate-500">
          Exámenes médicos, alturas, contratos y afiliaciones
        </Text>
      </View>

      {/* Upload button */}
      <Button
        title="Subir Nuevo Documento (PDF / Imagen)"
        variant="primary"
        icon={<Upload size={16} color="#FFFFFF" />}
        onPress={handlePickDocument}
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
      {filteredDocs.map((doc) => {
        const statusInfo = getDocumentStatusInfo(doc.expiry_date);
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
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Previsualización de Documento',
                    `Nombre: ${doc.file_name}\nEstado: ${statusInfo.label}\n\nEn la versión conectada se genera un Signed URL privado de 1 hora de vigencia de Supabase Storage.`
                  )
                }
              >
                <Text className="text-xs font-bold text-blue-600">Ver Archivo</Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}
