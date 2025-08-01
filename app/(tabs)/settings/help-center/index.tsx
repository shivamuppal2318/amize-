import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Search, ArrowLeft, ChevronDown } from 'lucide-react-native';
import { CustomTabNavigation } from '@/components/settings/CustomTabNavigation';
import { HELP_CATEGORIES, FAQ_QUESTIONS } from '@/lib/settings/constants';

const { width } = Dimensions.get('window');

export default function HelpCenterScreen() {
    const [activeTab, setActiveTab] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('general');
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

    const handleBack = () => {
        router.back();
    };

    const handleTabChange = (tab: string) => {
        if (tab === 'contact') {
            // Navigate to contact us screen
            router.push('/settings/help-center/contact-us');
        } else {
            setActiveTab(tab);
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
    };

    const handleQuestionToggle = (questionId: string) => {
        setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
    };

    // Filter questions by category and search query
    const filteredQuestions = FAQ_QUESTIONS.filter(q =>
        (selectedCategory === 'all' || q.category === selectedCategory) &&
        (searchQuery === '' ||
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={styles.rightPlaceholder} />
            </View>

            <CustomTabNavigation
                tabs={[
                    { key: 'faq', label: 'FAQ' },
                    { key: 'contact', label: 'Contact us' }
                ]}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.contentContainer}>
                    {/* Categories */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoriesScrollView}
                        contentContainerStyle={styles.categoriesContentContainer}
                    >
                        {HELP_CATEGORIES.map(category => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryButton,
                                    selectedCategory === category.id && styles.selectedCategoryButton
                                ]}
                                onPress={() => handleCategorySelect(category.id)}
                            >
                                <Text
                                    style={[
                                        styles.categoryLabel,
                                        selectedCategory === category.id && styles.selectedCategoryLabel
                                    ]}
                                >
                                    {category.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Search Bar */}
                    <View style={styles.searchBar}>
                        <Search size={18} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Ariana"
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* FAQ Questions */}
                    <View style={styles.faqContainer}>
                        {filteredQuestions.map(question => (
                            <TouchableOpacity
                                key={question.id}
                                style={styles.questionCard}
                                onPress={() => handleQuestionToggle(question.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.questionHeader}>
                                    <Text style={styles.questionText}>
                                        {question.question}
                                    </Text>
                                    <ChevronDown
                                        size={20}
                                        color="#FF5A5F"
                                        style={[
                                            styles.chevron,
                                            expandedQuestion === question.id && styles.rotatedChevron
                                        ]}
                                    />
                                </View>

                                {expandedQuestion === question.id && (
                                    <Text style={styles.answerText}>
                                        {question.answer}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}

                        {filteredQuestions.length === 0 && (
                            <View style={styles.noResultsContainer}>
                                <Text style={styles.noResultsText}>
                                    No results found. Try a different search or category.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
    },
    rightPlaceholder: {
        width: 24,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 12,
    },
    categoriesScrollView: {
        marginBottom: 16,
    },
    categoriesContentContainer: {
        paddingRight: 16,
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#1a1a2e',
        marginRight: 8,
    },
    selectedCategoryButton: {
        backgroundColor: '#FF5A5F',
        borderColor: '#FF5A5F',
    },
    categoryLabel: {
        color: '#9CA3AF',
        fontWeight: '500',
        fontSize: 14,
    },
    selectedCategoryLabel: {
        color: 'white',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        marginLeft: 8,
        height: 38,
        fontSize: 15,
    },
    faqContainer: {
        marginBottom: 16,
    },
    questionCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    questionText: {
        color: 'white',
        fontWeight: '500',
        flex: 1,
        paddingRight: 8,
        fontSize: 15,
    },
    chevron: {
        transform: [{ rotate: '0deg' }],
    },
    rotatedChevron: {
        transform: [{ rotate: '180deg' }],
    },
    answerText: {
        color: '#9CA3AF',
        marginTop: 12,
        lineHeight: 20,
        fontSize: 14,
    },
    noResultsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    noResultsText: {
        color: '#9CA3AF',
        textAlign: 'center',
    },
});