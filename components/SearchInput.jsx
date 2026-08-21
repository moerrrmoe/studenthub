import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function SearchInput({
  initialValue = "",
  value: controlledValue,
  onChangeText: controlledOnChangeText,
  onSubmit,
  placeholder = "Search StudentHub...",
  showAskAi = true,
  autoFocus = false,
  containerClassName = "",
}) {
  const pathname = usePathname();
  const params = useLocalSearchParams();

  const [isFocused, setIsFocused] = useState(false);
  const [internalQuery, setInternalQuery] = useState(initialValue);

  const query = controlledValue !== undefined ? controlledValue : internalQuery;

  useEffect(() => {
    if (initialValue !== undefined && controlledValue === undefined) {
      setInternalQuery(initialValue);
    }
  }, [initialValue, controlledValue]);

  // Sync with search URL parameter if on /search
  useEffect(() => {
    if (controlledValue === undefined && pathname?.includes("/search") && !isFocused) {
      const urlQ = (params.query || params.q || "").toString();
      setInternalQuery(urlQ);
    }
  }, [pathname, params.query, params.q, controlledValue, isFocused]);

  const handleChangeText = (text) => {
    if (controlledOnChangeText) {
      controlledOnChangeText(text);
    }
    if (controlledValue === undefined) {
      setInternalQuery(text);
    }
  };

  const handleClear = () => {
    handleChangeText("");
    if (pathname?.includes("/search")) {
      router.push("/search");
    }
  };

  const handleSubmit = () => {
    const trimmed = (query || "").trim();
    if (onSubmit) {
      onSubmit(trimmed);
      return;
    }
    if (trimmed) {
      router.push(`/search?query=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <View
      className={`flex-row items-center rounded-full pl-3.5 pr-2 h-[38px] w-full border transition-all duration-200 ${
        isFocused
          ? "bg-white dark:bg-slate-900 border-violet-500 shadow-sm"
          : "bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800"
      } ${containerClassName}`}
    >
      <Pressable onPress={handleSubmit} hitSlop={6}>
        <Ionicons
          name="search-outline"
          size={17}
          color={isFocused ? "#7c3aed" : "#9ca3af"}
        />
      </Pressable>

      <TextInput
        placeholderTextColor="#9ca3af"
        className="flex-1 px-2.5 py-1.5 text-sm text-gray-800 dark:text-slate-200 outline-none h-full"
        placeholder={placeholder}
        value={query}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {query ? (
        <Pressable
          onPress={handleClear}
          hitSlop={6}
          className="p-1 mr-1 rounded-full hover:bg-gray-200"
        >
          <Ionicons name="close-circle" size={16} color="#9ca3af" />
        </Pressable>
      ) : null}

      {showAskAi && (
        <Pressable
          className="flex-row items-center bg-violet-50 active:bg-violet-100 rounded-full px-2.5 py-1 gap-1 border border-violet-100 ml-0.5"
          onPress={() => router.push("/chat/ai")}
        >
          <Ionicons name="sparkles" size={12} color="#7c3aed" />
          <Text className="text-xs font-semibold text-violet-600">Ask</Text>
        </Pressable>
      )}
    </View>
  );
}

