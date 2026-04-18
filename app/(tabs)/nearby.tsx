import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, LocateFixed, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { AdBanner } from '@/components/ads/AdBanner';
import { NearbyDiscoveryItem, NearbyService } from '@/lib/api/nearbyService';
import { MapView as NativeMapView, Marker as NativeMarker } from '@/lib/maps/native';

type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};

const toCoarseCoordinate = (value: number) => Math.round(value * 100) / 100;

const withPrivacySafeJitter = (value: number, seed: number) =>
    Number((value + seed * 0.0008).toFixed(6));

const createNearbyItems = (latitude: number, longitude: number): NearbyDiscoveryItem[] => [
    {
        id: '1',
        title: 'Street Food Reels',
        type: 'Video',
        distanceKm: 0.4,
        latitude: latitude + 0.0024,
        longitude: longitude + 0.0018,
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
        subtitle: 'Trending clips near your area',
        targetId: 'fallback-video-1',
        targetType: 'video',
    },
    {
        id: '2',
        title: '@citycreator',
        type: 'Creator',
        distanceKm: 1.1,
        latitude: latitude - 0.0031,
        longitude: longitude + 0.0025,
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        subtitle: 'Lifestyle creator nearby',
        targetId: 'fallback-user-1',
        targetType: 'user',
    },
    {
        id: '3',
        title: 'Night Market Live Cuts',
        type: 'Video',
        distanceKm: 2.3,
        latitude: latitude + 0.0049,
        longitude: longitude - 0.0034,
        imageUrl: 'https://images.unsplash.com/photo-1523906630133-f6934a1ab2b9?w=400',
        subtitle: 'Fresh uploads around your city',
        targetId: 'fallback-video-2',
        targetType: 'video',
    },
];

