import { useInfiniteQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { searchItems } from "@/api/items";
import { colors, radius, shadow, typography } from "@/theme";
import type { ItemCategory, ItemSummary } from "@/types/item";
import { normalizeImageUrl } from "@/utils/image";

const CATEGORIES: { label: string; value: ItemCategory | null }[] = [
  { label: "전체", value: null },
  { label: "전자기기", value: "전자기기" },
  { label: "의류", value: "의류" },
  { label: "액세서리", value: "액세서리" },
  { label: "기타", value: "기타" },
];

const PAGE_SIZE = 20;

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ItemCategory | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["items", "browse", { query, category }],
    queryFn: ({ pageParam }) =>
      searchItems({
        page: pageParam,
        size: PAGE_SIZE,
        query: query || undefined,
        categories: category ? [category] : undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) => {
      const currentPage = typeof last.page === "number" ? last.page : lastPageParam;
      if (last.isLast || currentPage >= last.totalPages || last.content.length < PAGE_SIZE) return undefined;
      return lastPageParam + 1;
    },
  });

  const items = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.appBg }}>
      {/* 검색 + 필터 */}
      <View
        style={{
          backgroundColor: colors.cardBg,
          paddingHorizontal: 16,
          paddingTop: insets.top + 12,
          paddingBottom: 10,
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          hitSlop={8}
          style={{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="chevron-back" color={colors.textMain} size={24} />
        </Pressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="물건 이름 검색..."
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.appBg,
            borderRadius: radius.button,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 15,
            color: colors.textMain,
          }}
          returnKeyType="search"
        />
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: cat }) => {
            const active = category === cat.value;
            return (
              <Pressable
                onPress={() => setCategory(cat.value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: radius.chip,
                  backgroundColor: active ? colors.primary : colors.appBg,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: active ? "#fff" : colors.textSub,
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* 목록 */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 60 }}>
              검색 결과가 없습니다.
            </Text>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => <BrowseItemCard item={item} />}
        />
      )}
    </View>
  );
}

function BrowseItemCard({ item }: { item: ItemSummary }) {
  const imageUrl = normalizeImageUrl(item.image);
  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: radius.card,
        flexDirection: "row",
        overflow: "hidden",
        ...shadow,
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={{ width: 80, height: 80 }} resizeMode="cover" />
      ) : (
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: "#E5E7EB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 11, color: colors.textMuted }}>없음</Text>
        </View>
      )}
      <View style={{ flex: 1, padding: 12, justifyContent: "center", gap: 4 }}>
        <Text style={{ ...typography.body, color: colors.textMain }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSub }}>
          {item.foundPlace ?? ""}{item.foundPlaceDetail ? ` · ${item.foundPlaceDetail}` : ""}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.foundAt}</Text>
      </View>
      <View
        style={{
          paddingHorizontal: 12,
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: radius.chip,
            backgroundColor: colors.primaryBg,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.primary }}>
            {item.category}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
