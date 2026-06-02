import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { barberService, Service } from '@/services/barberService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
    const { user, logout, refreshUser } = useAuth();
    const [nameEdit, setNameEdit]                 = useState(user?.name ?? '');
    const [shopNameEdit, setShopNameEdit]         = useState(user?.barber?.shop_name ?? '');
    const [cnpjEdit, setCnpjEdit]                 = useState(user?.barber?.cnpj ?? '');
    const [streetEdit, setStreetEdit]             = useState(user?.barber?.street ?? '');
    const [numberEdit, setNumberEdit]             = useState(user?.barber?.number ?? '');
    const [complementEdit, setComplementEdit]     = useState(user?.barber?.complement ?? '');
    const [neighborhoodEdit, setNeighborhoodEdit] = useState(user?.barber?.neighborhood ?? '');
    const [cityEdit, setCityEdit]                 = useState(user?.barber?.city ?? '');
    const [stateEdit, setStateEdit]               = useState(user?.barber?.state ?? '');
    const [zipCodeEdit, setZipCodeEdit]           = useState(user?.barber?.zip_code ?? '');
    const [notifSchedule, setNotifSchedule]       = useState(true);
    const [notifReminder, setNotifReminder]       = useState(true);
    const [notifPromo, setNotifPromo]             = useState(false);

    const [editModal, setEditModal]               = useState(false);
    const [saving, setSaving]                     = useState(false);
    const [feedbackMsg, setFeedbackMsg]           = useState('');
    const [feedbackType, setFeedbackType]         = useState<'success' | 'error'>('success');

    function showFeedback(msg: string, type: 'success' | 'error' = 'success') {
        setFeedbackMsg(msg);
        setFeedbackType(type);
        setTimeout(() => setFeedbackMsg(''), 4000);
    }

    useEffect(() => {
        if (editModal) {
            setNameEdit(user?.name ?? '');
            setShopNameEdit(user?.barber?.shop_name ?? '');
            setCnpjEdit(user?.barber?.cnpj ?? '');
            setStreetEdit(user?.barber?.street ?? '');
            setNumberEdit(user?.barber?.number ?? '');
            setComplementEdit(user?.barber?.complement ?? '');
            setNeighborhoodEdit(user?.barber?.neighborhood ?? '');
            setCityEdit(user?.barber?.city ?? '');
            setStateEdit(user?.barber?.state ?? '');
            setZipCodeEdit(user?.barber?.zip_code ?? '');
        }
    }, [editModal]);

    async function handleSave() {
        setSaving(true);
        try {
            await authService.updateBarberProfile({
                NAME:         nameEdit,
                SHOP_NAME:    shopNameEdit,
                STREET:       streetEdit,
                NUMBER:       numberEdit,
                COMPLEMENT:   complementEdit || null,
                NEIGHBORHOOD: neighborhoodEdit,
                CITY:         cityEdit,
                STATE:        stateEdit.toUpperCase(),
                ZIP_CODE:     zipCodeEdit,
            });
            await refreshUser();
            showFeedback('Perfil atualizado com sucesso!', 'success');
            setTimeout(() => setEditModal(false), 1500);
        } catch (err: any) {
            showFeedback(err.message || 'Erro ao atualizar. Tente novamente.', 'error');
        } finally {
            setSaving(false);
        }
    }

    const [settingsModal, setSettingsModal]       = useState(false);
    const [notifModal, setNotifModal]             = useState(false);
    const [helpModal, setHelpModal]               = useState(false);
    const [servicesModal, setServicesModal]       = useState(false);

    // Serviços
    const queryClient                             = useQueryClient();
    const [editingService, setEditingService]     = useState<Service | null>(null);
    const [svcName, setSvcName]                   = useState('');
    const [svcPrice, setSvcPrice]                 = useState('');
    const [svcDuration, setSvcDuration]           = useState('');
    const [svcFormVisible, setSvcFormVisible]     = useState(false);

    const { data: services = [], isLoading: loadingServices } = useQuery({
        queryKey: ['services-mine'],
        queryFn:  () => barberService.listMyServices(),
        enabled:  servicesModal,
    });

    const saveMutation = useMutation({
        mutationFn: () => {
            const payload = {
                NAME:             svcName,
                PRICE:            parseFloat(svcPrice),
                DURATION_MINUTES: parseInt(svcDuration),
            };
            return editingService
                ? barberService.updateService(editingService.id, payload)
                : barberService.createService(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services-mine'] });
            setSvcFormVisible(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => barberService.deleteService(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services-mine'] }),
    });

    function openNewService() {
        setEditingService(null);
        setSvcName('');
        setSvcPrice('');
        setSvcDuration('');
        setSvcFormVisible(true);
    }

    function openEditService(svc: Service) {
        setEditingService(svc);
        setSvcName(svc.name);
        setSvcPrice(String(svc.price));
        setSvcDuration(String(svc.duration_minutes));
        setSvcFormVisible(true);
    }

    const saveService  = () => { if (svcName && svcPrice && svcDuration) saveMutation.mutate(); };
    const deleteService = (id: string) => deleteMutation.mutate(id);

    const menuItems = [
        { label: 'Editar Perfil', icon: 'person-outline',       onPress: () => setEditModal(true) },
        ...(user?.type === 'BARBER'
            ? [{ label: 'Meus Serviços', icon: 'cut-outline', onPress: () => setServicesModal(true) }]
            : [{ label: 'Meus Agendamentos', icon: 'calendar-outline', onPress: () => router.push('/my-appointments') }]
        ),
        { label: 'Configurações', icon: 'settings-outline',      onPress: () => setSettingsModal(true) },
        { label: 'Notificações',  icon: 'notifications-outline', onPress: () => setNotifModal(true) },
        { label: 'Ajuda',         icon: 'help-circle-outline',   onPress: () => setHelpModal(true) },
    ]

    return (
    <SafeAreaView style={styles.safe}>

        <View style={styles.header}>
            <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        <View style={styles.userCard}>
            <View style={styles.avatar} />
            <View>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>
        </View>

        <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
                <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
                    onPress={item.onPress}
                >
                    <Ionicons name={item.icon as any} size={22} color="#333" />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#aaa" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={logout}>
                <Ionicons name="log-out-outline" size={22} color="#ffb300" />
                <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
        </View>

        <Modal visible={editModal} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheetTall}>
                    <Text style={styles.sheetTitle}>Editar Perfil</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>

                        <Text style={styles.sheetLabel}>Nome</Text>
                        <TextInput style={styles.sheetInput} value={nameEdit} onChangeText={setNameEdit} />

                        <Text style={styles.sheetLabel}>E-mail</Text>
                        <TextInput style={[styles.sheetInput, styles.inputDisabled]} value={user?.email} editable={false} />

                        {user?.type === 'BARBER' && (
                            <>
                                <View style={styles.sectionDivider}>
                                    <Text style={styles.sectionTitle}>Dados da Barbearia</Text>
                                </View>

                                <Text style={styles.sheetLabel}>Nome da Barbearia</Text>
                                <TextInput style={styles.sheetInput} placeholder="Ex: Barbearia do João" value={shopNameEdit} onChangeText={setShopNameEdit} />

                                <Text style={styles.sheetLabel}>CNPJ</Text>
                                <TextInput style={styles.sheetInput} placeholder="00.000.000/0000-00" value={cnpjEdit} onChangeText={setCnpjEdit} keyboardType="numeric" />

                                <View style={styles.sectionDivider}>
                                    <Text style={styles.sectionTitle}>Endereço da Barbearia</Text>
                                </View>

                                <Text style={styles.sheetLabel}>CEP</Text>
                                <TextInput style={styles.sheetInput} placeholder="00000-000" value={zipCodeEdit} onChangeText={setZipCodeEdit} keyboardType="numeric" maxLength={9} />

                                <View style={styles.row2col}>
                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.sheetLabel}>Rua</Text>
                                        <TextInput style={styles.sheetInput} placeholder="Ex: Rua das Flores" value={streetEdit} onChangeText={setStreetEdit} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.sheetLabel}>Número</Text>
                                        <TextInput style={styles.sheetInput} placeholder="123" value={numberEdit} onChangeText={setNumberEdit} keyboardType="numeric" />
                                    </View>
                                </View>

                                <Text style={styles.sheetLabel}>Bairro</Text>
                                <TextInput style={styles.sheetInput} placeholder="Ex: Centro" value={neighborhoodEdit} onChangeText={setNeighborhoodEdit} />

                                <View style={styles.row2col}>
                                    <View style={{ flex: 2 }}>
                                        <Text style={styles.sheetLabel}>Cidade</Text>
                                        <TextInput style={styles.sheetInput} placeholder="Ex: São Paulo" value={cityEdit} onChangeText={setCityEdit} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={styles.sheetLabel}>UF</Text>
                                        <TextInput style={styles.sheetInput} placeholder="SP" value={stateEdit} onChangeText={setStateEdit} maxLength={2} autoCapitalize="characters" />
                                    </View>
                                </View>

                                <Text style={styles.sheetLabel}>Complemento (opcional)</Text>
                                <TextInput style={styles.sheetInput} placeholder="Ex: Sala 2" value={complementEdit} onChangeText={setComplementEdit} />
                            </>
                        )}

                        {feedbackMsg !== '' && (
                            <Text style={[styles.feedback, feedbackType === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
                                {feedbackMsg}
                            </Text>
                        )}

                        <View style={styles.sheetRow}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setEditModal(false)}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnConfirm} onPress={handleSave} disabled={saving}>
                                <Text style={styles.btnConfirmText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </View>
        </Modal>

        <Modal visible={settingsModal} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.sheetTitle}>Configurações</Text>
                    <TouchableOpacity style={styles.settingsItem} onPress={() => { setSettingsModal(false); router.push('/changePass'); }}>
                        <Ionicons name="lock-closed-outline" size={20} color="#333" />
                        <Text style={styles.settingsLabel}>Alterar senha</Text>
                        <Ionicons name="chevron-forward" size={16} color="#aaa" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingsItem}>
                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                        <Text style={[styles.settingsLabel, { color: '#e74c3c' }]}>Excluir conta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnClose} onPress={() => setSettingsModal(false)}>
                        <Text style={styles.btnCloseText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        <Modal visible={notifModal} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.sheetTitle}>Notificações</Text>
                    {[
                        { label: 'Novos agendamentos', value: notifSchedule, setter: setNotifSchedule },
                        { label: 'Lembretes',          value: notifReminder, setter: setNotifReminder },
                        { label: 'Promoções',          value: notifPromo,    setter: setNotifPromo },
                    ].map(item => (
                        <View key={item.label} style={styles.switchRow}>
                            <Text style={styles.switchLabel}>{item.label}</Text>
                            <Switch
                                value={item.value}
                                onValueChange={item.setter}
                                thumbColor="#fff"
                                trackColor={{ true: '#ffb300', false: '#ccc' }}
                            />
                        </View>
                    ))}
                    <TouchableOpacity style={styles.btnClose} onPress={() => setNotifModal(false)}>
                        <Text style={styles.btnCloseText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        <Modal visible={helpModal} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.sheetTitle}>Ajuda</Text>
                    {[
                        { question: 'Como cancelar um agendamento?', answer: 'Acesse a tela de Agenda, pressione o agendamento e selecione Cancelar.' },
                        { question: 'Como alterar minha senha?',     answer: 'Vá em Perfil → Configurações → Alterar senha.' },
                        { question: 'Suporte',                       answer: 'Entre em contato pelo e-mail suporte@barberapp.com' },
                    ].map(item => (
                        <View key={item.question} style={styles.faqItem}>
                            <Text style={styles.faqQuestion}>{item.question}</Text>
                            <Text style={styles.faqAnswer}>{item.answer}</Text>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.btnClose} onPress={() => setHelpModal(false)}>
                        <Text style={styles.btnCloseText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* Modal Meus Serviços */}
        <Modal visible={servicesModal} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.sheetTall}>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={styles.sheetTitle}>Meus Serviços</Text>
                        <TouchableOpacity onPress={openNewService}>
                            <Ionicons name="add-circle" size={28} color="#ffb300" />
                        </TouchableOpacity>
                    </View>

                    {svcFormVisible && (
                        <View style={styles.svcForm}>
                            <Text style={styles.svcFormTitle}>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</Text>

                            <Text style={styles.sheetLabel}>Nome</Text>
                            <TextInput style={styles.sheetInput} placeholder="Ex: Corte" value={svcName} onChangeText={setSvcName} />

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sheetLabel}>Preço (R$)</Text>
                                    <TextInput style={styles.sheetInput} placeholder="35.00" value={svcPrice} onChangeText={setSvcPrice} keyboardType="decimal-pad" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sheetLabel}>Duração (min)</Text>
                                    <TextInput style={styles.sheetInput} placeholder="30" value={svcDuration} onChangeText={setSvcDuration} keyboardType="numeric" />
                                </View>
                            </View>

                            <View style={styles.sheetRow}>
                                <TouchableOpacity style={styles.btnCancel} onPress={() => setSvcFormVisible(false)}>
                                    <Text style={styles.btnCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btnConfirm, saveMutation.isPending && { opacity: 0.6 }]}
                                    onPress={saveService}
                                    disabled={saveMutation.isPending}
                                >
                                    <Text style={styles.btnConfirmText}>{saveMutation.isPending ? 'Salvando...' : 'Salvar'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {loadingServices ? (
                            <Text style={{ textAlign: 'center', color: '#aaa', marginTop: 20 }}>Carregando...</Text>
                        ) : services.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: '#aaa', marginTop: 20 }}>
                                Nenhum serviço cadastrado ainda.{'\n'}Toque em + para adicionar.
                            </Text>
                        ) : (
                            services.map(svc => (
                                <View key={svc.id} style={styles.svcItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.svcName}>{svc.name}</Text>
                                        <Text style={styles.svcMeta}>{svc.duration_minutes} min · R$ {Number(svc.price ?? 0).toFixed(2)}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => openEditService(svc)} style={{ marginRight: 12 }}>
                                        <Ionicons name="pencil-outline" size={20} color="#888" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteService(svc.id)}>
                                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.btnClose} onPress={() => { setServicesModal(false); setSvcFormVisible(false); }}>
                        <Text style={styles.btnCloseText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

    </SafeAreaView>
);

}

