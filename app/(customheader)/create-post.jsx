import ImageCarousel from '@/components/image-carousel';
import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as documentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

const CreatePost = () => {
    const { user } = useUser();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([])

    const createPost = async () => {
        try {
            const res = await axios.post('http://localhost:8080/post', {
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
            const res = await axios.post('http://localhost:8080/image/temp/upload', formData)
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
        <View className="flex-1 bg-[#F3F5F7]">
            <View className='flex-row justify-between items-center bg-[#fefefe]  px-2 py-4 border-b-1 border-gray-200'>
                <Pressable onPress={() => {
                    if (router.canGoBack()) { router.back() }
                    else { router.replace("/home") }
                }}>
                    <Ionicons name="close" size={24} color="black" />
                </Pressable>
                <Text className='text-lg font-semibold'>Create Post</Text>
                <View className='px-2'>

                </View>
            </View>
            <View className='p-3'>
                <TextInput onChangeText={(e) => setTitle(e)} placeholder='Title' placeholderTextColor="gray" className='text-xl font-semibold text-black mb-2' />
                <TextInput onChangeText={(e) => setDescription(e)} placeholder="Description" multiline={true} numberOfLines={10} placeholderTextColor="gray" className='text-base text-black' />
            </View>
            <View className='p-3 w-full justify-center items-center'>
                <View className='w-full max-w-[500px]'>
                    {previewImages.length > 0 && <ImageCarousel images={previewImages} />}
                </View>
            </View>

            <View className='flex-row items-center bg-[#fefefe] mt-auto border-t-1 justify-between border-gray-200 py-3 px-2'>
                <Pressable onPress={() => pickImages()}>
                    <Ionicons name="image-outline" size={30} color="black" />
                </Pressable>
                <Pressable disabled={description.trim().length === 0} onPress={() => createPost()}>
                    <Ionicons name="send" size={32} color={description.trim().length === 0 ? "gray" : "black"} />
                </Pressable>

            </View>
        </View>
    )
}

export default CreatePost