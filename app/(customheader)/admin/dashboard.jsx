import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Alert, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

// Lightweight custom Select — uses Modal to avoid all zIndex issues on web & native
const AppSelect = ({ items, placeholder, value, onValueChange }) => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
                <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
                    {value ? value.label : placeholder}
                </Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color='#64748b' />
            </Pressable>

            <Modal
                visible={open}
                transparent
                animationType='fade'
                onRequestClose={() => setOpen(false)}
            >
                <Pressable style={styles.pickerOverlay} onPress={() => setOpen(false)}>
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>{placeholder}</Text>
                            <Pressable onPress={() => setOpen(false)} style={styles.pickerClose}>
                                <Ionicons name='close' size={20} color='#64748b' />
                            </Pressable>
                        </View>
                        <FlatList
                            data={items}
                            keyExtractor={(item) => String(item.value)}
                            renderItem={({ item }) => {
                                const isSelected = value?.value === item.value
                                return (
                                    <Pressable
                                        style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                                        onPress={() => {
                                            onValueChange(item)
                                            setOpen(false)
                                        }}
                                    >
                                        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                                            {item.label}
                                        </Text>
                                        {isSelected && <Ionicons name='checkmark' size={16} color='#6366f1' />}
                                    </Pressable>
                                )
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>
        </>
    )
}

