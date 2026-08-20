import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";

import { useApiConfig } from "@/contexts/ApiConfigContext";

const ImageCarousel = ({ images }) => {
  const { getCleanUrl } = useApiConfig();
  const [activeIndex, setActiveIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollViewRef = useRef(null);

  if (!images || images.length === 0) return null;

  const handleScroll = (event) => {
    if (width === 0) return;
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const handleLayout = (event) => {
    const { width: layoutWidth } = event.nativeEvent.layout;
    setWidth(layoutWidth);
  };

  const scrollToNext = () => {
    if (activeIndex < images.length - 1 && width > 0) {
      const nextIndex = activeIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setActiveIndex(nextIndex);
    }
  };

  const scrollToPrev = () => {
    if (activeIndex > 0 && width > 0) {
      const prevIndex = activeIndex - 1;
      scrollViewRef.current?.scrollTo({ x: prevIndex * width, animated: true });
      setActiveIndex(prevIndex);
    }
  };

  const showArrows = Platform.OS === "web" && images.length > 1;


  return (
    <View onLayout={handleLayout} className="w-full relative overflow-hidden rounded-lg group">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={width}
        snapToAlignment="center"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        className="w-full h-[400px]"
      >
        {width > 0 &&
          images.map((image, index) => (
            <View
              key={index}
              style={{ width }}
              className="h-[400px] justify-center items-center bg-gray-100"
            >
              <Image
                source={{ uri: getCleanUrl(image) }}
                contentFit="cover"
                className="w-full h-full"
              />
            </View>
          ))}
      </ScrollView>

      {/* Desktop Prev Button */}
      {showArrows && activeIndex > 0 && (
        <Pressable
          onPress={scrollToPrev}
          className="absolute left-3 top-1/2 -mt-5 w-10 h-10 bg-black/45 hover:bg-black/60 rounded-full justify-center items-center z-10"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
      )}

      {/* Desktop Next Button */}
      {showArrows && activeIndex < images.length - 1 && (
        <Pressable
          onPress={scrollToNext}
          className="absolute right-3 top-1/2 -mt-5 w-10 h-10 bg-black/45 hover:bg-black/60 rounded-full justify-center items-center z-10"
        >
          <Ionicons name="chevron-forward" size={24} color="white" />
        </Pressable>
      )}

      {/* Pagination Dots */}
      {images.length > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center items-center gap-1.5 z-10">
          {images.map((_, index) => (
            <View
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? "w-3 bg-white" : "w-1.5 bg-white/50"
                }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ImageCarousel;
