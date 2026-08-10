import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAssets } from 'expo-asset';
import { WebView } from 'react-native-webview';

export default function Book() {
    const { book_id, pdfUrl } = useLocalSearchParams();

    // Load local HTML asset for Native platforms (bundled via assets/)
    const [assets, error] = useAssets(
        Platform.OS !== 'web' ? [require('../../../../assets/pdf-viewer.html')] : []
    );

    const pdfQuery = pdfUrl ? `?pdf=${encodeURIComponent(pdfUrl)}` : '';

    if (Platform.OS === 'web') {
        const webSrc = `/html-contents/index.html${pdfQuery}`;
        return (
            <View style={styles.container}>
                <iframe
                    src={webSrc}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="PDF Viewer"
                />
            </View>
        );
    }

    // Native Platform (iOS / Android)
    const htmlAsset = assets?.[0];

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Failed to load PDF viewer asset.</Text>
            </View>
        );
    }

    if (!htmlAsset) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading PDF Viewer...</Text>
            </View>
        );
    }

    const nativeUri = `${htmlAsset.localUri || htmlAsset.uri}${pdfQuery}`;

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: nativeUri }}
                style={styles.webview}
                allowFileAccess
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    webview: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
    },
});