const Dashboard = () => {
    // --- States ---
    const [feedIntegrations, setFeedIntegrations] = useState([])
    const [providers, setProviders] = useState([])
    const [automatedUsers, setAutomatedUsers] = useState([])

    // Feed Integration Modal state
    const [selectedIntegration, setSelectedIntegration] = useState(null)
    const [modalIntegrationProvider, setModalIntegrationProvider] = useState(null)
    const [modalIntegrationUser, setModalIntegrationUser] = useState(null)
    const [modalIntegrationTag, setModalIntegrationTag] = useState('')

    // Provider Modal state
    const [selectedProvider, setSelectedProvider] = useState(null)
    const [modalProviderName, setModalProviderName] = useState('')
    const [modalProviderBaseUrl, setModalProviderBaseUrl] = useState('')

    // User Modal state
    const [selectedUser, setSelectedUser] = useState(null)
    const [modalFirstName, setModalFirstName] = useState('')
    const [modalLastName, setModalLastName] = useState('')

    const mockFeedIntegrations = [
        { id: 1, provider: { name: "Provider 1" }, user: { name: "User 1" } },
        { id: 2, provider: { name: "Provider 2" }, user: { name: "User 2" } },
    ]

    useEffect(() => {

        const fetchAdminDashboardData = async () => {
            try {
                const feedIntegrationsRes = await axios.get(`http://localhost:8080/feed/integration/all`)
                const feedProvidersRes = await axios.get(`http://localhost:8080/feed/provider/all`)
                const feedAccountsRes = await axios.get(`http://localhost:8080/feed/account/all`)
                const [feedIntegrations, feedProviders, feedAccounts] = await Promise.all([feedIntegrationsRes, feedProvidersRes, feedAccountsRes])
                console.log(feedIntegrations.data.data)
                setFeedIntegrations(feedIntegrations.data.data)
                setProviders(feedProviders.data.data)
                setAutomatedUsers(feedAccounts.data.data)
            } catch (err) {
                console.log("error", err.response.data)
            }
        }
        fetchAdminDashboardData()

    }, [])

    // Sync Feed Integration modal selected dropdown items
    useEffect(() => {
        if (selectedIntegration) {
            const hasProvider = providers.find(p => p.id === selectedIntegration.provider?.id || p.name === selectedIntegration.provider?.name)
            const hasUser = automatedUsers.find(u => u.id === selectedIntegration.user?.id || (u.firstName + u.lastName) === selectedIntegration.user?.name || u.name === selectedIntegration.user?.name)
            setModalIntegrationProvider(hasProvider ? { value: hasProvider.id, label: hasProvider.name } : null)
            setModalIntegrationUser(hasUser ? { value: hasUser.id, label: (hasUser.firstName && hasUser.lastName) ? (hasUser.firstName + ' ' + hasUser.lastName) : (hasUser.name || hasUser.id) } : null)
            setModalIntegrationTag(selectedIntegration.tag || '')
        } else {
            setModalIntegrationProvider(null)
            setModalIntegrationUser(null)
            setModalIntegrationTag('')
        }
    }, [selectedIntegration, providers, automatedUsers])

    // Sync Provider modal text input
    useEffect(() => {
        if (selectedProvider) {
            setModalProviderName(selectedProvider.name || '')
            setModalProviderBaseUrl(selectedProvider.url || '')
        } else {
            setModalProviderName('')
            setModalProviderBaseUrl('')
        }
    }, [selectedProvider])

    // Sync User modal text input
    useEffect(() => {
        if (selectedUser) {
            setModalFirstName(selectedUser.firstName || selectedUser.name || '')
            setModalLastName(selectedUser.lastName || '')
        } else {
            setModalFirstName('')
            setModalLastName('')
        }
    }, [selectedUser])

    // --- Feed Integration Actions ---
    const handleEditIntegration = (id) => {
        const integration = feedIntegrations.find(item => item.id === id)
        setSelectedIntegration(integration)
    }

    const handleDeleteIntegration = (id) => {
        const performDelete = async () => {
            try {
                const res = await axios.delete(`http://localhost:8080/feed/integration/${id}`)
                if (res.data.success) {
                    setFeedIntegrations(prev => prev.filter(item => item.id !== id))
                }
            } catch (err) {
                console.log("Error deleting integration", err)
            }
            setSelectedIntegration(null)
        }

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this feed integration?')) {
                performDelete()
            }
        } else {
            Alert.alert(
                'Delete Feed Integration',
                'Are you sure you want to delete this feed integration?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: performDelete }
                ]
            )
        }
    }

    const handleSaveIntegration = async () => {
        if (!modalIntegrationProvider || !modalIntegrationUser) {
            if (Platform.OS === 'web') {
                window.alert('Please select both provider and user.')
            } else {
                Alert.alert('Error', 'Please select both provider and user.')
            }
            return
        }

        if (selectedIntegration.id === 'new') {
            try {
                const res = await axios.post("http://localhost:8080/feed/integration", {
                    providerId: modalIntegrationProvider.value,
                    userId: String(modalIntegrationUser.value),
                    tag: String(modalIntegrationTag)
                })

                if (res.data.success) {
                    setFeedIntegrations(prev => [...prev, res.data.data])
                } else {
                    Alert.alert("Error", res.data.message)
                }
            } catch {
                Alert.alert("Error", "Something went wrong")
            }
        } else {
            try {
                const res = await axios.put(`http://localhost:8080/feed/integration/${selectedIntegration.id}`, {
                    providerId: modalIntegrationProvider.value,
                    userId: String(modalIntegrationUser.value),
                    tag: String(modalIntegrationTag)
                })
                if (res.data.success) {
                    setFeedIntegrations(prev => prev.map(item =>
                        item.id === selectedIntegration.id ? res.data.data : item
                    ))
                } else {
                    Alert.alert("Error", res.data.message)
                }
            } catch (err) {
                console.log("Error updating feed integration", err)
                Alert.alert("Error", "Something went wrong updating feed integration")
            }
        }
        setSelectedIntegration(null)
    }

    const handleStartTask = async (id) => {
        try {
            const res = await axios.post(`http://localhost:8080/feed/integration/${id}/start`)
            if (res.data.success) {
                setFeedIntegrations(prev => prev.map(item => {
                    if (item.id === id) {
                        return { ...item, isScheduled: true, taskStatus: 'scheduled' }
                    }
                    return item
                }))
            }
        } catch (err) {
            console.log(err)
        }
    }

    const handleStopTask = async (id) => {
        try {
            const res = await axios.post(`http://localhost:8080/feed/integration/${id}/stop`)
            if (res.data.success) {
                setFeedIntegrations(prev => prev.map(item => {
                    if (item.id === id) {
                        return { ...item, isScheduled: false, taskStatus: 'stopped' }
                    }
                    return item
                }))
            }
        } catch (err) {
            console.log(err)
        }
    }


    // --- Provider Actions ---
    const handleEditProvider = (id) => {
        const provider = providers.find(item => item.id === id)
        setSelectedProvider(provider)
    }

    const handleDeleteProvider = (id) => {
        const performDelete = async () => {
            try {
                const res = await axios.delete(`http://localhost:8080/feed/provider/${id}`)
                if (res.data.success) {
                    setProviders(prev => prev.filter(item => item.id !== id))
                    setFeedIntegrations(prev => prev.filter(f => f.providerId !== id && f.provider?.id !== id))
                }
            } catch (err) {
                console.log("Error deleting provider", err)
            }
            setSelectedProvider(null)
        }

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this provider? Associated feed integrations will also be removed.')) {
                performDelete()
            }
        } else {
            Alert.alert(
                'Delete Provider',
                'Are you sure you want to delete this provider? Associated feed integrations will also be removed.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: performDelete }
                ]
            )
        }
    }

    const handleSaveProvider = async () => {
        const isValid = (modalProviderName.trim() !== "") && (modalProviderBaseUrl.trim() !== "")
        if (!isValid) {
            if (Platform.OS === 'web') {
                window.alert('Please enter a provider name and base URL.')
            } else {
                Alert.alert('Error', 'Please enter a provider name and base URL.')
            }
            return
        }

        if (selectedProvider.id === 'new') {
            try {
                const res = await axios.post('http://localhost:8080/feed/provider', {
                    name: modalProviderName,
                    url: modalProviderBaseUrl
                })

                if (res.data.success) {
                    setProviders(prev => [...prev, res.data.data])
                } else {
                    Alert.alert('Error', 'Provider Creation Failed')
                }
            } catch (e) {
                console.log(e)
                Alert.alert('Error', 'Something went wrong')
            }
        } else {
            try {
                const res = await axios.put(`http://localhost:8080/feed/provider/${selectedProvider.id}`, {
                    name: modalProviderName,
                    url: modalProviderBaseUrl
                })
                if (res.data.success) {
                    setProviders(prev => prev.map(item =>
                        item.id === selectedProvider.id ? res.data.data : item
                    ))
                    setFeedIntegrations(prev => prev.map(f =>
                        f.providerId === selectedProvider.id || f.provider?.id === selectedProvider.id
                            ? { ...f, provider: res.data.data }
                            : f
                    ))
                }
            } catch (e) {
                console.log("Error updating provider", e)
                Alert.alert('Error', 'Failed to update provider')
            }
        }
        setSelectedProvider(null)
    }

    // --- User Actions ---
    const handleEditUser = (id) => {
        const user = automatedUsers.find(item => item.id === id)
        setSelectedUser(user)
    }

    const handleDeleteUser = (id) => {
        const performDelete = async () => {
            try {
                const res = await axios.delete(`http://localhost:8080/user/${id}`)
                if (res.data.success) {
                    setAutomatedUsers(prev => prev.filter(item => item.id !== id))
                    setFeedIntegrations(prev => prev.filter(f => f.userId !== id && f.user?.id !== id))
                }
            } catch (err) {
                console.log("Error deleting user", err)
            }
            setSelectedUser(null)
        }

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this automated user? Associated feed integrations will also be removed.')) {
                performDelete()
            }
        } else {
            Alert.alert(
                'Delete Automated User',
                'Are you sure you want to delete this automated user? Associated feed integrations will also be removed.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: performDelete }
                ]
            )
        }
    }

    const handleSaveUser = async () => {
        const isValid = (modalFirstName.trim() !== "") || (modalLastName.trim() !== "")
        if (!isValid) {
            if (Platform.OS === 'web') {
                window.alert('Please enter a user name.')
            } else {
                Alert.alert('Error', 'Please enter a user name.')
            }
            return
        }

        if (selectedUser.id === 'new') {
            try {
                const res = await axios.post('http://localhost:8080/feed/account', {
                    email: String(modalFirstName + modalLastName).toLowerCase().replace(/\s+/g, '') + "@studenthub.com",
                    firstName: modalFirstName,
                    lastName: modalLastName,
                    role: 'automated'
                })
                if (res.data.success) {
                    setAutomatedUsers(prev => [...prev, res.data.data])
                }
            } catch (error) {
                console.log("error creating feed user account", error)
            }
        } else {
            try {
                const res = await axios.put(`http://localhost:8080/user/${selectedUser.id}`, {
                    firstName: modalFirstName,
                    lastName: modalLastName
                })
                if (res.data.success) {
                    setAutomatedUsers(prev => prev.map(item =>
                        item.id === selectedUser.id ? res.data.data : item
                    ))
                    setFeedIntegrations(prev => prev.map(f =>
                        f.userId === selectedUser.id || f.user?.id === selectedUser.id
                            ? { ...f, user: { ...f.user, firstName: res.data.data.firstName, lastName: res.data.data.lastName } }
                            : f
                    ))
                }
            } catch (err) {
                console.log("Error updating user", err)
            }
        }
        setSelectedUser(null)
    }

    const providerItems = providers.map(p => ({ value: p.id, label: p.name }))
    const userItems = automatedUsers.map(u => ({ value: u.id, label: (u.firstName && u.lastName) ? (u.firstName + ' ' + u.lastName) : (u.name || u.id) }))

    return (
        <ScrollView className='flex-1 bg-[#f5f6f8]' contentContainerStyle={{ padding: 24, gap: 24 }}>
            {/* Header */}
            <View className='flex-row justify-between items-center'>
                <View>
                    <Text className='text-2xl font-bold text-slate-800'>Admin Dashboard</Text>
                    <Text className='text-sm text-slate-500 mt-1'>Manage your platform and system configurations</Text>
                </View>
            </View>

            {/* Analytics Card */}
            <View className='w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex-row items-center gap-4'>
                <View className='w-12 h-12 rounded-xl bg-violet-50 items-center justify-center'>
                    <Ionicons name='analytics' size={24} color='#6366f1' />
                </View>
                <View>
                    <Text className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>System Status</Text>
                    <Text className='text-lg font-bold text-slate-800'>All services running normally</Text>
                </View>
            </View>

            {/* Feed Integrations Section */}
            <View className='w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex-col'>
                <View className='flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100'>
                    <View className='flex-row items-center gap-2'>
                        <Ionicons name='git-merge-outline' size={20} color='#475569' />
                        <Text className='font-bold text-lg text-slate-800'>Feed Integrations</Text>
                    </View>
                    <View className='flex-row items-center gap-3'>
                        <View className='bg-slate-100 px-2.5 py-1 rounded-full'>
                            <Text className='text-xs font-semibold text-slate-600'>{feedIntegrations.length} Active</Text>
                        </View>
                        <Pressable
                            className='flex-row items-center gap-1 bg-indigo-600 px-3 py-1.5 rounded-lg active:bg-indigo-700'
                            onPress={() => setSelectedIntegration({ id: 'new', provider: { name: '' }, user: { name: '' } })}
                        >
                            <Ionicons name='add' size={16} color='#ffffff' />
                            <Text className='text-xs font-semibold text-white'>Add</Text>
                        </Pressable>
                    </View>
                </View>

                {feedIntegrations.length === 0 ? (
                    <View className='py-8 items-center justify-center'>
                        <Ionicons name='file-tray-outline' size={40} color='#94a3b8' />
                        <Text className='text-slate-400 mt-2 text-sm'>No feed integrations configured</Text>
                    </View>
                ) : (
                    <View className='gap-3'>
                        {feedIntegrations.map((feedIntegration) => (
                            <View key={feedIntegration.id} className='w-full flex-row items-center justify-between border border-slate-100 rounded-xl p-4 bg-slate-50/50'>
                                <View className='flex-row items-center gap-4 flex-1'>
                                    <View className='w-10 h-10 rounded-lg bg-slate-200/60 items-center justify-center'>
                                        <Ionicons name='logo-rss' size={20} color='#475569' />
                                    </View>
                                    <View className='flex-1 gap-0.5'>
                                        <View className='flex-row items-center gap-2'>
                                            <View className='flex-col pb-2'>
                                                <Text className='font-semibold text-slate-800 text-base'>{feedIntegration.provider.name} </Text>
                                                <Text className='text-slate-500 text-[10px]'>[{feedIntegration.tag}]</Text>
                                            </View>
                                            <View className='bg-slate-200 px-1.5 py-0.5 rounded'>
                                                <Text className='text-[10px] font-bold text-slate-600'>ID: {feedIntegration.id}</Text>
                                            </View>
                                        </View>
                                        <View className='flex-row items-center gap-1'>
                                            <Ionicons name='person-outline' size={12} color='#64748b' />
                                            <Text className='text-xs text-slate-500'>{feedIntegration.user.firstName + ' ' + feedIntegration.user.lastName}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View className='flex-col items-center gap-2'>
                                    <Pressable
                                        className='h-8 px-3 rounded-lg border border-slate-200 bg-white items-center justify-center flex-row gap-1 active:bg-slate-50'
                                        onPress={() => handleEditIntegration(feedIntegration.id)}
                                    >
                                        <Ionicons name='create-outline' size={14} color='#475569' />
                                        <Text className='text-xs font-medium text-slate-700'>Edit</Text>
                                    </Pressable>
                                    {
                                        feedIntegration?.taskStatus === 'scheduled' ? (
                                            <Pressable onPress={() => handleStopTask(feedIntegration.id)} className='h-8 px-3 rounded-lg border border-slate-200 bg-white items-center justify-center flex-row gap-1 active:bg-slate-50' >
                                                <Ionicons name='pause-outline' size={14} color='#dc2626' />
                                                <Text>Stop</Text>
                                            </Pressable>) :
                                            (
                                                <Pressable onPress={() => handleStartTask(feedIntegration.id)} className='h-8 px-3 rounded-lg border border-slate-200 bg-white items-center justify-center flex-row gap-1 active:bg-slate-50'>
                                                    <Ionicons name='play-outline' size={14} color='#22c55e' />
                                                    <Text>Start</Text>
                                                </Pressable>)
                                    }
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Providers Section */}
            <View className='w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex-col'>
                <View className='flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100'>
                    <View className='flex-row items-center gap-2'>
                        <Ionicons name='radio-outline' size={20} color='#475569' />
                        <Text className='font-bold text-lg text-slate-800'>Providers</Text>
                    </View>
                    <View className='flex-row items-center gap-3'>
                        <View className='bg-slate-100 px-2.5 py-1 rounded-full'>
                            <Text className='text-xs font-semibold text-slate-600'>{providers.length} Total</Text>
                        </View>
                        <Pressable
                            className='flex-row items-center gap-1 bg-indigo-600 px-3 py-1.5 rounded-lg active:bg-indigo-700'
                            onPress={() => setSelectedProvider({ id: 'new', name: '' })}
                        >
                            <Ionicons name='add' size={16} color='#ffffff' />
                            <Text className='text-xs font-semibold text-white'>Add</Text>
                        </Pressable>
                    </View>
                </View>

                {providers.length === 0 ? (
                    <View className='py-8 items-center justify-center'>
                        <Ionicons name='file-tray-outline' size={40} color='#94a3b8' />
                        <Text className='text-slate-400 mt-2 text-sm'>No providers configured</Text>
                    </View>
                ) : (
                    <View className='gap-3'>
                        {providers.map((provider) => (
                            <View key={provider.id} className='w-full flex-row items-center justify-between border border-slate-100 rounded-xl p-4 bg-slate-50/50'>
                                <View className='flex-row items-center gap-4 flex-1'>
                                    <View className='w-10 h-10 rounded-lg bg-indigo-50 items-center justify-center'>
                                        <Ionicons name='wifi-outline' size={20} color='#6366f1' />
                                    </View>
                                    <View className='flex-1 gap-0.5'>
                                        <View className='flex-row items-center gap-2'>
                                            <Text className='font-semibold text-slate-800 text-base'>{provider.name}</Text>
                                            <View className='bg-slate-200 px-1.5 py-0.5 rounded'>
                                                <Text className='text-[10px] font-bold text-slate-600'>ID: {provider.id}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <Pressable
                                    className='h-8 px-3 rounded-lg border border-slate-200 bg-white items-center justify-center flex-row gap-1 active:bg-slate-50'
                                    onPress={() => handleEditProvider(provider.id)}
                                >
                                    <Ionicons name='create-outline' size={14} color='#475569' />
                                    <Text className='text-xs font-medium text-slate-700'>Edit</Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* Automated Users Section */}
            <View className='w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex-col'>
                <View className='flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100'>
                    <View className='flex-row items-center gap-2'>
                        <Ionicons name='people-outline' size={20} color='#475569' />
                        <Text className='font-bold text-lg text-slate-800'>Automated Users</Text>
                    </View>
                    <View className='flex-row items-center gap-3'>
                        <View className='bg-slate-100 px-2.5 py-1 rounded-full'>
                            <Text className='text-xs font-semibold text-slate-600'>{automatedUsers.length} Total</Text>
                        </View>
                        <Pressable
                            className='flex-row items-center gap-1 bg-indigo-600 px-3 py-1.5 rounded-lg active:bg-indigo-700'
                            onPress={() => setSelectedUser({ id: 'new', name: '' })}
                        >
                            <Ionicons name='add' size={16} color='#ffffff' />
                            <Text className='text-xs font-semibold text-white'>Add</Text>
                        </Pressable>
                    </View>
                </View>

                {automatedUsers.length === 0 ? (
                    <View className='py-8 items-center justify-center'>
                        <Ionicons name='file-tray-outline' size={40} color='#94a3b8' />
                        <Text className='text-slate-400 mt-2 text-sm'>No automated users configured</Text>
                    </View>
                ) : (
                    <View className='gap-3'>
                        {automatedUsers.map((user) => (
                            <View key={user.id} className='w-full flex-row items-center justify-between border border-slate-100 rounded-xl p-4 bg-slate-50/50'>
                                <View className='flex-row items-center gap-4 flex-1'>
                                    <View className='w-10 h-10 rounded-lg bg-emerald-50 items-center justify-center'>
                                        <Ionicons name='person-circle-outline' size={22} color='#10b981' />
                                    </View>
                                    <View className='flex-1 gap-0.5'>
                                        <View className='flex-row items-center gap-2'>
                                            <Text className='font-semibold text-slate-800 text-base'>{user.name}</Text>
                                            <View className='bg-slate-200 px-1.5 py-0.5 rounded'>
                                                <Text className='text-[10px] font-bold text-slate-600'>ID: {user.id}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <Pressable
                                    className='h-8 px-3 rounded-lg border border-slate-200 bg-white items-center justify-center flex-row gap-1 active:bg-slate-50'
                                    onPress={() => handleEditUser(user.id)}
                                >
                                    <Ionicons name='create-outline' size={14} color='#475569' />
                                    <Text className='text-xs font-medium text-slate-700'>Edit</Text>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* --- Modals --- */}

            {/* Feed Integration Edit / Add Modal */}
            <Modal
                visible={!!selectedIntegration}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedIntegration(null)}
            >
                <View className='flex-1 justify-center items-center bg-black/40 px-4'>
                    <View className='w-full max-w-[400px] bg-white rounded-2xl p-6 shadow-xl border border-slate-100'>
                        <View className='flex-row justify-between items-center mb-6'>
                            <Text className='text-lg font-bold text-slate-800'>
                                {selectedIntegration?.id === 'new' ? 'Add Feed Integration' : 'Edit Feed Integration'}
                            </Text>
                            <Pressable onPress={() => setSelectedIntegration(null)} className='p-1 rounded-full active:bg-slate-100'>
                                <Ionicons name='close' size={20} color='#64748b' />
                            </Pressable>
                        </View>

                        <View className='gap-5 mb-8'>
                            <View className='gap-2'>
                                <Text className='text-sm font-semibold text-slate-600'>Provider</Text>
                                <AppSelect
                                    items={providerItems}
                                    placeholder="Select Provider"
                                    value={modalIntegrationProvider}
                                    onValueChange={setModalIntegrationProvider}
                                />
                            </View>

                            <View className='gap-2'>
                                <Text className='text-sm font-semibold text-slate-600'>Automated User</Text>
                                <AppSelect
                                    items={userItems}
                                    placeholder="Select User"
                                    value={modalIntegrationUser}
                                    onValueChange={setModalIntegrationUser}
                                />
                            </View>

                            <View className='gap-2'>
                                <Text className='text-sm font-semibold text-slate-600'>Tag</Text>
                                <TextInput
                                    className='px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800'
                                    placeholderTextColor="#94a3b8"
                                    placeholder='Enter Tag'
                                    value={modalIntegrationTag}
                                    onChangeText={setModalIntegrationTag}
                                />
                            </View>
                        </View>

                        <View className='flex-row gap-3 justify-between items-center'>
                            {selectedIntegration?.id !== 'new' ? (
                                <Pressable
                                    className='px-3 py-2 rounded-xl bg-red-50 active:bg-red-100 flex-row items-center gap-1'
                                    onPress={() => handleDeleteIntegration(selectedIntegration.id)}
                                >
                                    <Ionicons name='trash-outline' size={14} color='#dc2626' />
                                    <Text className='text-xs font-semibold text-red-600'>Delete</Text>
                                </Pressable>
                            ) : (
                                <View />
                            )}
                            <View className='flex-row gap-3'>
                                <Pressable
                                    className='px-4 py-2 rounded-xl border border-slate-200 bg-white active:bg-slate-50'
                                    onPress={() => setSelectedIntegration(null)}
                                >
                                    <Text className='text-sm font-medium text-slate-600'>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    className='px-4 py-2 rounded-xl bg-indigo-600 active:bg-indigo-700'
                                    onPress={handleSaveIntegration}
                                >
                                    <Text className='text-sm font-medium text-white'>Save</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Provider Edit / Add Modal */}
            <Modal
                visible={!!selectedProvider}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedProvider(null)}
            >
                <View className='flex-1 justify-center items-center bg-black/40 px-4'>
                    <View className='w-full max-w-[400px] bg-white rounded-2xl p-6 shadow-xl border border-slate-100'>
                        <View className='flex-row justify-between items-center mb-6'>
                            <Text className='text-lg font-bold text-slate-800'>
                                {selectedProvider?.id === 'new' ? 'Add Provider' : 'Edit Provider'}
                            </Text>
                            <Pressable onPress={() => setSelectedProvider(null)} className='p-1 rounded-full active:bg-slate-100'>
                                <Ionicons name='close' size={20} color='#64748b' />
                            </Pressable>
                        </View>

                        <View className='gap-5 mb-8'>
                            <View className='gap-2'>
                                <Text className='text-sm font-semibold text-slate-600'>Provider Name</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter provider name"
                                    placeholderTextColor="#94a3b8"
                                    value={modalProviderName}
                                    onChangeText={setModalProviderName}
                                />
                            </View>
                            <View className='gap-2'>
                                <Text className='text-sm font-semibold text-slate-600'>Provider Base Url</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter provider base url"
                                    placeholderTextColor="#94a3b8"
                                    value={modalProviderBaseUrl}
                                    onChangeText={setModalProviderBaseUrl}
                                />
                            </View>
                        </View>

                        <View className='flex-row gap-3 justify-between items-center'>
                            {selectedProvider?.id !== 'new' ? (
                                <Pressable
                                    className='px-3 py-2 rounded-xl bg-red-50 active:bg-red-100 flex-row items-center gap-1'
                                    onPress={() => handleDeleteProvider(selectedProvider.id)}
                                >
                                    <Ionicons name='trash-outline' size={14} color='#dc2626' />
                                    <Text className='text-xs font-semibold text-red-600'>Delete</Text>
                                </Pressable>
                            ) : (
                                <View />
                            )}
                            <View className='flex-row gap-3'>
                                <Pressable
                                    className='px-4 py-2 rounded-xl border border-slate-200 bg-white active:bg-slate-50'
                                    onPress={() => setSelectedProvider(null)}
                                >
                                    <Text className='text-sm font-medium text-slate-600'>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    className='px-4 py-2 rounded-xl bg-indigo-600 active:bg-indigo-700'
                                    onPress={handleSaveProvider}
                                >
                                    <Text className='text-sm font-medium text-white'>Save</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* User Edit / Add Modal */}
            <Modal
                visible={!!selectedUser}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedUser(null)}
            >
                <View className='flex-1 justify-center items-center bg-black/40 px-4'>
                    <View className='w-full max-w-[400px] bg-white rounded-2xl p-6 shadow-xl border border-slate-100'>
                        <View className='flex-row justify-between items-center mb-6'>
                            <Text className='text-lg font-bold text-slate-800'>
                                {selectedUser?.id === 'new' ? 'Add Automated User' : 'Edit Automated User'}
                            </Text>
                            <Pressable onPress={() => setSelectedUser(null)} className='p-1 rounded-full active:bg-slate-100'>
                                <Ionicons name='close' size={20} color='#64748b' />
                            </Pressable>
                        </View>

                        <View className='gap-5 mb-8'>
                            <View className='gap-2'>
                                <Text className='text-sm font-semibold text-slate-600'>First Name</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter user name"
                                    placeholderTextColor="#94a3b8"
                                    value={modalFirstName}
                                    onChangeText={setModalFirstName}
                                />
                            </View>
                            <View className='gap-2'>
                                <Text className='text-sm font-semibold text-slate-600'>Last Name</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter user name"
                                    placeholderTextColor="#94a3b8"
                                    value={modalLastName}
                                    onChangeText={setModalLastName}
                                />
                            </View>
                        </View>

                        <View className='flex-row gap-3 justify-between items-center'>
                            {selectedUser?.id !== 'new' ? (
                                <Pressable
                                    className='px-3 py-2 rounded-xl bg-red-50 active:bg-red-100 flex-row items-center gap-1'
                                    onPress={() => handleDeleteUser(selectedUser.id)}
                                >
                                    <Ionicons name='trash-outline' size={14} color='#dc2626' />
                                    <Text className='text-xs font-semibold text-red-600'>Delete</Text>
                                </Pressable>
                            ) : (
                                <View />
                            )}
                            <View className='flex-row gap-3'>
                                <Pressable
                                    className='px-4 py-2 rounded-xl border border-slate-200 bg-white active:bg-slate-50'
                                    onPress={() => setSelectedUser(null)}
                                >
                                    <Text className='text-sm font-medium text-slate-600'>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    className='px-4 py-2 rounded-xl bg-indigo-600 active:bg-indigo-700'
                                    onPress={handleSaveUser}
                                >
                                    <Text className='text-sm font-medium text-white'>Save</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView >
    )
}

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        minHeight: 44,
    },
    triggerText: {
        fontSize: 14,
        color: '#1e293b',
        flex: 1,
    },
    triggerPlaceholder: {
        color: '#94a3b8',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        minHeight: 44,
        fontSize: 14,
        color: '#1e293b',
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerSheet: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        maxHeight: 340,
    },
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    pickerTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    pickerClose: {
        padding: 4,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    pickerItemActive: {
        backgroundColor: '#f0f0ff',
    },
    pickerItemText: {
        fontSize: 14,
        color: '#334155',
    },
    pickerItemTextActive: {
        color: '#6366f1',
        fontWeight: '600',
    },
})

export default Dashboard