export default function NearbyScreen() {
    const [locationPermission, setLocationPermission] = useState<
        'granted' | 'denied' | 'undetermined'
    >('undetermined');
    const [loading, setLoading] = useState(true);
    const [locationLabel, setLocationLabel] = useState('Fetching location');
    const [region, setRegion] = useState<Region | null>(null);
    const [nearbyItems, setNearbyItems] = useState<NearbyDiscoveryItem[]>([]);

    const loadNearby = async () => {
        try {
            setLoading(true);
            const permission = await Location.requestForegroundPermissionsAsync();

            if (permission.status !== 'granted') {
                setLocationPermission('denied');
                return;
            }

            setLocationPermission('granted');

            const currentPosition = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const preciseLatitude = currentPosition.coords.latitude;
            const preciseLongitude = currentPosition.coords.longitude;
            const coarseLatitude = toCoarseCoordinate(preciseLatitude);
            const coarseLongitude = toCoarseCoordinate(preciseLongitude);

            const nextRegion: Region = {
                latitude: coarseLatitude,
                longitude: coarseLongitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
            };

            setRegion(nextRegion);

            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: preciseLatitude,
                longitude: preciseLongitude,
            });

            const place = reverseGeocode[0];
            const areaLabel = [place?.city, place?.region]
                .filter(Boolean)
                .join(', ');

            setLocationLabel(areaLabel || 'Current area');

            try {
                const items = await NearbyService.getNearbyDiscovery({
                    latitude: coarseLatitude,
                    longitude: coarseLongitude,
                    area: areaLabel || undefined,
                    limit: 12,
                });

                setNearbyItems(
                    items.length > 0
                        ? items.map((item, index) => ({
                              ...item,
                              latitude: withPrivacySafeJitter(item.latitude, index % 3 === 0 ? -1 : 1),
                              longitude: withPrivacySafeJitter(
                                  item.longitude,
                                  index % 2 === 0 ? 1 : -1
                              ),
                          }))
                        : createNearbyItems(
                              coarseLatitude,
                              coarseLongitude
                          )
                );
            } catch (apiError) {
                console.warn('Nearby discovery API unavailable, using fallback:', apiError);
                setNearbyItems(
                    createNearbyItems(
                        coarseLatitude,
                        coarseLongitude
                    )
                );
            }
        } catch (error) {
            console.error('Failed to load nearby discovery:', error);
            setLocationPermission('denied');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNearby();
    }, []);

    const headerSubtitle = useMemo(() => {
        if (loading) {
            return 'Loading nearby discovery';
        }

        if (locationPermission !== 'granted') {
            return 'Location access required';
        }

        return `Exploring around ${locationLabel}`;
    }, [loading, locationLabel, locationPermission]);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['#1E4A72', '#000000']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity 
                    onPress={() => router.back()}
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Nearby Discovery</Text>
                        <Text style={styles.subtitle}>{headerSubtitle}</Text>
                    </View>
                    <TouchableOpacity 
                    onPress={loadNearby}
                    accessibilityLabel="Refresh nearby"
                    accessibilityRole="button"
                >
                        <RefreshCw size={20} color="#FF5A5F" />
                    </TouchableOpacity>
                </View>

                <AdBanner label="Nearby Banner" placement="nearbyBanner" />

                {loading ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="large" color="#FF5A5F" />
                        <Text style={styles.stateTitle}>Finding nearby creators</Text>
                        <Text style={styles.stateText}>
                            We are getting your location and preparing nearby content.
                        </Text>
                    </View>
                ) : locationPermission !== 'granted' || !region ? (
                    <View style={styles.centerState}>
                        <LocateFixed size={42} color="#FF5A5F" />
                        <Text style={styles.stateTitle}>Enable location access</Text>
                        <Text style={styles.stateText}>
                            Nearby discovery needs your device location to show local creators and videos.
                        </Text>
                        <Button
                            label="Try Again"
                            onPress={loadNearby}
                            variant="primary"
                        />
                    </View>
                ) : (
                    <>
                        <View style={styles.mapCard}>
                            {Platform.OS === 'web' || !NativeMapView || !NativeMarker ? (
                                <View style={styles.webMapFallback}>
                                    <MapPin size={28} color="#FF5A5F" />
                                    <Text style={styles.webMapTitle}>Map preview is native-only</Text>
                                    <Text style={styles.webMapText}>
                                        Nearby results still load on web, but the interactive map is
                                        shown on Android and iOS only.
                                    </Text>
                                    <Text style={styles.webMapMeta}>
                                        Centered around {locationLabel}
                                    </Text>
                                </View>
                            ) : (
                                <NativeMapView style={styles.map} initialRegion={region} region={region}>
                                    <NativeMarker
                                        coordinate={{
                                            latitude: region.latitude,
                                            longitude: region.longitude,
                                        }}
                                        title="You are here"
                                    />
                                    {nearbyItems.map((item) => (
                                        <NativeMarker
                                            key={item.id}
                                            coordinate={{
                                                latitude: item.latitude,
                                                longitude: item.longitude,
                                            }}
                                            title={item.title}
                                            description={item.subtitle}
                                        />
                                    ))}
                                </NativeMapView>
                            )}
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Around {locationLabel}</Text>
                            <View style={styles.pill}>
                                <MapPin size={12} color="#FF5A5F" />
                                <Text style={styles.pillText}>{nearbyItems.length} local results</Text>
                            </View>
                        </View>

                        <FlatList
                            data={nearbyItems}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <View style={styles.card}>
                                    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                                    <View style={styles.cardContent}>
                                        <View style={styles.typeBadge}>
                                            <Text style={styles.typeBadgeText}>{item.type}</Text>
                                        </View>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                                        <Text style={styles.cardMeta}>
                                            {item.distanceKm.toFixed(1)} km away
                                        </Text>
                                    </View>
                                </View>
                            )}
                        />
                    </>
                )}
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    gradient: {
        flex: 1,
        paddingTop: 44,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerText: {
        flex: 1,
        marginHorizontal: 16,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    subtitle: {
        color: '#9CA3AF',
        marginTop: 2,
        fontSize: 13,
        fontFamily: 'Figtree',
    },
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    stateTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        fontFamily: 'Figtree',
    },
    stateText: {
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 10,
        marginBottom: 24,
        fontFamily: 'Figtree',
    },
    mapCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 18,
    },
    map: {
        height: 250,
        width: '100%',
    },
    webMapFallback: {
        height: 250,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
    },
    webMapTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 12,
        fontFamily: 'Figtree',
    },
    webMapText: {
        color: '#CBD5E1',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginTop: 8,
        fontFamily: 'Figtree',
    },
    webMapMeta: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 12,
        fontFamily: 'Figtree',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255, 90, 95, 0.12)',
    },
    pillText: {
        color: '#FF5A5F',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Figtree',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    card: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 18,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 12,
    },
    cardImage: {
        width: 82,
        height: 82,
        borderRadius: 14,
        marginRight: 14,
    },
    cardContent: {
        flex: 1,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(116, 169, 217, 0.15)',
        marginBottom: 8,
    },
    typeBadgeText: {
        color: '#74A9D9',
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Figtree',
    },
    cardSubtitle: {
        color: '#D1D5DB',
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: 'Figtree',
    },
    cardMeta: {
        color: '#9CA3AF',
        marginTop: 8,
        fontSize: 12,
        fontFamily: 'Figtree',
    },
});