const styles = StyleSheet.create({
    safe:           { flex: 1, backgroundColor: '#f5f5f5' },

    header:         { backgroundColor: '#fff', paddingHorizontal: 20,
                      paddingVertical: 16, marginBottom: 12 },
    headerTitle:    { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },

    userCard:       { flexDirection: 'row', alignItems: 'center',
                      backgroundColor: '#fff', marginHorizontal: 16,
                      borderRadius: 12, padding: 16, gap: 14, marginBottom: 12 },
    avatar:         { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ccc' },
    name:           { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a' },
    email:          { fontSize: 13, color: '#888', marginTop: 2 },

    menuCard:       { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
    menuItem:       { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    menuLabel:      { fontSize: 15, color: '#1a1a1a' },
    divider:        { height: 1, backgroundColor: '#f0f0f0' },
    logoutText:     { fontSize: 15, color: '#ffb300', fontWeight: '600' },

    overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    sheetTitle:     { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 20 },
    sheetLabel:     { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
    sheetInput:     { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 },
    inputDisabled:  { backgroundColor: '#f5f5f5', color: '#aaa' },
    sheetRow:       { flexDirection: 'row', gap: 12, marginTop: 8 },
    btnCancel:      { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    btnCancelText:  { color: '#666', fontWeight: '600' },
    btnConfirm:     { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#ffb300', alignItems: 'center' },
    btnConfirmText: { color: '#fff', fontWeight: '700' },
    btnClose:       { marginTop: 20, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    btnCloseText:   { color: '#666', fontWeight: '600' },
    settingsItem:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    settingsLabel:  { fontSize: 15, color: '#1a1a1a' },
    switchRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    switchLabel:    { fontSize: 15, color: '#1a1a1a' },
    faqItem:        { marginBottom: 16 },
    faqQuestion:    { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
    faqAnswer:      { fontSize: 13, color: '#666', lineHeight: 20 },

    sheetTall:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '90%' },
    feedback:        { textAlign: 'center', fontSize: 13, borderRadius: 6, padding: 10, marginBottom: 12 },
    feedbackSuccess: { backgroundColor: '#d4edda', color: '#155724' },
    feedbackError:   { backgroundColor: '#f8d7da', color: '#721c24' },
    sectionDivider: { borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4, marginBottom: 16, paddingTop: 16 },
    sectionTitle:   { fontSize: 13, fontWeight: '700', color: '#ffb300', textTransform: 'uppercase', letterSpacing: 0.5 },
    row2col:        { flexDirection: 'row', alignItems: 'flex-start' },

    svcForm:        { backgroundColor: '#fffbf0', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ffb300' },
    svcFormTitle:   { fontSize: 14, fontWeight: '700', color: '#b8860b', marginBottom: 12 },
    svcItem:        { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, backgroundColor: '#f9f9f9', marginBottom: 10 },
    svcName:        { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    svcMeta:        { fontSize: 12, color: '#888', marginTop: 2 },
});
