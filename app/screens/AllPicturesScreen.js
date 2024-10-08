import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Modal, Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';

const AllPicturesScreen = () => {
    const [savedPictures, setSavedPictures] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const navigation = useNavigation();
    const route = useRoute();

    useEffect(() => {
        loadSavedPictures();
    }, []);

    const loadSavedPictures = async () => {
        try {
            if (route.params?.items) {
                // If items are passed from the ProfileScreen, use those
                setSavedPictures(route.params.items.filter(item => item.type !== 'document'));
            } else {
                // Otherwise, load from AsyncStorage as before
                const savedItemsJSON = await AsyncStorage.getItem('savedItems');
                const items = savedItemsJSON ? JSON.parse(savedItemsJSON) : [];
                setSavedPictures(items.filter(item => item.type !== 'document'));
            }
        } catch (error) {
            console.error('Error loading saved pictures:', error);
        }
    };

    const renderPictureItem = ({ item }) => (
        <TouchableOpacity
            style={tw`m-1 items-center justify-center`}
            onPress={() => setSelectedImage(item)}
            onLongPress={() => promptDeletePicture(item)}
        >
            <Image source={{ uri: item.uri }} style={tw`w-28 h-28 rounded-lg`} />
        </TouchableOpacity>
    );

    const promptDeletePicture = (picture) => {
        Alert.alert(
            "Delete Picture",
            "Are you sure you want to delete this picture?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deletePicture(picture) }
            ]
        );
    };

    const deletePicture = async (picture) => {
        try {
            const updatedPictures = savedPictures.filter(p => p.id !== picture.id);
            await AsyncStorage.setItem('savedItems', JSON.stringify(updatedPictures));
            setSavedPictures(updatedPictures);
            if (selectedImage && selectedImage.id === picture.id) {
                setSelectedImage(null);
            }
        } catch (error) {
            console.error('Error deleting picture:', error);
        }
    };

    const sharePicture = async (uri) => {
        try {
            const result = await Share.share({
                url: uri,
            });
            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log('shared with activity type of', result.activityType);
                } else {
                    console.log('shared');
                }
            } else if (result.action === Share.dismissedAction) {
                console.log('dismissed');
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    const savePictureToDevice = async (uri) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
                const asset = await MediaLibrary.createAssetAsync(uri);
                await MediaLibrary.createAlbumAsync('MyApp', asset, false);
                Alert.alert('Success', 'Picture saved to device');
            } else {
                Alert.alert('Permission required', 'Please grant permission to save pictures');
            }
        } catch (error) {
            console.error('Error saving picture to device:', error);
            Alert.alert('Error', 'Failed to save picture to device');
        }
    };

    return (
        <View style={tw`flex-1 bg-gray-100`}>

            {savedPictures.length > 0 ? (
                <FlatList
                    data={savedPictures}
                    renderItem={renderPictureItem}
                    keyExtractor={(item) => item.id}
                    numColumns={3}
                    contentContainerStyle={tw`w-full  justify-center items-center`}
                />
            ) : (
                <View style={tw`flex-1 justify-center items-center`}>
                    <Text style={tw`text-xl text-gray-500 font-semibold`}>No pictures saved yet</Text>
                    <Text style={tw`text-sm text-gray-400 mt-2`}>Start capturing memories!</Text>
                </View>
            )}
            <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
                <View style={tw`flex-1 bg-black`}>
                    <Image
                        source={{ uri: selectedImage?.uri }}
                        style={tw`w-full h-full`}
                        resizeMode="contain"
                    />
                    <View style={tw`absolute bottom-14 left-0 right-0 flex-row justify-evenly p-4`}>
                        <TouchableOpacity
                            style={tw`p-2 bg-black bg-opacity-50 rounded-full`}
                            onPress={() => setSelectedImage(null)}
                        >
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={tw`p-2 bg-black bg-opacity-50 rounded-full`}
                            onPress={() => savePictureToDevice(selectedImage.uri)}
                        >
                            <Ionicons name="save-outline" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={tw`p-2 bg-black bg-opacity-50 rounded-full`}
                            onPress={() => sharePicture(selectedImage.uri)}
                        >
                            <Ionicons name="share-outline" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={tw`p-2 bg-black bg-opacity-50 rounded-full`}
                            onPress={() => promptDeletePicture(selectedImage)}
                        >
                            <Ionicons name="trash-outline" size={30} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AllPicturesScreen;