import ImageCarousel from '@/components/image-carousel';
import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as documentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useApiConfig } from "@/contexts/ApiConfigContext";
import { useTheme } from "@/contexts/ThemeContext";

const CreatePost = () => {
    const { getCleanUrl } = useApiConfig();
    const { isDarkMode } = useTheme();
    const { user } = useUser();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([])

    const createPost = async () => {
        try {
            const res = await axios.post(getCleanUrl('post'), {
                authorId: user.id,
                title,
                content: {
                    text: description,
                    images: images,
                },
                published: true

            })
            if (res.data.success) {
                if (router.canGoBack()) { router.back() }
                else { router.replace("/home") }
            }
        } catch (error) {
            console.log(error)
        }
    }

    const pickImages = async () => {

        const result = await documentPicker.getDocumentAsync({
            type: "image/*",
            multiple: true
        })
        if (!result.canceled) {
            uploadAsTemp(result.assets)
        }
    }

    const uploadAsTemp = async (assets) => {
        const formData = new FormData();


        for (const asset of assets) {
            const uriPart = asset.uri.split('/');
            const filename = uriPart[uriPart.length - 1];
            if (asset.file) {
                formData.append("images", asset.file)
                continue
            }
            formData.append("images", {
                uri: asset.uri,
                name: filename,
                type: asset.mimeType
            })
        }
        try {
            const res = await axios.post(getCleanUrl('image/temp/upload'), formData)
            if (res.data.success) {
                setImages(prev => ([...prev, ...res.data.data.files.map(file => file.path)]))
                setPreviewImages(prev => ([...prev, ...assets.map(asset => asset.uri)]))
            } else {
                console.log("Uploading Images failed")
            }
        } catch (err) {
            console.error("Uploading Images failed", err);
        }
    }



    return (
        <View className="flex-1 bg-[#f5f6f8] dark:bg-slate-950">
            <View className='flex-row justify-between items-center bg-white dark:bg-slate-900 px-4 py-3 border-b border-gray-200 dark:border-slate-800'>
                <Pressable
                    onPress={() => {
                        if (router.canGoBack()) { router.back() }
                        else { router.replace("/home") }
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                    <Ionicons name="close" size={22} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
                </Pressable>
                <Text className='text-base font-semibold text-gray-900 dark:text-white'>Create Post</Text>
                <Pressable
                    disabled={description.trim().length === 0}
                    onPress={() => createPost()}
                    className={`px-4 py-1.5 rounded-full ${description.trim().length === 0 ? 'bg-gray-200 dark:bg-slate-700' : 'bg-violet-600'}`}
                >
                    <Text className={`text-sm font-semibold ${description.trim().length === 0 ? 'text-gray-400 dark:text-slate-500' : 'text-white'}`}>Post</Text>
                </Pressable>
            </View>
            <View className='p-4'>
                <TextInput onChangeText={(e) => setTitle(e)} placeholder='Title' placeholderTextColor="#9ca3af" className='text-lg font-semibold text-gray-900 dark:text-white mb-2' />
                <TextInput onChangeText={(e) => setDescription(e)} placeholder="What's on your mind?" multiline={true} numberOfLines={10} placeholderTextColor="#9ca3af" className='text-sm text-gray-600 dark:text-slate-300 leading-5' />
            </View>
            <View className='p-3 w-full justify-center items-center'>
                <View className='w-full max-w-[500px]'>
                    {previewImages.length > 0 && <ImageCarousel images={previewImages} />}
                </View>
            </View>

            <View className='flex-row items-center bg-white dark:bg-slate-900 mt-auto border-t border-gray-200 dark:border-slate-800 py-3 px-4 gap-3'>
                <Pressable onPress={() => pickImages()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
                    <Ionicons name="image-outline" size={24} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
                </Pressable>
            </View>
        </View>
    )
}

export default CreatePost