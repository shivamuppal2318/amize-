import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Camera, Image, Plus } from 'lucide-react-native';

export default function CreateScreen() {
    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1 items-center justify-center p-6">
                <Text className="text-white text-2xl font-bold mb-8">Create New Content</Text>

                <View className="w-full gap-4">
                    <TouchableOpacity className="bg-[#222] p-6 rounded-xl flex-row items-center">
                        <View className="bg-[#FF5A5F] p-3 rounded-lg mr-4">
                            <Camera size={24} color="white" />
                        </View>
                        <View>
                            <Text className="text-white text-lg font-bold">Record Video</Text>
                            <Text className="text-gray-400">Create a new video</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-[#222] p-6 rounded-xl flex-row items-center">
                        <View className="bg-[#5A8CFF] p-3 rounded-lg mr-4">
                            <Image size={24} color="white" />
                        </View>
                        <View>
                            <Text className="text-white text-lg font-bold">Upload Media</Text>
                            <Text className="text-gray-400">Share videos from your gallery</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-[#222] p-6 rounded-xl flex-row items-center">
                        <View className="bg-[#FFB800] p-3 rounded-lg mr-4">
                            <Plus size={24} color="white" />
                        </View>
                        <View>
                            <Text className="text-white text-lg font-bold">Create Story</Text>
                            <Text className="text-gray-400">Share a quick update</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}